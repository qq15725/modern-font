import { defineColumn, Readable } from '../utils'
import { createCmapSegments } from './CmapSegment'

export class CmapSubtableFormat12 extends Readable {
  @defineColumn('uint16') declare format: 12
  @defineColumn('uint16') declare reserved: number
  @defineColumn('uint32') declare length: number
  @defineColumn('uint32') declare language: number
  @defineColumn('uint32') declare nGroups: number

  get groups(): { startCharCode: number, endCharCode: number, startGlyphCode: number }[] {
    const nGroups = this.nGroups
    this.view.seek(16)
    return Array.from({ length: nGroups }, () => {
      return {
        startCharCode: this.view.readUint32(),
        endCharCode: this.view.readUint32(),
        startGlyphCode: this.view.readUint32(),
      }
    })
  }

  static from(unicodeGlyphIndexMap: Map<number, number>): CmapSubtableFormat12 {
    const segments = createCmapSegments(unicodeGlyphIndexMap)
    const table = new CmapSubtableFormat12(new ArrayBuffer(16 + segments.length * 12))
    table.format = 12
    table.reserved = 0
    table.length = table.view.byteLength
    table.language = 0
    table.nGroups = segments.length
    segments.forEach((segment) => {
      table.view.writeUint32(segment.start)
      table.view.writeUint32(segment.end)
      table.view.writeUint32(segment.startId)
    })
    return table
  }

  getUnicodeGlyphIndexMap(): Map<number, number> {
    const unicodeGlyphIndexMap = new Map<number, number>()
    const groups = this.groups
    for (let i = 0, l = groups.length; i < l; i++) {
      const group = groups[i]
      let startId = group.startGlyphCode
      let start = group.startCharCode
      const end = group.endCharCode
      for (;start <= end;) {
        unicodeGlyphIndexMap.set(start++, startId++)
      }
    }
    return unicodeGlyphIndexMap
  }
}
