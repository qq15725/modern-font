import { Entity } from '../../utils'

export class CmapSubtableFormat2 extends Entity {
  @Entity.column({ type: 'uint16' }) declare format: 2
  @Entity.column({ type: 'uint16' }) declare length: number
  @Entity.column({ type: 'uint16' }) declare language: number

  get subHeaderKeys() {
    this.seek(6)
    return Array.from({ length: 256 }, () => this.readUint16() / 8)
  }

  get maxSubHeaderKey() {
    return this.subHeaderKeys.reduce((max, key) => Math.max(max, key), 0)
  }

  get subHeaders() {
    const maxSubHeaderKey = this.maxSubHeaderKey
    this.seek(6 + 256 * 2)
    return Array.from({ length: maxSubHeaderKey }, (_, i) => {
      return {
        firstCode: this.readUint16(),
        entryCount: this.readUint16(),
        idDelta: this.readUint16(),
        idRangeOffset: (this.readUint16() - (maxSubHeaderKey - i) * 8 - 2) / 2,
      }
    })
  }

  get glyphIndexArray() {
    const maxSubHeaderKey = this.maxSubHeaderKey
    const cursor = 6 + 256 * 2 + maxSubHeaderKey * 8
    this.seek(cursor)
    const length = (this.byteLength - cursor) / 2
    return Array.from({ length }, () => this.readUint16())
  }

  getUnicodeGlyphIndexMap(numGlyphs: number): Map<number, number> {
    const unicodeGlyphIndexMap = new Map<number, number>()
    const subHeaderKeys = this.subHeaderKeys
    const maxSubHeaderKey = this.maxSubHeaderKey
    const subHeaders = this.subHeaders
    const glyphIndexArray = this.glyphIndexArray
    const maxPos = subHeaderKeys.findIndex((key) => key === maxSubHeaderKey)

    let index = 0
    for (let i = 0; i < 256; i++) {
      if (subHeaderKeys[i] === 0) {
        if (i >= maxPos) {
          index = 0
        } else if (i < subHeaders[0].firstCode
          || i >= subHeaders[0].firstCode + subHeaders[0].entryCount
          || subHeaders[0].idRangeOffset + (i - subHeaders[0].firstCode) >= glyphIndexArray.length) {
          index = 0
          // eslint-disable-next-line no-cond-assign
        } else if ((index = glyphIndexArray[subHeaders[0].idRangeOffset + (i - subHeaders[0].firstCode)]) !== 0) {
          index = index + subHeaders[0].idDelta
        }
        if (index !== 0 && index < numGlyphs) {
          unicodeGlyphIndexMap.set(i, index)
        }
      } else {
        const k = subHeaderKeys[i]
        for (let j = 0, entryCount = subHeaders[k].entryCount; j < entryCount; j++) {
          if (subHeaders[k].idRangeOffset + j >= glyphIndexArray.length) {
            index = 0
            // eslint-disable-next-line no-cond-assign
          } else if ((index = glyphIndexArray[subHeaders[k].idRangeOffset + j]) !== 0) {
            index = index + subHeaders[k].idDelta
          }

          if (index !== 0 && index < numGlyphs) {
            const unicode = ((i << 8) | (j + subHeaders[k].firstCode)) % 0xFFFF
            unicodeGlyphIndexMap.set(unicode, index)
          }
        }
      }
    }
    return unicodeGlyphIndexMap
  }
}
