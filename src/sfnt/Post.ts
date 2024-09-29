import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    post: Post
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6post.html
 */
@defineSfntTable('post')
export class Post extends SfntTable {
  @defineColumn({ type: 'fixed' }) declare format: number
  @defineColumn({ type: 'fixed' }) declare italicAngle: number
  @defineColumn({ type: 'int16' }) declare underlinePosition: number
  @defineColumn({ type: 'int16' }) declare underlineThickness: number
  @defineColumn({ type: 'uint32' }) declare isFixedPitch: number
  @defineColumn({ type: 'uint32' }) declare minMemType42: number
  @defineColumn({ type: 'uint32' }) declare maxMemType42: number
  @defineColumn({ type: 'uint32' }) declare minMemType1: number
  @defineColumn({ type: 'uint32' }) declare maxMemType1: number

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number, byteLength?: number) {
    super(buffer, byteLength, byteOffset)
  }
}
