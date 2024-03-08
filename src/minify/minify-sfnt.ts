import { minifyGlyfs } from './minify-glyfs'
import type { Sfnt } from '../sfnt'

export function minifySfnt(sfnt: Sfnt, subset: string): Sfnt {
  const glyfs = minifyGlyfs(sfnt, subset)
  const numGlyphs = glyfs.length
  const head = sfnt.head
  head.checkSumAdjustment = 0
  head.magickNumber = 0x5F0F3CF5
  head.indexToLocFormat = 1
  const maxp = sfnt.maxp
  maxp.numGlyphs = numGlyphs
  const hhea = sfnt.hhea
  hhea.numOfLongHorMetrics = numGlyphs
  const vhea = sfnt.vhea
  if (vhea) vhea.numOfLongVerMetrics = numGlyphs
  const post = sfnt.post
  post.format = Math.round(3 * 65536)
  post.italicAngle = 0
  post.underlinePosition = 0
  post.underlineThickness = 0
  post.isFixedPitch = 0
  post.minMemType42 = 0
  post.minMemType42 = 0
  post.minMemType1 = 0
  post.maxMemType1 = numGlyphs
  return sfnt
}
