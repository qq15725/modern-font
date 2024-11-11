import { Eot, fonts, minifyFont, Ttf, Woff } from '../src'

async function init(): Promise<void> {
  await fonts.load({ family: 'source', url: 'opentype.woff' })

  const font = fonts.get('source')?.font
  let woff: Woff | undefined
  let ttf: Ttf | undefined
  let eot: Eot | undefined
  if (font instanceof Woff) {
    woff = font
    const sfnt = woff.sfnt
    ttf = Ttf.from(sfnt)
    eot = Eot.from(ttf)
    const ctx = document.querySelector('canvas')!.getContext('2d')!
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    const commands1 = sfnt.getPathCommands('你', 100, 100)
    const commands2 = sfnt.getPathCommands('好', 200, 200)
    console.warn(sfnt.charToGlyph('啊'))
    console.warn(commands1)
    console.warn(commands2)
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
    console.warn(sfnt)
  }
  else if (font instanceof Ttf) {
    ttf = font
    woff = Woff.from(ttf.sfnt)
    eot = Eot.from(ttf)
  }
  let minifyWoff
  if (woff) {
    minifyWoff = minifyFont(woff, 'minify')
    fonts.injectFontFace('woff', woff.toBuffer())
    fonts.injectFontFace('minifyWoff', minifyWoff.toBuffer())
  }
  if (ttf) {
    fonts.injectFontFace('ttf', ttf.toBuffer())
  }
  if (eot) {
    fonts.injectFontFace('eot', eot.toBuffer())
  }
  console.warn(woff, ttf, eot, minifyWoff)
}

init()
