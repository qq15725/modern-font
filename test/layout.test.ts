import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { FontCollection, parseCollection, parseFont, TTF, WOFF } from '../src'

async function loadSFNT(path: string) {
  const v = await fs.readFile(path)
  const buf = v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer
  return (parseFont(buf) as WOFF).sfnt
}

describe('GPOS pair kerning', () => {
  it('reads horizontal kerning from the GPOS kern feature', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    // glyph 4 -> glyph 16 has a -32 pair adjustment in example.woff's GPOS
    expect(sfnt.gpos!.getKerningValue(4, 16)).toBe(-32)
    expect(sfnt.getKerningValue(4, 16)).toBe(-32)
    // an un-kerned pair is 0
    expect(sfnt.getKerningValue(0, 0)).toBe(0)
  })
})

describe('TTC font collection', () => {
  // Build a 'ttcf' wrapping one TTF, referenced numFonts times. Table directory
  // offsets become absolute from the collection start, so they are shifted by H.
  function buildTTC(ttf: ArrayBuffer, numFonts: number): ArrayBuffer {
    const H = 12 + numFonts * 4
    const out = new ArrayBuffer(H + ttf.byteLength)
    const dv = new DataView(out)
    dv.setUint32(0, 0x7474_6366, false) // 'ttcf'
    dv.setUint32(4, 0x0001_0000, false) // version 1.0
    dv.setUint32(8, numFonts, false)
    for (let i = 0; i < numFonts; i++) dv.setUint32(12 + i * 4, H, false)
    new Uint8Array(out).set(new Uint8Array(ttf), H)
    const numTables = dv.getUint16(H + 4, false)
    for (let i = 0; i < numTables; i++) {
      const rec = H + 12 + i * 16
      dv.setUint32(rec + 8, dv.getUint32(rec + 8, false) + H, false)
    }
    return out
  }

  it('parses every packed font, sharing table data', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    const ttc = buildTTC(TTF.from(sfnt).toBuffer(), 2)

    expect(FontCollection.is(ttc)).toBe(true)
    const collection = parseCollection(ttc)
    expect(collection.numFonts).toBe(2)
    expect(collection.sfnts).toHaveLength(2)
    expect(collection.sfnts[0].numGlyphs).toBe(sfnt.numGlyphs)
    expect(collection.sfnts[1].numGlyphs).toBe(sfnt.numGlyphs)
    expect(collection.sfnts[0].charToGlyph('永').pathCommands.length).toBeGreaterThan(0)
  })

  it('parseFont returns the first packed font', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    const ttc = buildTTC(TTF.from(sfnt).toBuffer(), 2)
    const first = parseFont(ttc)
    expect(first).toBeInstanceOf(TTF)
    expect((first as TTF).sfnt.numGlyphs).toBe(sfnt.numGlyphs)
  })
})
