import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6kern.html
 */
@defineSFNTTable('kern', 'kern')
export class Kern extends SFNTTable {
  // TODO
}
