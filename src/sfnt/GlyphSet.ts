import type { Glyph } from './Glyph'
import type { Sfnt } from './Sfnt'

export type GlyphOrLoader = Glyph | undefined

export abstract class GlyphSet {
  protected _items: GlyphOrLoader[] = []

  constructor(
    protected _sfnt: Sfnt,
  ) {
    //
  }

  protected abstract _get(index: number): Glyph

  get(index: number): Glyph {
    const _glyph = this._items[index]
    let glyph: Glyph
    if (_glyph) {
      glyph = _glyph
    }
    else {
      glyph = this._get(index)
      const metric = this._sfnt.hmtx.metrics[index]
      if (metric) {
        glyph.advanceWidth = glyph.advanceWidth || metric.advanceWidth
        glyph.leftSideBearing = glyph.leftSideBearing || metric.leftSideBearing
      }
      const unicodes = this._sfnt.cmap.glyphIndexToUnicodesMap.get(index)
      if (unicodes) {
        glyph.unicode ??= unicodes[0]
        glyph.unicodes ??= unicodes
      }
      this._items[index] = glyph
    }
    return glyph
  }
}
