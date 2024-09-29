import type { Sfnt } from './Sfnt'
import { FontDataView } from '../utils'

export class SfntTable extends FontDataView {
  declare sfnt: Sfnt

  setSfnt(sfnt: Sfnt): this {
    this.sfnt = sfnt
    return this
  }
}
