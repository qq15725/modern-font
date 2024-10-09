import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6kern.html
 */
@defineSfntTable('kern', 'kern')
export class Kern extends SfntTable {
  // TODO
}
