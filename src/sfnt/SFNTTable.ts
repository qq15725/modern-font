import type { SFNT } from './SFNT'
import { FontDataObject } from '../core'

export class SFNTTable extends FontDataObject {
  declare protected _sfnt: SFNT

  setSFNT(sfnt: SFNT): this {
    this._sfnt = sfnt
    return this
  }

  getSFNT(): SFNT {
    return this._sfnt
  }
}
