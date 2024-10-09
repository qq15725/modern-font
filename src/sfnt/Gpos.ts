import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://learn.microsoft.com/zh-cn/typography/opentype/spec/gpos
 */
@defineSfntTable('GPOS', 'gpos')
export class Gpos extends SfntTable {
  // TODO
}
