import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    gpos: Gpos
  }
}

/**
 * @link https://learn.microsoft.com/zh-cn/typography/opentype/spec/gpos
 */
@defineSfntTable('GPOS', 'gpos')
export class Gpos extends SfntTable {
  // TODO
}
