import type { SFNT } from '../sfnt'
import { TTF, WOFF } from '../font'
import { toDataView } from '../utils'
import { minifySFNT } from './minifySFNT'

export function minifyFont<T extends (TTF | WOFF | ArrayBuffer)>(source: T, subset: string): T {
  let sfnt: SFNT
  let outputFormat: 'ttf' | 'woff' | 'ttf-buffer' | 'woff-buffer'
  if (source instanceof TTF) {
    sfnt = source.sfnt.clone()
    outputFormat = 'ttf'
  }
  else if (source instanceof WOFF) {
    sfnt = source.sfnt.clone()
    outputFormat = 'woff'
  }
  else {
    const view = toDataView(source)
    if (TTF.is(view)) {
      sfnt = new TTF(view).sfnt.clone()
      outputFormat = 'ttf-buffer'
    }
    else if (WOFF.is(view)) {
      sfnt = new WOFF(view).sfnt.clone()
      outputFormat = 'woff-buffer'
    }
    else {
      throw new Error('Failed to minify, only support ttf、woff source')
    }
  }
  const newSFNT = minifySFNT(sfnt, subset)
  switch (outputFormat) {
    case 'ttf':
      return TTF.from(newSFNT) as T
    case 'woff':
      return WOFF.from(newSFNT) as T
    case 'ttf-buffer':
      return TTF.from(newSFNT).view.buffer as T
    case 'woff-buffer':
    default:
      return WOFF.from(newSFNT).view.buffer as T
  }
}

/**
 * Async counterpart of {@link minifyFont}: decodes WOFF input and encodes WOFF
 * output off the main thread (fflate async (de)compression). The glyph
 * subsetting itself runs synchronously. TrueType I/O has no zlib step, so for
 * TTF in/out this is just {@link minifyFont} wrapped in a promise.
 */
export async function minifyFontAsync<T extends (TTF | WOFF | ArrayBuffer)>(source: T, subset: string): Promise<T> {
  let sfnt: SFNT
  let outputFormat: 'ttf' | 'woff' | 'ttf-buffer' | 'woff-buffer'
  if (source instanceof TTF) {
    sfnt = source.sfnt.clone()
    outputFormat = 'ttf'
  }
  else if (source instanceof WOFF) {
    sfnt = (await source.createSFNTAsync()).clone()
    outputFormat = 'woff'
  }
  else {
    const view = toDataView(source)
    if (TTF.is(view)) {
      sfnt = new TTF(view).sfnt.clone()
      outputFormat = 'ttf-buffer'
    }
    else if (WOFF.is(view)) {
      sfnt = (await new WOFF(view).createSFNTAsync()).clone()
      outputFormat = 'woff-buffer'
    }
    else {
      throw new Error('Failed to minify, only support ttf、woff source')
    }
  }
  const newSFNT = minifySFNT(sfnt, subset)
  switch (outputFormat) {
    case 'ttf':
      return TTF.from(newSFNT) as T
    case 'woff':
      return (await WOFF.fromAsync(newSFNT)) as T
    case 'ttf-buffer':
      return TTF.from(newSFNT).view.buffer as T
    case 'woff-buffer':
    default:
      return (await WOFF.fromAsync(newSFNT)).view.buffer as T
  }
}
