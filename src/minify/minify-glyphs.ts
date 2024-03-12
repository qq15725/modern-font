import { componentFlags } from '../sfnt'
import type { HMetric, Sfnt, VMetric } from '../sfnt'

export interface MinimizedGlyph extends HMetric, VMetric {
  rawGlyphIndex: number
  glyphIndex: number
  unicodes: Array<number>
  view: DataView
}

export function minifyGlyphs(sfnt: Sfnt, subset: string) {
  const { cmap, loca, hmtx, vmtx, glyf } = sfnt
  const unicodeGlyphIndexMap = cmap.getUnicodeGlyphIndexMap()
  const glyphIndexUnicodesMap = new Map<number, Set<number>>()
  unicodeGlyphIndexMap.forEach((glyphIndex, unicode) => {
    let unicodes = glyphIndexUnicodesMap.get(glyphIndex)
    if (!unicodes) glyphIndexUnicodesMap.set(glyphIndex, unicodes = new Set())
    unicodes.add(unicode)
  })
  const locations = loca.getLocations()
  const hMetrics = hmtx.getMetrics()
  const vMetrics = vmtx?.getMetrics()
  const unicodes = Array.from(
    new Set(
      subset.split('')
        .map(str => str.codePointAt(0))
        .filter(unicode => unicode !== undefined && unicodeGlyphIndexMap.has(unicode)) as Array<number>,
    ),
  ).sort((a, b) => a - b)

  const glyphs: Array<MinimizedGlyph> = []

  const addGlyph = (glyphIndex: number) => {
    const hMetric = hMetrics[glyphIndex]
    const vMetric = vMetrics?.[glyphIndex] ?? { advanceHeight: 0, topSideBearing: 0 }
    const start = locations[glyphIndex]
    const end = locations[glyphIndex + 1] ?? start
    const glyph = {
      ...hMetric,
      ...vMetric,
      rawGlyphIndex: glyphIndex,
      glyphIndex: glyphs.length,
      unicodes: Array.from(glyphIndexUnicodesMap.get(glyphIndex) ?? []),
      view: new DataView(
        glyf.buffer,
        glyf.byteOffset + start,
        end - start,
      ),
    }
    glyphs.push(glyph)
    return glyph
  }

  addGlyph(0)

  unicodes.forEach(unicode => addGlyph(unicodeGlyphIndexMap.get(unicode)!))

  glyphs.slice().forEach(glyph => {
    const { view } = glyph
    if (!view.byteLength) return
    const numberOfContours = view.getInt16(0)
    if (numberOfContours >= 0) return
    let offset = 10
    let flags
    do {
      flags = view.getUint16(offset)
      const glyphIndexOffset = offset + 2
      const glyphIndex = view.getUint16(glyphIndexOffset)
      offset += 4
      if (componentFlags.ARG_1_AND_2_ARE_WORDS & flags) offset += 4
      else offset += 2
      if (componentFlags.WE_HAVE_A_SCALE & flags) offset += 2
      else if (componentFlags.WE_HAVE_AN_X_AND_Y_SCALE & flags) offset += 4
      else if (componentFlags.WE_HAVE_A_TWO_BY_TWO & flags) offset += 8
      const glyph = addGlyph(glyphIndex)
      view.setUint16(glyphIndexOffset, glyph.glyphIndex)
    } while (componentFlags.MORE_COMPONENTS & flags)
  })

  return glyphs
}
