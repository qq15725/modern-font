import type { Glyph } from './Glyph'
import type { Sfnt } from './Sfnt'

export type GlyphOrLoader = Glyph | (() => Glyph)

export class GlyphSet {
  length = 0
  glyphs: GlyphOrLoader[] = []

  constructor(
    protected _sfnt: Sfnt,
  ) {
    //
  }

  get(index: number): Glyph {
    const _glyph = this.glyphs[index]
    let glyph: Glyph
    if (typeof _glyph === 'function') {
      glyph = _glyph()
      glyph.path = glyph.buildPath(this)
    }
    else {
      glyph = _glyph
    }
    return glyph
  }

  push(index: number, glyph: GlyphOrLoader): void {
    this.glyphs[index] = glyph
    this.length++
  }
}
