import { defineProp } from '../utils'
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
  @defineProp({ type: 'fixed' }) declare format: number
  @defineProp({ type: 'fixed' }) declare italicAngle: number
  @defineProp({ type: 'int16' }) declare underlinePosition: number
  @defineProp({ type: 'int16' }) declare underlineThickness: number
  @defineProp({ type: 'uint32' }) declare isFixedPitch: number
  @defineProp({ type: 'uint32' }) declare minMemType42: number
  @defineProp({ type: 'uint32' }) declare maxMemType42: number
  @defineProp({ type: 'uint32' }) declare minMemType1: number
  @defineProp({ type: 'uint32' }) declare maxMemType1: number

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number, byteLength?: number) {
    super(buffer, byteLength, byteOffset)
  }
}
