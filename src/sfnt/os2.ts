import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    'OS/2': Os2
  }
}

// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6OS2.html
@Sfnt.table('OS/2')
export class Os2 extends Entity {
  @Entity.column({ type: 'uint16' }) declare version: number
  @Entity.column({ type: 'int16' }) declare xAvgCharWidth: number
  @Entity.column({ type: 'uint16' }) declare usWeightClass: number
  @Entity.column({ type: 'uint16' }) declare usWidthClass: number
  @Entity.column({ type: 'uint16' }) declare fsType: number
  @Entity.column({ type: 'uint16' }) declare ySubscriptXSize: number
  @Entity.column({ type: 'uint16' }) declare ySubscriptYSize: number
  @Entity.column({ type: 'uint16' }) declare ySubscriptXOffset: number
  @Entity.column({ type: 'uint16' }) declare ySubscriptYOffset: number
  @Entity.column({ type: 'uint16' }) declare ySuperscriptXSize: number
  @Entity.column({ type: 'uint16' }) declare ySuperscriptYSize: number
  @Entity.column({ type: 'uint16' }) declare ySuperscriptXOffset: number
  @Entity.column({ type: 'uint16' }) declare ySuperscriptYOffset: number
  @Entity.column({ type: 'uint16' }) declare yStrikeoutSize: number
  @Entity.column({ type: 'uint16' }) declare yStrikeoutPosition: number
  @Entity.column({ type: 'uint16' }) declare sFamilyClass: number
  // panose
  @Entity.column({ type: 'uint8' }) declare bFamilyType: number
  @Entity.column({ type: 'uint8' }) declare bSerifStyle: number
  @Entity.column({ type: 'uint8' }) declare bWeight: number
  @Entity.column({ type: 'uint8' }) declare bProportion: number
  @Entity.column({ type: 'uint8' }) declare bContrast: number
  @Entity.column({ type: 'uint8' }) declare bStrokeVariation: number
  @Entity.column({ type: 'uint8' }) declare bArmStyle: number
  @Entity.column({ type: 'uint8' }) declare bLetterform: number
  @Entity.column({ type: 'uint8' }) declare bMidline: number
  @Entity.column({ type: 'uint8' }) declare bXHeight: number
  // unicode range
  @Entity.column({ type: 'uint8', size: 16 }) declare ulUnicodeRange: Array<number>
  @Entity.column({ type: 'char', size: 4 }) declare achVendID: string
  @Entity.column({ type: 'uint16' }) declare fsSelection: number
  @Entity.column({ type: 'uint16' }) declare usFirstCharIndex: number
  @Entity.column({ type: 'uint16' }) declare usLastCharIndex: number
  // additional Fields
  @Entity.column({ type: 'int16' }) declare sTypoAscender: number
  @Entity.column({ type: 'int16' }) declare sTypoDescender: number
  @Entity.column({ type: 'int16' }) declare sTypoLineGap: number
  @Entity.column({ type: 'uint16' }) declare usWinAscent: number
  @Entity.column({ type: 'uint16' }) declare usWinDescent: number
  // version 0 above 39
  @Entity.column({ offset: 72, type: 'uint8', size: 8 }) declare ulCodePageRange: Array<number>
  // version 1 above 41
  @Entity.column({ offset: 72, type: 'int16' }) declare sxHeight: number
  @Entity.column({ type: 'int16' }) declare sCapHeight: number
  @Entity.column({ type: 'uint16' }) declare usDefaultChar: number
  @Entity.column({ type: 'uint16' }) declare usBreakChar: number
  @Entity.column({ type: 'uint16' }) declare usMaxContext: number
}
