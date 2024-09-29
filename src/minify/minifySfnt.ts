import type { Sfnt } from '../sfnt'
import { Cmap, Glyf, Hmtx, Loca, Post, Vmtx } from '../sfnt'
import { minifyGlyphs } from './minifyGlyphs'

export function minifySfnt(sfnt: Sfnt, subset: string): Sfnt {
  const glyphs = minifyGlyphs(sfnt, subset)
  const numGlyphs = glyphs.length

  const { head, maxp, hhea, vhea } = sfnt

  head.checkSumAdjustment = 0
  head.magickNumber = 0x5F0F3CF5
  head.indexToLocFormat = 1

  maxp.numGlyphs = numGlyphs

  let offset = 0
  sfnt.loca = Loca.from(
    [
      ...glyphs.map((glyph) => {
        const result = offset
        offset += glyph.view.byteLength
        return result
      }),
      offset,
    ],
    head.indexToLocFormat,
  )

  const unicodeGlyphIndexMap = glyphs.reduce((map, glyph, glyphIndex) => {
    glyph.unicodes.forEach(unicode => map.set(unicode, glyphIndex))
    return map
  }, new Map<number, number>())

  sfnt.cmap = Cmap.from(unicodeGlyphIndexMap)

  sfnt.glyf = Glyf.from(glyphs.map(glyph => glyph.view))

  hhea.numOfLongHorMetrics = numGlyphs

  sfnt.hmtx = Hmtx.from(glyphs.map(glyph => ({
    advanceWidth: glyph.advanceWidth,
    leftSideBearing: glyph.leftSideBearing,
  })))

  if (vhea)
    vhea.numOfLongVerMetrics = numGlyphs

  const vmtx = sfnt.vmtx
  if (vmtx) {
    sfnt.vmtx = Vmtx.from(glyphs.map(glyph => ({
      advanceHeight: glyph.advanceHeight,
      topSideBearing: glyph.topSideBearing,
    })))
  }

  const post = new Post()
  post.format = 3
  post.italicAngle = 0
  post.underlinePosition = 0
  post.underlineThickness = 0
  post.isFixedPitch = 0
  post.minMemType42 = 0
  post.minMemType42 = 0
  post.minMemType1 = 0
  post.maxMemType1 = numGlyphs
  sfnt.post = post

  // TODO
  sfnt.delete('GPOS') // 字形定位
  sfnt.delete('GSUB') // 字形替换
  sfnt.delete('hdmx') // 仅适用于 Macintosh 平台上的字体
  // sfnt.delete('FFTM')
  // sfnt.delete('GDEF') // Glyph Definition Table
  // sfnt.delete('gasp') // grid-fitting and scan-conversion procedure
  // sfnt.delete('prep') // control value program

  return sfnt
}
