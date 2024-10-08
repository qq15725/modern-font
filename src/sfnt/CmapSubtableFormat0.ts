import { defineColumn, Readable } from '../utils'

export class CmapSubtableFormat0 extends Readable {
  @defineColumn('uint16') declare format: 0
  @defineColumn('uint16') declare length: number
  @defineColumn('uint16') declare language: number
  @defineColumn({ type: 'uint8', size: 256 }) declare glyphIndexArray: Array<number>

  constructor(buffer: BufferSource = new ArrayBuffer(262), byteOffset?: number) {
    super(buffer, byteOffset, 262)
  }

  static from(unicodeGlyphIndexMap: Map<number, number>): CmapSubtableFormat0 {
    const table = new CmapSubtableFormat0()
    table.format = 0
    table.length = table.view.byteLength
    table.language = 0
    unicodeGlyphIndexMap.forEach((glyphIndex, unicode) => {
      if (unicode < 256 && glyphIndex < 256) {
        table.view.writeUint8(glyphIndex, 6 + unicode)
      }
    })
    return table
  }

  getUnicodeGlyphIndexMap(): Map<number, number> {
    const unicodeGlyphIndexMap = new Map<number, number>()
    this.glyphIndexArray.forEach((glyphIndex, unicode) => {
      unicodeGlyphIndexMap.set(unicode, glyphIndex)
    })
    return unicodeGlyphIndexMap
  }
}
