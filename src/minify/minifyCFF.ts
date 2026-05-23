import type { SFNT } from '../sfnt'

/**
 * Minify a CFF/OpenType font by blanking the outlines of glyphs outside the
 * subset (see {@link Cff.blankGlyphsExcept}). Glyph count and cmap are kept, so
 * characters outside the subset resolve to empty glyphs; combined with WOFF
 * compression the output shrinks substantially (uncompressed size is unchanged
 * — a reindexing subset is a future enhancement). Returns the same SFNT.
 */
export function minifyCFF(sfnt: SFNT, subset: string): SFNT {
  const keep = new Set<number>([0]) // always keep .notdef
  for (const char of subset) {
    keep.add(sfnt.charToGlyphIndex(char))
  }
  sfnt.cff.blankGlyphsExcept(keep)
  return sfnt
}
