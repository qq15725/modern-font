import { defineColumn } from '../core'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hhea.html
 */
@defineSfntTable('hhea')
export class Hhea extends SfntTable {
  @defineColumn('fixed') declare version: number
  @defineColumn('int16') declare ascent: number
  @defineColumn('int16') declare descent: number
  @defineColumn('int16') declare lineGap: number
  @defineColumn('uint16') declare advanceWidthMax: number
  @defineColumn('int16') declare minLeftSideBearing: number
  @defineColumn('int16') declare minRightSideBearing: number
  @defineColumn('int16') declare xMaxExtent: number
  @defineColumn('int16') declare caretSlopeRise: number
  @defineColumn('int16') declare caretSlopeRun: number
  @defineColumn('int16') declare caretOffset: number
  @defineColumn({ type: 'int16', size: 4 }) declare reserved: number[]
  @defineColumn('int16') declare metricDataFormat: number
  @defineColumn('uint16') declare numOfLongHorMetrics: number

  constructor(buffer: BufferSource = new ArrayBuffer(36), byteOffset?: number) {
    super(buffer, byteOffset, Math.min(36, buffer.byteLength - (byteOffset ?? 0)))
  }
}
