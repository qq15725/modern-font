import { GlyfGlyph } from './GlyfGlyph'
import { GlyphSet } from './GlyphSet'

export class GlyfGlyphSet extends GlyphSet {
  get length(): number {
    return this._sfnt.loca.locations.length
  }

  protected _get(index: number): GlyfGlyph {
    const locations = this._sfnt.loca.locations
    const location = locations[index]
    const glyph = new GlyfGlyph({ index })
    if (location !== locations[index + 1]) {
      glyph.parse(this._sfnt.glyf, location, this)
    }
    return glyph
  }
}
