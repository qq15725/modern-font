import { Entity } from '../utils'
import type { Sfnt } from './sfnt'

export class SfntTable extends Entity {
  declare sfnt: Sfnt

  setSfnt(sfnt: Sfnt): this {
    this.sfnt = sfnt
    return this
  }
}
