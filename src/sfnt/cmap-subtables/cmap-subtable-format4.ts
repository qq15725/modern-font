import { Entity } from '../../utils'
import { createSegments } from './utils'

export class CmapSubtableFormat4 extends Entity {
  @Entity.column({ type: 'uint16' }) declare format: 4
  @Entity.column({ type: 'uint16' }) declare length: number
  @Entity.column({ type: 'uint16' }) declare language: number
  @Entity.column({ type: 'uint16' }) declare segCountX2: number
  @Entity.column({ type: 'uint16' }) declare searchRange: number
  @Entity.column({ type: 'uint16' }) declare entrySelector: number
  @Entity.column({ type: 'uint16' }) declare rangeShift: number

  get endCode() {
    const segCountX2 = this.segCountX2
    this.seek(14)
    return Array.from({ length: segCountX2 / 2 }, () => this.readUint16())
  }

  set endCode(value) {
    this.seek(14)
    value.forEach(val => this.writeUint16(val))
  }

  get reservedPad() {
    return this.readUint16(14 + this.segCountX2)
  }

  set reservedPad(value) {
    this.writeUint16(value, 14 + this.segCountX2)
  }

  get startCode() {
    const segCountX2 = this.segCountX2
    this.seek(14 + segCountX2 + 2)
    return Array.from({ length: segCountX2 / 2 }, () => this.readUint16())
  }

  set startCode(value) {
    this.seek(14 + this.segCountX2 + 2)
    value.forEach(val => this.writeUint16(val))
  }

  get idDelta() {
    const segCountX2 = this.segCountX2
    this.seek(14 + segCountX2 + 2 + segCountX2)
    return Array.from({ length: segCountX2 / 2 }, () => this.readUint16())
  }

  set idDelta(value) {
    const segCountX2 = this.segCountX2
    this.seek(14 + segCountX2 + 2 + segCountX2)
    value.forEach(val => this.writeUint16(val))
  }

  get idRangeOffsetCursor() {
    const segCountX2 = this.segCountX2
    return 14 + segCountX2 + 2 + segCountX2 * 2
  }

  get idRangeOffset() {
    const segCountX2 = this.segCountX2
    this.seek(this.idRangeOffsetCursor)
    return Array.from({ length: segCountX2 / 2 }, () => this.readUint16())
  }

  set idRangeOffset(value) {
    this.seek(this.idRangeOffsetCursor)
    value.forEach(val => this.writeUint16(val))
  }

  get glyphIndexArrayCursor() {
    const segCountX2 = this.segCountX2
    return 14 + segCountX2 + 2 + segCountX2 * 3
  }

  get glyphIndexArray() {
    const cursor = this.glyphIndexArrayCursor
    this.seek(cursor)
    const length = (this.byteLength - cursor) / 2
    return Array.from({ length }, () => this.readUint16())
  }

  static from(unicodeGlyphIndexMap: Map<number, number>): CmapSubtableFormat4 {
    const segments = createSegments(unicodeGlyphIndexMap, 0xFFFF)
    const segCount = segments.length + 1
    const entrySelector = Math.floor(Math.log(segCount) / Math.LN2)
    const searchRange = 2 * Math.pow(2, entrySelector)
    const table = new CmapSubtableFormat4(new ArrayBuffer(24 + segments.length * 8))
    table.format = 4
    table.length = table.byteLength
    table.language = 0
    table.segCountX2 = segCount * 2
    table.searchRange = searchRange
    table.entrySelector = entrySelector
    table.rangeShift = 2 * segCount - searchRange
    table.endCode = [...segments.map(segment => segment.end), 0xFFFF]
    table.reservedPad = 0
    table.startCode = [...segments.map(segment => segment.start), 0xFFFF]
    table.idDelta = [...segments.map(segment => segment.delta), 1]
    table.idRangeOffset = Array.from({ length: segCount }, () => 0)
    return table
  }

  getUnicodeGlyphIndexMap(): Map<number, number> {
    const unicodeGlyphIndexMap = new Map<number, number>()
    const segCount = this.segCountX2 / 2
    const graphIndexArrayIndexOffset = (this.glyphIndexArrayCursor - this.idRangeOffsetCursor) / 2
    const startCode = this.startCode
    const endCode = this.endCode
    const idRangeOffset = this.idRangeOffset
    const idDelta = this.idDelta
    const glyphIndexArray = this.glyphIndexArray
    for (let i = 0; i < segCount; ++i) {
      for (let start = startCode[i], end = endCode[i]; start <= end; ++start) {
        if (idRangeOffset[i] === 0) {
          unicodeGlyphIndexMap.set(start, (start + idDelta[i]) % 0x10000)
        } else {
          const index = i + idRangeOffset[i] / 2
            + (start - startCode[i])
            - graphIndexArrayIndexOffset
          const graphId = glyphIndexArray[index]
          if (graphId !== 0) {
            unicodeGlyphIndexMap.set(start, (graphId + idDelta[i]) % 0x10000)
          } else {
            unicodeGlyphIndexMap.set(start, 0)
          }
        }
      }
    }
    unicodeGlyphIndexMap.delete(65535)
    return unicodeGlyphIndexMap
  }
}
