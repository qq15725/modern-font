import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { minifyFont } from '../src'

describe('minify font', () => {
  it('minify woff', async () => {
    const view = await fs.readFile('./test/assets/example.woff')
    const rawValue = view.buffer
    const value = minifyFont(rawValue, 'subset')
    expect(value.byteLength < rawValue.byteLength).toEqual(true)
  })
})
