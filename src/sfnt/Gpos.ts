import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

/**
 * @link https://learn.microsoft.com/zh-cn/typography/opentype/spec/gpos
 */
@defineSFNTTable('GPOS', 'gpos')
export class Gpos extends SFNTTable {
  // TODO
}
