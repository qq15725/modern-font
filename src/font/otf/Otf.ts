import type { Sfnt } from '../../sfnt'
import { Ttf } from '../ttf'

// OpenType
export class Otf extends Ttf {
  format = 'OpenType'
  mimeType = 'font/otf'

  static signature = new Set([
    0x4F54544F, // OTTO
  ])

  static from(sfnt: Sfnt): Otf {
    return super.from(sfnt) as Otf
  }
}
