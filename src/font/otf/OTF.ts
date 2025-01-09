import type { SFNT } from '../../sfnt'
import { TTF } from '../ttf'

/**
 * OpenType
 */
export class OTF extends TTF {
  format = 'OpenType'
  mimeType = 'font/otf'

  static signature = new Set([
    0x4F54544F, // OTTO
  ])

  static from(sfnt: SFNT): OTF {
    return super.from(sfnt) as OTF
  }
}
