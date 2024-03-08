import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    hhea: Hhea
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hhea.html
 */
@Sfnt.table('hhea')
export class Hhea extends Entity {
  @Entity.column({ type: 'fixed' }) declare version: number
  @Entity.column({ type: 'int16' }) declare ascent: number
  @Entity.column({ type: 'int16' }) declare descent: number
  @Entity.column({ type: 'int16' }) declare lineGap: number
  @Entity.column({ type: 'uint16' }) declare advanceWidthMax: number
  @Entity.column({ type: 'int16' }) declare minLeftSideBearing: number
  @Entity.column({ type: 'int16' }) declare minRightSideBearing: number
  @Entity.column({ type: 'int16' }) declare xMaxExtent: number
  @Entity.column({ type: 'int16' }) declare caretSlopeRise: number
  @Entity.column({ type: 'int16' }) declare caretSlopeRun: number
  @Entity.column({ type: 'int16' }) declare caretOffset: number
  @Entity.column({ type: 'int16', size: 4 }) declare reserved: Array<number>
  @Entity.column({ type: 'int16' }) declare metricDataFormat: number
  @Entity.column({ type: 'uint16' }) declare numOfLongHorMetrics: number
}
