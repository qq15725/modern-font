import { defineProp } from '../utils'
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
  @defineProp({ type: 'fixed' }) declare version: number
  @defineProp({ type: 'int16' }) declare ascent: number
  @defineProp({ type: 'int16' }) declare descent: number
  @defineProp({ type: 'int16' }) declare lineGap: number
  @defineProp({ type: 'uint16' }) declare advanceWidthMax: number
  @defineProp({ type: 'int16' }) declare minLeftSideBearing: number
  @defineProp({ type: 'int16' }) declare minRightSideBearing: number
  @defineProp({ type: 'int16' }) declare xMaxExtent: number
  @defineProp({ type: 'int16' }) declare caretSlopeRise: number
  @defineProp({ type: 'int16' }) declare caretSlopeRun: number
  @defineProp({ type: 'int16' }) declare caretOffset: number
  @defineProp({ type: 'int16', size: 4 }) declare reserved: Array<number>
  @defineProp({ type: 'int16' }) declare metricDataFormat: number
  @defineProp({ type: 'uint16' }) declare numOfLongHorMetrics: number

  constructor(buffer: BufferSource = new ArrayBuffer(36), byteOffset?: number) {
    super(buffer, byteOffset, 36)
  }
}
