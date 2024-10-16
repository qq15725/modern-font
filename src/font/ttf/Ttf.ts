import type { SfntTableTag } from '../../sfnt'
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

  protected _sfnt?: Sfnt
  get sfnt(): Sfnt {
    if (!this._sfnt) {
      this._sfnt = this.createSfnt()
    }
    return this._sfnt
  }

  static FLAGS = new Set([
    0x00010000,
    0x74727565, // true
    0x74797031, // typ1
    0x4F54544F, // OTTO
  ])

  static is(source: BufferSource): boolean {
    return this.FLAGS.has(toDataView(source).getUint32(0))
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
    const numTables = sfnt.tableViews.size
    const sfntSize = sfnt.tableViews.values().reduce((total, view) => total + round4(view.byteLength), 0)
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
    const directories = ttf.getDirectories()
    sfnt.tableViews.forEach((view, tag) => {
      const dir = directories[i++]
      dir.tag = tag
      dir.checkSum = Ttf.checksum(view)
      dir.offset = dataOffset
      dir.length = view.byteLength
      ttf.view.writeBytes(view, dataOffset)
      dataOffset += round4(dir.length)
    })
    const head = ttf.createSfnt().head
    head.checkSumAdjustment = 0
    head.checkSumAdjustment = 0xB1B0AFBA - Ttf.checksum(ttf.view)
    return ttf
  }

  getDirectories(): TableDirectory[] {
    let offset = this.view.byteOffset + 12
    return Array.from({ length: this.numTables }, () => {
      const dir = new TableDirectory(this.view.buffer, offset)
      offset += dir.view.byteLength
      return dir
    })
  }

  createSfnt(): Sfnt {
    return new Sfnt(
      this.getDirectories().reduce((views, dir) => {
        views[dir.tag] = new DataView(this.view.buffer, this.view.byteOffset + dir.offset, dir.length)
        return views
      }, {} as Record<SfntTableTag, DataView>),
    )
  }
}
