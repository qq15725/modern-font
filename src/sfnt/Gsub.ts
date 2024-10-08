import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    gsub: Gsub
  }
}

/**
 * @link https://learn.microsoft.com/zh-cn/typography/opentype/spec/gsub
 */
@defineSfntTable('GSUB', 'gsub')
export class Gsub extends SfntTable {
  @defineColumn('fixed') declare version: number
  // TODO
}
