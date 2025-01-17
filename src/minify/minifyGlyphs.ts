import type { HMetric, SFNT, VMetric } from '../sfnt'
import { componentFlags } from '../sfnt'

export interface MinimizedGlyph extends HMetric, VMetric {
  rawGlyphIndex: number
  glyphIndex: number
  unicodes: number[]
  view: DataView
}

// TODO OpenType
export function minifyGlyphs(sfnt: SFNT, subset: string): MinimizedGlyph[] {
  const { cmap, loca, hmtx, vmtx, glyf } = sfnt
  const unicodeToGlyphIndexMap = cmap.unicodeToGlyphIndexMap
  const locations = loca.locations
  const hMetrics = hmtx.metrics
  const vMetrics = vmtx?.metrics
  const unicodes = Array.from(
    new Set(
      subset.split('')
        .map(str => str.codePointAt(0))
        .filter(unicode => unicode !== undefined && unicodeToGlyphIndexMap.has(unicode)) as number[],
    ),
  ).sort((a, b) => a - b)
  const glyphIndexUnicodesMap = new Map<number, Set<number>>()
  unicodes.forEach((unicode) => {
    const glyphIndex = unicodeToGlyphIndexMap.get(unicode) ?? 0
    let unicodes = glyphIndexUnicodesMap.get(glyphIndex)
    if (!unicodes)
      glyphIndexUnicodesMap.set(glyphIndex, unicodes = new Set())
    unicodes.add(unicode)
  })

  const glyphs: MinimizedGlyph[] = []

  const addGlyph = (glyphIndex: number): MinimizedGlyph => {
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
        glyf.view.buffer,
        glyf.view.byteOffset + start,
        end - start,
      ),
    }
    glyphs.push(glyph)
    return glyph
  }

  addGlyph(0)

  unicodes.forEach(unicode => addGlyph(unicodeToGlyphIndexMap.get(unicode)!))

  glyphs.slice().forEach((glyph) => {
    const { view } = glyph
    if (!view.byteLength)
      return
    const numberOfContours = view.getInt16(0)
    if (numberOfContours >= 0)
      return
    let offset = 10
    let flags
    do {
      flags = view.getUint16(offset)
      const glyphIndexOffset = offset + 2
      const glyphIndex = view.getUint16(glyphIndexOffset)
      offset += 4
      if (componentFlags.ARG_1_AND_2_ARE_WORDS & flags)
        offset += 4
      else offset += 2
      if (componentFlags.WE_HAVE_A_SCALE & flags)
        offset += 2
      else if (componentFlags.WE_HAVE_AN_X_AND_Y_SCALE & flags)
        offset += 4
      else if (componentFlags.WE_HAVE_A_TWO_BY_TWO & flags)
        offset += 8
      const glyph = addGlyph(glyphIndex)
      view.setUint16(glyphIndexOffset, glyph.glyphIndex)
    } while (componentFlags.MORE_COMPONENTS & flags)
  })

  return glyphs
}
