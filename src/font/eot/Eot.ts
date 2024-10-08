import type { Ttf } from '../ttf'
import { defineColumn, toUCS2Bytes } from '../../utils'
import { Font } from '../Font'

// http://www.w3.org/Submission/EOT
export class Eot extends Font {
  override mimeType = 'application/vnd.ms-fontobject'
  @defineColumn('uint32') declare EOTSize: number
  @defineColumn('uint32') declare FontDataSize: number
  @defineColumn('uint32') declare Version: number
  @defineColumn('uint32') declare Flags: number
  @defineColumn({ type: 'uint8', size: 10 }) declare FontPANOSE: Array<number>
  @defineColumn('uint8') declare Charset: number
  @defineColumn('uint8') declare Italic: number
  @defineColumn('uint32') declare Weight: number
  @defineColumn('uint16') declare fsType: number
  @defineColumn('uint16') declare MagicNumber: number
  @defineColumn({ type: 'uint8', size: 16 }) declare UnicodeRange: Array<number>
  @defineColumn({ type: 'uint8', size: 8 }) declare CodePageRange: Array<number>
  @defineColumn('uint32') declare CheckSumAdjustment: number
  @defineColumn({ type: 'uint8', size: 16 }) declare Reserved: Array<number>
  @defineColumn('uint16') declare Padding1: number
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
    const sfnt = ttf.getSfnt()
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
      + ttf.view.byteLength

    const eot = new Eot(new ArrayBuffer(size), 0, size, true)
    eot.EOTSize = eot.view.byteLength
    eot.FontDataSize = ttf.view.byteLength
    eot.Version = 0x00020001 // 0x00010000 / 0x00020001 / 0x00020002
    eot.Flags = 0
    eot.Charset = 0x1
    eot.MagicNumber = 0x504C
    eot.Padding1 = 0
    eot.CheckSumAdjustment = sfnt.head.checkSumAdjustment

    const os2 = sfnt.os2
    if (os2) {
      eot.FontPANOSE = os2.fontPANOSE
      eot.Italic = os2.fsSelection
      eot.Weight = os2.usWeightClass
      eot.fsType = os2.fsType
      eot.UnicodeRange = os2.ulUnicodeRange
      eot.CodePageRange = os2.ulCodePageRange
    }

    // write names
    eot.view.writeUint16(FamilyNameSize)
    eot.view.writeBytes(FamilyName)
    eot.view.writeUint16(0)
    eot.view.writeUint16(StyleNameSize)
    eot.view.writeBytes(StyleName)
    eot.view.writeUint16(0)
    eot.view.writeUint16(VersionNameSize)
    eot.view.writeBytes(VersionName)
    eot.view.writeUint16(0)
    eot.view.writeUint16(FullNameSize)
    eot.view.writeBytes(FullName)
    eot.view.writeUint16(0)
    // rootstring
    eot.view.writeUint16(0)
    eot.view.writeBytes(ttf.view)
    return eot
  }
}
