import type { Sfnt } from './Sfnt'
import { Readable } from '../utils'

export class SfntTable extends Readable {
  declare protected _sfnt: Sfnt

  setSfnt(sfnt: Sfnt): this {
    this._sfnt = sfnt
    return this
  }

  getSfnt(): Sfnt {
    return this._sfnt
  }
}
