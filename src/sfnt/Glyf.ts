import type { GlyphComponent, GlyphPoint } from './Glyph'
import { assert } from '../utils'
import { Glyph } from './Glyph'
import { GlyphSet } from './GlyphSet'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

declare module './Sfnt' {
  interface Sfnt {
    glyf: Glyf
  }
}

export const componentFlags = {
  ARG_1_AND_2_ARE_WORDS: 0x01,
  ARGS_ARE_XY_VALUES: 0x02,
  ROUND_XY_TO_GRID: 0x04,
  WE_HAVE_A_SCALE: 0x08,
  RESERVED: 0x10,
  MORE_COMPONENTS: 0x20,
  WE_HAVE_AN_X_AND_Y_SCALE: 0x40,
  WE_HAVE_A_TWO_BY_TWO: 0x80,
  WE_HAVE_INSTRUCTIONS: 0x100,
  USE_MY_METRICS: 0x200,
  OVERLAP_COMPOUND: 0x400,
  SCALED_COMPONENT_OFFSET: 0x800,
  UNSCALED_COMPONENT_OFFSET: 0x1000,
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6glyf.html
 */
@defineSfntTable('glyf')
export class Glyf extends SfntTable {
  static from(glyphs: DataView[]): Glyf {
    const byteLength = glyphs.reduce((byteLength, view) => byteLength + view.byteLength, 0)
    const glyf = new Glyf(new ArrayBuffer(byteLength))
    glyphs.forEach((view) => {
      glyf.view.writeBytes(view)
    })
    return glyf
  }

  protected _parseGlyphCoordinate(
    flag: number,
    previousValue: number,
    shortVectorBitMask: number,
    sameBitMask: number,
  ): number {
    let v
    if ((flag & shortVectorBitMask) > 0) {
      v = this.view.readUint8()
      if ((flag & sameBitMask) === 0) {
        v = -v
      }
      v = previousValue + v
    }
    else {
      if ((flag & sameBitMask) > 0) {
        v = previousValue
      }
      else {
        v = previousValue + this.view.readInt16()
      }
    }
    return v
  }

  protected _parseGlyph(glyph: Glyph, offset: number): Glyph {
    this.view.seek(offset)
    const numberOfContours = glyph.numberOfContours = this.view.readInt16()
    glyph.xMin = this.view.readInt16()
    glyph.yMin = this.view.readInt16()
    glyph.xMax = this.view.readInt16()
    glyph.yMax = this.view.readInt16()
    if (numberOfContours > 0) {
      const endPointIndices = glyph.endPointIndices = [] as number[]
      for (let i = 0; i < numberOfContours; i++) {
        endPointIndices.push(this.view.readUint16())
      }

      const instructionLength = glyph.instructionLength = this.view.readUint16()

      assert(instructionLength > 5000, `Bad instructionLength:${instructionLength}`)

      const instructions = glyph.instructions = [] as number[]
      for (let i = 0; i < instructionLength; ++i) {
        instructions.push(this.view.readUint8())
      }

      const offset = this.view.byteOffset
      const numberOfCoordinates = endPointIndices[endPointIndices.length - 1] + 1

      assert(numberOfCoordinates > 20000, `Bad numberOfCoordinates:${offset}`)

      const flags: number[] = []
      let flag
      let i = 0
      while (i < numberOfCoordinates) {
        flag = this.view.readUint8()
        flags.push(flag)
        i++
        if ((flag & 8) && i < numberOfCoordinates) {
          const repeat = this.view.readUint8()
          for (let j = 0; j < repeat; j++) {
            flags.push(flag)
            i++
          }
        }
      }

      assert(flags.length === numberOfCoordinates, 'Bad flags')

      if (endPointIndices.length > 0) {
        const points: GlyphPoint[] = []
        let point: GlyphPoint
        if (numberOfCoordinates > 0) {
          for (let i = 0; i < numberOfCoordinates; i += 1) {
            flag = flags[i]
            point = {} as GlyphPoint
            point.onCurve = !!(flag & 1)
            point.lastPointOfContour = endPointIndices.includes(i)
            points.push(point)
          }

          let px = 0
          for (let i = 0; i < numberOfCoordinates; i += 1) {
            flag = flags[i]
            point = points[i]
            point.x = this._parseGlyphCoordinate(flag, px, 2, 16)
            px = point.x
          }

          let py = 0
          for (let i = 0; i < numberOfCoordinates; i += 1) {
            flag = flags[i]
            point = points[i]
            point.y = this._parseGlyphCoordinate(flag, py, 4, 32)
            py = point.y
          }
        }
        glyph.points = points
      }
      else {
        glyph.points = []
      }
    }
    else if (numberOfContours === 0) {
      glyph.points = []
    }
    else {
      glyph.isComposite = true
      glyph.points = []
      glyph.components = []

      let flags: number
      let moreComponents = true
      while (moreComponents) {
        flags = this.view.readUint16()
        const component: GlyphComponent = {
          glyphIndex: this.view.readUint16(),
          xScale: 1,
          scale01: 0,
          scale10: 0,
          yScale: 1,
          dx: 0,
          dy: 0,
        }

        if ((flags & 1) > 0) {
          if ((flags & 2) > 0) {
            component.dx = this.view.readInt16()
            component.dy = this.view.readInt16()
          }
          else {
            component.matchedPoints = [this.view.readUint16(), this.view.readUint16()]
          }
        }
        else {
          if ((flags & 2) > 0) {
            component.dx = this.view.readInt8()
            component.dy = this.view.readInt8()
          }
          else {
            component.matchedPoints = [this.view.readUint8(), this.view.readUint8()]
          }
        }

        if ((flags & 8) > 0) {
          component.xScale = component.yScale = this.view.readInt16() / 16384
        }
        else if ((flags & 64) > 0) {
          component.xScale = this.view.readInt16() / 16384
          component.yScale = this.view.readInt16() / 16384
        }
        else if ((flags & 128) > 0) {
          component.xScale = this.view.readInt16() / 16384
          component.scale01 = this.view.readInt16() / 16384
          component.scale10 = this.view.readInt16() / 16384
          component.yScale = this.view.readInt16() / 16384
        }

        glyph.components.push(component)
        moreComponents = !!(flags & 32)
      }

      // @ts-expect-error flags
      if (flags & 0x100) {
        glyph.instructionLength = this.view.readUint16()
        glyph.instructions = []
        for (let i = 0; i < glyph.instructionLength; i += 1) {
          glyph.instructions.push(this.view.readUint8())
        }
      }
    }
    return glyph
  }

  getGlyphs(): GlyphSet {
    const loca = this._sfnt.loca.getLocations()
    const glyphs = new GlyphSet(this._sfnt)
    const startOffset = this.view.byteOffset
    for (let i = 0, len = loca.length; i < len; i++) {
      const glyph = new Glyph({ index: i })
      if (loca[i] === loca[i + 1]) {
        glyphs.push(i, glyph)
      }
      else {
        glyphs.push(i, () => this._parseGlyph(glyph, startOffset + loca[i]))
      }
    }
    return glyphs
  }
}
