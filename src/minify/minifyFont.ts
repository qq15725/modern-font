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
      sfnt = new TTF(view).sfnt
      outputFormat = 'ttf-buffer'
    }
    else if (WOFF.is(view)) {
      sfnt = new WOFF(view).sfnt
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
