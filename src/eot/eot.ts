import { Entity, toUCS2Bytes } from '../utils'
import type { Ttf } from '../ttf'

// http://www.w3.org/Submission/EOT
export class Eot extends Entity {
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

  from(ttf: Ttf): Eot {
    const buffer = ttf.buffer
    const sfnt = ttf.sfnt
    const fontDataSize = buffer.byteLength

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
      + fontDataSize

    const eot = new Eot(new ArrayBuffer(size))
    eot.EOTSize = size
    eot.FontDataSize = fontDataSize
    eot.Version = 0x20001
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

    eot.readWriter.seek(82)
    // write names
    eot.readWriter.writeUint16(FamilyNameSize)
    eot.readWriter.writeBytes(FamilyName)
    eot.readWriter.writeUint16(0)
    eot.readWriter.writeUint16(StyleNameSize)
    eot.readWriter.writeBytes(StyleName)
    eot.readWriter.writeUint16(0)
    eot.readWriter.writeUint16(VersionNameSize)
    eot.readWriter.writeBytes(VersionName)
    eot.readWriter.writeUint16(0)
    eot.readWriter.writeUint16(FullNameSize)
    eot.readWriter.writeBytes(FullName)
    eot.readWriter.writeUint16(0)
    // rootstring
    eot.readWriter.writeUint16(0)
    eot.readWriter.writeBytes(buffer, eot.FontDataSize)
    return eot
  }
}
