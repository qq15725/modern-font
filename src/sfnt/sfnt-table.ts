import type { Sfnt } from './sfnt'
import { Entity } from '../utils'

export class SfntTable extends Entity {
  declare sfnt: Sfnt

  setSfnt(sfnt: Sfnt): this {
    this.sfnt = sfnt
    return this
  }
}
