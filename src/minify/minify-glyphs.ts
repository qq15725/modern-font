import { componentFlags } from '../sfnt'
import type { HMetric, Sfnt, VMetric } from '../sfnt'

export interface MinimizedGlyph extends HMetric, VMetric {
  glyphIndex: number
  unicodes: Array<number>
  view: DataView
}

export function minifyGlyphs(sfnt: Sfnt, subset: string) {
  const { cmap, loca, hmtx, vmtx, glyf } = sfnt
  const unicodeGlyphIndexMap = cmap.getUnicodeGlyphIndexMap()
  const glyphIndexUnicodesMap = new Map<number, Set<number>>()
  unicodeGlyphIndexMap.forEach((unicode, glyphIndex) => {
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
        .filter(unicode => unicode !== undefined && unicodeGlyphIndexMap.has(unicode))
        .sort(),
    ),
  ) as Array<number>

  const glyphIndexToGlyph = (glyphIndex: number) => {
    const hMetric = hMetrics[glyphIndex]
    const vMetric = vMetrics?.[glyphIndex] ?? { advanceHeight: 0, topSideBearing: 0 }
    const start = locations[glyphIndex]
    const end = locations[glyphIndex + 1] ?? start
    return {
      ...hMetric,
      ...vMetric,
      glyphIndex,
      unicodes: Array.from(glyphIndexUnicodesMap.get(glyphIndex)!) ?? [],
      view: new DataView(
        glyf.buffer,
        glyf.byteOffset + start,
        end - start,
      ),
    }
  }

  const glyphs: Array<MinimizedGlyph> = unicodes.map(unicode => glyphIndexToGlyph(unicodeGlyphIndexMap.get(unicode)!))

  const compoundGlyphs: Array<MinimizedGlyph> = []
  glyphs.forEach(glyph => {
    const { view } = glyph
    const numberOfContours = view.getInt16(0)
    if (numberOfContours >= 0) return
    let offset = 10
    let flags
    do {
      flags = view.getUint16(offset)
      const glyphIndex = view.getUint16(offset + 2)
      offset += 4
      if (componentFlags.ARG_1_AND_2_ARE_WORDS & flags) offset += 4
      else offset += 2
      if (componentFlags.WE_HAVE_A_SCALE & flags) offset += 2
      else if (componentFlags.WE_HAVE_AN_X_AND_Y_SCALE & flags) offset += 4
      else if (componentFlags.WE_HAVE_A_TWO_BY_TWO & flags) offset += 8
      compoundGlyphs.push(glyphIndexToGlyph(glyphIndex))
    } while (componentFlags.MORE_COMPONENTS & flags)
  })

  compoundGlyphs.forEach(glyph => glyphs.push(glyph))

  glyphs.unshift({
    ...hMetrics[0],
    ...(vMetrics?.[0] ?? { advanceHeight: 0, topSideBearing: 0 }),
    glyphIndex: 0,
    unicodes: [0],
    view: new DataView(
      glyf.buffer,
      glyf.byteOffset + locations[0],
      locations[1] - locations[0],
    ),
  })

  return glyphs
}
