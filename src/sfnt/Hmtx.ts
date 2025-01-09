import { defineSFNTTable } from './SFNT'
import { SFNTTable } from './SFNTTable'

export interface HMetric {
  advanceWidth: number
  leftSideBearing: number
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hmtx.html
 */
@defineSFNTTable('hmtx')
export class Hmtx extends SFNTTable {
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
    return this._metrics ??= this.readMetrics()
  }

  readMetrics(): HMetric[] {
    const numGlyphs = this._sfnt.maxp.numGlyphs
    const numOfLongHorMetrics = this._sfnt.hhea.numOfLongHorMetrics
    let advanceWidth = 0
    const reader = this.view
    reader.seek(0)
    return Array.from({ length: numGlyphs }).map((_, i) => {
      if (i < numOfLongHorMetrics)
        advanceWidth = reader.readUint16()
      return {
        advanceWidth,
        leftSideBearing: reader.readUint16(),
      }
    })
  }
}
