import type { Cff } from './Cff'
import type { CffGlyphSet } from './CffGlyphSet'
import type { GlyphPathCommand } from './Glyph'
import { cffStandardEncoding } from './CffEncoding'
import { Glyph } from './Glyph'

export class CffGlyph extends Glyph {
  parse(cff: Cff, code: number[], glyphs: CffGlyphSet): void {
    // eslint-disable-next-line ts/no-this-alias
    const self = this
    const { nominalWidthX, defaultWidthX, gsubrsBias, subrsBias } = cff
    const paintType = cff.topDict.paintType
    const index = this.index

    let c1x: number
    let c1y: number
    let c2x: number
    let c2y: number
    const pathCommands: GlyphPathCommand[] = []
    const stack: number[] = []
    let nStems = 0
    let haveWidth = false
    let open = false
    let width = defaultWidthX
    let x = 0
    let y = 0

    function lineTo(x: number, y: number): void {
      pathCommands.push({ type: 'L', x, y })
    }

    function curveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
      pathCommands.push({ type: 'C', x1: c1x, y1: c1y, x2: c2x, y2: c2y, x, y })
    }

    function moveTo(x: number, y: number): void {
      if (open && paintType !== 2) {
        closePath()
      }
      open = true
      pathCommands.push({ type: 'M', x, y })
    }

    function closePath(): void {
      pathCommands.push({ type: 'Z' })
    }

    function extend(commands: GlyphPathCommand[]): void {
      pathCommands.push(...commands)
    }

    function parseStems(): void {
      // The number of stem operators on the stack is always even.
      // If the value is uneven, that means a width is specified.
      const hasWidthArg = stack.length % 2 !== 0
      if (hasWidthArg && !haveWidth) {
        width = stack.shift()! + nominalWidthX
      }
      nStems += stack.length >> 1
      stack.length = 0
      haveWidth = true
    }

