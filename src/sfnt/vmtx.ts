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
  static from(metrics: VMetric[]): Vmtx {
    const byteLength = metrics.length * 4
    const vmtx = new Vmtx(new ArrayBuffer(byteLength))
    metrics.forEach((metric) => {
      vmtx.writeUint16(metric.advanceHeight)
      vmtx.writeInt16(metric.topSideBearing)
    })
    return vmtx
  }

  getMetrics(): VMetric[] {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const numOfLongVerMetrics = this.sfnt.vhea?.numOfLongVerMetrics ?? 0
    this.seek(0)
    let advanceHeight = 0
    return Array.from({ length: numGlyphs }).map((_, i) => {
      if (i < numOfLongVerMetrics) {
        advanceHeight = this.readUint16()
      }
      return {
        advanceHeight,
        topSideBearing: this.readInt16(),
      }
    })
  }
}
