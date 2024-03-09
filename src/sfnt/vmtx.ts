import { Sfnt } from './sfnt'
import { SfntTable } from './sfnt-table'

declare module './sfnt' {
  interface Sfnt {
    vmtx?: Vmtx
  }
}

export interface VMetric {
  advanceHeight: number
  topSideBearing: number
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6vmtx.html
 */
@Sfnt.table('vmtx')
export class Vmtx extends SfntTable {
  get metrics(): Array<VMetric> {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const numOfLongVerMetrics = this.sfnt.vhea?.numOfLongVerMetrics ?? 0
    this.seek(0)
    let advanceHeight = 0
    return Array.from(new Array(numGlyphs)).map((_, i) => {
      if (i < numOfLongVerMetrics) {
        advanceHeight = this.readUint16()
      }
      return {
        advanceHeight,
        topSideBearing: this.readInt16(),
      }
    })
  }

  set metrics(metrics: Array<VMetric>) {
    this.seek(0)
    metrics.forEach(metric => {
      this.writeUint16(metric.advanceHeight)
      this.writeInt16(metric.topSideBearing)
    })
  }
}
