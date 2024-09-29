import { defineProp, Entity } from '../../utils'

export class WoffTableDirectoryEntry extends Entity {
  @defineProp({ type: 'char', size: 4 }) declare tag: string
  @defineProp({ type: 'uint32' }) declare offset: number
  @defineProp({ type: 'uint32' }) declare compLength: number
  @defineProp({ type: 'uint32' }) declare origLength: number
  @defineProp({ type: 'uint32' }) declare origChecksum: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 20)
  }
}
