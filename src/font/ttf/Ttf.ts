import { Sfnt } from '../../sfnt'
import { defineColumn, toDataView } from '../../utils'
import { Font } from '../Font'
import { TableDirectory } from './TableDirectory'

// TrueType
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html
export class Ttf extends Font {
  override mimeType = 'font/ttf'
  @defineColumn('uint32') declare scalerType: number
  @defineColumn('uint16') declare numTables: number
  @defineColumn('uint16') declare searchRange: number
  @defineColumn('uint16') declare entrySelector: number
  @defineColumn('uint16') declare rangeShift: number

  directories: TableDirectory[] = []

  static is(source: BufferSource): boolean {
    const view = toDataView(source)
    return [
      0x00010000,
      0x74727565, // true
      0x74797031, // typ1
      0x4F54544F, // OTTO
    ].includes(view.getUint32(0))
  }

  static checksum(source: BufferSource): number {
    const view = toDataView(source)
    let byteLength = view.byteLength
    while (byteLength % 4) byteLength++
    let sum = 0
    for (let i = 0, len = byteLength / 4; i < len; i += 4) {
      if (i * 4 < byteLength - 4) {
        sum += view.getUint32(i * 4, false)
      }
    }
    return sum & 0xFFFFFFFF
  }

  static from(sfnt: Sfnt): Ttf {
    const round4 = (value: number): number => (value + 3) & ~3
    const numTables = sfnt.tables.length
    const sfntSize = sfnt.tables.reduce((total, table) => total + round4(table.view.byteLength), 0)
    const ttf = new Ttf(
      new ArrayBuffer(
        12 // head
        + numTables * 16 // dirs
        + sfntSize, // tables
      ),
    )
    const log2 = Math.log(2)
    ttf.scalerType = 0x00010000
    ttf.numTables = numTables
    ttf.searchRange = Math.floor(Math.log(numTables) / log2) * 16
    ttf.entrySelector = Math.floor(ttf.searchRange / log2)
    ttf.rangeShift = numTables * 16 - ttf.searchRange
    let dataOffset = 12 + numTables * 16
    let i = 0
    ttf.updateDirectories()
    sfnt.tables.forEach((table) => {
      const dir = ttf.directories[i++]
      dir.tag = table.tag
      dir.checkSum = Ttf.checksum(table.view)
      dir.offset = dataOffset
      dir.length = table.view.byteLength
      ttf.view.writeBytes(table.view, dataOffset)
      dataOffset += round4(dir.length)
    })
    const head = ttf.getSfnt().head
    head.checkSumAdjustment = 0
    head.checkSumAdjustment = 0xB1B0AFBA - Ttf.checksum(ttf.view)
    return ttf
  }

  updateDirectories(): this {
    let offset = this.view.byteOffset + 12
    this.directories = Array.from({ length: this.numTables }, () => {
      const dir = new TableDirectory(this.view.buffer, offset)
      offset += dir.view.byteLength
      return dir
    })
    return this
  }

  getSfnt(): Sfnt {
    return new Sfnt(
      this.updateDirectories().directories.map((dir) => {
        return {
          tag: dir.tag,
          view: new DataView(this.view.buffer, this.view.byteOffset + dir.offset, dir.length),
        }
      }),
    )
  }
}
