import { defineColumn } from '../core'
import { featureLookupIndices, readClassDef, readCoverage, readLookup, readXAdvance, valueRecordSize } from './otLayout'
import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

/** A parsed PairPos format-2 (class-based) subtable, queried on demand. */
interface ClassPairSubtable {
  coverage: Set<number>
  classDef1: Map<number, number>
  classDef2: Map<number, number>
  class2Count: number
  class1RecordsOffset: number
  recordSize: number
  valueFormat1: number
}

/**
 * Glyph Positioning Table — currently parses the `kern` feature's pair
 * adjustment (Lookup Type 2) for horizontal kerning, including Type 9
 * (extension) wrappers. Other positioning (mark, cursive, single) is not
 * applied.
 *
 * @link https://learn.microsoft.com/en-us/typography/opentype/spec/gpos
 */
@defineSFNTTable('GPOS', 'gpos')
export class Gpos extends SFNTTable {
  @defineColumn('uint16') declare majorVersion: number
  @defineColumn('uint16') declare minorVersion: number
  @defineColumn('uint16') declare scriptListOffset: number
  @defineColumn('uint16') declare featureListOffset: number
  @defineColumn('uint16') declare lookupListOffset: number

  // Format 1 is sparse, so it's flattened to a pair map; format 2 is class-based
  // and would explode if expanded, so it's queried on demand.
  protected _format1Pairs?: Map<number, number>
  protected _classSubtables?: ClassPairSubtable[]

  /** Horizontal kerning (font units) for a glyph pair, from the GPOS `kern` feature. */
  getKerningValue(leftGlyphIndex: number, rightGlyphIndex: number): number {
    this._ensureKerning()
    const flat = this._format1Pairs!.get(leftGlyphIndex * 0x10000 + rightGlyphIndex)
    if (flat !== undefined)
      return flat
    for (const st of this._classSubtables!) {
      if (!st.coverage.has(leftGlyphIndex))
        continue
      const class1 = st.classDef1.get(leftGlyphIndex) ?? 0
      const class2 = st.classDef2.get(rightGlyphIndex) ?? 0
      const valueOffset = st.class1RecordsOffset + (class1 * st.class2Count + class2) * st.recordSize
      const value = readXAdvance(this.view, valueOffset, st.valueFormat1)
      if (value)
        return value
    }
    return 0
  }

  protected _ensureKerning(): void {
    if (this._format1Pairs)
      return
    this._format1Pairs = new Map()
    this._classSubtables = []
    featureLookupIndices(this.view, this.featureListOffset, 'kern').forEach((lookupIndex) => {
      const lookup = readLookup(this.view, this.lookupListOffset, lookupIndex)
      lookup?.subtableOffsets.forEach(offset => this._collectPairPos(offset, lookup.lookupType))
    })
  }

  protected _collectPairPos(offset: number, lookupType: number): void {
    const view = this.view
    if (lookupType === 9) { // Extension Positioning — unwrap
      const extensionType = view.readUint16(offset + 2)
      const extensionOffset = view.readUint32(offset + 4)
      this._collectPairPos(offset + extensionOffset, extensionType)
      return
    }
    if (lookupType !== 2) // PairPos only
      return
    const posFormat = view.readUint16(offset)
    const coverage = readCoverage(view, offset + view.readUint16(offset + 2))
    const valueFormat1 = view.readUint16(offset + 4)
    const valueFormat2 = view.readUint16(offset + 6)
    if (posFormat === 1) {
      const pairSetCount = view.readUint16(offset + 8)
      const recordSize = 2 + valueRecordSize(valueFormat1) + valueRecordSize(valueFormat2)
      for (let i = 0; i < pairSetCount && i < coverage.length; i++) {
        const first = coverage[i]
        const pairSetOffset = offset + view.readUint16(offset + 10 + i * 2)
        const pairValueCount = view.readUint16(pairSetOffset)
        let p = pairSetOffset + 2
        for (let j = 0; j < pairValueCount; j++) {
          const second = view.readUint16(p)
          const value = readXAdvance(view, p + 2, valueFormat1)
          if (value)
            this._format1Pairs!.set(first * 0x10000 + second, value)
          p += recordSize
        }
      }
    }
    else if (posFormat === 2) {
      this._classSubtables!.push({
        coverage: new Set(coverage),
        classDef1: readClassDef(view, offset + view.readUint16(offset + 8)),
        classDef2: readClassDef(view, offset + view.readUint16(offset + 10)),
        class2Count: view.readUint16(offset + 14),
        class1RecordsOffset: offset + 16,
        recordSize: valueRecordSize(valueFormat1) + valueRecordSize(valueFormat2),
        valueFormat1,
      })
    }
  }
}
