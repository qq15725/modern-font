import { defineColumn } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    os2: Os2
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6OS2.html
 */
@defineSfntTable('OS/2', 'os2')
export class Os2 extends SfntTable {
  @defineColumn('uint16') declare version: number
  @defineColumn('int16') declare xAvgCharWidth: number
  @defineColumn('uint16') declare usWeightClass: number
  @defineColumn('uint16') declare usWidthClass: number
  @defineColumn('uint16') declare fsType: number
  @defineColumn('uint16') declare ySubscriptXSize: number
  @defineColumn('uint16') declare ySubscriptYSize: number
  @defineColumn('uint16') declare ySubscriptXOffset: number
  @defineColumn('uint16') declare ySubscriptYOffset: number
  @defineColumn('uint16') declare ySuperscriptXSize: number
  @defineColumn('uint16') declare ySuperscriptYSize: number
  @defineColumn('uint16') declare ySuperscriptXOffset: number
  @defineColumn('uint16') declare ySuperscriptYOffset: number
  @defineColumn('uint16') declare yStrikeoutSize: number
  @defineColumn('uint16') declare yStrikeoutPosition: number
  @defineColumn('uint16') declare sFamilyClass: number
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
  @defineColumn({ type: 'uint8', size: 16 }) declare ulUnicodeRange: number[]
  @defineColumn({ type: 'char', size: 4 }) declare achVendID: string
  @defineColumn('uint16') declare fsSelection: number
  @defineColumn('uint16') declare usFirstCharIndex: number
  @defineColumn('uint16') declare usLastCharIndex: number
  // additional Fields
  @defineColumn('int16') declare sTypoAscender: number
  @defineColumn('int16') declare sTypoDescender: number
  @defineColumn('int16') declare sTypoLineGap: number
  @defineColumn('uint16') declare usWinAscent: number
  @defineColumn('uint16') declare usWinDescent: number
  // version 0 above 39
  @defineColumn({ offset: 72, type: 'uint8', size: 8 }) declare ulCodePageRange: number[]
  // version 1 above 41
  @defineColumn({ offset: 72, type: 'int16' }) declare sxHeight: number
  @defineColumn('int16') declare sCapHeight: number
  @defineColumn('uint16') declare usDefaultChar: number
  @defineColumn('uint16') declare usBreakChar: number
  @defineColumn('uint16') declare usMaxContext: number

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
