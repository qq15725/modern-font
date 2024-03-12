import { Entity } from '../utils'
import { Sfnt } from './sfnt'
import { SfntTable } from './sfnt-table'
import { CmapSubtableFormat0, CmapSubtableFormat12, CmapSubtableFormat14, CmapSubtableFormat2, CmapSubtableFormat4, CmapSubtableFormat6 } from './cmap-subtables'

declare module './sfnt' {
  interface Sfnt {
    cmap: Cmap
  }
}

export interface CmapSubtable {
  platformID: number
  platformSpecificID: number
  offset: number
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6cmap.html
 */
@Sfnt.table('cmap')
export class Cmap extends SfntTable {
  @Entity.column({ type: 'uint16' }) declare version: number
  @Entity.column({ type: 'uint16' }) declare numberSubtables: number

  static from(unicodeGlyphIndexMap: Map<number, number>): Cmap {
    const has2Byte = Array.from(unicodeGlyphIndexMap.keys()).some(unicode => unicode > 0xFFFF)
    const table4 = CmapSubtableFormat4.from(unicodeGlyphIndexMap)
    const table0 = CmapSubtableFormat0.from(unicodeGlyphIndexMap)
    const table12 = has2Byte ? CmapSubtableFormat12.from(unicodeGlyphIndexMap) : undefined
    const offset4 = 4 + (table12 ? 32 : 24)
    const offset0 = offset4 + table4.byteLength
    const offset12 = offset0 + table0.byteLength
    const subtables = [
      { platformID: 0, platformSpecificID: 3, offset: offset4 }, // subtable 4, unicode
      { platformID: 1, platformSpecificID: 0, offset: offset0 }, // subtable 0, mac standard
      { platformID: 3, platformSpecificID: 1, offset: offset4 }, // subtable 4, windows standard
      table12 && { platformID: 3, platformSpecificID: 10, offset: offset12 }, // hasGLyphsOver2Bytes
    ].filter(Boolean) as Array<CmapSubtable>
    const cmap = new Cmap(
      new ArrayBuffer(
        4 // head
        + 8 * subtables.length // subtables
        + table4.byteLength // format 4
        + table0.byteLength // format 0
        + (table12?.byteLength ?? 0), // format 12
      ),
    )
    cmap.numberSubtables = subtables.length
    cmap.seek(4)
    subtables.forEach(subtable => {
      cmap.writeUint16(subtable.platformID)
      cmap.writeUint16(subtable.platformSpecificID)
      cmap.writeUint32(subtable.offset)
    })
    cmap.writeBytes(table4, offset4)
    cmap.writeBytes(table0, offset0)
    table12 && cmap.writeBytes(table12, offset12)
    return cmap
  }

  getSubtables() {
    const numberSubtables = this.numberSubtables
    this.seek(4)
    return Array.from({ length: numberSubtables }, () => {
      return {
        platformID: this.readUint16(),
        platformSpecificID: this.readUint16(),
        offset: this.readUint32(),
      } as CmapSubtable
    }).map(table => {
      this.seek(table.offset)
      const format = this.readUint16()
      let view
      switch (format) {
        case 0:
          view = new CmapSubtableFormat0(this.buffer, table.offset)
          break
        case 2:
          view = new CmapSubtableFormat2(this.buffer, table.offset, this.readUint16())
          break
        case 4:
          view = new CmapSubtableFormat4(this.buffer, table.offset, this.readUint16())
          break
        case 6:
          view = new CmapSubtableFormat6(this.buffer, table.offset, this.readUint16())
          break
        case 12:
          view = new CmapSubtableFormat12(this.buffer, table.offset, this.readUint32(table.offset + 4))
          break
        case 14:
        default:
          view = new CmapSubtableFormat14(this.buffer, table.offset, this.readUint32())
          break
      }
      return {
        ...table,
        format,
        view,
      }
    })
  }

  getUnicodeGlyphIndexMap(): Map<number, number> {
    const tables = this.getSubtables()
    const table0 = tables.find(item => item.format === 0)?.view as CmapSubtableFormat0 | undefined
    const table2 = tables.find(item => item.platformID === 3 && item.platformSpecificID === 3 && item.format === 2)?.view as CmapSubtableFormat2 | undefined
    const table4 = tables.find(item => item.platformID === 3 && item.platformSpecificID === 1 && item.format === 4)?.view as CmapSubtableFormat4 | undefined
    const table12 = tables.find(item => item.platformID === 3 && item.platformSpecificID === 10 && item.format === 12)?.view as CmapSubtableFormat12 | undefined
    const table14 = tables.find(item => item.platformID === 0 && item.platformSpecificID === 5 && item.format === 14)?.view as CmapSubtableFormat14 | undefined
    return new Map([
      ...(table0?.getUnicodeGlyphIndexMap() ?? []),
      ...(table2?.getUnicodeGlyphIndexMap(this.sfnt.maxp.numGlyphs) ?? []),
      ...(table4?.getUnicodeGlyphIndexMap() ?? []),
      ...(table12?.getUnicodeGlyphIndexMap() ?? []),
      ...(table14?.getUnicodeGlyphIndexMap() ?? []),
    ])
  }
}
