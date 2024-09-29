import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
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
@defineSfntTable('hmtx')
export class Hmtx extends SfntTable {
  static from(metrics: Array<HMetric>): Hmtx {
    const byteLength = metrics.length * 4
    const hmtx = new Hmtx(new ArrayBuffer(byteLength))
    metrics.forEach((metric) => {
      hmtx.view.writeUint16(metric.advanceWidth)
      hmtx.view.writeUint16(metric.leftSideBearing)
    })
    return hmtx
  }

  getMetrics(): Array<HMetric> {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const numOfLongHorMetrics = this.sfnt.hhea.numOfLongHorMetrics
    let advanceWidth = 0
    this.view.seek(0)
    return Array.from({ length: numGlyphs }).map((_, i) => {
      if (i < numOfLongHorMetrics)
        advanceWidth = this.view.readUint16()
      return {
        advanceWidth,
        leftSideBearing: this.view.readUint16(),
      }
    })
  }
}
