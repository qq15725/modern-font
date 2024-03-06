import { Entity } from '../utils'
import { Sfnt } from '../sfnt'
import { WoffTableDirectoryEntry } from './woff-table-directory-entry'

// https://www.w3.org/submissions/WOFF
export class Woff extends Entity {
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

  update(): this {
    const buffer = this.buffer
    let offset = 44
    this.directories = Array.from({ length: this.numTables }, () => {
      const dir = new WoffTableDirectoryEntry(buffer, offset)
      offset += 20
      return dir
    })
    return this
  }

  get sfnt() {
    const buffer = this.buffer
    return new Sfnt(
      this.directories.map(dir => {
        const tag = dir.tag
        const offset = dir.offset
        const compLength = dir.compLength
        const origLength = dir.origLength
        const end = offset + compLength
        return {
          tag,
          view: compLength >= origLength
            ? new DataView(buffer, offset, compLength)
            : new DataView(unzlibSync(new Uint8Array(buffer.slice(offset, end))).buffer),
        }
      }),
    )
  }
}
