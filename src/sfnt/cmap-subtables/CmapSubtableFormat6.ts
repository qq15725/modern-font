import { defineProp, Entity } from '../../utils'

export class CmapSubtableFormat6 extends Entity {
  @defineProp({ type: 'uint16' }) declare format: 6
  @defineProp({ type: 'uint16' }) declare length: number
  @defineProp({ type: 'uint16' }) declare language: number
  @defineProp({ type: 'uint16' }) declare firstCode: number
  @defineProp({ type: 'uint16' }) declare entryCount: number

  get glyphIndexArray(): number[] {
    this.seek(12)
    return Array.from({ length: this.entryCount }, () => this.readUint16())
  }

  getUnicodeGlyphIndexMap(): Map<number, number> {
    const glyphIndexArray = this.glyphIndexArray
    const unicodeGlyphIndexMap = new Map<number, number>()
    glyphIndexArray.forEach((glyphIndex, unicode) => {
      unicodeGlyphIndexMap.set(unicode, glyphIndex)
    })
    return unicodeGlyphIndexMap
  }
}
