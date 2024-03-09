import { Entity } from '../utils'
import { Sfnt } from './sfnt'
import { SfntTable } from './sfnt-table'

declare module './sfnt' {
  interface Sfnt {
    vhea?: Vhea
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6vhea.html
 */
@Sfnt.table('vhea')
export class Vhea extends SfntTable {
  @Entity.column({ type: 'fixed' }) declare version: number
  @Entity.column({ type: 'int16' }) declare vertTypoAscender: number
  @Entity.column({ type: 'int16' }) declare vertTypoDescender: number
  @Entity.column({ type: 'int16' }) declare vertTypoLineGap: number
  @Entity.column({ type: 'int16' }) declare advanceHeightMax: number
  @Entity.column({ type: 'int16' }) declare minTopSideBearing: number
  @Entity.column({ type: 'int16' }) declare minBottomSideBearing: number
  @Entity.column({ type: 'int16' }) declare yMaxExtent: number
  @Entity.column({ type: 'int16' }) declare caretSlopeRise: number
  @Entity.column({ type: 'int16' }) declare caretSlopeRun: number
  @Entity.column({ type: 'int16' }) declare caretOffset: number
  @Entity.column({ type: 'int16', size: 4 }) declare reserved: Array<number>
  @Entity.column({ type: 'int16' }) declare metricDataFormat: number
  @Entity.column({ type: 'int16' }) declare numOfLongVerMetrics: number
}
