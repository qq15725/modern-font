import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    head: Head
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6head.html
 */
@defineSfntTable('head')
export class Head extends SfntTable {
  @defineColumn({ type: 'fixed' }) declare version: number
  @defineColumn({ type: 'fixed' }) declare fontRevision: number
  @defineColumn({ type: 'uint32' }) declare checkSumAdjustment: number
  @defineColumn({ type: 'uint32' }) declare magickNumber: number
  @defineColumn({ type: 'uint16' }) declare flags: number
  @defineColumn({ type: 'uint16' }) declare unitsPerEm: number
  @defineColumn({ type: 'longDateTime' }) declare created: Date
  @defineColumn({ type: 'longDateTime' }) declare modified: Date
  @defineColumn({ type: 'int16' }) declare xMin: number
  @defineColumn({ type: 'int16' }) declare yMin: number
  @defineColumn({ type: 'int16' }) declare xMax: number
  @defineColumn({ type: 'int16' }) declare yMax: number
  @defineColumn({ type: 'uint16' }) declare macStyle: number
  @defineColumn({ type: 'uint16' }) declare lowestRecPPEM: number
  @defineColumn({ type: 'int16' }) declare fontDirectionHint: number
  @defineColumn({ type: 'int16' }) declare indexToLocFormat: number
  @defineColumn({ type: 'int16' }) declare glyphDataFormat: number

  constructor(buffer: BufferSource = new ArrayBuffer(54), byteOffset?: number) {
    super(buffer, byteOffset, 54)
  }
}
