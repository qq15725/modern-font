import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { CmapSubtableFormat6, parseFont, WOFF } from '../src'
import { CffPrivateDict } from '../src/sfnt/CffPrivateDict'
import { CffTopDict } from '../src/sfnt/CffTopDict'

async function loadSFNT(path: string) {
  const v = await fs.readFile(path)
  const buf = v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer
  return (parseFont(buf) as WOFF).sfnt
}

describe('CmapSubtableFormat6', () => {
  it('maps codes as firstCode + index, with the array right after the 10-byte header', () => {
    // format, length, language, firstCode=0x41, entryCount=3, glyphs=[10,11,12]
    const buf = new ArrayBuffer(16)
    const dv = new DataView(buf)
    const u16 = [6, 16, 0, 0x41, 3, 10, 11, 12]
    u16.forEach((v, i) => dv.setUint16(i * 2, v, false))

    const map = new CmapSubtableFormat6(buf).getUnicodeToGlyphIndexMap()
    expect([...map]).toEqual([[0x41, 10], [0x42, 11], [0x43, 12]])
  })
})

describe('CffDict defaults', () => {
  it('returns declared defaults (not undefined / throw) when an operator is absent', () => {
    const top = new CffTopDict(new ArrayBuffer(0))
    expect(top.underlinePosition).toBe(-100)
    expect(top.underlineThickness).toBe(50)
    expect(top.charstringType).toBe(2)
    expect(top.italicAngle).toBe(0) // no explicit default -> CFF default 0
    expect(top.fontMatrix).toEqual([0.001, 0, 0, 0.001, 0, 0])
    expect(() => top.version).not.toThrow() // absent string must not crash
    expect(top.version).toBeUndefined()

    const priv = new CffPrivateDict(new ArrayBuffer(0))
    expect(priv.defaultWidthX).toBe(0)
    expect(priv.nominalWidthX).toBe(0)
  })
})

describe('vertical metrics & GSUB substitution', () => {
  it('reads vmtx advanceHeight and getAdvanceHeight mirrors it', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    const glyph = sfnt.charToGlyph('永')
    expect(glyph.advanceHeight).toBeGreaterThan(0)
    // at fontSize == unitsPerEm the scale is 1
    expect(sfnt.getAdvanceHeight('永', sfnt.unitsPerEm)).toBeCloseTo(glyph.advanceHeight, 5)
    expect(sfnt.defaultAdvanceHeight).toBe(sfnt.ascender + Math.abs(sfnt.descender))
  })

  it('resolves vert single substitutions from GSUB', async () => {
    const sfnt = await loadSFNT('./test/assets/example.woff')
    const vert = sfnt.gsub!.getSingleSubstitutions('vert')
    expect(vert.size).toBeGreaterThan(0)
    const [from, to] = vert.entries().next().value as [number, number]
    expect(to).not.toBe(from)
    expect(sfnt.getSubstituteGlyphIndex(from, 'vert')).toBe(to)
    // a glyph with no vert variant maps to itself
    expect(sfnt.getSubstituteGlyphIndex(0xFFFE, 'vert')).toBe(0xFFFE)
  })
})
