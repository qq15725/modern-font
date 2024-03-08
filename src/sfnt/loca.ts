import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    loca: Loca
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6loca.html
 */
@Sfnt.table('loca')
export class Loca extends Entity {
  getLocations(
    numGlyphs: number,
    indexToLocFormat: number,
  ): Array<number> {
    this.seek(0)
    return Array.from(new Array(numGlyphs)).map(() => {
      return indexToLocFormat
        ? this.readUint32()
        : this.readUint16() * 2
    })
  }
}
