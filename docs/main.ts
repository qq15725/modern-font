import { Eot, fonts, minify, Ttf, Woff } from '../src'

async function init(): Promise<void> {
  // await fonts.load({ family: 'source', url: 'https://opentype.js.org/fonts/FiraSansMedium.woff' })
  await fonts.load({ family: 'source', url: '1.woff' })

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
    console.warn(sfnt.getPathCommands('你', 100, 100))
    console.warn(sfnt.getPathCommands('好', 200, 200))
    console.warn(sfnt)
  }
  else if (font instanceof Ttf) {
    ttf = font
    woff = Woff.from(ttf.sfnt)
    eot = Eot.from(ttf)
  }
  let minifyWoff
  if (woff) {
    minifyWoff = minify(woff, 'minify')
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
