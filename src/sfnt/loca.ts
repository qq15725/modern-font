import { Sfnt } from './sfnt'
import { SfntTable } from './sfnt-table'

declare module './sfnt' {
  interface Sfnt {
    loca: Loca
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6loca.html
 */
@Sfnt.table('loca')
export class Loca extends SfntTable {
  get locations(): Array<number> {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const indexToLocFormat = this.sfnt.head.indexToLocFormat
    this.seek(0)
    return Array.from(new Array(numGlyphs)).map(() => {
      return indexToLocFormat
        ? this.readUint32()
        : this.readUint16() * 2
    })
  }

  // set locations() {
  // const newLoca = new DataView(new ArrayBuffer((numGlyphs + 1) * 4))
  // let newLocaOffset = 0
  // glyphs.forEach((glyf, i) => {
  //   newLoca.setUint32(i * 4, newLocaOffset, false)
  //   newLocaOffset += glyf.buffer.byteLength
  // })
  // newLoca.setUint32(numGlyphs * 4, newLocaOffset, false) // extra
  // }
}
