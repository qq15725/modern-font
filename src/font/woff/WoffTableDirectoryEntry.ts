import { defineColumn, Readable } from '../../utils'

export class WoffTableDirectoryEntry extends Readable {
  @defineColumn({ type: 'char', size: 4 }) declare tag: string
  @defineColumn('uint32') declare offset: number
  @defineColumn('uint32') declare compLength: number
  @defineColumn('uint32') declare origLength: number
  @defineColumn('uint32') declare origChecksum: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 20)
  }
}
