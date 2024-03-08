import { Entity } from '../../utils'

export class WoffTableDirectoryEntry extends Entity {
  @Entity.column({ type: 'char', size: 4 }) declare tag: string
  @Entity.column({ type: 'uint32' }) declare offset: number
  @Entity.column({ type: 'uint32' }) declare compLength: number
  @Entity.column({ type: 'uint32' }) declare origLength: number
  @Entity.column({ type: 'uint32' }) declare origChecksum: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 20)
  }
}
