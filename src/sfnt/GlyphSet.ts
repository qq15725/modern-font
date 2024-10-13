import type { Sfnt } from './Sfnt'
import { Glyph } from './Glyph'

export type GlyphOrLoader = Glyph | undefined

export class GlyphSet {
  protected _items: GlyphOrLoader[] = []

  get length(): number {
    return this._sfnt.loca.locations.length
  }

  constructor(
    protected _sfnt: Sfnt,
  ) {
    //
  }

  get(index: number): Glyph {
    const _glyph = this._items[index]
    let glyph: Glyph
    if (_glyph) {
      glyph = _glyph
    }
    else {
      glyph = new Glyph({ index })
      const locations = this._sfnt.loca.locations
      const metrics = this._sfnt.hmtx.metrics
      const metric = metrics[index]
      const location = locations[index]
      if (metric) {
        glyph.advanceWidth = metrics[index].advanceWidth
        glyph.leftSideBearing = metrics[index].leftSideBearing
      }
      if (location !== locations[index + 1]) {
        glyph._parse(this._sfnt.glyf, location, this)
      }
      this._items[index] = glyph
    }
    return glyph
  }
}
