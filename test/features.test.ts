import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { commandsToPathData, Kern, parseFont, Post, WOFF } from '../src'
import { macGlyphNames } from '../src/sfnt/standardGlyphNames'

async function loadSFNT(path: string) {
  const v = await fs.readFile(path)
  const buf = v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer
  return (parseFont(buf) as WOFF).sfnt
}

describe('SVG path data', () => {
  it('serializes commands to an SVG d string', () => {
    expect(commandsToPathData([
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10.5, y: -0 },
      { type: 'Q', x1: 1, y1: 2, x: 3, y: 4 },
      { type: 'C', x1: 1, y1: 2, x2: 3, y2: 4, x: 5, y: 6 },
      { type: 'Z' },
    ])).toBe('M0 0L10.5 0Q1 2 3 4C1 2 3 4 5 6Z')
  })

  it('SFNT.getPathData / Glyph.getPathData match getPathCommands', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    const d = sfnt.getPathData('永', 0, 0, 72)
    expect(d.startsWith('M')).toBe(true)
    expect(d.length).toBeGreaterThan(10)
    const glyph = sfnt.charToGlyph('永')
    expect(glyph.getPathData(0, 0, 72, {}, sfnt)).toBe(commandsToPathData(glyph.getPathCommands(0, 0, 72, {}, sfnt)))
  })
})

describe('kern table', () => {
  it('reads format-0 horizontal pairs', () => {
    const buf = new ArrayBuffer(30)
    const dv = new DataView(buf)
    dv.setUint16(0, 0) // version
    dv.setUint16(2, 1) // nTables
    dv.setUint16(4, 0) // subtable version
    dv.setUint16(6, 26) // subtable length
    dv.setUint16(8, 0x0001) // coverage: horizontal, format 0
    dv.setUint16(10, 2) // nPairs
    dv.setUint16(18, 1); dv.setUint16(20, 2); dv.setInt16(22, -50)
    dv.setUint16(24, 3); dv.setUint16(26, 4); dv.setInt16(28, 100)
    const kern = new Kern(buf)
    expect(kern.getKerningValue(1, 2)).toBe(-50)
    expect(kern.getKerningValue(3, 4)).toBe(100)
    expect(kern.getKerningValue(9, 9)).toBe(0)
  })

  it('SFNT.getKerningValue returns 0 when there is no kern table', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    expect(sfnt.getKerningValue(1, 2)).toBe(0)
  })
})

describe('post glyph names', () => {
  it('has the 258 standard Macintosh glyph names', () => {
    expect(macGlyphNames.length).toBe(258)
    expect(macGlyphNames[3]).toBe('space')
    expect(macGlyphNames[36]).toBe('A')
    expect(macGlyphNames[257]).toBe('dcroat')
  })

  it('reads format 2 names (standard + custom)', () => {
    const buf = new ArrayBuffer(48)
    const dv = new DataView(buf)
    dv.setInt32(0, 0x0002_0000) // format 2.0
    dv.setUint16(32, 3) // numGlyphs
    dv.setUint16(34, 0) // glyph 0 -> standard '.notdef'
    dv.setUint16(36, 258) // glyph 1 -> custom[0]
    dv.setUint16(38, 259) // glyph 2 -> custom[1]
    let p = 40
    for (const s of ['foo', 'bar']) {
      dv.setUint8(p++, s.length)
      for (const c of s) dv.setUint8(p++, c.charCodeAt(0))
    }
    const post = new Post(buf)
    expect(post.getGlyphName(0)).toBe('.notdef')
    expect(post.getGlyphName(1)).toBe('foo')
    expect(post.getGlyphName(2)).toBe('bar')
  })

  it('does not throw on a real font (format 3 has no names)', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    expect(Array.isArray(sfnt.post.glyphNames)).toBe(true)
    expect(() => sfnt.charToGlyph('永').name).not.toThrow()
  })
})
