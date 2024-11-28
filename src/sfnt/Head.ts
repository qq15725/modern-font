import { defineColumn } from '../core'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6head.html
 */
@defineSfntTable('head')
export class Head extends SfntTable {
  @defineColumn('fixed') declare version: number
  @defineColumn('fixed') declare fontRevision: number
  @defineColumn('uint32') declare checkSumAdjustment: number
  @defineColumn('uint32') declare magickNumber: number
  @defineColumn('uint16') declare flags: number
  @defineColumn('uint16') declare unitsPerEm: number
  @defineColumn({ type: 'longDateTime' }) declare created: Date
  @defineColumn({ type: 'longDateTime' }) declare modified: Date
  @defineColumn('int16') declare xMin: number
  @defineColumn('int16') declare yMin: number
  @defineColumn('int16') declare xMax: number
  @defineColumn('int16') declare yMax: number
  @defineColumn('uint16') declare macStyle: number
  @defineColumn('uint16') declare lowestRecPPEM: number
  @defineColumn('int16') declare fontDirectionHint: number
  @defineColumn('int16') declare indexToLocFormat: number
  @defineColumn('int16') declare glyphDataFormat: number

  constructor(buffer: BufferSource = new ArrayBuffer(54), byteOffset?: number) {
    super(buffer, byteOffset, Math.min(54, buffer.byteLength - (byteOffset ?? 0)))
  }
}
