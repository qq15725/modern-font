import { defineColumn } from '../core'
import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'
import { macGlyphNames } from './standardGlyphNames'

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6post.html
 */
@defineSFNTTable('post')
export class Post extends SFNTTable {
  @defineColumn('fixed') declare format: number
  @defineColumn('fixed') declare italicAngle: number
  @defineColumn('int16') declare underlinePosition: number
  @defineColumn('int16') declare underlineThickness: number
  @defineColumn('uint32') declare isFixedPitch: number
  @defineColumn('uint32') declare minMemType42: number
  @defineColumn('uint32') declare maxMemType42: number
  @defineColumn('uint32') declare minMemType1: number
  @defineColumn('uint32') declare maxMemType1: number

  protected _glyphNames?: string[]
  /** Glyph names from post format 1/2; empty for format 3 (which stores no names). */
  get glyphNames(): string[] {
    return this._glyphNames ??= this._readGlyphNames()
  }

  getGlyphName(glyphIndex: number): string | undefined {
    return this.glyphNames[glyphIndex]
  }

  protected _readGlyphNames(): string[] {
    const format = this.format
    if (format === 1) {
      return macGlyphNames.slice() // exactly the standard 258-glyph set
    }
    if (format !== 2) {
      return [] // 2.5 (deprecated), 3 (no names), 4
    }
    const view = this.view
    const numGlyphs = view.readUint16(32)
    const indices: number[] = []
    for (let i = 0; i < numGlyphs; i++) {
      indices.push(view.readUint16(34 + i * 2))
    }
    // Custom names (Pascal strings) for indices >= 258 follow the index array.
    const customNames: string[] = []
    let p = 34 + numGlyphs * 2
    const end = view.byteLength
    while (p < end) {
      const len = view.readUint8(p)
      p += 1
      customNames.push(view.readString(p, len))
      p += len
    }
    return indices.map(index => index < 258 ? macGlyphNames[index] : (customNames[index - 258] ?? ''))
  }

  constructor(buffer: BufferSource = new ArrayBuffer(32), byteOffset?: number, byteLength?: number) {
    super(buffer, byteOffset, byteLength)
  }
}
