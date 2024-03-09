import { Entity } from '../utils'
import { Sfnt } from './sfnt'
import { SfntTable } from './sfnt-table'

declare module './sfnt' {
  interface Sfnt {
    cmap: Cmap
  }
}

export interface CmapSubtableBase {
  platformID: number
  platformSpecificID: number
  offset: number
}

export interface CmapSubtableFormat0 extends CmapSubtableBase {
  format: 0
  length: number
  language: number
  glyphIndexArray: Array<number>
}

export interface CmapSubtableFormat2 extends CmapSubtableBase {
  format: 2
  length: number
  language: number
  subHeaderKeys: Array<number>
  subHeaders: Array<{
    firstCode: number
    entryCount: number
    idDelta: number
    idRangeOffset: number
  }>
  glyphIndexArray: Array<number>
  // custom
  maxPos: number
}

export interface CmapSubtableFormat4 extends CmapSubtableBase {
  format: 4
  length: number
  language: number
  segCountX2: number
  searchRange: number
  entrySelector: number
  rangeShift: number
  endCode: Array<number>
  reservedPad: number
  startCode: Array<number>
  idDelta: Array<number>
  idRangeOffset: Array<number>
  glyphIndexArray: Array<number>
  // custom
  idRangeOffsetCursor: number
  glyphIndexArrayCursor: number
}

export interface CmapSubtableFormat6 extends CmapSubtableBase {
  format: 6
  length: number
  language: number
  firstCode: number
  entryCount: number
  glyphIndexArray: Array<number>
}

export interface CmapSubtableFormat12 extends CmapSubtableBase {
  format: 12
  length: number
  language: number
  reserved: number
  nGroups: number
  groups: Array<{
    startCharCode: number
    endCharCode: number
    startGlyphCode: number
  }>
}

export interface CmapSubtableFormat14 extends CmapSubtableBase {
  format: 14
  length: number
  numVarSelectorRecords: number
  groups: Array<Record<string, any>>
}

// 0、2、4、6、8、10、12、13、14
export type CmapSubtable =
  | CmapSubtableFormat0
  | CmapSubtableFormat2
  | CmapSubtableFormat4
  | CmapSubtableFormat6
  | CmapSubtableFormat12
  | CmapSubtableFormat14

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6cmap.html
 */
@Sfnt.table('cmap')
export class Cmap extends SfntTable {
  @Entity.column({ type: 'uint16' }) declare version: number
  @Entity.column({ type: 'uint16' }) declare numberSubtables: number

  readSubtableFormat0(table: CmapSubtableBase): CmapSubtableFormat0 {
    const length = this.readUint16()
    const language = this.readUint16()
    const glyphCount = table.offset + length - this.cursor
    const glyphIndexArray = Array.from({ length: glyphCount }, () => this.readUint8())
    return { ...table, format: 0, length, language, glyphIndexArray }
  }

  readSubtableFormat2(table: CmapSubtableBase): CmapSubtableFormat2 {
    const length = this.readUint16()
    const language = this.readUint16()
    const subHeaderKeys = []
    let maxSubHeadKey = 0
    let maxPos = -1
    for (let i = 0; i < 256; i++) {
      subHeaderKeys[i] = this.readUint16() / 8
      if (subHeaderKeys[i] > maxSubHeadKey) {
        maxSubHeadKey = subHeaderKeys[i]
        maxPos = i
      }
    }
    const subHeaders = []
    for (let i = 0; i <= maxSubHeadKey; i++) {
      subHeaders[i] = {
        firstCode: this.readUint16(),
        entryCount: this.readUint16(),
        idDelta: this.readUint16(),
        idRangeOffset: (this.readUint16() - (maxSubHeadKey - i) * 8 - 2) / 2,
      }
    }
    const glyphCount = (table.offset + length - this.cursor) / 2
    const glyphIndexArray = Array.from({ length: glyphCount }, () => this.readUint16())
    return { ...table, format: 2, length, language, subHeaders, subHeaderKeys, glyphIndexArray, maxPos }
  }

