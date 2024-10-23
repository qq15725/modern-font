import { defineColumn, Readable } from '../utils'

export class CmapSubtableFormat0 extends Readable {
  @defineColumn('uint16') declare format: 0
  @defineColumn('uint16') declare length: number
  @defineColumn('uint16') declare language: number
  @defineColumn({ type: 'uint8', size: 256 }) declare glyphIndexArray: number[]

  constructor(buffer: BufferSource = new ArrayBuffer(262), byteOffset?: number) {
    super(buffer, byteOffset, 262)
  }

  static from(unicodeToGlyphIndexMap: Map<number, number>): CmapSubtableFormat0 {
    const table = new CmapSubtableFormat0()
    table.format = 0
    table.length = table.view.byteLength
    table.language = 0
    unicodeToGlyphIndexMap.forEach((glyphIndex, unicode) => {
      if (unicode < 256 && glyphIndex < 256) {
        table.view.writeUint8(glyphIndex, 6 + unicode)
      }
    })
    return table
  }

  getUnicodeToGlyphIndexMap(): Map<number, number> {
    const unicodeToGlyphIndexMap = new Map<number, number>()
    this.glyphIndexArray.forEach((glyphIndex, unicode) => {
      unicodeToGlyphIndexMap.set(unicode, glyphIndex)
    })
    return unicodeToGlyphIndexMap
  }
}
