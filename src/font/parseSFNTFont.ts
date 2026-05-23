import type { SFNTFont } from './SFNTFont'
import { OTF } from './otf'
import { FontCollection } from './ttc'
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
  else if (FontCollection.is(source)) {
    // A collection holds several fonts; return the first (use parseCollection for all).
    const fonts = new FontCollection(source).fonts
    if (fonts.length) {
      return fonts[0] as T
    }
  }
  if (orFail) {
    throw new Error('Failed to parseFont')
  }
  return undefined
}

/** Parse every font packed in a TrueType/OpenType Collection ('ttcf'). */
export function parseCollection(source: BufferSource): FontCollection {
  return new FontCollection(source)
}
