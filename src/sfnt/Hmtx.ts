import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

export interface HMetric {
  advanceWidth: number
  leftSideBearing: number
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hmtx.html
 */
@defineSfntTable('hmtx')
export class Hmtx extends SfntTable {
  static from(metrics: HMetric[]): Hmtx {
    const byteLength = metrics.length * 4
    const hmtx = new Hmtx(new ArrayBuffer(byteLength))
    metrics.forEach((metric) => {
      hmtx.view.writeUint16(metric.advanceWidth)
      hmtx.view.writeUint16(metric.leftSideBearing)
    })
    return hmtx
  }

  protected _metrics?: HMetric[]
  get metrics(): HMetric[] {
    if (!this._metrics)
      this._metrics = this._getMetrics()
    return this._metrics
  }

  protected _getMetrics(): HMetric[] {
    const numGlyphs = this._sfnt.maxp.numGlyphs
    const numOfLongHorMetrics = this._sfnt.hhea.numOfLongHorMetrics
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
