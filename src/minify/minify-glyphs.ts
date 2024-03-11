import type { Sfnt } from '../sfnt'

export function minifyGlyphs(sfnt: Sfnt, subset: string) {
  const { cmap, loca, hmtx, vmtx, glyf } = sfnt
  const unicodeGlyphIndexMap = cmap.getUnicodeGlyphIndexMap()
  const locations = loca.getLocations()
  const hMetrics = hmtx.getMetrics()
  const vMetrics = vmtx?.getMetrics()
  const unicodes = Array.from(
    new Set(
      subset.split('')
        .map(str => str.codePointAt(0))
        .filter(unicode => unicode !== undefined && unicode in unicodeGlyphIndexMap)
        .sort(),
    ),
  ) as Array<number>
  const glyphs = unicodes.map(unicode => {
    const glyphIndex = unicodeGlyphIndexMap[unicode]
    const hMetric = hMetrics[glyphIndex]
    const vMetric = vMetrics?.[glyphIndex] ?? { advanceHeight: 0, topSideBearing: 0 }
    const start = locations[glyphIndex]
    const end = locations[glyphIndex + 1]
    const view = new DataView(
      glyf.buffer,
      glyf.byteOffset + start,
      end - start,
    )
    const numContours = view.getInt16(0)
    if (numContours < 0) {
      // TODO 支持复合形状
      throw new Error(`Failed to minifyGlyphs, composite shapes are not supported. character: "${ String.fromCharCode(unicode) }"`)
    }
    return {
      ...hMetric,
      ...vMetric,
      glyphIndex,
      unicode,
      view,
    }
  })
  glyphs.unshift({
    ...hMetrics[0],
    ...(vMetrics?.[0] ?? { advanceHeight: 0, topSideBearing: 0 }),
    glyphIndex: 0,
    unicode: 0,
    view: new DataView(
      glyf.buffer,
      glyf.byteOffset + locations[0],
      locations[1] - locations[0],
    ),
  })
  return glyphs
}
