import { Otf } from './otf'
import { Ttf } from './ttf'
import { Woff } from './woff'

export function parse(source: BufferSource): Ttf | Otf | Woff | undefined {
  if (Ttf.is(source)) {
    return new Ttf(source)
  }
  else if (Otf.is(source)) {
    return new Otf(source)
  }
  else if (Woff.is(source)) {
    return new Woff(source)
  }
  return undefined
}
