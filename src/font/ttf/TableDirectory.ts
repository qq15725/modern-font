import { defineColumn, Readable } from '../../utils'

export class TableDirectory extends Readable {
  @defineColumn({ type: 'char', size: 4 }) declare tag: string
  @defineColumn({ type: 'uint32' }) declare checkSum: number
  @defineColumn({ type: 'uint32' }) declare offset: number
  @defineColumn({ type: 'uint32' }) declare length: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 16)
  }
}