  readSubtableFormat4(table: CmapSubtableBase): CmapSubtableFormat4 {
    const length = this.readUint16()
    const language = this.readUint16()
    const segCountX2 = this.readUint16()
    const searchRange = this.readUint16()
    const entrySelector = this.readUint16()
    const rangeShift = this.readUint16()
    const segCount = segCountX2 / 2
    const endCode = Array.from({ length: segCount }, () => this.readUint16())
    const reservedPad = this.readUint16()
    const startCode = Array.from({ length: segCount }, () => this.readUint16())
    const idDelta = Array.from({ length: segCount }, () => this.readUint16())
    const idRangeOffsetCursor = this.cursor
    const idRangeOffset = Array.from({ length: segCount }, () => this.readUint16())
    const glyphCount = (table.offset + length - this.cursor) / 2
    const glyphIndexArrayCursor = this.cursor
    const glyphIndexArray = Array.from({ length: glyphCount }, () => this.readUint16())
    return { ...table, format: 4, length, language, segCountX2, searchRange, entrySelector, rangeShift, endCode, reservedPad, startCode, idDelta, idRangeOffset, glyphIndexArray, glyphIndexArrayCursor, idRangeOffsetCursor }
  }

  readSubtableFormat6(table: CmapSubtableBase): CmapSubtableFormat6 {
    const length = this.readUint16()
    const language = this.readUint16()
    const firstCode = this.readUint16()
    const entryCount = this.readUint16()
    const glyphIndexArray = Array.from({ length: entryCount }, () => this.readUint16())
    return { ...table, format: 6, length, language, firstCode, entryCount, glyphIndexArray }
  }

  readSubtableFormat12(table: CmapSubtableBase): CmapSubtableFormat12 {
    const reserved = this.readUint16()
    const length = this.readUint32()
    const language = this.readUint32()
    const nGroups = this.readUint32()
    const groups: CmapSubtableFormat12['groups'] = []
    for (let i = 0; i < nGroups; ++i) {
      groups.push({
        startCharCode: this.readUint32(),
        endCharCode: this.readUint32(),
        startGlyphCode: this.readUint32(),
      })
    }
    return { ...table, format: 12, length, language, reserved, nGroups, groups }
  }

  readSubtableFormat14(table: CmapSubtableBase): CmapSubtableFormat14 {
    const length = this.readUint32()
    const numVarSelectorRecords = this.readUint32()
    const groups: CmapSubtableFormat14['groups'] = []
    let offset = this.cursor
    for (let i = 0; i < numVarSelectorRecords; i++) {
      this.seek(offset)
      const varSelector = this.readUint24()
      const defaultUVSOffset = this.readUint32()
      const nonDefaultUVSOffset = this.readUint32()
      offset += 11
      if (defaultUVSOffset) {
        this.seek(table.offset + defaultUVSOffset)
        const numUnicodeValueRanges = this.readUint32()
        for (let j = 0; j < numUnicodeValueRanges; j++) {
          const startUnicode = this.readUint24()
          const additionalCount = this.readUint8()
          groups.push({
            start: startUnicode,
            end: startUnicode + additionalCount,
            varSelector,
          })
        }
      }
      if (nonDefaultUVSOffset) {
        this.seek(table.offset + nonDefaultUVSOffset)
        const numUVSMappings = this.readUint32()
        for (let j = 0; j < numUVSMappings; j++) {
          const unicode = this.readUint24()
          const glyphId = this.readUint16()
          groups.push({
            unicode,
            glyphId,
            varSelector,
          })
        }
      }
    }
    return { ...table, format: 14, length, numVarSelectorRecords, groups }
  }

  get subtables(): Array<CmapSubtable> {
    const numberSubtables = this.numberSubtables
    this.seek(4)
    return Array.from({ length: numberSubtables }, () => {
      return {
        platformID: this.readUint16(),
        platformSpecificID: this.readUint16(),
        offset: this.readUint32(),
      } as CmapSubtableBase
    }).map(table => {
      this.seek(table.offset)
      switch (this.readUint16()) {
        case 0:
          return this.readSubtableFormat0(table)
        case 2:
          return this.readSubtableFormat2(table)
        case 4:
          return this.readSubtableFormat4(table)
        case 6:
          return this.readSubtableFormat6(table)
        case 12:
          return this.readSubtableFormat12(table)
        case 14:
          return this.readSubtableFormat14(table)
      }
      return table as any
    })
  }

