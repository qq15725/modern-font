import { defineColumn, FontDataObject } from '../core'

export class CmapSubtableFormat6 extends FontDataObject {
  @defineColumn('uint16') declare format: 6
  @defineColumn('uint16') declare length: number
  @defineColumn('uint16') declare language: number
  @defineColumn('uint16') declare firstCode: number
  @defineColumn('uint16') declare entryCount: number

  get glyphIndexArray(): number[] {
    // header = format, length, language, firstCode, entryCount (5 × uint16 = 10 bytes);
    // read at explicit offsets so a stale view cursor can't shift the array.
    const entryCount = this.entryCount
    return Array.from({ length: entryCount }, (_, i) => this.view.readUint16(10 + i * 2))
  }

  getUnicodeToGlyphIndexMap(): Map<number, number> {
    const glyphIndexArray = this.glyphIndexArray
    const firstCode = this.firstCode
    const unicodeToGlyphIndexMap = new Map<number, number>()
    // Format 6 is a trimmed table mapping codes firstCode..firstCode+entryCount-1;
    // the array index is an offset from firstCode, not the code point itself.
    glyphIndexArray.forEach((glyphIndex, i) => {
      unicodeToGlyphIndexMap.set(firstCode + i, glyphIndex)
    })
    return unicodeToGlyphIndexMap
  }
}
