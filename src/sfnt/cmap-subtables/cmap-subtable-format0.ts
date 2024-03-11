import { Entity } from '../../utils'

export class CmapSubtableFormat0 extends Entity {
  @Entity.column({ type: 'uint16' }) declare format: 0
  @Entity.column({ type: 'uint16' }) declare length: number
  @Entity.column({ type: 'uint16' }) declare language: number

  get glyphIndexArray() {
    this.seek(6)
    return Array.from({ length: 256 }, () => this.readUint8())
  }

  constructor(buffer: BufferSource = new ArrayBuffer(262), byteOffset?: number) {
    super(buffer, byteOffset, 262)
  }

  static from(unicodeGlyphIndexMap: Record<number, number>): CmapSubtableFormat0 {
    const unicodes: Array<number> = []
    for (const [key, glyphIndex] of Object.entries(unicodeGlyphIndexMap)) {
      const unicode = Number(key)
      if (unicode < 256 && glyphIndex < 256) {
        unicodes.push(unicode)
      }
    }
    const table = new CmapSubtableFormat0()
    table.format = 0
    table.length = table.byteLength
    table.language = 0
    unicodes.sort((a, b) => a - b).forEach(unicode => {
      table.writeUint8(unicodeGlyphIndexMap[unicode], Number(6 + unicode))
    })
    return table
  }

  getUnicodeGlyphIndexMap(): Record<number, number> {
    return this.glyphIndexArray
  }
}
