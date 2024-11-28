import { defineColumn } from '../core'
import { cffExpertEncoding, cffStandardEncoding } from './CffEncoding'
import { CffGlyphSet } from './CffGlyphSet'
import { CffNumberIndex, CffStringIndex } from './CffIndex'
import { CffPrivateDict } from './CffPrivateDict'
import { cffExpertSubsetStrings, cffIExpertStrings, cffISOAdobeStrings, getCffString } from './CffString'
import { CffTopDict } from './CffTopDict'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

/**
 * @link https://www.microsoft.com/typography/OTSPEC/cff.htm
 */
@defineSfntTable('CFF ', 'cff')
export class Cff extends SfntTable {
  @defineColumn('uint8') declare majorVersion: number
  @defineColumn('uint8') declare minorVersion: number
  @defineColumn('uint8') declare headerSize: number
  @defineColumn('uint8') declare offsetSize: number

  declare nameIndex: CffStringIndex
  declare topDictIndex: CffNumberIndex
  declare stringIndex: CffStringIndex
  declare globalSubrIndex: CffNumberIndex
  declare charStringsIndex: CffNumberIndex

  protected _glyphs?: CffGlyphSet
  get glyphs(): CffGlyphSet {
    return this._glyphs ??= new CffGlyphSet(this._sfnt)
  }

  get gsubrs(): number[][] { return this.globalSubrIndex.objects }
  get gsubrsBias(): number { return this._calcSubroutineBias(this.globalSubrIndex.objects) }

  declare topDict: CffTopDict
  privateDict?: CffPrivateDict
  subrsIndex?: CffNumberIndex

  get defaultWidthX(): number { return this.privateDict?.defaultWidthX ?? 0 }
  get nominalWidthX(): number { return this.privateDict?.nominalWidthX ?? 0 }
  get subrs(): number[][] { return this.subrsIndex?.objects ?? [] }
  get subrsBias(): number { return this._calcSubroutineBias(this.subrs) }

  declare charset: string[]
  declare encoding: string[]

  constructor(
    source: BufferSource,
    byteOffset?: number,
    byteLength?: number,
    littleEndian?: boolean,
  ) {
    super(source, byteOffset, byteLength, littleEndian)
    this._init()
  }

  protected _init(): void {
    const reader = this.view
    const { buffer, byteOffset: offset } = reader
    const headerEndOffset = offset + 4
    this.nameIndex = new CffStringIndex(buffer, headerEndOffset)
    this.topDictIndex = new CffNumberIndex(buffer, this.nameIndex.endOffset)
    this.stringIndex = new CffStringIndex(buffer, this.topDictIndex.endOffset)
    this.globalSubrIndex = new CffNumberIndex(buffer, this.stringIndex.endOffset)
    this.topDict = new CffTopDict(new Uint8Array(this.topDictIndex.objects[0]).buffer).setStringIndex(this.stringIndex)
    const privateSize = this.topDict.private[0]
    const privateOffset = this.topDict.private[1]
    if (privateSize) {
      this.privateDict = new CffPrivateDict(
        buffer,
        offset + privateOffset,
        privateSize,
      ).setStringIndex(this.stringIndex)

      if (this.privateDict.subrs) {
        this.subrsIndex = new CffNumberIndex(
          buffer,
          offset + privateOffset + this.privateDict.subrs,
        )
      }
    }
    this.charStringsIndex = new CffNumberIndex(
      buffer,
      offset + this.topDict.charStrings,
    )
    const nGlyphs = this.charStringsIndex.offsets.length - 1
    if (this.topDict.charset === 0) {
      this.charset = cffISOAdobeStrings
    }
    else if (this.topDict.charset === 1) {
      this.charset = cffIExpertStrings
    }
    else if (this.topDict.charset === 2) {
      this.charset = cffExpertSubsetStrings
    }
    else {
      this.charset = this._readCharset(
        offset + this.topDict.charset,
        nGlyphs,
        this.stringIndex.objects,
      )
    }
    if (this.topDict.encoding === 0) {
      this.encoding = cffStandardEncoding
    }
    else if (this.topDict.encoding === 1) {
      this.encoding = cffExpertEncoding
    }
    else {
      this.encoding = this._readEncoding(offset + this.topDict.encoding) as any
    }
  }

  protected _readCharset(start: number, nGlyphs: number, strings: string[]): string[] {
    const reader = this.view
    reader.seek(start)
    let i
    let sid
    let count
    // The .notdef glyph is not included, so subtract 1.
    nGlyphs -= 1
    const charset = ['.notdef']
    const format = reader.readUint8()
    if (format === 0) {
      for (i = 0; i < nGlyphs; i += 1) {
        sid = reader.readUint16()
        charset.push(getCffString(strings, sid))
      }
    }
    else if (format === 1) {
      while (charset.length <= nGlyphs) {
        sid = reader.readUint16()
        count = reader.readUint8()
        for (i = 0; i <= count; i += 1) {
          charset.push(getCffString(strings, sid))
          sid += 1
        }
      }
    }
    else if (format === 2) {
      while (charset.length <= nGlyphs) {
        sid = reader.readUint16()
        count = reader.readUint16()
        for (i = 0; i <= count; i += 1) {
          charset.push(getCffString(strings, sid))
          sid += 1
        }
      }
    }
    else {
      throw new Error(`Unknown charset format ${format}`)
    }
    return charset
  }

  protected _readEncoding(start: number): Record<number, number> {
    const reader = this.view
    reader.seek(start)
    let i
    let code
    const encoding: Record<number, number> = {}
    const format = reader.readUint8()
    if (format === 0) {
      const nCodes = reader.readUint8()
      for (i = 0; i < nCodes; i += 1) {
        code = reader.readUint8()
        encoding[code] = i
      }
    }
    else if (format === 1) {
      const nRanges = reader.readUint8()
      code = 1
      for (i = 0; i < nRanges; i += 1) {
        const first = reader.readUint8()
        const nLeft = reader.readUint8()
        for (let j = first; j <= first + nLeft; j += 1) {
          encoding[j] = code
          code += 1
        }
      }
    }
    else {
      console.warn(`unknown encoding format:${format}`)
    }
    return encoding
  }

  protected _calcSubroutineBias(subrs: number[][]): number {
    let bias
    if (subrs.length < 1240) {
      bias = 107
    }
    else if (subrs.length < 33900) {
      bias = 1131
    }
    else {
      bias = 32768
    }
    return bias
  }
}
