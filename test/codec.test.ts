import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { parseFont, parseSFNTFont, TTF, WOFF } from '../src'

async function readBuffer(path: string): Promise<ArrayBuffer> {
  const v = await fs.readFile(path)
  return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer
}

// Reference OpenType checksum: sum of big-endian uint32s (table zero-padded to a
// 4-byte boundary) mod 2^32. Kept independent of the implementation under test.
function refChecksum(buf: ArrayBuffer): number {
  const view = new DataView(buf)
  const len = buf.byteLength
  const nLongs = Math.floor(len / 4)
  let sum = 0
  for (let i = 0; i < nLongs; i++) sum += view.getUint32(i * 4, false)
  if (len % 4) {
    let last = 0
    for (let b = 0; b < 4; b++) {
      const o = nLongs * 4 + b
      last = last * 256 + (o < len ? view.getUint8(o) : 0)
    }
    sum += last
  }
  return sum % 0x1_0000_0000
}

describe('parse', () => {
  it('parses a glyf (TrueType) woff', async () => {
    const font = parseFont(await readBuffer('./test/assets/example.woff'))
    expect(font).toBeInstanceOf(WOFF)
    const sfnt = (font as WOFF).sfnt
    expect(sfnt.hasGlyf).toBe(true)
    expect(sfnt.numGlyphs).toBeGreaterThan(0)
    expect(sfnt.charToGlyph('永').pathCommands.length).toBeGreaterThan(0)
  })

  it('parses a CFF (OpenType) woff', async () => {
    const sfnt = (parseFont(await readBuffer('./test/assets/example-cff.woff')) as WOFF).sfnt
    expect(sfnt.hasGlyf).toBe(false)
    expect(sfnt.numGlyphs).toBeGreaterThan(0)
    expect(sfnt.charToGlyph('A').pathCommands.length).toBeGreaterThan(0)
  })
})

describe('TTF.checksum', () => {
  it('matches a reference implementation, including a partial trailing word', () => {
    const buf = new ArrayBuffer(10) // not a multiple of 4
    const dv = new DataView(buf)
    for (let i = 0; i < 10; i++) dv.setUint8(i, (i * 37 + 11) & 0xFF)
    expect(TTF.checksum(buf) >>> 0).toBe(refChecksum(buf) >>> 0)
  })

  it('produces a font whose whole-file checksum is 0xB1B0AFBA', async () => {
    const woff = parseFont(await readBuffer('./test/assets/example.woff')) as WOFF
    const ttf = TTF.from(woff.sfnt)
    // This 0xB1B0AFBA invariant is the definition of head.checkSumAdjustment.
    expect(refChecksum(ttf.toBuffer()) >>> 0).toBe(0xB1B0AFBA)
  })
})

describe('format conversion round trip', () => {
  it('WOFF -> TTF -> re-parse preserves glyph count', async () => {
    const woff = parseFont(await readBuffer('./test/assets/example.woff')) as WOFF
    const ttf = TTF.from(woff.sfnt)
    const buf = ttf.toBuffer()
    expect(TTF.is(buf)).toBe(true)
    const reparsed = parseSFNTFont(buf)
    expect(reparsed).toBeInstanceOf(TTF)
    expect(reparsed.sfnt.numGlyphs).toBe(woff.sfnt.numGlyphs)
  })

  it('TTF -> WOFF -> re-parse preserves glyph count', async () => {
    const woff = parseFont(await readBuffer('./test/assets/example.woff')) as WOFF
    const ttf = TTF.from(woff.sfnt)
    const buf = WOFF.from(ttf.sfnt).toBuffer()
    expect(WOFF.is(buf)).toBe(true)
    expect(parseSFNTFont(buf).sfnt.numGlyphs).toBe(woff.sfnt.numGlyphs)
  })
})
