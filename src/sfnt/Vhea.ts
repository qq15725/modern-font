import { defineProp } from '../utils'
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
  @defineProp({ type: 'fixed' }) declare version: number
  @defineProp({ type: 'int16' }) declare vertTypoAscender: number
  @defineProp({ type: 'int16' }) declare vertTypoDescender: number
  @defineProp({ type: 'int16' }) declare vertTypoLineGap: number
  @defineProp({ type: 'int16' }) declare advanceHeightMax: number
  @defineProp({ type: 'int16' }) declare minTopSideBearing: number
  @defineProp({ type: 'int16' }) declare minBottomSideBearing: number
  @defineProp({ type: 'int16' }) declare yMaxExtent: number
  @defineProp({ type: 'int16' }) declare caretSlopeRise: number
  @defineProp({ type: 'int16' }) declare caretSlopeRun: number
  @defineProp({ type: 'int16' }) declare caretOffset: number
  @defineProp({ type: 'int16', size: 4 }) declare reserved: Array<number>
  @defineProp({ type: 'int16' }) declare metricDataFormat: number
  @defineProp({ type: 'int16' }) declare numOfLongVerMetrics: number

  constructor(buffer: BufferSource = new ArrayBuffer(36), byteOffset?: number) {
    super(buffer, byteOffset, 36)
  }
}
