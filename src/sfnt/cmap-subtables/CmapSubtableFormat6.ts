import { defineColumn, FontDataView } from '../../utils'

export class CmapSubtableFormat6 extends FontDataView {
  @defineColumn({ type: 'uint16' }) declare format: 6
  @defineColumn({ type: 'uint16' }) declare length: number
  @defineColumn({ type: 'uint16' }) declare language: number
  @defineColumn({ type: 'uint16' }) declare firstCode: number
  @defineColumn({ type: 'uint16' }) declare entryCount: number

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
