import { defineColumn, FontDataView } from '../../utils'

export interface VarSelectorRecord {
  varSelector: number
  defaultUVSOffset: number
  unicodeValueRanges: Array<UnicodeValueRange>
  nonDefaultUVSOffset: number
  uVSMappings: Array<VSMappings>
}

export interface UnicodeValueRange {
  startUnicodeValue: number
  additionalCount: number
}

export interface VSMappings {
  unicodeValue: number
  glyphID: number
}

export class CmapSubtableFormat14 extends FontDataView {
  @defineColumn({ type: 'uint16' }) declare format: 14
  @defineColumn({ type: 'uint32' }) declare length: number
  @defineColumn({ type: 'uint32' }) declare numVarSelectorRecords: number

  get varSelectorRecords(): VarSelectorRecord[] {
    const numVarSelectorRecords = this.numVarSelectorRecords
    this.seek(10)
    return Array.from({ length: numVarSelectorRecords }, () => {
      const varSelectorRecord: VarSelectorRecord = {
        varSelector: this.readUint24(),
        defaultUVSOffset: this.readUint32(),
        unicodeValueRanges: [],
        nonDefaultUVSOffset: this.readUint32(),
        uVSMappings: [],
      }
      if (varSelectorRecord.defaultUVSOffset) {
        this.seek(varSelectorRecord.defaultUVSOffset)
        const numUnicodeValueRanges = this.readUint32()
        varSelectorRecord.unicodeValueRanges = Array.from({ length: numUnicodeValueRanges }, () => {
          return {
            startUnicodeValue: this.readUint24(),
            additionalCount: this.readUint8(),
          }
        })
      }
      if (varSelectorRecord.nonDefaultUVSOffset) {
        this.seek(varSelectorRecord.nonDefaultUVSOffset)
        const numUVSMappings = this.readUint32()
        varSelectorRecord.uVSMappings = Array.from({ length: numUVSMappings }, () => {
          return {
            unicodeValue: this.readUint24(),
            glyphID: this.readUint16(),
          }
        })
      }
      return varSelectorRecord
    })
  }

  getUnicodeGlyphIndexMap(): Map<number, number> {
    const unicodeGlyphIndexMap = new Map<number, number>()
    const varSelectorRecords = this.varSelectorRecords
    for (let i = 0, l = varSelectorRecords.length; i < l; i++) {
      const { uVSMappings } = varSelectorRecords[i]
      uVSMappings.forEach((uVSMapping) => {
        unicodeGlyphIndexMap.set(uVSMapping.unicodeValue, uVSMapping.glyphID)
      })
    }
    return unicodeGlyphIndexMap
  }
}
