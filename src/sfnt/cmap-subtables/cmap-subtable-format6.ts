import { Entity } from '../../utils'

export class CmapSubtableFormat6 extends Entity {
  @Entity.column({ type: 'uint16' }) declare format: 6
  @Entity.column({ type: 'uint16' }) declare length: number
  @Entity.column({ type: 'uint16' }) declare language: number
  @Entity.column({ type: 'uint16' }) declare firstCode: number
  @Entity.column({ type: 'uint16' }) declare entryCount: number

  get glyphIndexArray() {
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
