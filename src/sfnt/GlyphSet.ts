import type { Glyf } from './Glyf'
import type { Loca } from './Loca'
import { Glyph } from './Glyph'

export type GlyphOrLoader = Glyph | undefined

export class GlyphSet {
  protected _items: GlyphOrLoader[] = []

  get length(): number {
    return this._loca.locations.length
  }

  constructor(
    protected _glyf: Glyf,
    protected _loca: Loca,
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
      const locations = this._loca.locations
      if (locations[index] !== locations[index + 1]) {
        glyph._parse(this._glyf, locations[index], this)
      }
      this._items[index] = glyph
    }
    return glyph
  }
}
