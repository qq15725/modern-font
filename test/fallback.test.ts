import fs from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Fonts } from '../src'

async function readBuffer(path: string): Promise<ArrayBuffer> {
  const v = await fs.readFile(path)
  return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer
}

describe('Fonts.loadFallbackFont — auto fallback', () => {
  afterEach(() => {
    delete (globalThis as any).queryLocalFonts
  })

  it('uses the embedded tofu font when no source and no Local Font Access', async () => {
    const fonts = new Fonts()
    let emitted: unknown
    fonts.on('load', (f) => {
      emitted = f
    })
    await fonts.loadFallbackFont() // Node: no queryLocalFonts → embedded
    const fb = fonts.fallbackFont
    expect(fb?.src).toBe('modern-font:embedded-fallback')
    expect(emitted).toBe(fb) // 'load' fired so the render layer can re-measure
    const sfnt = fb!.getSFNT()!
    expect(sfnt.head.unitsPerEm).toBe(1000)
    // every character maps to .notdef (0) and nothing throws
    expect(() => sfnt.textToGlyphIndexes('Hi 世界!')).not.toThrow()
    expect(sfnt.textToGlyphIndexes('Hi 世界!').every(i => i === 0)).toBe(true)
    expect(sfnt.getAdvanceWidth('A', 100)).toBeGreaterThan(0)
  })

  it('prefers a real system font via Local Font Access when available', async () => {
    const raw = await readBuffer('./test/assets/example.woff') // stand-in system font
    const queryLocalFonts = vi.fn().mockResolvedValue([
      { family: 'Comic UI', blob: async () => ({ arrayBuffer: async () => raw }) },
      { family: 'Arial', blob: async () => ({ arrayBuffer: async () => raw }) },
    ])
    ;(globalThis as any).queryLocalFonts = queryLocalFonts
    const fonts = new Fonts()
    await fonts.loadFallbackFont()
    expect(queryLocalFonts).toHaveBeenCalledTimes(1)
    const fb = fonts.fallbackFont!
    expect(fb.src).toBe('local-font:Arial') // picks the preferred family, not just the first
    expect(fb.getSFNT()).toBeTruthy()
  })

  it('falls back to the embedded font when Local Font Access is denied', async () => {
    ;(globalThis as any).queryLocalFonts = vi.fn().mockRejectedValue(new Error('permission denied'))
    const fonts = new Fonts()
    await fonts.loadFallbackFont()
    expect(fonts.fallbackFont?.src).toBe('modern-font:embedded-fallback')
  })

  it('falls back to the embedded font when Local Font Access returns nothing', async () => {
    ;(globalThis as any).queryLocalFonts = vi.fn().mockResolvedValue([])
    const fonts = new Fonts()
    await fonts.loadFallbackFont()
    expect(fonts.fallbackFont?.src).toBe('modern-font:embedded-fallback')
  })
})
