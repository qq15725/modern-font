import { defineColumn } from '../core'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://learn.microsoft.com/zh-cn/typography/opentype/spec/gsub
 */
@defineSfntTable('GSUB', 'gsub')
export class Gsub extends SfntTable {
  @defineColumn('uint16') declare majorVersion: number
  @defineColumn('uint16') declare minorVersion: number
  @defineColumn('uint16') declare scriptListOffset: number
  @defineColumn('uint16') declare featureListOffset: number
  @defineColumn('uint16') declare lookupListOffset: number
  @defineColumn('uint16') declare featureVariationsOffset: number
  // TODO
}
