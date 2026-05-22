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

  it('throws a clear error for CFF/OpenType fonts (unsupported) instead of crashing', async () => {
    const cff = await readBuffer('./test/assets/example-cff.woff')
    const woff = parseFont(cff) as WOFF
    expect(woff.sfnt.hasGlyf).toBe(false)
    expect(() => minifyFont(woff, 'A')).toThrow(/TrueType|CFF/i)
  })
})
