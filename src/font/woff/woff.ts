import { unzlibSync, zlibSync } from 'fflate'
import { Entity, toDataView } from '../../utils'
import { Sfnt } from '../../sfnt'
import { FontFileFormat } from '../font-file-format'
import { WoffTableDirectoryEntry } from './woff-table-directory-entry'

// https://www.w3.org/submissions/WOFF
export class Woff extends FontFileFormat {
  readonly mimeType = 'font/woff'
  @Entity.column({ type: 'uint32' }) declare signature: number
  @Entity.column({ type: 'uint32' }) declare flavor: number
  @Entity.column({ type: 'uint32' }) declare length: number
  @Entity.column({ type: 'uint16' }) declare numTables: number
  @Entity.column({ type: 'uint16' }) declare reserved: number
  @Entity.column({ type: 'uint32' }) declare totalSfntSize: number
  @Entity.column({ type: 'uint16' }) declare majorVersion: number
  @Entity.column({ type: 'uint16' }) declare minorVersion: number
  @Entity.column({ type: 'uint32' }) declare metaOffset: number
  @Entity.column({ type: 'uint32' }) declare metaLength: number
  @Entity.column({ type: 'uint32' }) declare metaOrigLength: number
  @Entity.column({ type: 'uint32' }) declare privOffset: number
  @Entity.column({ type: 'uint32' }) declare privLength: number

  directories: Array<WoffTableDirectoryEntry> = []

  static is(source: BufferSource) {
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
    const round4 = (value: number) => (value + 3) & ~3
    const numTables = sfnt.tables.length
    const tables = sfnt.tables.map(table => {
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
    woff.length = woff.byteLength
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
      woff.writeBytes(table.view, dataOffset)
      dataOffset += round4(dir.compLength)
    })
    woff.writeBytes(rest)
    return woff
  }

  updateDirectories(): this {
    let offset = 44
    this.directories = Array.from({ length: this.numTables }, () => {
      const dir = new WoffTableDirectoryEntry(this.buffer, offset)
      offset += dir.byteLength
      return dir
    })
    return this
  }

  get sfnt() {
    this.updateDirectories()
    return new Sfnt(
      this.directories.map(dir => {
        const tag = dir.tag
        const start = this.byteOffset + dir.offset
        const compLength = dir.compLength
        const origLength = dir.origLength
        const end = start + compLength
        return {
          tag,
          view: compLength >= origLength
            ? new DataView(this.buffer, start, compLength)
            : new DataView(unzlibSync(new Uint8Array(this.buffer.slice(start, end))).buffer),
        }
      }),
    )
  }
}
