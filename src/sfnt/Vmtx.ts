import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
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
@defineSfntTable('vmtx')
export class Vmtx extends SfntTable {
  static from(metrics: VMetric[]): Vmtx {
    const byteLength = metrics.length * 4
    const vmtx = new Vmtx(new ArrayBuffer(byteLength))
    metrics.forEach((metric) => {
      vmtx.view.writeUint16(metric.advanceHeight)
      vmtx.view.writeInt16(metric.topSideBearing)
    })
    return vmtx
  }

  getMetrics(): VMetric[] {
    const numGlyphs = this.sfnt.maxp.numGlyphs
    const numOfLongVerMetrics = this.sfnt.vhea?.numOfLongVerMetrics ?? 0
    this.view.seek(0)
    let advanceHeight = 0
    return Array.from({ length: numGlyphs }).map((_, i) => {
      if (i < numOfLongVerMetrics) {
        advanceHeight = this.view.readUint16()
      }
      return {
        advanceHeight,
        topSideBearing: this.view.readUint8(),
      }
    })
  }
}
