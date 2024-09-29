import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    vhea?: Vhea
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6vhea.html
 */
@defineSfntTable('vhea')
export class Vhea extends SfntTable {
  @defineColumn({ type: 'fixed' }) declare version: number
  @defineColumn({ type: 'int16' }) declare vertTypoAscender: number
  @defineColumn({ type: 'int16' }) declare vertTypoDescender: number
  @defineColumn({ type: 'int16' }) declare vertTypoLineGap: number
  @defineColumn({ type: 'int16' }) declare advanceHeightMax: number
  @defineColumn({ type: 'int16' }) declare minTopSideBearing: number
  @defineColumn({ type: 'int16' }) declare minBottomSideBearing: number
  @defineColumn({ type: 'int16' }) declare yMaxExtent: number
  @defineColumn({ type: 'int16' }) declare caretSlopeRise: number
  @defineColumn({ type: 'int16' }) declare caretSlopeRun: number
  @defineColumn({ type: 'int16' }) declare caretOffset: number
  @defineColumn({ type: 'int16', size: 4 }) declare reserved: Array<number>
  @defineColumn({ type: 'int16' }) declare metricDataFormat: number
  @defineColumn({ type: 'int16' }) declare numOfLongVerMetrics: number

  constructor(buffer: BufferSource = new ArrayBuffer(36), byteOffset?: number) {
    super(buffer, byteOffset, 36)
  }
}
