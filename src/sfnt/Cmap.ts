import { defineColumn } from '../utils'
import { CmapSubtableFormat0 } from './CmapSubtableFormat0'
import { CmapSubtableFormat2 } from './CmapSubtableFormat2'
import { CmapSubtableFormat4 } from './CmapSubtableFormat4'
import { CmapSubtableFormat6 } from './CmapSubtableFormat6'
import { CmapSubtableFormat12 } from './CmapSubtableFormat12'
import { CmapSubtableFormat14 } from './CmapSubtableFormat14'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
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
@defineSfntTable('cmap')
export class Cmap extends SfntTable {
  @defineColumn({ type: 'uint16' }) declare version: number
  @defineColumn({ type: 'uint16' }) declare numberSubtables: number

  static from(unicodeGlyphIndexMap: Map<number, number>): Cmap {
    const has2Byte = Array.from(unicodeGlyphIndexMap.keys()).some(unicode => unicode > 0xFFFF)
    const table4 = CmapSubtableFormat4.from(unicodeGlyphIndexMap)
    const table0 = CmapSubtableFormat0.from(unicodeGlyphIndexMap)
    const table12 = has2Byte ? CmapSubtableFormat12.from(unicodeGlyphIndexMap) : undefined
    const offset4 = 4 + (table12 ? 32 : 24)
    const offset0 = offset4 + table4.view.byteLength
    const offset12 = offset0 + table0.view.byteLength
    const subtables = [
      { platformID: 0, platformSpecificID: 3, offset: offset4 }, // subtable 4, unicode
      { platformID: 1, platformSpecificID: 0, offset: offset0 }, // subtable 0, mac standard
      { platformID: 3, platformSpecificID: 1, offset: offset4 }, // subtable 4, windows standard
      table12 && { platformID: 3, platformSpecificID: 10, offset: offset12 }, // hasGLyphsOver2Bytes
    ].filter(Boolean) as CmapSubtable[]
    const cmap = new Cmap(
      new ArrayBuffer(
        4 // head
        + 8 * subtables.length // subtables
        + table4.view.byteLength // format 4
        + table0.view.byteLength // format 0
        + (table12?.view.byteLength ?? 0), // format 12
      ),
    )
    cmap.numberSubtables = subtables.length
    cmap.view.seek(4)
    subtables.forEach((subtable) => {
      cmap.view.writeUint16(subtable.platformID)
      cmap.view.writeUint16(subtable.platformSpecificID)
      cmap.view.writeUint32(subtable.offset)
    })
    cmap.view.writeBytes(table4.view, offset4)
    cmap.view.writeBytes(table0.view, offset0)
    table12 && cmap.view.writeBytes(table12.view, offset12)
    return cmap
  }

  getSubtables(): (CmapSubtable & { format: number, view: any })[] {
    const numberSubtables = this.numberSubtables
    this.view.seek(4)
    return Array.from({ length: numberSubtables }, () => {
      return {
        platformID: this.view.readUint16(),
        platformSpecificID: this.view.readUint16(),
        offset: this.view.readUint32(),
      } as CmapSubtable
    }).map((table) => {
      this.view.seek(table.offset)
      const format = this.view.readUint16()
      let view
      switch (format) {
        case 0:
          view = new CmapSubtableFormat0(this.view.buffer, table.offset)
          break
        case 2:
          view = new CmapSubtableFormat2(this.view.buffer, table.offset, this.view.readUint16())
          break
        case 4:
          view = new CmapSubtableFormat4(this.view.buffer, table.offset, this.view.readUint16())
          break
        case 6:
          view = new CmapSubtableFormat6(this.view.buffer, table.offset, this.view.readUint16())
          break
        case 12:
          view = new CmapSubtableFormat12(this.view.buffer, table.offset, this.view.readUint32(table.offset + 4))
          break
        case 14:
        default:
          view = new CmapSubtableFormat14(this.view.buffer, table.offset, this.view.readUint32())
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
      ...(table2?.getUnicodeGlyphIndexMap(this._sfnt.maxp.numGlyphs) ?? []),
      ...(table4?.getUnicodeGlyphIndexMap() ?? []),
      ...(table12?.getUnicodeGlyphIndexMap() ?? []),
      ...(table14?.getUnicodeGlyphIndexMap() ?? []),
    ])
  }
}
