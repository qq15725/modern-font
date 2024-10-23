import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6vhea.html
 */
@defineSfntTable('vhea')
export class Vhea extends SfntTable {
  @defineColumn('fixed') declare version: number
  @defineColumn('int16') declare vertTypoAscender: number
  @defineColumn('int16') declare vertTypoDescender: number
  @defineColumn('int16') declare vertTypoLineGap: number
  @defineColumn('int16') declare advanceHeightMax: number
  @defineColumn('int16') declare minTopSideBearing: number
  @defineColumn('int16') declare minBottomSideBearing: number
  @defineColumn('int16') declare yMaxExtent: number
  @defineColumn('int16') declare caretSlopeRise: number
  @defineColumn('int16') declare caretSlopeRun: number
  @defineColumn('int16') declare caretOffset: number
  @defineColumn({ type: 'int16', size: 4 }) declare reserved: number[]
  @defineColumn('int16') declare metricDataFormat: number
  @defineColumn('int16') declare numOfLongVerMetrics: number

  constructor(buffer: BufferSource = new ArrayBuffer(36), byteOffset?: number) {
    super(buffer, byteOffset, Math.min(36, buffer.byteLength - (byteOffset ?? 0)))
  }
}
