import { defineColumn } from '../core'
import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

export interface GsubLookup {
  lookupType: number
  lookupFlag: number
  /** Offsets of each subtable, relative to the start of the GSUB table. */
  subtableOffsets: number[]
}

export interface LigatureRule {
  /** Glyphs that must follow the first glyph for the ligature to apply. */
  components: number[]
  ligatureGlyph: number
}

/**
 * Glyph Substitution Table
 *
 * Implements the feature/lookup lists, Lookup Type 1 (single substitution,
 * e.g. `vert`/`vrt2`) and Lookup Type 4 (ligatures, e.g. `liga`); Type 7
 * extension lookups are unwrapped transparently.
 *
 * @link https://learn.microsoft.com/en-us/typography/opentype/spec/gsub
 */
@defineSFNTTable('GSUB', 'gsub')
export class Gsub extends SFNTTable {
  @defineColumn('uint16') declare majorVersion: number
  @defineColumn('uint16') declare minorVersion: number
  @defineColumn('uint16') declare scriptListOffset: number
  @defineColumn('uint16') declare featureListOffset: number
  @defineColumn('uint16') declare lookupListOffset: number
  // `featureVariationsOffset` (Offset32) only exists when minorVersion >= 1; read it manually if ever needed.

  protected _singleSubstitutions?: Map<string, Map<number, number>>
  protected _ligatures?: Map<string, Map<number, LigatureRule[]>>

  /**
   * Build a `glyphIndex -> substituteGlyphIndex` map from every Type 1 (single
   * substitution) lookup referenced by features whose tag is `featureTag`
   * (e.g. `'vert'` or `'vrt2'` for vertical writing). Type 7 (extension)
   * lookups wrapping a single substitution are unwrapped transparently — CJK
   * fonts commonly store `vert` this way.
   *
   * Glyphs without a substitution are simply absent from the map. The result
   * is cached per feature tag.
   */
  getSingleSubstitutions(featureTag: string): Map<number, number> {
    const cache = this._singleSubstitutions ??= new Map()
    let map = cache.get(featureTag)
    if (!map) {
      map = new Map<number, number>()
      this._featureLookupIndices(featureTag).forEach((lookupIndex) => {
        const lookup = this.readLookup(lookupIndex)
        lookup?.subtableOffsets.forEach((offset) => {
          this._collectSingleSubstitutions(offset, lookup.lookupType, map!)
        })
      })
      cache.set(featureTag, map)
    }
    return map
  }

  /**
   * Build `firstGlyph -> ligature rules` for a ligature feature (e.g. `'liga'`,
   * `'rlig'`, `'dlig'`, `'clig'`) from its Lookup Type 4 subtables (Type 7
   * extensions unwrapped). Apply over a glyph run with {@link SFNT.applyLigatures}.
   */
  getLigatures(featureTag: string): Map<number, LigatureRule[]> {
    const cache = this._ligatures ??= new Map()
    let map = cache.get(featureTag)
    if (!map) {
      map = new Map<number, LigatureRule[]>()
      this._featureLookupIndices(featureTag).forEach((lookupIndex) => {
        const lookup = this.readLookup(lookupIndex)
        lookup?.subtableOffsets.forEach((offset) => {
          this._collectLigatures(offset, lookup.lookupType, map!)
        })
      })
      cache.set(featureTag, map)
    }
    return map
  }

  protected _collectLigatures(subtableOffset: number, lookupType: number, map: Map<number, LigatureRule[]>): void {
    const view = this.view
    if (lookupType === 7) { // Extension Substitution — unwrap
      const extensionLookupType = view.readUint16(subtableOffset + 2)
      const extensionOffset = view.readUint32(subtableOffset + 4)
      this._collectLigatures(subtableOffset + extensionOffset, extensionLookupType, map)
      return
    }
    if (lookupType !== 4) // LigatureSubst only
      return
    const coverage = this._readCoverage(subtableOffset + view.readUint16(subtableOffset + 2))
    const ligatureSetCount = view.readUint16(subtableOffset + 4)
    for (let i = 0; i < ligatureSetCount && i < coverage.length; i++) {
      const first = coverage[i]
      const ligatureSetOffset = subtableOffset + view.readUint16(subtableOffset + 6 + i * 2)
      const ligatureCount = view.readUint16(ligatureSetOffset)
      const rules = map.get(first) ?? []
      for (let j = 0; j < ligatureCount; j++) {
        const ligatureOffset = ligatureSetOffset + view.readUint16(ligatureSetOffset + 2 + j * 2)
        const ligatureGlyph = view.readUint16(ligatureOffset)
        const componentCount = view.readUint16(ligatureOffset + 2)
        const components: number[] = []
        for (let k = 0; k < componentCount - 1; k++) {
          components.push(view.readUint16(ligatureOffset + 4 + k * 2))
        }
        rules.push({ components, ligatureGlyph })
      }
      if (!map.has(first))
        map.set(first, rules)
    }
  }

