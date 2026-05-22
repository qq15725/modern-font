import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { minifyFont, minifyFontAsync, parseFont, WOFF } from '../src'

async function readBuffer(path: string): Promise<ArrayBuffer> {
  const v = await fs.readFile(path)
  return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer
}

describe('async API', () => {
  it('createSFNTAsync decodes identically to the lazy sync path', async () => {
    const woff = parseFont(await readBuffer('./test/assets/example.woff')) as WOFF
    const sync = woff.sfnt
    const asyncSfnt = await woff.createSFNTAsync()
    expect(asyncSfnt.numGlyphs).toBe(sync.numGlyphs)
    expect(asyncSfnt.charToGlyph('永').pathCommands).toEqual(sync.charToGlyph('永').pathCommands)
  })

  it('WOFF.fromAsync produces a valid, re-parseable WOFF', async () => {
    const sfnt = (parseFont(await readBuffer('./test/assets/example.woff')) as WOFF).sfnt
    const buf = (await WOFF.fromAsync(sfnt)).toBuffer()
    expect(WOFF.is(buf)).toBe(true)
    expect((parseFont(buf) as WOFF).sfnt.numGlyphs).toBe(sfnt.numGlyphs)
  })

  it('minifyFontAsync matches minifyFont byte-for-byte', async () => {
    const raw = await readBuffer('./test/assets/example.woff')
    const subset = '永你好世界'
    const sync = minifyFont(raw, subset)
    const asyncOut = await minifyFontAsync(raw, subset)
    expect(WOFF.is(asyncOut)).toBe(true)
    expect(new Uint8Array(asyncOut)).toEqual(new Uint8Array(sync))
    const sfnt = (parseFont(asyncOut) as WOFF).sfnt
    for (const ch of subset) expect(sfnt.charToGlyphIndex(ch)).toBeGreaterThan(0)
  })
})

describe('lazy decode', () => {
  it('does not corrupt the source when minifying (clone is a deep copy)', async () => {
    const raw = await readBuffer('./test/assets/example.woff')
    const woff = parseFont(raw) as WOFF
    const before = woff.sfnt.charToGlyph('永').pathCommands
    minifyFont(woff, '永你好') // mutates a clone, not the source
    const after = woff.sfnt.charToGlyph('永').pathCommands
    expect(after).toEqual(before)
  })
})
