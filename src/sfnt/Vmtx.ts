import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

export interface VMetric {
  advanceHeight: number
  topSideBearing: number
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6vmtx.html
 */
@defineSFNTTable('vmtx')
export class Vmtx extends SFNTTable {
  static from(metrics: VMetric[]): Vmtx {
    const byteLength = metrics.length * 4
    const vmtx = new Vmtx(new ArrayBuffer(byteLength))
    metrics.forEach((metric) => {
      vmtx.view.writeUint16(metric.advanceHeight)
      vmtx.view.writeInt16(metric.topSideBearing)
    })
    return vmtx
  }

  protected _metrics?: VMetric[]
  get metrics(): VMetric[] {
    return this._metrics ??= this.readMetrics()
  }

  readMetrics(): VMetric[] {
    const numGlyphs = this._sfnt.maxp.numGlyphs
    const numOfLongVerMetrics = this._sfnt.vhea?.numOfLongVerMetrics ?? 0
    const reader = this.view
    reader.seek(0)
    let advanceHeight = 0
    return Array.from({ length: numGlyphs }).map((_, i) => {
      if (i < numOfLongVerMetrics) {
        advanceHeight = reader.readUint16()
      }
      return {
        advanceHeight,
        topSideBearing: reader.readUint8(),
      }
    })
  }
}
