import { Sfnt } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    loca: Loca
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6loca.html
 */
@Sfnt.table('loca')
export class Loca extends SfntTable {
  static from(locations: Array<number>, indexToLocFormat = 1): Loca {
    const byteLength = locations.length * (indexToLocFormat ? 4 : 2)
    const loca = new Loca(new ArrayBuffer(byteLength))
    locations.forEach((location) => {
      if (indexToLocFormat) {
        loca.writeUint32(location)
      }
      else {
        loca.writeUint16(location / 2)
      }
    })
    return loca
  }

  getLocations(): Array<number> {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const indexToLocFormat = this.sfnt.head.indexToLocFormat
    this.seek(0)
    return Array.from({ length: numGlyphs }).map(() => {
      return indexToLocFormat
        ? this.readUint32()
        : this.readUint16() * 2
    })
  }
}
