import type { SFNTTableTag } from '../../sfnt'
import { defineColumn } from '../../core'
import { SFNT } from '../../sfnt'
import { toDataView } from '../../utils'
import { BaseFont } from '../BaseFont'
import { TableDirectory } from './TableDirectory'

/**
 * TrueType
 *
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html
 */
export class TTF extends BaseFont {
  format = 'TrueType'
  mimeType = 'font/ttf'
  @defineColumn('uint32') declare scalerType: number
  @defineColumn('uint16') declare numTables: number
  @defineColumn('uint16') declare searchRange: number
  @defineColumn('uint16') declare entrySelector: number
  @defineColumn('uint16') declare rangeShift: number

  protected _sfnt?: SFNT
  get sfnt(): SFNT {
    if (!this._sfnt) {
      this._sfnt = this.createSFNT()
    }
    return this._sfnt
  }

  static signature = new Set([
    0x00010000,
    0x74727565, // true
    0x74797031, // typ1
  ])

  static is(source: BufferSource | number): boolean {
    if (typeof source === 'number') {
      return this.signature.has(source)
    }
    else {
      return this.signature.has(toDataView(source).getUint32(0))
    }
  }

  static checksum(source: BufferSource): number {
    const view = toDataView(source)
    const length = view.byteLength
    const nLongs = Math.floor(length / 4)
    let sum = 0
    for (let i = 0; i < nLongs; i++) {
      sum += view.getUint32(i * 4, false)
    }
    // Final partial uint32: the table is treated as zero-padded to a 4-byte
    // boundary, read big-endian (use *256 rather than << to stay unsigned).
    const leftBytes = length - nLongs * 4
    if (leftBytes > 0) {
      let last = 0
      const offset = nLongs * 4
      for (let b = 0; b < 4; b++) {
        last = last * 256 + (b < leftBytes ? view.getUint8(offset + b) : 0)
      }
      sum += last
    }
    return sum % 0x1_0000_0000
  }

  static from(sfnt: SFNT): TTF {
    const round4 = (value: number): number => (value + 3) & ~3
    const tags = sfnt.tableTags
    const views = tags.map(tag => sfnt.getTableView(tag)!)
    const numTables = tags.length
    const sfntSize = views.reduce((total, view) => total + round4(view.byteLength), 0)
    const ttf = new (this as any)(
      new ArrayBuffer(
        12 // head
        + numTables * 16 // dirs
        + sfntSize, // tables
      ),
    ) as TTF
    ttf.scalerType = 0x00010000
    ttf.numTables = numTables
    // searchRange = (largest power of 2 <= numTables) * 16; entrySelector = log2 of it
    const entrySelector = Math.floor(Math.log2(numTables))
    ttf.searchRange = 2 ** entrySelector * 16
    ttf.entrySelector = entrySelector
    ttf.rangeShift = numTables * 16 - ttf.searchRange
    let dataOffset = 12 + numTables * 16
    const directories = ttf.getDirectories()
    tags.forEach((tag, i) => {
      const view = views[i]
      const dir = directories[i]
      dir.tag = tag
      dir.checkSum = this.checksum(view)
      dir.offset = dataOffset
      dir.length = view.byteLength
      ttf.view.writeBytes(view, dataOffset)
      dataOffset += round4(dir.length)
    })
    // head.checkSumAdjustment = 0xB1B0AFBA - checksum(whole font, field zeroed).
    // Write it straight into the font buffer: going through createSFNT() here
    // would hit a detached copy (SFNT clones every table), so it would not stick.
    const headDir = directories.find(dir => dir.tag === 'head')
    if (headDir) {
      const checkSumAdjustmentOffset = headDir.offset + 8
      ttf.view.writeUint32(0, checkSumAdjustmentOffset)
      ttf.view.writeUint32((0xB1B0AFBA - this.checksum(ttf.view)) >>> 0, checkSumAdjustmentOffset)
    }
    return ttf as any
  }

  getDirectories(): TableDirectory[] {
    let offset = this.view.byteOffset + 12
    return Array.from({ length: this.numTables }, () => {
      const dir = new TableDirectory(this.view.buffer, offset)
      offset += dir.view.byteLength
      return dir
    })
  }

  createSFNT(): SFNT {
    return new SFNT(
      this.getDirectories()
        .reduce((views, dir) => {
          views[dir.tag] = new DataView(this.view.buffer, this.view.byteOffset + dir.offset, dir.length)
          return views
        }, {} as Record<SFNTTableTag, DataView<ArrayBuffer>>),
    )
  }
}
