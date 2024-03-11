import { Entity } from '../../utils'

export class CmapSubtableFormat14 extends Entity {
  @Entity.column({ type: 'uint16' }) declare format: 14
  @Entity.column({ type: 'uint32' }) declare length: number
  @Entity.column({ type: 'uint32' }) declare numVarSelectorRecords: number

  get varSelectorRecords() {
    const numVarSelectorRecords = this.numVarSelectorRecords
    this.seek(10)
    return Array.from({ length: numVarSelectorRecords }, () => {
      const varSelectorRecord = {
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

  getUnicodeGlyphIndexMap(): Record<number, number> {
    const unicodeGlyphIndexMap: Record<number, number> = {}
    const varSelectorRecords = this.varSelectorRecords
    for (let i = 0, l = varSelectorRecords.length; i < l; i++) {
      const { uVSMappings } = varSelectorRecords[i]
      uVSMappings.forEach(uVSMapping => {
        unicodeGlyphIndexMap[uVSMapping.unicodeValue] = uVSMapping.glyphID
      })
    }
    return unicodeGlyphIndexMap
  }
}
