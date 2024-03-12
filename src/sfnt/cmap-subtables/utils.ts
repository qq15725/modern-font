function encodeDelta(delta: number) {
  return delta > 0x7FFF
    ? delta - 0x10000
    : (delta < -0x7FFF ? delta + 0x10000 : delta)
}

export interface Segment {
  start: number
  startId: number
  end: number
  delta: number
}

export function createSegments(unicodeGlyphIndexMap: Map<number, number>, bound?: number) {
  let prev: Record<string, any> | undefined
  const segments: Segment[] = []
  let segment: Segment = {} as Segment
  unicodeGlyphIndexMap.forEach((glyphIndex, unicode) => {
    if (bound && unicode > bound) return
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
        } as Segment
      } else {
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
