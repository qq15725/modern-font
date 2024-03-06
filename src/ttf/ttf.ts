import { Entity } from '../utils'
import { Sfnt } from '../sfnt'
import { TableDirectory } from './table-directory'

// TrueType
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html
export class Ttf extends Entity {
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

  static from(sfnt: Sfnt): Ttf {
    const numTables = sfnt.tables.length
    let byteLength = 0
    sfnt.tables.forEach(table => byteLength += Math.ceil(table.view.byteLength / 4) * 4)
    const ttf = new Ttf(new ArrayBuffer(
      12 // head
      + numTables * 16 // directories
      + byteLength, // tables
    ))
    const log2 = Math.log(2)
    ttf.scalerType = 0x00010000
    ttf.numTables = numTables
    ttf.searchRange = Math.floor(Math.log(numTables) / log2) * 16
    ttf.entrySelector = Math.floor(ttf.searchRange / log2)
    ttf.rangeShift = numTables * 16 - ttf.searchRange
    const offset = 12
    let dataOffset = 12 + numTables * 16
    let i = 0
    sfnt.tables.forEach((table) => {
      const data = new Uint8Array(table.view.buffer)
      const dir = ttf.directories[i++]
      dir.tag = table.tag
      dir.checkSum = Ttf.checksum(data)
      dir.offset = offset
      dir.length = data.byteLength
      ttf.readWriter.writeBytes(data, dataOffset)
      dataOffset += dir.length
      while (dataOffset % 4) {
        dataOffset++
      }
    })
    // const head = ttf.sfnt.head
    // head.checkSumAdjustment
    return ttf
  }

  update() {
    const buffer = this.buffer

    let offset = this.byteLength
    this.directories = Array.from({ length: this.numTables }, () => {
      const dir = new TableDirectory(buffer, offset)
      offset += dir.byteLength
      return dir
    })
  }

  get sfnt() {
    const buffer = this.buffer
    return new Sfnt(
      this.directories.map(dir => {
        return {
          tag: dir.tag,
          view: new DataView(buffer, dir.offset, dir.length),
        }
      }),
    )
  }

  static checksum(data: Uint8Array): number {
    const newData = [].slice.call(data) as Array<number>
    while (newData.length % 4) newData.push(0)
    const tmp = new DataView(new ArrayBuffer(newData.length))
    let sum = 0
    for (let i = 0, len = newData.length / 4; i < len; i = i += 4) {
      sum += tmp.getUint32(i * 4, false)
    }
    return sum & 0xFFFFFFFF
  }
}
