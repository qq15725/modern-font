import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

/**
 * Kerning table.
 *
 * Parses the Microsoft/OpenType layout (uint16 version 0) with format 0
 * horizontal pair subtables — the common case. The legacy Apple version 1.0
 * (0x00010000) layout is not parsed (modern fonts keep kerning in GPOS).
 *
 * @link https://learn.microsoft.com/en-us/typography/opentype/spec/kern
 */
@defineSFNTTable('kern', 'kern')
export class Kern extends SFNTTable {
  protected _pairs?: Map<number, number>
  /** `(leftGlyphIndex * 0x10000 + rightGlyphIndex) -> kerning value (font units)`. */
  get pairs(): Map<number, number> {
    return this._pairs ??= this._readPairs()
  }

  getKerningValue(leftGlyphIndex: number, rightGlyphIndex: number): number {
    return this.pairs.get(leftGlyphIndex * 0x10000 + rightGlyphIndex) ?? 0
  }

  protected _readPairs(): Map<number, number> {
    const view = this.view
    const pairs = new Map<number, number>()
    if (view.byteLength < 4 || view.readUint16(0) !== 0) {
      return pairs // empty or Apple (1.0) kern, unsupported
    }
    const nTables = view.readUint16(2)
    let offset = 4
    for (let t = 0; t < nTables && offset + 6 <= view.byteLength; t++) {
      const length = view.readUint16(offset + 2)
      const coverage = view.readUint16(offset + 4)
      const format = coverage >> 8
      const horizontal = (coverage & 0x1) !== 0
      if (format === 0 && horizontal) {
        const nPairs = view.readUint16(offset + 6)
        // skip nPairs/searchRange/entrySelector/rangeShift (4 × uint16)
        let p = offset + 14
        for (let i = 0; i < nPairs; i++) {
          const left = view.readUint16(p)
          const right = view.readUint16(p + 2)
          const value = view.readInt16(p + 4)
          pairs.set(left * 0x10000 + right, value)
          p += 6
        }
      }
      if (length <= 0)
        break // malformed length; avoid an infinite loop
      offset += length
    }
    return pairs
  }
}
