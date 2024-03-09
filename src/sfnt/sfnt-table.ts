import { Entity } from '../utils'
import type { Sfnt } from './sfnt'

export class SfntTable extends Entity {
  constructor(
    public sfnt: Sfnt,
    source: BufferSource,
    byteOffset?: number,
    byteLength?: number,
  ) {
    super(source, byteOffset, byteLength)
  }
}
