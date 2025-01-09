import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6loca.html
 */
@defineSFNTTable('loca')
export class Loca extends SFNTTable {
  static from(locations: number[], indexToLocFormat = 1): Loca {
    const byteLength = locations.length * (indexToLocFormat ? 4 : 2)
    const loca = new Loca(new ArrayBuffer(byteLength))
    locations.forEach((location) => {
      if (indexToLocFormat) {
        loca.view.writeUint32(location)
      }
      else {
        loca.view.writeUint16(location / 2)
      }
    })
    return loca
  }

  protected _locations?: number[]
  get locations(): number[] {
    return this._locations ??= this.readLocations()
  }

  readLocations(): number[] {
    const numGlyphs = this._sfnt.maxp.numGlyphs
    const indexToLocFormat = this._sfnt.head.indexToLocFormat
    const reader = this.view
    reader.seek(0)
    return Array.from({ length: numGlyphs }).map(() => {
      return indexToLocFormat
        ? reader.readUint32()
        : reader.readUint16() * 2
    })
  }
}
