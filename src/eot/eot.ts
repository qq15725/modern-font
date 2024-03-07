import { Entity, toUCS2Bytes } from '../utils'
import { FontFile } from '../font-file'
import type { Ttf } from '../ttf'

// http://www.w3.org/Submission/EOT
export class Eot extends FontFile {
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
  // get FamilyNameSize() {}
  // get FamilyName() {}
  // get Padding2() {}
  // get StyleNameSize() {}
  // get StyleName() {}
  // get Padding3() {}
  // get VersionNameSize() {}
  // get VersionName() {}
  // get Padding4() {}
  // get FullNameSize() {}
  // get FullName() {}
  // get FontData() {}

  static from(ttf: Ttf): Eot {
    const sfnt = ttf.sfnt
    const name = sfnt.name
    const nameRecords = name.nameRecords
    const FamilyName = toUCS2Bytes(nameRecords.fontFamily || '')
    const FamilyNameSize = FamilyName.length
    const StyleName = toUCS2Bytes(nameRecords.fontStyle || '')
    const StyleNameSize = StyleName.length
    const VersionName = toUCS2Bytes(nameRecords.version || '')
    const VersionNameSize = VersionName.length
    const FullName = toUCS2Bytes(nameRecords.fullName || '')
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
    eot.Version = 0x20001 // 0x00010000 / 0x00020001 / 0x00020002
    eot.Flags = 0
    eot.Charset = 0x1
    eot.MagicNumber = 0x504C
    eot.Padding1 = 0

    const head = sfnt.head
    eot.CheckSumAdjustment = head.checkSumAdjustment

    const os2 = sfnt['OS/2']
    eot.FontPANOSE = [
      os2.bFamilyType,
      os2.bSerifStyle,
      os2.bWeight,
      os2.bProportion,
      os2.bContrast,
      os2.bStrokeVariation,
      os2.bArmStyle,
      os2.bLetterform,
      os2.bMidline,
      os2.bXHeight,
    ]
    eot.Italic = os2.fsSelection
    eot.Weight = os2.usWeightClass
    eot.fsType = os2.fsType
    eot.UnicodeRange = os2.ulUnicodeRange
    eot.CodePageRange = os2.ulCodePageRange

    eot.seek(82)
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
    eot.writeBytes(ttf.buffer)
    return eot
  }
}
