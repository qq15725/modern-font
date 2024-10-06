import { unzlibSync, zlibSync } from 'fflate'
import { Sfnt } from '../../sfnt'
import { defineColumn, toDataView } from '../../utils'
import { Font } from '../Font'
import { WoffTableDirectoryEntry } from './WoffTableDirectoryEntry'

// https://www.w3.org/submissions/WOFF
export class Woff extends Font {
  override mimeType = 'font/woff'
  @defineColumn({ type: 'uint32' }) declare signature: number
  @defineColumn({ type: 'uint32' }) declare flavor: number
  @defineColumn({ type: 'uint32' }) declare length: number
  @defineColumn({ type: 'uint16' }) declare numTables: number
  @defineColumn({ type: 'uint16' }) declare reserved: number
  @defineColumn({ type: 'uint32' }) declare totalSfntSize: number
  @defineColumn({ type: 'uint16' }) declare majorVersion: number
  @defineColumn({ type: 'uint16' }) declare minorVersion: number
  @defineColumn({ type: 'uint32' }) declare metaOffset: number
  @defineColumn({ type: 'uint32' }) declare metaLength: number
  @defineColumn({ type: 'uint32' }) declare metaOrigLength: number
  @defineColumn({ type: 'uint32' }) declare privOffset: number
  @defineColumn({ type: 'uint32' }) declare privLength: number

  directories: Array<WoffTableDirectoryEntry> = []

  static is(source: BufferSource): boolean {
    const view = toDataView(source)
    return [
      0x774F4646, // wOFF
    ].includes(view.getUint32(0))
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
    const numTables = sfnt.tables.length
    const tables = sfnt.tables.map((table) => {
      const view = toDataView(zlibSync(
        new Uint8Array(
          table.view.buffer,
          table.view.byteOffset,
          table.view.byteLength,
        ),
      ))
      return {
        tag: table.tag,
        view: view.byteLength < table.view.byteLength ? view : table.view,
        rawView: table.view,
      }
    })
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
    woff.updateDirectories()
    tables.forEach((table) => {
      const dir = woff.directories[i++]
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

  updateDirectories(): this {
    let offset = 44
    this.directories = Array.from({ length: this.numTables }, () => {
      const dir = new WoffTableDirectoryEntry(this.view.buffer, offset)
      offset += dir.view.byteLength
      return dir
    })
    return this
  }

  get sfnt(): Sfnt {
    this.updateDirectories()
    return new Sfnt(
      this.directories.map((dir) => {
        const tag = dir.tag
        const start = this.view.byteOffset + dir.offset
        const compLength = dir.compLength
        const origLength = dir.origLength
        const end = start + compLength
        return {
          tag,
          view: compLength >= origLength
            ? new DataView(this.view.buffer, start, compLength)
            : new DataView(unzlibSync(new Uint8Array(this.view.buffer.slice(start, end))).buffer),
        }
      }),
    )
  }
}
