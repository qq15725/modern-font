/**
 * Shared OpenType Layout (GSUB/GPOS) readers: feature/lookup lists, Coverage,
 * ClassDef and ValueRecord. Big-endian, offset-based (no view cursor).
 *
 * Note: Gsub currently keeps its own equivalents of the feature/lookup/coverage
 * readers; those can be migrated onto these helpers later.
 */

export interface OTLookup {
  lookupType: number
  lookupFlag: number
  /** Subtable offsets relative to the start of the GSUB/GPOS table. */
  subtableOffsets: number[]
}

export function readTag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  )
}

/** Lookup-list indices referenced by every feature whose tag is `featureTag`. */
export function featureLookupIndices(view: DataView, featureListOffset: number, featureTag: string): number[] {
  if (!featureListOffset)
    return []
  const featureCount = view.getUint16(featureListOffset, false)
  const indices = new Set<number>()
  for (let i = 0; i < featureCount; i++) {
    const record = featureListOffset + 2 + i * 6
    if (readTag(view, record) !== featureTag)
      continue
    const featureOffset = featureListOffset + view.getUint16(record + 4, false)
    const lookupIndexCount = view.getUint16(featureOffset + 2, false)
    for (let j = 0; j < lookupIndexCount; j++) {
      indices.add(view.getUint16(featureOffset + 4 + j * 2, false))
    }
  }
  return [...indices]
}

export function readLookup(view: DataView, lookupListOffset: number, lookupIndex: number): OTLookup | undefined {
  if (!lookupListOffset || lookupIndex >= view.getUint16(lookupListOffset, false))
    return undefined
  const lookupOffset = lookupListOffset + view.getUint16(lookupListOffset + 2 + lookupIndex * 2, false)
  const subTableCount = view.getUint16(lookupOffset + 4, false)
  const subtableOffsets: number[] = []
  for (let i = 0; i < subTableCount; i++) {
    subtableOffsets.push(lookupOffset + view.getUint16(lookupOffset + 6 + i * 2, false))
  }
  return {
    lookupType: view.getUint16(lookupOffset, false),
    lookupFlag: view.getUint16(lookupOffset + 2, false),
    subtableOffsets,
  }
}

/** Covered glyph indices in coverage-index order (array index === coverage index). */
export function readCoverage(view: DataView, offset: number): number[] {
  const format = view.getUint16(offset, false)
  const glyphs: number[] = []
  if (format === 1) {
    const count = view.getUint16(offset + 2, false)
    for (let i = 0; i < count; i++) {
      glyphs.push(view.getUint16(offset + 4 + i * 2, false))
    }
  }
  else if (format === 2) {
    const rangeCount = view.getUint16(offset + 2, false)
    for (let i = 0; i < rangeCount; i++) {
      const record = offset + 4 + i * 6
      const start = view.getUint16(record, false)
      const end = view.getUint16(record + 2, false)
      let coverageIndex = view.getUint16(record + 4, false)
      for (let g = start; g <= end; g++) {
        glyphs[coverageIndex++] = g
      }
    }
  }
  return glyphs
}

/** ClassDef → `glyphIndex -> class`. Glyphs absent from the map are class 0. */
export function readClassDef(view: DataView, offset: number): Map<number, number> {
  const map = new Map<number, number>()
  const format = view.getUint16(offset, false)
  if (format === 1) {
    const startGlyph = view.getUint16(offset + 2, false)
    const count = view.getUint16(offset + 4, false)
    for (let i = 0; i < count; i++) {
      map.set(startGlyph + i, view.getUint16(offset + 6 + i * 2, false))
    }
  }
  else if (format === 2) {
    const rangeCount = view.getUint16(offset + 2, false)
    for (let i = 0; i < rangeCount; i++) {
      const record = offset + 4 + i * 6
      const start = view.getUint16(record, false)
      const end = view.getUint16(record + 2, false)
      const cls = view.getUint16(record + 4, false)
      for (let g = start; g <= end; g++) {
        map.set(g, cls)
      }
    }
  }
  return map
}

/** Byte size of a ValueRecord for a given valueFormat (set-bit count × 2). */
export function valueRecordSize(valueFormat: number): number {
  let bits = valueFormat
  let count = 0
  while (bits) {
    count += bits & 1
    bits >>= 1
  }
  return count * 2
}

/** XAdvance (horizontal advance adjustment) from a ValueRecord, or 0 if absent. */
export function readXAdvance(view: DataView, offset: number, valueFormat: number): number {
  if (!(valueFormat & 0x0004))
    return 0 // no XAdvance field
  let pos = offset
  if (valueFormat & 0x0001)
    pos += 2 // XPlacement precedes XAdvance
  if (valueFormat & 0x0002)
    pos += 2 // YPlacement precedes XAdvance
  return view.getInt16(pos, false)
}
