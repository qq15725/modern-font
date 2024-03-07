import { unzlibSync } from 'fflate'
import { Entity } from '../utils'
import { Sfnt } from '../sfnt'
import { FontFile } from '../font-file'
import { WoffTableDirectoryEntry } from './woff-table-directory-entry'

// https://www.w3.org/submissions/WOFF
export class Woff extends FontFile {
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

  static is(view: DataView) {
    return [
      0x774F4646, // wOFF
    ].includes(view.getUint32(0))
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
