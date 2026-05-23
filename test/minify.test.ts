import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { minifyFont, parseFont, WOFF } from '../src'

async function readBuffer(path: string): Promise<ArrayBuffer> {
  const v = await fs.readFile(path)
  return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer
}

describe('minifyFont', () => {
  it('subsets a glyf woff: smaller, re-parseable, keeps the subset glyphs', async () => {
    const raw = await readBuffer('./test/assets/example.woff')
    const subset = '永你好'
    const out = minifyFont(raw, subset)
    expect(out.byteLength).toBeLessThan(raw.byteLength)

    const sfnt = (parseFont(out) as WOFF).sfnt
    for (const ch of subset) {
      // glyph index 0 is .notdef — a kept char must map to a real glyph
      expect(sfnt.charToGlyphIndex(ch)).toBeGreaterThan(0)
    }
  })

  it('subsets a CFF/OpenType font: smaller, keeps subset glyphs, blanks the rest', async () => {
    const raw = await readBuffer('./test/assets/example-cff.woff')
    const orig = (parseFont(raw) as WOFF).sfnt
    expect(orig.hasGlyf).toBe(false)
    expect(orig.charToGlyph('A').pathCommands.length).toBeGreaterThan(0)
    expect(orig.charToGlyph('B').pathCommands.length).toBeGreaterThan(0)

    const out = minifyFont(raw, 'A')
    expect(out.byteLength).toBeLessThan(raw.byteLength)

    const sfnt = (parseFont(out) as WOFF).sfnt
    expect(sfnt.charToGlyph('A').pathCommands.length).toBeGreaterThan(0) // kept
    expect(sfnt.charToGlyph('B').pathCommands.length).toBe(0) // blanked (outside subset)
  })
})
