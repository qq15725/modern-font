import type { Ttf } from '../ttf'
import { Entity, toUCS2Bytes } from '../../utils'
import { FontFileFormat } from '../FontFileFormat'

// http://www.w3.org/Submission/EOT
export class Eot extends FontFileFormat {
  readonly mimeType = 'application/vnd.ms-fontobject'
  @Entity.column({ type: 'uint32' }) declare EOTSize: number
  @Entity.column({ type: 'uint32' }) declare FontDataSize: number
  @Entity.column({ type: 'uint32' }) declare Version: number
  @Entity.column({ type: 'uint32' }) declare Flags: number
  @Entity.column({ type: 'uint8', size: 10 }) declare FontPANOSE: Array<number>
  @Entity.column({ type: 'uint8' }) declare Charset: number
  @Entity.column({ type: 'uint8' }) declare Italic: number
  @Entity.column({ type: 'uint32' }) declare Weight: number
  @Entity.column({ type: 'uint16' }) declare fsType: number
  @Entity.column({ type: 'uint16' }) declare MagicNumber: number
  @Entity.column({ type: 'uint8', size: 16 }) declare UnicodeRange: Array<number>
  @Entity.column({ type: 'uint8', size: 8 }) declare CodePageRange: Array<number>
  @Entity.column({ type: 'uint32' }) declare CheckSumAdjustment: number
  @Entity.column({ type: 'uint8', size: 16 }) declare Reserved: Array<number>
  @Entity.column({ type: 'uint16' }) declare Padding1: number
  // FamilyNameSize
  // FamilyName
  // Padding2
  // StyleNameSize
  // StyleName
  // Padding3
  // VersionNameSize
  // VersionName
  // Padding4
  // FullNameSize
  // FullName
  // FontData

  static from(ttf: Ttf): Eot {
    const sfnt = ttf.sfnt
    const name = sfnt.name
    const names = name.getNames()
    const FamilyName = toUCS2Bytes(names.fontFamily || '')
    const FamilyNameSize = FamilyName.length
    const StyleName = toUCS2Bytes(names.fontStyle || '')
    const StyleNameSize = StyleName.length
    const VersionName = toUCS2Bytes(names.version || '')
    const VersionNameSize = VersionName.length
    const FullName = toUCS2Bytes(names.fullName || '')
    const FullNameSize = FullName.length

    const size = 82
      + 4 + FamilyNameSize
      + 4 + StyleNameSize
      + 4 + VersionNameSize
      + 4 + FullNameSize
      + 2
      + ttf.byteLength

    const eot = new Eot(new ArrayBuffer(size), 0, size, true)
    eot.EOTSize = eot.byteLength
    eot.FontDataSize = ttf.byteLength
    eot.Version = 0x00020001 // 0x00010000 / 0x00020001 / 0x00020002
    eot.Flags = 0
    eot.Charset = 0x1
    eot.MagicNumber = 0x504C
    eot.Padding1 = 0
    eot.CheckSumAdjustment = sfnt.head.checkSumAdjustment

    const os2 = sfnt['OS/2']
    if (os2) {
      eot.FontPANOSE = os2.fontPANOSE
      eot.Italic = os2.fsSelection
      eot.Weight = os2.usWeightClass
      eot.fsType = os2.fsType
      eot.UnicodeRange = os2.ulUnicodeRange
      eot.CodePageRange = os2.ulCodePageRange
    }

    // write names
    eot.writeUint16(FamilyNameSize)
    eot.writeBytes(FamilyName)
    eot.writeUint16(0)
    eot.writeUint16(StyleNameSize)
    eot.writeBytes(StyleName)
    eot.writeUint16(0)
    eot.writeUint16(VersionNameSize)
    eot.writeBytes(VersionName)
    eot.writeUint16(0)
    eot.writeUint16(FullNameSize)
    eot.writeBytes(FullName)
    eot.writeUint16(0)
    // rootstring
    eot.writeUint16(0)
    eot.writeBytes(ttf)
    return eot
  }
}
