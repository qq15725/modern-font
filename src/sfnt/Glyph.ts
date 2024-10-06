import type { GlyphSet } from './GlyphSet'
import { Path2D } from '../path'
import { assert } from '../utils'

export interface GlyphPoint {
  x: number
  y: number
  onCurve?: boolean
  lastPointOfContour?: boolean
}

export interface GlyphComponent {
  glyphIndex: number
  xScale: number
  scale01: number
  scale10: number
  yScale: number
  dx: number
  dy: number
  matchedPoints?: number[]
}

export interface GlyphOptions {
  index?: number
  name?: string | null
  unicode?: number
  unicodes?: number[]
  advanceWidth?: number
  leftSideBearing?: number
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  points?: GlyphPoint[]
}

export class Glyph {
  declare index: number
  declare name: string | null
  declare unicode?: number
  declare unicodes: number[]
  declare advanceWidth?: number
  declare leftSideBearing?: number
  declare numberOfContours: number
  declare xMin: number
  declare xMax: number
  declare yMin: number
  declare yMax: number
  declare endPointIndices: number[]
  declare instructionLength: number
  declare instructions: number[]
  declare points: GlyphPoint[]
  declare isComposite: boolean
  declare components: GlyphComponent[]
  declare path: Path2D

  constructor(
    options: GlyphOptions,
  ) {
    const config: GlyphOptions = { ...options }

    this.index = config.index || 0

    if (config.name === '.notdef') {
      config.unicode = undefined
    }
    else if (config.name === '.null') {
      config.unicode = 0
    }

    if (config.unicode === 0 && config.name !== '.null') {
      throw new Error('The unicode value "0" is reserved for the glyph name ".null" and cannot be used by any other glyph.')
    }

    this.name = config.name || null
    this.unicode = config.unicode
    this.unicodes = config.unicodes || (config.unicode !== undefined ? [config.unicode] : [])

    if (config.xMin !== undefined)
      this.xMin = config.xMin
    if (config.yMin !== undefined)
      this.yMin = config.yMin
    if (config.xMax !== undefined)
      this.xMax = config.xMax
    if (config.yMax !== undefined)
      this.yMax = config.yMax
    if (config.advanceWidth !== undefined)
      this.advanceWidth = config.advanceWidth
    if (config.leftSideBearing !== undefined)
      this.leftSideBearing = config.leftSideBearing
    if (config.points !== undefined)
      this.points = config.points
  }

  protected _getContours(points: GlyphPoint[]): GlyphPoint[][] {
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

  protected _getPath(points: GlyphPoint[]): Path2D {
    const p = new Path2D()
    if (!points)
      return p
    const contours = this._getContours(points)
    for (let contourIndex = 0; contourIndex < contours.length; ++contourIndex) {
      const contour = contours[contourIndex]
      let curr = contour[contour.length - 1]
      let next = contour[0]
      if (curr.onCurve) {
        p.moveTo(curr.x, curr.y)
      }
      else {
        if (next.onCurve) {
          p.moveTo(next.x, next.y)
        }
        else {
          p.moveTo(
            (curr.x + next.x) * 0.5,
            (curr.y + next.y) * 0.5,
          )
        }
      }
      for (let i = 0; i < contour.length; ++i) {
        curr = next
        next = contour[(i + 1) % contour.length]
        if (curr.onCurve) {
          p.lineTo(curr.x, curr.y)
        }
        else {
          let next2 = next
          if (!next.onCurve) {
            next2 = {
              x: (curr.x + next.x) * 0.5,
              y: (curr.y + next.y) * 0.5,
            }
          }
          p.quadraticCurveTo(curr.x, curr.y, next2.x, next2.y)
        }
      }
      p.closePath()
    }
    return p
  }

  protected _transformPoints(points: GlyphPoint[], transform: Exclude<GlyphComponent, 'glyphIndex'>): GlyphPoint[] {
    const newPoints = []
    for (let i = 0; i < points.length; i += 1) {
      const pt = points[i]
      const newPt = {
        x: transform.xScale * pt.x + transform.scale10 * pt.y + transform.dx,
        y: transform.scale01 * pt.x + transform.yScale * pt.y + transform.dy,
        onCurve: pt.onCurve,
        lastPointOfContour: pt.lastPointOfContour,
      }
      newPoints.push(newPt)
    }
    return newPoints
  }

  protected _buildPath(glyph: Glyph, glyphs: GlyphSet): Path2D {
    if (glyph.isComposite) {
      for (let j = 0; j < glyph.components.length; j += 1) {
        const component = glyph.components[j]
        const componentGlyph = glyphs.get(component.glyphIndex)
        componentGlyph.getPath()
        if (componentGlyph.points) {
          let transformedPoints
          if (component.matchedPoints === undefined) {
            transformedPoints = this._transformPoints(componentGlyph.points, component)
          }
          else {
            assert(
              (component.matchedPoints[0] > glyph.points.length - 1) || (component.matchedPoints[1] > componentGlyph.points.length - 1),
              `Matched points out of range in ${glyph.name}`,
            )
            const firstPt = glyph.points[component.matchedPoints[0]]
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
          glyph.points = glyph.points.concat(transformedPoints)
        }
      }
    }
    return this._getPath(glyph.points)
  }

  getPath(x = 0, y = 0, fontSize = 72, options: any, font: any): Path2D {
    options = Object.assign({}, font && font.defaultRenderOptions, options)
    let xScale = options.xScale
    let yScale = options.yScale
    const scale = 1 / (font.unitsPerEm || 1000) * fontSize
    const commands = this.path.getPathCommands()
    if (xScale === undefined)
      xScale = scale
    if (yScale === undefined)
      yScale = scale

    const p = new Path2D()
    for (let i = 0; i < commands.length; i += 1) {
      const cmd = commands[i]
      if (cmd.type === 'M') {
        p.moveTo(x + (cmd.x * xScale), y + (-cmd.y * yScale))
      }
      else if (cmd.type === 'L') {
        p.lineTo(x + (cmd.x * xScale), y + (-cmd.y * yScale))
      }
      else if (cmd.type === 'Q') {
        p.quadraticCurveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale), x + (cmd.x * xScale), y + (-cmd.y * yScale))
      }
      else if (cmd.type === 'C') {
        p.bezierCurveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale), x + (cmd.x2 * xScale), y + (-cmd.y2 * yScale), x + (cmd.x * xScale), y + (-cmd.y * yScale))
      }
      else if (cmd.type === 'Z') {
        p.closePath()
      }
    }

    return p
  }
}
