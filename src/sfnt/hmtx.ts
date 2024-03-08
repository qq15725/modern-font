import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    hmtx: Hmtx
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hmtx.html
 */
@Sfnt.table('hmtx')
export class Hmtx extends Entity {
  getMetrics(
    numGlyphs: number,
    numOfLongHorMetrics: number,
  ) {
    let advanceWidth = 0
    this.seek(0)
    return Array.from(new Array(numGlyphs)).map((_, i) => {
      if (i < numOfLongHorMetrics) advanceWidth = this.readUint16()
      return {
        advanceWidth,
        leftSideBearing: this.readUint16(),
      }
    })
  }
}
