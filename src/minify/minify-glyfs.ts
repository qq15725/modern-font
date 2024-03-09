import type { Sfnt } from '../sfnt'

export function minifyGlyfs(sfnt: Sfnt, subset: string) {
  const codePointGlyphIndexMap = sfnt.cmap.codePointGlyphIndexMap
  const subsetCodePoints = Array.from(
    new Set(
      subset.split('')
        .map(val => val.codePointAt(0)!)
        .filter(v => v !== undefined && codePointGlyphIndexMap[v] !== undefined)
        .sort(),
    ),
  )
  const locations = sfnt.loca.locations
  const hMetrics = sfnt.hmtx.metrics
  const vMetrics = sfnt.vmtx?.metrics
  const glyf = sfnt.glyf
  const subsetGlyphs = subsetCodePoints.map(codePoint => {
    const glyphIndex = codePointGlyphIndexMap[codePoint]
    const hMetric = hMetrics[glyphIndex]
    const vMetric = vMetrics?.[glyphIndex] ?? { advanceHeight: 0, topSideBearing: 0 }
    const start = locations[glyphIndex]
    const end = locations[glyphIndex + 1]
    const view = new DataView(
      glyf.buffer,
      glyf.byteOffset + start,
      end - start,
    )
    return {
      glyphIndex,
      ...hMetric,
      ...vMetric,
      view,
    }
  })
  return [
    {
      glyphIndex: 0,
      ...hMetrics[0],
      ...(vMetrics?.[0] ?? { advanceHeight: 0, topSideBearing: 0 }),
      codePoints: [],
      buffer: new DataView(
        glyf.buffer,
        glyf.byteOffset + locations[0],
        locations[1] - locations[0],
      ),
    },
    ...subsetGlyphs,
  ]
}
