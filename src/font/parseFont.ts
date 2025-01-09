import type { Font } from './Font'
import { parseSFNTFont } from './parseSFNTFont'

export function parseFont<T extends Font = Font>(source: BufferSource): T
export function parseFont<T extends Font = Font>(source: BufferSource, orFail: false): T | undefined
export function parseFont<T extends Font = Font>(source: BufferSource, orFail = true): T | undefined {
  const font = parseSFNTFont(source, false)
  if (font) {
    return font as T
  }
  if (orFail) {
    throw new Error('Failed to parseFont')
  }
  return undefined
}
