import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { FontCollection, parseCollection, parseFont, SFNT, TTF, WOFF } from '../src'

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

describe('GSUB ligatures', () => {
  // Minimal GSUB with a 'liga' feature → one Type 4 lookup mapping [10, 20] -> 99.
  function buildLigatureGsub(): SFNT {
    const buf = new ArrayBuffer(62)
    const dv = new DataView(buf)
    const u16 = (o: number, v: number) => dv.setUint16(o, v, false)
    u16(0, 1); u16(2, 0); u16(4, 10); u16(6, 12); u16(8, 26) // header
    u16(10, 0) // scriptList: scriptCount = 0
    u16(12, 1) // featureList: featureCount = 1
    for (let i = 0; i < 4; i++) dv.setUint8(14 + i, 'liga'.charCodeAt(i)) // FeatureRecord tag
    u16(18, 8) // featureOffset -> 20
    u16(20, 0); u16(22, 1); u16(24, 0) // Feature: params, lookupIndexCount, indices[0]=0
    u16(26, 1); u16(28, 4) // LookupList: count, offset[0] -> 30
    u16(30, 4); u16(32, 0); u16(34, 1); u16(36, 8) // Lookup: type 4, flag, subtableCount, offset -> 38
    u16(38, 1); u16(40, 8); u16(42, 1); u16(44, 14) // LigatureSubst f1: format, coverage->46, setCount, set->52
    u16(46, 1); u16(48, 1); u16(50, 10) // Coverage f1: format, glyphCount, glyph[0]=10
    u16(52, 1); u16(54, 4) // LigatureSet: ligatureCount, offset -> 56
    u16(56, 99); u16(58, 2); u16(60, 20) // Ligature: glyph=99, componentCount=2, components[0]=20
    return new SFNT(new Map<any, any>([['GSUB', new DataView(buf)]]))
  }

  it('parses Type 4 ligature rules and applies them over a glyph run', () => {
    const sfnt = buildLigatureGsub()
    expect(sfnt.gsub!.getLigatures('liga').get(10)).toEqual([{ components: [20], ligatureGlyph: 99 }])
    expect(sfnt.applyLigatures([5, 10, 20, 7], 'liga')).toEqual([5, 99, 7])
    expect(sfnt.applyLigatures([10, 21], 'liga')).toEqual([10, 21]) // components don't match
    expect(sfnt.applyLigatures([10], 'liga')).toEqual([10]) // no following component
  })

  it('reads ligatures from a real font and collapses a known sequence', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    const ligatures = sfnt.gsub!.getLigatures('liga')
    expect(ligatures.size).toBeGreaterThan(0)
    const [first, rules] = ligatures.entries().next().value as [number, { components: number[], ligatureGlyph: number }[]]
    const sequence = [first, ...rules[0].components]
    expect(sfnt.applyLigatures(sequence, 'liga')).toEqual([rules[0].ligatureGlyph])
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
