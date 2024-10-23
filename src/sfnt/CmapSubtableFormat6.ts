import { defineColumn, Readable } from '../utils'

export class CmapSubtableFormat6 extends Readable {
  @defineColumn('uint16') declare format: 6
  @defineColumn('uint16') declare length: number
  @defineColumn('uint16') declare language: number
  @defineColumn('uint16') declare firstCode: number
  @defineColumn('uint16') declare entryCount: number

  get glyphIndexArray(): number[] {
    this.view.seek(12)
    return Array.from({ length: this.entryCount }, () => this.view.readUint16())
  }

  getUnicodeToGlyphIndexMap(): Map<number, number> {
    const glyphIndexArray = this.glyphIndexArray
    const unicodeToGlyphIndexMap = new Map<number, number>()
    glyphIndexArray.forEach((glyphIndex, unicode) => {
      unicodeToGlyphIndexMap.set(unicode, glyphIndex)
    })
    return unicodeToGlyphIndexMap
  }
}
