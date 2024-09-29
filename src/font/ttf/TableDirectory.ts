import { defineProp, Entity } from '../../utils'

export class TableDirectory extends Entity {
  @defineProp({ type: 'char', size: 4 }) declare tag: string
  @defineProp({ type: 'uint32' }) declare checkSum: number
  @defineProp({ type: 'uint32' }) declare offset: number
  @defineProp({ type: 'uint32' }) declare length: number

  constructor(buffer: BufferSource, byteOffset?: number) {
    super(buffer, byteOffset, 16)
  }
}
