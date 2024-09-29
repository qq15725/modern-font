import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    os2?: Os2
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6OS2.html
 */
@defineSfntTable('os2')
export class Os2 extends SfntTable {
  @defineColumn({ type: 'uint16' }) declare version: number
  @defineColumn({ type: 'int16' }) declare xAvgCharWidth: number
  @defineColumn({ type: 'uint16' }) declare usWeightClass: number
  @defineColumn({ type: 'uint16' }) declare usWidthClass: number
  @defineColumn({ type: 'uint16' }) declare fsType: number
  @defineColumn({ type: 'uint16' }) declare ySubscriptXSize: number
  @defineColumn({ type: 'uint16' }) declare ySubscriptYSize: number
  @defineColumn({ type: 'uint16' }) declare ySubscriptXOffset: number
  @defineColumn({ type: 'uint16' }) declare ySubscriptYOffset: number
  @defineColumn({ type: 'uint16' }) declare ySuperscriptXSize: number
  @defineColumn({ type: 'uint16' }) declare ySuperscriptYSize: number
  @defineColumn({ type: 'uint16' }) declare ySuperscriptXOffset: number
  @defineColumn({ type: 'uint16' }) declare ySuperscriptYOffset: number
  @defineColumn({ type: 'uint16' }) declare yStrikeoutSize: number
  @defineColumn({ type: 'uint16' }) declare yStrikeoutPosition: number
  @defineColumn({ type: 'uint16' }) declare sFamilyClass: number
  // panose
  @defineColumn({ type: 'uint8' }) declare bFamilyType: number
  @defineColumn({ type: 'uint8' }) declare bSerifStyle: number
  @defineColumn({ type: 'uint8' }) declare bWeight: number
  @defineColumn({ type: 'uint8' }) declare bProportion: number
  @defineColumn({ type: 'uint8' }) declare bContrast: number
  @defineColumn({ type: 'uint8' }) declare bStrokeVariation: number
  @defineColumn({ type: 'uint8' }) declare bArmStyle: number
  @defineColumn({ type: 'uint8' }) declare bLetterform: number
  @defineColumn({ type: 'uint8' }) declare bMidline: number
  @defineColumn({ type: 'uint8' }) declare bXHeight: number
  // unicode range
  @defineColumn({ type: 'uint8', size: 16 }) declare ulUnicodeRange: Array<number>
  @defineColumn({ type: 'char', size: 4 }) declare achVendID: string
  @defineColumn({ type: 'uint16' }) declare fsSelection: number
  @defineColumn({ type: 'uint16' }) declare usFirstCharIndex: number
  @defineColumn({ type: 'uint16' }) declare usLastCharIndex: number
  // additional Fields
  @defineColumn({ type: 'int16' }) declare sTypoAscender: number
  @defineColumn({ type: 'int16' }) declare sTypoDescender: number
  @defineColumn({ type: 'int16' }) declare sTypoLineGap: number
  @defineColumn({ type: 'uint16' }) declare usWinAscent: number
  @defineColumn({ type: 'uint16' }) declare usWinDescent: number
  // version 0 above 39
  @defineColumn({ offset: 72, type: 'uint8', size: 8 }) declare ulCodePageRange: Array<number>
  // version 1 above 41
  @defineColumn({ offset: 72, type: 'int16' }) declare sxHeight: number
  @defineColumn({ type: 'int16' }) declare sCapHeight: number
  @defineColumn({ type: 'uint16' }) declare usDefaultChar: number
  @defineColumn({ type: 'uint16' }) declare usBreakChar: number
  @defineColumn({ type: 'uint16' }) declare usMaxContext: number

  get fontPANOSE(): number[] {
    return [
      this.bFamilyType,
      this.bSerifStyle,
      this.bWeight,
      this.bProportion,
      this.bContrast,
      this.bStrokeVariation,
      this.bArmStyle,
      this.bLetterform,
      this.bMidline,
      this.bXHeight,
    ]
  }
}
