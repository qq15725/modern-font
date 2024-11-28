import { defineColumn } from '../core'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6post.html
 */
@defineSfntTable('post')
export class Post extends SfntTable {
  @defineColumn('fixed') declare format: number
  @defineColumn('fixed') declare italicAngle: number
  @defineColumn('int16') declare underlinePosition: number
  @defineColumn('int16') declare underlineThickness: number
  @defineColumn('uint32') declare isFixedPitch: number
  @defineColumn('uint32') declare minMemType42: number
  @defineColumn('uint32') declare maxMemType42: number
  @defineColumn('uint32') declare minMemType1: number
  @defineColumn('uint32') declare maxMemType1: number

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number, byteLength?: number) {
    super(buffer, byteOffset, byteLength)
  }
}
