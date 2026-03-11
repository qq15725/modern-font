import type { SFNT } from '../src'
import { EOT, fonts, minifyFont, TTF, WOFF } from '../src'

async function init(): Promise<void> {
  await fonts.load({ family: 'source', src: 'opentype.woff' })

  const font = fonts.get('source')?.getFont()
  let woff: WOFF | undefined
  let ttf: TTF | undefined
  let eot: EOT | undefined
  let sfnt
  if (font instanceof WOFF) {
    woff = font
    sfnt = woff.sfnt
    ttf = TTF.from(sfnt)
    eot = EOT.from(ttf)
  }
  else if (font instanceof TTF) {
    ttf = font
    sfnt = ttf.sfnt
    woff = WOFF.from(sfnt)
    eot = EOT.from(ttf)
  }

  if (sfnt) {
    testGlyph(sfnt)
    testCanvas(sfnt)
  }

  let minifyWoff
  if (woff) {
    minifyWoff = minifyFont(woff, 'minify')
    await fonts.injectFontFace('woff', woff.toBuffer())
    await fonts.injectFontFace('minifyWoff', minifyWoff.toBuffer())
  }
  if (ttf) {
    await fonts.injectFontFace('ttf', ttf.toBuffer())
  }
  if (eot) {
    await fonts.injectFontFace('eot', eot.toBuffer())
  }
  console.warn(woff, ttf, eot, minifyWoff)
}

const fsSelectionMap: Record<number, 'italic' | 'bold'> = {
  0x01: 'italic',
  0x20: 'bold',
}

const macStyleMap: Record<number, 'italic' | 'bold'> = {
  0x01: 'italic',
  0x02: 'bold',
}

function testGlyph(sfnt: SFNT) {
  const content = '你'
  const fontSize = 100
  const { hhea, os2, post, head } = sfnt
  const unitsPerEm = head.unitsPerEm
  const ascender = hhea.ascent
  const descender = hhea.descent
  const rate = unitsPerEm / fontSize
  const advanceWidth = sfnt.getAdvanceWidth(content, fontSize)
  const advanceHeight = (ascender + Math.abs(descender)) / rate
  const baseline = ascender / rate
  const res: Record<string, any> = {}
  res.advanceWidth = advanceWidth
  res.advanceHeight = advanceHeight
  res.underlinePosition = (ascender - post.underlinePosition) / rate
  res.underlineThickness = post.underlineThickness / rate
  res.strikeoutPosition = (ascender - os2.yStrikeoutPosition) / rate
  res.strikeoutSize = os2.yStrikeoutSize / rate
  res.ascender = ascender / rate
  res.descender = descender / rate
  res.typoAscender = os2.sTypoAscender / rate
  res.typoDescender = os2.sTypoDescender / rate
  res.typoLineGap = os2.sTypoLineGap / rate
  res.winAscent = os2.usWinAscent / rate
  res.winDescent = os2.usWinDescent / rate
  console.log(os2)
  res.xHeight = os2.version > 1 ? os2.sxHeight / rate : 0
  res.capHeight = os2.version > 1 ? os2.sCapHeight / rate : 0
  res.baseline = baseline
  res.centerDiviation = advanceHeight / 2 - baseline
  res.fontStyle = fsSelectionMap[os2.fsSelection] ?? macStyleMap[head.macStyle]
  console.log(res)
}

function testCanvas(sfnt: SFNT) {
  const ctx = document.querySelector('canvas')!.getContext('2d')!
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  const commands1 = sfnt.getPathCommands('你', 100, 100)
  const commands2 = sfnt.getPathCommands('好', 200, 200)
  ;[commands1, commands2].forEach((commands) => {
    ctx.beginPath()
    commands?.forEach((cmd) => {
      switch (cmd.type) {
        case 'M':
          ctx.moveTo(cmd.x, cmd.y)
          break
        case 'L':
          ctx.lineTo(cmd.x, cmd.y)
          break
        case 'Q':
          ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y)
          break
        case 'C':
          ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y)
          break
        case 'Z':
          ctx.closePath()
          break
      }
    })
    ctx.stroke()
  })
}

init()
