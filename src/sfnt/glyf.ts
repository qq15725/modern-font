import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    glyf: Glyf
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6glyf.html
 */
@Sfnt.table('glyf')
export class Glyf extends Entity {
  //
}
