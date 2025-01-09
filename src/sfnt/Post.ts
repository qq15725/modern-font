import { defineColumn } from '../core'
import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6post.html
 */
@defineSFNTTable('post')
export class Post extends SFNTTable {
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
