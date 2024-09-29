import { defineColumn, Readable } from '../../utils'

export class WoffTableDirectoryEntry extends Readable {
  @defineColumn({ type: 'char', size: 4 }) declare tag: string
  @defineColumn({ type: 'uint32' }) declare offset: number
  @defineColumn({ type: 'uint32' }) declare compLength: number
  @defineColumn({ type: 'uint32' }) declare origLength: number
  @defineColumn({ type: 'uint32' }) declare origChecksum: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 20)
  }
}
