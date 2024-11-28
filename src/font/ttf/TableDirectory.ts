import { defineColumn, FontDataObject } from '../../core'

export class TableDirectory extends FontDataObject {
  @defineColumn({ type: 'char', size: 4 }) declare tag: string
  @defineColumn('uint32') declare checkSum: number
  @defineColumn('uint32') declare offset: number
  @defineColumn('uint32') declare length: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 16)
  }
}
