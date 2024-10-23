import type { Glyf } from './Glyf'
import type { GlyfGlyphSet } from './GlyfGlyphSet'
import type { GlyphComponent, GlyphPathCommand } from './Glyph'
import { assert } from '../utils'
import { Glyph } from './Glyph'

export interface GlyphPoint {
  x: number
  y: number
  onCurve?: boolean
  lastPointOfContour?: boolean
}

export class GlyfGlyph extends Glyph {
  declare numberOfContours: number
  declare xMin: number
  declare xMax: number
  declare yMin: number
  declare yMax: number
  declare endPointIndices: number[]
  declare instructionLength: number
  declare instructions: number[]
  declare points: GlyphPoint[]

  protected _parseContours(points: GlyphPoint[]): GlyphPoint[][] {
    const contours = []
    let currentContour = []
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i]
      currentContour.push(point)
      if (point.lastPointOfContour) {
        contours.push(currentContour)
        currentContour = []
      }
    }
    assert(currentContour.length === 0, 'There are still points left in the current contour.')
    return contours
  }

  protected _transformPoints(points: GlyphPoint[], transform: Omit<GlyphComponent, 'glyphIndex'>): GlyphPoint[] {
    const newPoints = []
    for (let i = 0; i < points.length; i += 1) {
      const pt = points[i]
      const newPt = {
        x: transform.xScale! * pt.x + transform.scale10! * pt.y + transform.dx,
        y: transform.scale01! * pt.x + transform.yScale! * pt.y + transform.dy,
        onCurve: pt.onCurve,
        lastPointOfContour: pt.lastPointOfContour,
      }
      newPoints.push(newPt)
    }
    return newPoints
  }

  protected _parseGlyphCoordinate(
    glyf: Glyf,
    flag: number,
    previousValue: number,
    shortVectorBitMask: number,
    sameBitMask: number,
  ): number {
    let v
    if ((flag & shortVectorBitMask) > 0) {
      v = glyf.view.readUint8()
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
        v = previousValue + glyf.view.readInt16()
      }
    }
    return v
  }

  parse(glyf: Glyf, offset: number, glyphs: GlyfGlyphSet): void {
    glyf.view.seek(offset)
    const numberOfContours = this.numberOfContours = glyf.view.readInt16()
    this.xMin = glyf.view.readInt16()
    this.yMin = glyf.view.readInt16()
    this.xMax = glyf.view.readInt16()
    this.yMax = glyf.view.readInt16()
    if (numberOfContours > 0) {
      const endPointIndices = this.endPointIndices = [] as number[]
      for (let i = 0; i < numberOfContours; i++) {
        endPointIndices.push(glyf.view.readUint16())
      }

      const instructionLength = this.instructionLength = glyf.view.readUint16()

      assert(instructionLength < 5000, `Bad instructionLength:${instructionLength}`)

      const instructions = this.instructions = [] as number[]
      for (let i = 0; i < instructionLength; ++i) {
        instructions.push(glyf.view.readUint8())
      }

      const offset = glyf.view.byteOffset
      const numberOfCoordinates = endPointIndices[endPointIndices.length - 1] + 1

      assert(numberOfCoordinates < 20000, `Bad numberOfCoordinates:${offset}`)

      const flags: number[] = []
      let flag
      let i = 0
      while (i < numberOfCoordinates) {
        flag = glyf.view.readUint8()
        flags.push(flag)
        i++
        if ((flag & 8) && i < numberOfCoordinates) {
          const repeat = glyf.view.readUint8()
          for (let j = 0; j < repeat; j++) {
            flags.push(flag)
            i++
          }
        }
      }

      assert(flags.length === numberOfCoordinates, `Bad flags length: ${flags.length}, numberOfCoordinates: ${numberOfCoordinates}`)

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
            point.x = this._parseGlyphCoordinate(glyf, flag, px, 2, 16)
            px = point.x
          }

          let py = 0
          for (let i = 0; i < numberOfCoordinates; i += 1) {
            flag = flags[i]
            point = points[i]
            point.y = this._parseGlyphCoordinate(glyf, flag, py, 4, 32)
            py = point.y
          }
        }
        this.points = points
      }
      else {
        this.points = []
      }
    }
    else if (numberOfContours === 0) {
      this.points = []
    }
    else {
      this.isComposite = true
      this.points = []
      this.components = []

      let flags: number
      let moreComponents = true
      while (moreComponents) {
        flags = glyf.view.readUint16()
        const component: GlyphComponent = {
          glyphIndex: glyf.view.readUint16(),
          xScale: 1,
          scale01: 0,
          scale10: 0,
          yScale: 1,
          dx: 0,
          dy: 0,
        }

        if ((flags & 1) > 0) {
          if ((flags & 2) > 0) {
            component.dx = glyf.view.readInt16()
            component.dy = glyf.view.readInt16()
          }
          else {
            component.matchedPoints = [glyf.view.readUint16(), glyf.view.readUint16()]
          }
        }
        else {
          if ((flags & 2) > 0) {
            component.dx = glyf.view.readInt8()
            component.dy = glyf.view.readInt8()
          }
          else {
            component.matchedPoints = [glyf.view.readUint8(), glyf.view.readUint8()]
          }
        }

        if ((flags & 8) > 0) {
          component.xScale = component.yScale = glyf.view.readInt16() / 16384
        }
        else if ((flags & 64) > 0) {
          component.xScale = glyf.view.readInt16() / 16384
          component.yScale = glyf.view.readInt16() / 16384
        }
        else if ((flags & 128) > 0) {
          component.xScale = glyf.view.readInt16() / 16384
          component.scale01 = glyf.view.readInt16() / 16384
          component.scale10 = glyf.view.readInt16() / 16384
          component.yScale = glyf.view.readInt16() / 16384
        }

        this.components.push(component)
        moreComponents = !!(flags & 32)
      }

      // @ts-expect-error flags
      if (flags & 0x100) {
        this.instructionLength = glyf.view.readUint16()
        this.instructions = []
        for (let i = 0; i < this.instructionLength; i += 1) {
          this.instructions.push(glyf.view.readUint8())
        }
      }
    }

    if (this.isComposite) {
      for (let j = 0; j < this.components.length; j += 1) {
        const component = this.components[j]
        const componentGlyph = glyphs.get(component.glyphIndex) as GlyfGlyph
        componentGlyph.getPathCommands()
        if (componentGlyph.points) {
          let transformedPoints
          if (component.matchedPoints === undefined) {
            transformedPoints = this._transformPoints(componentGlyph.points, component)
          }
          else {
            assert(
              (component.matchedPoints[0] > this.points.length - 1) || (component.matchedPoints[1] > componentGlyph.points.length - 1),
              `Matched points out of range in ${this.name}`,
            )
            const firstPt = this.points[component.matchedPoints[0]]
            let secondPt = componentGlyph.points[component.matchedPoints[1]]
            const transform: Omit<GlyphComponent, 'glyphIndex'> = {
              xScale: component.xScale,
              scale01: component.scale01,
              scale10: component.scale10,
              yScale: component.yScale,
              dx: 0,
              dy: 0,
            }
            secondPt = this._transformPoints([secondPt], transform)[0]
            transform.dx = firstPt.x - secondPt.x
            transform.dy = firstPt.y - secondPt.y
            transformedPoints = this._transformPoints(componentGlyph.points, transform)
          }
          this.points = this.points.concat(transformedPoints)
        }
      }
    }
    const pathCommands: GlyphPathCommand[] = []
    const contours = this._parseContours(this.points)
    for (let i = 0, len = contours.length; i < len; ++i) {
      const contour = contours[i]
      let curr = contour[contour.length - 1]
      let next = contour[0]
      if (curr.onCurve) {
        pathCommands.push({ type: 'M', x: curr.x, y: curr.y })
      }
      else if (next.onCurve) {
        pathCommands.push({ type: 'M', x: next.x, y: next.y })
      }
      else {
        pathCommands.push({ type: 'M', x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5 })
      }
      for (let j = 0, len = contour.length; j < len; ++j) {
        curr = next
        next = contour[(j + 1) % len]
        if (curr.onCurve) {
          pathCommands.push({ type: 'L', x: curr.x, y: curr.y })
        }
        else {
          let next2 = next
          if (!next.onCurve) {
            next2 = {
              x: (curr.x + next.x) * 0.5,
              y: (curr.y + next.y) * 0.5,
            }
          }
          pathCommands.push({ type: 'Q', x1: curr.x, y1: curr.y, x: next2.x, y: next2.y })
        }
      }
      pathCommands.push({ type: 'Z' })
    }
    this.pathCommands = pathCommands
  }
}
