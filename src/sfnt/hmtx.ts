import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    hmtx: Hmtx
  }
}

// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hmtx.html
@Sfnt.table('hmtx')
export class Hmtx extends Entity {
  //
}