  get codePointGlyphIndexMap(): Record<number, number> {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const tables = this.subtables
    const format0 = tables.find(item => item.format === 0) as CmapSubtableFormat0 | undefined
    const format12 = tables.find(item => item.platformID === 3 && item.platformSpecificID === 10 && item.format === 12) as CmapSubtableFormat12 | undefined
    const format4 = tables.find(item => item.platformID === 3 && item.platformSpecificID === 1 && item.format === 4) as CmapSubtableFormat4 | undefined
    const format2 = tables.find(item => item.platformID === 3 && item.platformSpecificID === 3 && item.format === 2) as CmapSubtableFormat2 | undefined
    const format14 = tables.find(item => item.platformID === 0 && item.platformSpecificID === 5 && item.format === 14) as CmapSubtableFormat14 | undefined
    const map: Record<number, number> = {}

    if (format0) {
      for (let i = 0, l = format0.glyphIndexArray.length; i < l; i++) {
        if (format0.glyphIndexArray[i]) {
          map[i] = format0.glyphIndexArray[i]
        }
      }
    }

    if (format14) {
      for (let i = 0, l = format14.groups.length; i < l; i++) {
        const { unicode, glyphId } = format14.groups[i]
        if (unicode) {
          map[unicode] = glyphId
        }
      }
    }

    if (format12) {
      for (let i = 0, l = format12.nGroups; i < l; i++) {
        const group = format12.groups[i]
        let startId = group.startGlyphCode
        let start = group.startCharCode
        const end = group.endCharCode
        for (;start <= end;) {
          map[start++] = startId++
        }
      }
    } else if (format4) {
      const segCount = format4.segCountX2 / 2
      const graphIndexArrayIndexOffset = (format4.glyphIndexArrayCursor - format4.idRangeOffsetCursor) / 2

      for (let i = 0; i < segCount; ++i) {
        for (let start = format4.startCode[i], end = format4.endCode[i]; start <= end; ++start) {
          if (format4!.idRangeOffset[i] === 0) {
            map[start] = (start + format4!.idDelta[i]) % 0x10000
          } else {
            const index = i + format4!.idRangeOffset[i] / 2
              + (start - format4!.startCode[i])
              - graphIndexArrayIndexOffset

            const graphId = format4!.glyphIndexArray[index]
            if (graphId !== 0) {
              map[start] = (graphId + format4!.idDelta[i]) % 0x10000
            } else {
              map[start] = 0
            }
          }
        }
      }

      delete map[65535]
    } else if (format2) {
      const subHeadKeys = format2.subHeaderKeys
      const subHeads = format2.subHeaders
      const glyphs = format2.glyphIndexArray
      let index = 0
      for (let i = 0; i < 256; i++) {
        if (subHeadKeys[i] === 0) {
          if (i >= format2.maxPos) {
            index = 0
          } else if (i < subHeads[0].firstCode
            || i >= subHeads[0].firstCode + subHeads[0].entryCount
            || subHeads[0].idRangeOffset + (i - subHeads[0].firstCode) >= glyphs.length) {
            index = 0
            // eslint-disable-next-line no-cond-assign
          } else if ((index = glyphs[subHeads[0].idRangeOffset + (i - subHeads[0].firstCode)]) !== 0) {
            index = index + subHeads[0].idDelta
          }
          if (index !== 0 && index < numGlyphs) {
            map[i] = index
          }
        } else {
          const k = subHeadKeys[i]
          for (let j = 0, entryCount = subHeads[k].entryCount; j < entryCount; j++) {
            if (subHeads[k].idRangeOffset + j >= glyphs.length) {
              index = 0
              // eslint-disable-next-line no-cond-assign
            } else if ((index = glyphs[subHeads[k].idRangeOffset + j]) !== 0) {
              index = index + subHeads[k].idDelta
            }

            if (index !== 0 && index < numGlyphs) {
              const unicode = ((i << 8) | (j + subHeads[k].firstCode)) % 0xFFFF
              map[unicode] = index
            }
          }
        }
      }
    }

    return map
  }
}
