import type { SFNTFont } from './SFNTFont'
import { OTF } from './otf'
import { TTF } from './ttf'
import { WOFF } from './woff'

export function parseSFNTFont<T extends SFNTFont = SFNTFont>(source: BufferSource): T
export function parseSFNTFont<T extends SFNTFont = SFNTFont>(source: BufferSource, orFail: false): T | undefined
export function parseSFNTFont<T extends SFNTFont = SFNTFont>(source: BufferSource, orFail = true): T | undefined {
  if (TTF.is(source)) {
    return new TTF(source) as T
  }
  else if (OTF.is(source)) {
    return new OTF(source) as T
  }
  else if (WOFF.is(source)) {
    return new WOFF(source) as T
  }
  if (orFail) {
    throw new Error('Failed to parseFont')
  }
  return undefined
}
