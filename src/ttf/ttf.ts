import { Entity } from '../utils'
import { Sfnt } from '../sfnt'
import { FontFile } from '../font-file'
import { TableDirectory } from './table-directory'

// TrueType
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html
export class Ttf extends FontFile {
  readonly mimeType = 'font/ttf'
  @Entity.column({ type: 'uint32' }) declare scalerType: number
  @Entity.column({ type: 'uint16' }) declare numTables: number
  @Entity.column({ type: 'uint16' }) declare searchRange: number
  @Entity.column({ type: 'uint16' }) declare entrySelector: number
  @Entity.column({ type: 'uint16' }) declare rangeShift: number

  directories: Array<TableDirectory> = []

  static is(view: DataView) {
    return [
      0x00010000,
      0x74727565, // true
      0x74797031, // typ1
      0x4F54544F, // OTTO
    ].includes(view.getUint32(0))
  }

  static checksum(view: DataView): number {
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
    const numTables = sfnt.tables.length
    let tablesByteLength = 0
    sfnt.tables.forEach(table => tablesByteLength += Math.ceil(table.view.byteLength / 4) * 4)
    const ttf = new Ttf(new ArrayBuffer(
      12 // head
      + numTables * 16 // directories
      + tablesByteLength, // tables
    ))
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
      ttf.writeBytes(table.view, dataOffset)
      dataOffset += dir.length
      while (dataOffset % 4) {
        dataOffset++
      }
    })
    const head = ttf.sfnt.head
    head.checkSumAdjustment = 0
    head.checkSumAdjustment = 0xB1B0AFBA - Ttf.checksum(ttf)
    return ttf
  }

  updateDirectories(): this {
    let offset = this.byteOffset + 12
    this.directories = Array.from({ length: this.numTables }, () => {
      const dir = new TableDirectory(this.buffer, offset)
      offset += dir.byteLength
      return dir
    })
    return this
  }

  get sfnt() {
    this.updateDirectories()
    return new Sfnt(
      this.directories.map(dir => {
        return {
          tag: dir.tag,
          view: new DataView(this.buffer, this.byteOffset + dir.offset, dir.length),
        }
      }),
    )
  }
}
