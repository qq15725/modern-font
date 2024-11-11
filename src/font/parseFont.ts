import type { Font } from './Font'
import { Otf } from './otf'
import { Ttf } from './ttf'
import { Woff } from './woff'

export function parseFont(source: BufferSource): Font
export function parseFont(source: BufferSource, orFail: false): Font | undefined
export function parseFont(source: BufferSource, orFail = true): Font | undefined {
  if (Ttf.is(source)) {
    return new Ttf(source)
  }
  else if (Otf.is(source)) {
    return new Otf(source)
  }
  else if (Woff.is(source)) {
    return new Woff(source)
  }
  if (orFail) {
    throw new Error('Failed to parseFont')
  }
  return undefined
}
