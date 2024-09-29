import { defineProp } from '../utils'
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
  @defineProp({ type: 'fixed' }) declare version: number
  @defineProp({ type: 'fixed' }) declare fontRevision: number
  @defineProp({ type: 'uint32' }) declare checkSumAdjustment: number
  @defineProp({ type: 'uint32' }) declare magickNumber: number
  @defineProp({ type: 'uint16' }) declare flags: number
  @defineProp({ type: 'uint16' }) declare unitsPerEm: number
  @defineProp({ type: 'longDateTime' }) declare created: Date
  @defineProp({ type: 'longDateTime' }) declare modified: Date
  @defineProp({ type: 'int16' }) declare xMin: number
  @defineProp({ type: 'int16' }) declare yMin: number
  @defineProp({ type: 'int16' }) declare xMax: number
  @defineProp({ type: 'int16' }) declare yMax: number
  @defineProp({ type: 'uint16' }) declare macStyle: number
  @defineProp({ type: 'uint16' }) declare lowestRecPPEM: number
  @defineProp({ type: 'int16' }) declare fontDirectionHint: number
  @defineProp({ type: 'int16' }) declare indexToLocFormat: number
  @defineProp({ type: 'int16' }) declare glyphDataFormat: number

  constructor(buffer: BufferSource = new ArrayBuffer(54), byteOffset?: number) {
    super(buffer, byteOffset, 54)
  }
}
