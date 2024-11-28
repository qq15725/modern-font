import { defineColumn, FontDataObject } from '../../core'

export class WoffTableDirectoryEntry extends FontDataObject {
  @defineColumn({ type: 'char', size: 4 }) declare tag: string
  @defineColumn('uint32') declare offset: number
  @defineColumn('uint32') declare compLength: number
  @defineColumn('uint32') declare origLength: number
  @defineColumn('uint32') declare origChecksum: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 20)
  }
}
