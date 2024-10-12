import type { SfntTableTag } from '../../sfnt'
import { unzlibSync, zlibSync } from 'fflate'
import { Sfnt } from '../../sfnt'
import { defineColumn, toDataView } from '../../utils'
import { Font } from '../Font'
import { WoffTableDirectoryEntry } from './WoffTableDirectoryEntry'

// https://www.w3.org/submissions/WOFF
export class Woff extends Font {
  override mimeType = 'font/woff'
  @defineColumn('uint32') declare signature: number
  @defineColumn('uint32') declare flavor: number
  @defineColumn('uint32') declare length: number
  @defineColumn('uint16') declare numTables: number
  @defineColumn('uint16') declare reserved: number
  @defineColumn('uint32') declare totalSfntSize: number
  @defineColumn('uint16') declare majorVersion: number
  @defineColumn('uint16') declare minorVersion: number
  @defineColumn('uint32') declare metaOffset: number
  @defineColumn('uint32') declare metaLength: number
  @defineColumn('uint32') declare metaOrigLength: number
  @defineColumn('uint32') declare privOffset: number
  @defineColumn('uint32') declare privLength: number

  protected _sfnt?: Sfnt
  get sfnt(): Sfnt {
    if (!this._sfnt) {
      this._sfnt = this.createSfnt()
    }
    return this._sfnt
  }

  static FLAGS = new Set([
    0x774F4646, // wOFF
  ])

  static is(source: BufferSource): boolean {
    return this.FLAGS.has(toDataView(source).getUint32(0))
  }

  static checkSum(source: BufferSource): number {
    const view = toDataView(source)
    const length = view.byteLength
    const nLongs = Math.floor(length / 4)
    let sum = 0
    let i = 0
    while (i < nLongs) {
      sum += view.getUint32(4 * i++, false)
    }
    let leftBytes = length - nLongs * 4
    if (leftBytes) {
      let offset = nLongs * 4
      while (leftBytes > 0) {
        sum += view.getUint8(offset) << (leftBytes * 8)
        offset++
        leftBytes--
      }
    }
    return sum % 0x100000000
  }

  static from(sfnt: Sfnt, rest = new ArrayBuffer(0)): Woff {
    const round4 = (value: number): number => (value + 3) & ~3
    const tables: { tag: string, view: DataView, rawView: DataView }[] = []
    sfnt.tableViews.forEach((view, tag) => {
      const newView = toDataView(zlibSync(
        new Uint8Array(
          view.buffer,
          view.byteOffset,
          view.byteLength,
        ),
      ))
      tables.push({
        tag,
        view: newView.byteLength < view.byteLength ? newView : view,
        rawView: view,
      })
    })
    const numTables = tables.length
    const sfntSize = tables.reduce((total, table) => total + round4(table.view.byteLength), 0)
    const woff = new Woff(
      new ArrayBuffer(
        44 // WOFFHeader
        + 20 * numTables // TableDirectory
        + sfntSize // FontTables
        + rest.byteLength,
      ),
    )
    woff.signature = 0x774F4646
    woff.flavor = 0x00010000
    woff.length = woff.view.byteLength
    woff.numTables = numTables
    woff.totalSfntSize = 12 + 16 * numTables + tables.reduce((total, table) => total + round4(table.rawView.byteLength), 0)
    let dataOffset = 44 + numTables * 20
    let i = 0
    const directories = woff.getDirectories()
    tables.forEach((table) => {
      const dir = directories[i++]
      dir.tag = table.tag
      dir.offset = dataOffset
      dir.compLength = table.view.byteLength
      dir.origChecksum = Woff.checkSum(table.rawView)
      dir.origLength = table.rawView.byteLength
      woff.view.writeBytes(table.view, dataOffset)
      dataOffset += round4(dir.compLength)
    })
    woff.view.writeBytes(rest)
    return woff
  }

  getDirectories(): WoffTableDirectoryEntry[] {
    let offset = 44
    return Array.from({ length: this.numTables }, () => {
      const dir = new WoffTableDirectoryEntry(this.view.buffer, offset)
      offset += dir.view.byteLength
      return dir
    })
  }

  createSfnt(): Sfnt {
    return new Sfnt(
      this.getDirectories().reduce((views, dir) => {
        const tag = dir.tag
        const start = this.view.byteOffset + dir.offset
        const compLength = dir.compLength
        const origLength = dir.origLength
        const end = start + compLength
        views[tag] = compLength >= origLength
          ? new DataView(this.view.buffer, start, compLength)
          : new DataView(unzlibSync(new Uint8Array(this.view.buffer.slice(start, end))).buffer)
        return views
      }, {} as Record<SfntTableTag, DataView>),
    )
  }
}
