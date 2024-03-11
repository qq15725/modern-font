import { Ttf, Woff } from '../font'
import { toDataView } from '../utils'
import { minifySfnt } from './minify-sfnt'
import type { Sfnt } from '../sfnt'

export function minify<T extends (Ttf | Woff | BufferSource)>(source: T, subset: string): T {
  let sfnt: Sfnt
  let outputFormat: 'ttf' | 'woff' | 'ttf-buffer' | 'woff-buffer'
  if (source instanceof Ttf) {
    sfnt = source.sfnt
    outputFormat = 'ttf'
  } else if (source instanceof Woff) {
    sfnt = source.sfnt
    outputFormat = 'woff'
  } else {
    const view = toDataView(source)
    if (Ttf.is(view)) {
      sfnt = new Ttf(view).sfnt
      outputFormat = 'ttf-buffer'
    } else if (Woff.is(view)) {
      sfnt = new Woff(view).sfnt
      outputFormat = 'woff-buffer'
    } else {
      throw new Error('Failed to minify, only support ttf、woff source')
    }
  }
  const newSfnt = minifySfnt(sfnt, subset)
  switch (outputFormat) {
    case 'ttf':
      return Ttf.from(newSfnt) as T
    case 'woff':
      return Woff.from(newSfnt) as T
    case 'ttf-buffer':
      return Ttf.from(newSfnt).buffer as T
    case 'woff-buffer':
    default:
      return Woff.from(newSfnt).buffer as T
  }
}
