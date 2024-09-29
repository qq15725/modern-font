import type { Sfnt } from './Sfnt'
import { Readable } from '../utils'

export class SfntTable extends Readable {
  declare sfnt: Sfnt

  setSfnt(sfnt: Sfnt): this {
    this.sfnt = sfnt
    return this
  }
}
