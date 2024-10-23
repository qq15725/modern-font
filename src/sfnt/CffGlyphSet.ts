import { CffGlyph } from './CffGlyph'
import { GlyphSet } from './GlyphSet'

export class CffGlyphSet extends GlyphSet {
  get length(): number {
    return this._sfnt.cff.charStringsIndex.offsets.length - 1
  }

  protected _get(index: number): CffGlyph {
    const cff = this._sfnt.cff
    const glyph = new CffGlyph({ index })
    glyph.parse(cff, cff.charStringsIndex.get(index), this)
    glyph.name = cff.charset[index]
    return glyph
  }
}
