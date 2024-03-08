import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    vmtx?: Vmtx
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6vmtx.html
 */
@Sfnt.table('vmtx')
export class Vmtx extends Entity {
  getMetrics(
    numGlyphs: number,
    numOfLongVerMetrics: number,
  ) {
    this.seek(0)
    let advanceHeight = 0
    return Array.from(new Array(numGlyphs)).map((_, i) => {
      if (i < numOfLongVerMetrics) {
        advanceHeight = this.readUint16()
      }
      return {
        advanceHeight,
        topSideBearing: this.readInt16(),
      }
    })
  }
}