    function parse(code: number[]): void {
      let b1
      let b2
      let b3
      let b4
      let codeIndex
      let subrCode
      let jpx
      let jpy
      let c3x
      let c3y
      let c4x
      let c4y

      let i = 0
      while (i < code.length) {
        let v = code[i++]
        switch (v) {
          case 1: // hstem
            parseStems()
            break
          case 3: // vstem
            parseStems()
            break
          case 4: // vmoveto
            if (stack.length > 1 && !haveWidth) {
              width = stack.shift()! + nominalWidthX
              haveWidth = true
            }
            y += stack.pop()!
            moveTo(x, y)
            break
          case 5: // rlineto
            while (stack.length > 0) {
              x += stack.shift()!
              y += stack.shift()!
              lineTo(x, y)
            }
            break
          case 6: // hlineto
            while (stack.length > 0) {
              x += stack.shift()!
              lineTo(x, y)
              if (stack.length === 0) {
                break
              }
              y += stack.shift()!
              lineTo(x, y)
            }
            break
          case 7: // vlineto
            while (stack.length > 0) {
              y += stack.shift()!
              lineTo(x, y)
              if (stack.length === 0) {
                break
              }
              x += stack.shift()!
              lineTo(x, y)
            }
            break
          case 8: // rrcurveto
            while (stack.length > 0) {
              c1x = x + stack.shift()!
              c1y = y + stack.shift()!
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              x = c2x + stack.shift()!
              y = c2y + stack.shift()!
              curveTo(c1x, c1y, c2x, c2y, x, y)
            }
            break
          case 10: // callsubr
            codeIndex = stack.pop()! + subrsBias
            subrCode = cff.subrs![codeIndex]
            if (subrCode) {
              parse(subrCode)
            }
            break
          case 11: // return
            return
          case 12: // flex operators
            v = code[i]
            i += 1
            switch (v) {
              case 35: // flex
                // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd flex (12 35) |-
                c1x = x + stack.shift()! // dx1
                c1y = y + stack.shift()! // dy1
                c2x = c1x + stack.shift()! // dx2
                c2y = c1y + stack.shift()! // dy2
                jpx = c2x + stack.shift()! // dx3
                jpy = c2y + stack.shift()! // dy3
                c3x = jpx + stack.shift()! // dx4
                c3y = jpy + stack.shift()! // dy4
                c4x = c3x + stack.shift()! // dx5
                c4y = c3y + stack.shift()! // dy5
                x = c4x + stack.shift()! // dx6
                y = c4y + stack.shift()! // dy6
                stack.shift()! // flex depth
                curveTo(c1x, c1y, c2x, c2y, jpx, jpy)
                curveTo(c3x, c3y, c4x, c4y, x, y)
                break
              case 34: // hflex
                // |- dx1 dx2 dy2 dx3 dx4 dx5 dx6 hflex (12 34) |-
                c1x = x + stack.shift()! // dx1
                c1y = y // dy1
                c2x = c1x + stack.shift()! // dx2
                c2y = c1y + stack.shift()! // dy2
                jpx = c2x + stack.shift()! // dx3
                jpy = c2y // dy3
                c3x = jpx + stack.shift()! // dx4
                c3y = c2y // dy4
                c4x = c3x + stack.shift()! // dx5
                c4y = y // dy5
                x = c4x + stack.shift()! // dx6
                curveTo(c1x, c1y, c2x, c2y, jpx, jpy)
                curveTo(c3x, c3y, c4x, c4y, x, y)
                break
              case 36: // hflex1
                // |- dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6 hflex1 (12 36) |-
                c1x = x + stack.shift()! // dx1
                c1y = y + stack.shift()! // dy1
                c2x = c1x + stack.shift()! // dx2
                c2y = c1y + stack.shift()! // dy2
                jpx = c2x + stack.shift()! // dx3
                jpy = c2y // dy3
                c3x = jpx + stack.shift()! // dx4
                c3y = c2y // dy4
                c4x = c3x + stack.shift()! // dx5
                c4y = c3y + stack.shift()! // dy5
                x = c4x + stack.shift()! // dx6
                curveTo(c1x, c1y, c2x, c2y, jpx, jpy)
                curveTo(c3x, c3y, c4x, c4y, x, y)
                break
              case 37: // flex1
                // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 d6 flex1 (12 37) |-
                c1x = x + stack.shift()! // dx1
                c1y = y + stack.shift()! // dy1
                c2x = c1x + stack.shift()! // dx2
                c2y = c1y + stack.shift()! // dy2
                jpx = c2x + stack.shift()! // dx3
                jpy = c2y + stack.shift()! // dy3
                c3x = jpx + stack.shift()! // dx4
                c3y = jpy + stack.shift()! // dy4
                c4x = c3x + stack.shift()! // dx5
                c4y = c3y + stack.shift()! // dy5
                if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
                  x = c4x + stack.shift()!
                }
                else {
                  y = c4y + stack.shift()!
                }
                curveTo(c1x, c1y, c2x, c2y, jpx, jpy)
                curveTo(c3x, c3y, c4x, c4y, x, y)
                break
              default:
                console.warn(`Glyph ${index}: unknown operator ${1200 + v}`)
                stack.length = 0
            }
            break
          case 14: // endchar
            if (stack.length >= 4) {
              // Type 2 Charstring Format Appendix C
              // treat like Type 1 seac command (standard encoding accented character)
              const acharName = cffStandardEncoding[stack.pop()!]
              const bcharName = cffStandardEncoding[stack.pop()!]
              const ady = stack.pop()!
              const adx = stack.pop()!
              // const asb = stack.pop(); // ignored for Type 2
              if (acharName && bcharName) {
                self.isComposite = true
                self.components = []
                const acharGlyphIndex = cff.charset.indexOf(acharName)
                const bcharGlyphIndex = cff.charset.indexOf(bcharName)
                self.components.push({
                  glyphIndex: bcharGlyphIndex,
                  dx: 0,
                  dy: 0,
                })
                self.components.push({
                  glyphIndex: acharGlyphIndex,
                  dx: adx,
                  dy: ady,
                })
                extend(glyphs.get(bcharGlyphIndex)!.pathCommands)
                const shiftedCommands = JSON.parse(JSON.stringify(glyphs.get(acharGlyphIndex)!.pathCommands)) // make a deep clone
                for (let i = 0; i < shiftedCommands.length; i += 1) {
                  const cmd = shiftedCommands[i]
                  if (cmd.type !== 'Z') {
                    cmd.x += adx
                    cmd.y += ady
                  }
                  if (cmd.type === 'Q' || cmd.type === 'C') {
                    cmd.x1 += adx
                    cmd.y1 += ady
                  }
                  if (cmd.type === 'C') {
                    cmd.x2 += adx
                    cmd.y2 += ady
                  }
                }
                extend(shiftedCommands)
              }
            }
            else if (stack.length > 0 && !haveWidth) {
              width = stack.shift()! + nominalWidthX
              haveWidth = true
            }
            if (open && paintType !== 2) {
              closePath()
              open = false
            }
            break
          case 18: // hstemhm
            parseStems()
            break
          case 19: // hintmask
          case 20: // cntrmask
            parseStems()
            i += (nStems + 7) >> 3
            break
          case 21: // rmoveto
            if (stack.length > 2 && !haveWidth) {
              width = stack.shift()! + nominalWidthX
              haveWidth = true
            }
            y += stack.pop()!
            x += stack.pop()!
            moveTo(x, y)
            break
          case 22: // hmoveto
            if (stack.length > 1 && !haveWidth) {
              width = stack.shift()! + nominalWidthX
              haveWidth = true
            }
            x += stack.pop()!
            moveTo(x, y)
            break
          case 23: // vstemhm
            parseStems()
            break
          case 24: // rcurveline
            while (stack.length > 2) {
              c1x = x + stack.shift()!
              c1y = y + stack.shift()!
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              x = c2x + stack.shift()!
              y = c2y + stack.shift()!
              curveTo(c1x, c1y, c2x, c2y, x, y)
            }
            x += stack.shift()!
            y += stack.shift()!
            lineTo(x, y)
            break
          case 25: // rlinecurve
            while (stack.length > 6) {
              x += stack.shift()!
              y += stack.shift()!
              lineTo(x, y)
            }
            c1x = x + stack.shift()!
            c1y = y + stack.shift()!
            c2x = c1x + stack.shift()!
            c2y = c1y + stack.shift()!
            x = c2x + stack.shift()!
            y = c2y + stack.shift()!
            curveTo(c1x, c1y, c2x, c2y, x, y)
            break
          case 26: // vvcurveto
            if (stack.length % 2) {
              x += stack.shift()!
            }
            while (stack.length > 0) {
              c1x = x
              c1y = y + stack.shift()!
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              x = c2x
              y = c2y + stack.shift()!
              curveTo(c1x, c1y, c2x, c2y, x, y)
            }
            break
          case 27: // hhcurveto
            if (stack.length % 2) {
              y += stack.shift()!
            }
            while (stack.length > 0) {
              c1x = x + stack.shift()!
              c1y = y
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              x = c2x + stack.shift()!
              y = c2y
              curveTo(c1x, c1y, c2x, c2y, x, y)
            }
            break
          case 28: // shortint
            b1 = code[i]
            b2 = code[i + 1]
            stack.push(((b1 << 24) | (b2 << 16)) >> 16)
            i += 2
            break
          case 29: // callgsubr
            codeIndex = stack.pop()! + gsubrsBias
            subrCode = cff.gsubrs[codeIndex]
            if (subrCode) {
              parse(subrCode)
            }
            break
          case 30: // vhcurveto
            while (stack.length > 0) {
              c1x = x
              c1y = y + stack.shift()!
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              x = c2x + stack.shift()!
              y = c2y + (stack.length === 1 ? stack.shift()! : 0)
              curveTo(c1x, c1y, c2x, c2y, x, y)
              if (stack.length === 0) {
                break
              }
              c1x = x + stack.shift()!
              c1y = y
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              y = c2y + stack.shift()!
              x = c2x + (stack.length === 1 ? stack.shift()! : 0)
              curveTo(c1x, c1y, c2x, c2y, x, y)
            }
            break
          case 31: // hvcurveto
            while (stack.length > 0) {
              c1x = x + stack.shift()!
              c1y = y
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              y = c2y + stack.shift()!
              x = c2x + (stack.length === 1 ? stack.shift()! : 0)
              curveTo(c1x, c1y, c2x, c2y, x, y)
              if (stack.length === 0) {
                break
              }
              c1x = x
              c1y = y + stack.shift()!
              c2x = c1x + stack.shift()!
              c2y = c1y + stack.shift()!
              x = c2x + stack.shift()!
              y = c2y + (stack.length === 1 ? stack.shift()! : 0)
              curveTo(c1x, c1y, c2x, c2y, x, y)
            }
            break
          default:
            if (v < 32) {
              console.warn(`Glyph ${index}: unknown operator ${v}`)
            }
            else if (v < 247) {
              stack.push(v - 139)
            }
            else if (v < 251) {
              b1 = code[i]
              i += 1
              stack.push((v - 247) * 256 + b1 + 108)
            }
            else if (v < 255) {
              b1 = code[i]
              i += 1
              stack.push(-(v - 251) * 256 - b1 - 108)
            }
            else {
              b1 = code[i]
              b2 = code[i + 1]
              b3 = code[i + 2]
              b4 = code[i + 3]
              i += 4
              stack.push(((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) / 65536)
            }
        }
      }
    }

    parse(code)

    this.pathCommands = pathCommands

    if (haveWidth) {
      this.advanceWidth = width
    }
  }
}
