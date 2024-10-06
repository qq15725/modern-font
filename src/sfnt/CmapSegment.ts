function encodeDelta(delta: number): number {
  return delta > 0x7FFF
    ? delta - 0x10000
    : (delta < -0x7FFF ? delta + 0x10000 : delta)
}

export interface CmapSegment {
  start: number
  startId: number
  end: number
  delta: number
}

export function createCmapSegments(unicodeGlyphIndexMap: Map<number, number>, bound?: number): CmapSegment[] {
  let prev: Record<string, any> | undefined
  const segments: CmapSegment[] = []
  let segment: CmapSegment = {} as CmapSegment
  unicodeGlyphIndexMap.forEach((glyphIndex, unicode) => {
    if (bound && unicode > bound)
      return
    if (!prev
      || unicode !== prev.unicode + 1
      || glyphIndex !== prev.glyphIndex + 1
    ) {
      if (prev) {
        segment.end = prev.unicode
        segments.push(segment)
        segment = {
          start: unicode,
          startId: glyphIndex,
          delta: encodeDelta(glyphIndex - unicode),
        } as CmapSegment
      }
      else {
        segment.start = Number(unicode)
        segment.startId = glyphIndex
        segment.delta = encodeDelta(glyphIndex - unicode)
      }
    }
    prev = { unicode, glyphIndex }
  })
  if (prev) {
    segment.end = prev.unicode
    segments.push(segment)
  }

  return segments
}
