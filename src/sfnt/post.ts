import { Entity } from '../utils'
import { Sfnt } from './sfnt'
import { SfntTable } from './sfnt-table'

declare module './sfnt' {
  interface Sfnt {
    post: Post
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6post.html
 */
@Sfnt.table('post')
export class Post extends SfntTable {
  @Entity.column({ type: 'fixed' }) declare format: number
  @Entity.column({ type: 'fixed' }) declare italicAngle: number
  @Entity.column({ type: 'int16' }) declare underlinePosition: number
  @Entity.column({ type: 'int16' }) declare underlineThickness: number
  @Entity.column({ type: 'uint32' }) declare isFixedPitch: number
  @Entity.column({ type: 'uint32' }) declare minMemType42: number
  @Entity.column({ type: 'uint32' }) declare maxMemType42: number
  @Entity.column({ type: 'uint32' }) declare minMemType1: number
  @Entity.column({ type: 'uint32' }) declare maxMemType1: number

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number, byteLength?: number) {
    super(buffer, byteLength, byteOffset)
  }
}
