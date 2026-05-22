import { describe, expect, it } from 'vitest'
import { getUTF8String } from '../src/utils/string'

describe('getUTF8String', () => {
  it('decodes multi-byte UTF-8 sequences (not byte-by-byte)', () => {
    expect(getUTF8String([0x48, 0x69])).toBe('Hi') // ASCII
    expect(getUTF8String([0xC3, 0xA9])).toBe('é') // 2-byte
    expect(getUTF8String([0xE4, 0xB8, 0xAD])).toBe('中') // 3-byte
    expect(getUTF8String([0xF0, 0x9F, 0x98, 0x80])).toBe('😀') // 4-byte
  })
})
