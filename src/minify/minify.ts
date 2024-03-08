import { Ttf, Woff } from '../font'
import { minifySfnt } from './minify-sfnt'

export function minify<T extends (Ttf | Woff)>(source: T, subset: string): T {
  const newSfnt = minifySfnt(source.sfnt, subset)
  if (source instanceof Ttf) {
    return Ttf.from(newSfnt) as T
  } else if (source instanceof Woff) {
    return Woff.from(newSfnt) as T
  }
  throw new Error('Failed to minify, only support ttf、woff source')
}
