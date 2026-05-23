import type { SFNTTableTag } from '../../sfnt'
import { SFNT } from '../../sfnt'
import { toDataView } from '../../utils'
import { OTF } from '../otf'
import { TTF } from '../ttf'

/**
 * TrueType/OpenType Collection ('ttcf'): several fonts packed in one file,
 * sharing table data. Each packed font is exposed as an SFNT (zero-copy views
 * into the collection buffer) or rebuilt as a standalone TTF/OTF.
 *
 * @link https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-collections
 */
export class FontCollection {
  static signature = 0x74746366 // 'ttcf'

  static is(source: BufferSource): boolean {
    const view = toDataView(source)
    return view.byteLength >= 12 && view.getUint32(0, false) === this.signature
  }

  view: DataView<ArrayBuffer>
  /** Number of fonts packed in the collection. */
  numFonts: number

  constructor(source: BufferSource) {
    this.view = toDataView(source)
    this.numFonts = this.view.getUint32(8, false)
  }

  /** The SFNT model of each packed font (table data shared with the collection buffer). */
  get sfnts(): SFNT[] {
    return Array.from({ length: this.numFonts }, (_, i) => {
      return this._readSFNT(this.view.getUint32(12 + i * 4, false))
    })
  }

  /** Each packed font rebuilt as a standalone font (OTF when it has a `CFF ` table, else TTF). */
  get fonts(): TTF[] {
    return this.sfnts.map(sfnt => (sfnt.hasTable('CFF ') ? OTF.from(sfnt) : TTF.from(sfnt)))
  }

  protected _readSFNT(fontOffset: number): SFNT {
    const view = this.view
    const base = view.byteOffset
    const numTables = view.getUint16(fontOffset + 4, false)
    const tableViews = new Map<SFNTTableTag, DataView<ArrayBuffer>>()
    for (let i = 0; i < numTables; i++) {
      const record = fontOffset + 12 + i * 16
      const tag = String.fromCharCode(
        view.getUint8(record),
        view.getUint8(record + 1),
        view.getUint8(record + 2),
        view.getUint8(record + 3),
      ) as SFNTTableTag
      // Table offsets in a collection are absolute from the collection start.
      const tableOffset = view.getUint32(record + 8, false)
      const length = view.getUint32(record + 12, false)
      tableViews.set(tag, new DataView(view.buffer, base + tableOffset, length))
    }
    return new SFNT(tableViews)
  }
}
