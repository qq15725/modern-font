import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    hhea: Hhea
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hhea.html
 */
@defineSfntTable('hhea')
export class Hhea extends SfntTable {
  @defineColumn({ type: 'fixed' }) declare version: number
  @defineColumn({ type: 'int16' }) declare ascent: number
  @defineColumn({ type: 'int16' }) declare descent: number
  @defineColumn({ type: 'int16' }) declare lineGap: number
  @defineColumn({ type: 'uint16' }) declare advanceWidthMax: number
  @defineColumn({ type: 'int16' }) declare minLeftSideBearing: number
  @defineColumn({ type: 'int16' }) declare minRightSideBearing: number
  @defineColumn({ type: 'int16' }) declare xMaxExtent: number
  @defineColumn({ type: 'int16' }) declare caretSlopeRise: number
  @defineColumn({ type: 'int16' }) declare caretSlopeRun: number
  @defineColumn({ type: 'int16' }) declare caretOffset: number
  @defineColumn({ type: 'int16', size: 4 }) declare reserved: Array<number>
  @defineColumn({ type: 'int16' }) declare metricDataFormat: number
  @defineColumn({ type: 'uint16' }) declare numOfLongHorMetrics: number

  constructor(buffer: BufferSource = new ArrayBuffer(36), byteOffset?: number) {
    super(buffer, byteOffset, 36)
  }
}
