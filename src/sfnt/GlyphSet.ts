import type { Glyf } from './Glyf'
import { Glyph } from './Glyph'

export type GlyphOrLoader = Glyph | undefined

export class GlyphSet {
  glyphs: GlyphOrLoader[] = []

  get length(): number {
    return this._locations.length
  }

  constructor(
    protected _glyf: Glyf,
    protected _locations: number[],
  ) {
    //
  }

  get(index: number): Glyph {
    const _glyph = this.glyphs[index]
    let glyph: Glyph
    if (_glyph) {
      glyph = _glyph
    }
    else {
      glyph = new Glyph({ index })
      const locations = this._locations
      if (locations[index] !== locations[index + 1]) {
        glyph._parse(this._glyf, locations[index], this)
      }
      this.glyphs[index] = glyph
    }
    return glyph
  }
}