  readLookup(lookupIndex: number): GsubLookup | undefined {
    const lookupList = this.lookupListOffset
    if (!lookupList)
      return undefined
    const view = this.view
    if (lookupIndex >= view.readUint16(lookupList))
      return undefined
    const lookupOffset = lookupList + view.readUint16(lookupList + 2 + lookupIndex * 2)
    const subTableCount = view.readUint16(lookupOffset + 4)
    const subtableOffsets: number[] = []
    for (let i = 0; i < subTableCount; i++) {
      subtableOffsets.push(lookupOffset + view.readUint16(lookupOffset + 6 + i * 2))
    }
    return {
      lookupType: view.readUint16(lookupOffset),
      lookupFlag: view.readUint16(lookupOffset + 2),
      subtableOffsets,
    }
  }

  /** Lookup-list indices referenced by every feature whose tag is `featureTag`. */
  protected _featureLookupIndices(featureTag: string): number[] {
    const featureList = this.featureListOffset
    if (!featureList)
      return []
    const view = this.view
    const featureCount = view.readUint16(featureList)
    const indices = new Set<number>()
    for (let i = 0; i < featureCount; i++) {
      const recordOffset = featureList + 2 + i * 6
      if (view.readString(recordOffset, 4) !== featureTag)
        continue
      const featureOffset = featureList + view.readUint16(recordOffset + 4)
      const lookupIndexCount = view.readUint16(featureOffset + 2)
      for (let j = 0; j < lookupIndexCount; j++) {
        indices.add(view.readUint16(featureOffset + 4 + j * 2))
      }
    }
    return Array.from(indices)
  }

  protected _collectSingleSubstitutions(subtableOffset: number, lookupType: number, map: Map<number, number>): void {
    const view = this.view
    // Type 7: Extension Substitution — unwrap to the real subtable and recurse.
    if (lookupType === 7) {
      const extensionLookupType = view.readUint16(subtableOffset + 2)
      const extensionOffset = view.readUint32(subtableOffset + 4)
      this._collectSingleSubstitutions(subtableOffset + extensionOffset, extensionLookupType, map)
      return
    }
    if (lookupType !== 1)
      return
    const substFormat = view.readUint16(subtableOffset)
    const coverage = this._readCoverage(subtableOffset + view.readUint16(subtableOffset + 2))
    if (substFormat === 1) {
      // Format 1: substitute = (coveredGlyph + deltaGlyphId) mod 65536
      const deltaGlyphId = view.readInt16(subtableOffset + 4)
      coverage.forEach((glyphIndex) => {
        map.set(glyphIndex, (glyphIndex + deltaGlyphId) & 0xFFFF)
      })
    }
    else if (substFormat === 2) {
      // Format 2: substitute = substituteGlyphIDs[coverageIndex]
      const glyphCount = view.readUint16(subtableOffset + 4)
      for (let i = 0; i < glyphCount && i < coverage.length; i++) {
        map.set(coverage[i], view.readUint16(subtableOffset + 6 + i * 2))
      }
    }
  }

  /** Read a Coverage table, returning the covered glyph indices in coverage-index order. */
  protected _readCoverage(offset: number): number[] {
    const view = this.view
    const format = view.readUint16(offset)
    const glyphs: number[] = []
    if (format === 1) {
      const glyphCount = view.readUint16(offset + 2)
      for (let i = 0; i < glyphCount; i++) {
        glyphs.push(view.readUint16(offset + 4 + i * 2))
      }
    }
    else if (format === 2) {
      const rangeCount = view.readUint16(offset + 2)
      for (let i = 0; i < rangeCount; i++) {
        const recordOffset = offset + 4 + i * 6
        const startGlyphId = view.readUint16(recordOffset)
        const endGlyphId = view.readUint16(recordOffset + 2)
        let coverageIndex = view.readUint16(recordOffset + 4)
        for (let glyphId = startGlyphId; glyphId <= endGlyphId; glyphId++) {
          glyphs[coverageIndex++] = glyphId
        }
      }
    }
    return glyphs
  }
}
