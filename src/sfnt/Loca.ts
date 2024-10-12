import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6loca.html
 */
@defineSfntTable('loca')
export class Loca extends SfntTable {
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
    if (!this._locations)
      this._locations = this._getLocations()
    return this._locations
  }

  protected _getLocations(): number[] {
    const numGlyphs = this._sfnt.maxp.numGlyphs
    const indexToLocFormat = this._sfnt.head.indexToLocFormat
    this.view.seek(0)
    return Array.from({ length: numGlyphs }).map(() => {
      return indexToLocFormat
        ? this.view.readUint32()
        : this.view.readUint16() * 2
    })
  }
}
