import { Entity } from '../utils'
import { Sfnt } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    head: Head
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6head.html
 */
@Sfnt.table('head')
export class Head extends SfntTable {
  @Entity.column({ type: 'fixed' }) declare version: number
  @Entity.column({ type: 'fixed' }) declare fontRevision: number
  @Entity.column({ type: 'uint32' }) declare checkSumAdjustment: number
  @Entity.column({ type: 'uint32' }) declare magickNumber: number
  @Entity.column({ type: 'uint16' }) declare flags: number
  @Entity.column({ type: 'uint16' }) declare unitsPerEm: number
  @Entity.column({ type: 'longDateTime' }) declare created: Date
  @Entity.column({ type: 'longDateTime' }) declare modified: Date
  @Entity.column({ type: 'int16' }) declare xMin: number
  @Entity.column({ type: 'int16' }) declare yMin: number
  @Entity.column({ type: 'int16' }) declare xMax: number
  @Entity.column({ type: 'int16' }) declare yMax: number
  @Entity.column({ type: 'uint16' }) declare macStyle: number
  @Entity.column({ type: 'uint16' }) declare lowestRecPPEM: number
  @Entity.column({ type: 'int16' }) declare fontDirectionHint: number
  @Entity.column({ type: 'int16' }) declare indexToLocFormat: number
  @Entity.column({ type: 'int16' }) declare glyphDataFormat: number

  constructor(buffer: BufferSource = new ArrayBuffer(54), byteOffset?: number) {
    super(buffer, byteOffset, 54)
  }
}
