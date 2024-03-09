import { Sfnt } from './sfnt'
import { SfntTable } from './sfnt-table'

declare module './sfnt' {
  interface Sfnt {
    hmtx: Hmtx
  }
}

export interface HMetric {
  advanceWidth: number
  leftSideBearing: number
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hmtx.html
 */
@Sfnt.table('hmtx')
export class Hmtx extends SfntTable {
  get metrics(): Array<HMetric> {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const numOfLongHorMetrics = this.sfnt.hhea.numOfLongHorMetrics
    let advanceWidth = 0
    this.seek(0)
    return Array.from(new Array(numGlyphs)).map((_, i) => {
      if (i < numOfLongHorMetrics) advanceWidth = this.readUint16()
      return {
        advanceWidth,
        leftSideBearing: this.readUint16(),
      }
    })
  }

  set metrics(metrics: Array<HMetric>) {
    this.seek(0)
    metrics.forEach(metric => {
      this.writeUint16(metric.advanceWidth)
      this.writeInt16(metric.leftSideBearing)
    })
  }
}
