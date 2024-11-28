import type { Sfnt } from './Sfnt'
import { FontDataObject } from '../core'

export class SfntTable extends FontDataObject {
  declare protected _sfnt: Sfnt

  setSfnt(sfnt: Sfnt): this {
    this._sfnt = sfnt
    return this
  }

  getSfnt(): Sfnt {
    return this._sfnt
  }
}
