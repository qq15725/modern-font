import { defineProp } from '../utils'
import { Sfnt } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    'OS/2'?: Os2
  }
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6OS2.html
 */
@Sfnt.table('OS/2')
export class Os2 extends SfntTable {
  @defineProp({ type: 'uint16' }) declare version: number
  @defineProp({ type: 'int16' }) declare xAvgCharWidth: number
  @defineProp({ type: 'uint16' }) declare usWeightClass: number
  @defineProp({ type: 'uint16' }) declare usWidthClass: number
  @defineProp({ type: 'uint16' }) declare fsType: number
  @defineProp({ type: 'uint16' }) declare ySubscriptXSize: number
  @defineProp({ type: 'uint16' }) declare ySubscriptYSize: number
  @defineProp({ type: 'uint16' }) declare ySubscriptXOffset: number
  @defineProp({ type: 'uint16' }) declare ySubscriptYOffset: number
  @defineProp({ type: 'uint16' }) declare ySuperscriptXSize: number
  @defineProp({ type: 'uint16' }) declare ySuperscriptYSize: number
  @defineProp({ type: 'uint16' }) declare ySuperscriptXOffset: number
  @defineProp({ type: 'uint16' }) declare ySuperscriptYOffset: number
  @defineProp({ type: 'uint16' }) declare yStrikeoutSize: number
  @defineProp({ type: 'uint16' }) declare yStrikeoutPosition: number
  @defineProp({ type: 'uint16' }) declare sFamilyClass: number
  // panose
  @defineProp({ type: 'uint8' }) declare bFamilyType: number
  @defineProp({ type: 'uint8' }) declare bSerifStyle: number
  @defineProp({ type: 'uint8' }) declare bWeight: number
  @defineProp({ type: 'uint8' }) declare bProportion: number
  @defineProp({ type: 'uint8' }) declare bContrast: number
  @defineProp({ type: 'uint8' }) declare bStrokeVariation: number
  @defineProp({ type: 'uint8' }) declare bArmStyle: number
  @defineProp({ type: 'uint8' }) declare bLetterform: number
  @defineProp({ type: 'uint8' }) declare bMidline: number
  @defineProp({ type: 'uint8' }) declare bXHeight: number
  // unicode range
  @defineProp({ type: 'uint8', size: 16 }) declare ulUnicodeRange: Array<number>
  @defineProp({ type: 'char', size: 4 }) declare achVendID: string
  @defineProp({ type: 'uint16' }) declare fsSelection: number
  @defineProp({ type: 'uint16' }) declare usFirstCharIndex: number
  @defineProp({ type: 'uint16' }) declare usLastCharIndex: number
  // additional Fields
  @defineProp({ type: 'int16' }) declare sTypoAscender: number
  @defineProp({ type: 'int16' }) declare sTypoDescender: number
  @defineProp({ type: 'int16' }) declare sTypoLineGap: number
  @defineProp({ type: 'uint16' }) declare usWinAscent: number
  @defineProp({ type: 'uint16' }) declare usWinDescent: number
  // version 0 above 39
  @defineProp({ offset: 72, type: 'uint8', size: 8 }) declare ulCodePageRange: Array<number>
  // version 1 above 41
  @defineProp({ offset: 72, type: 'int16' }) declare sxHeight: number
  @defineProp({ type: 'int16' }) declare sCapHeight: number
  @defineProp({ type: 'uint16' }) declare usDefaultChar: number
  @defineProp({ type: 'uint16' }) declare usBreakChar: number
  @defineProp({ type: 'uint16' }) declare usMaxContext: number

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
