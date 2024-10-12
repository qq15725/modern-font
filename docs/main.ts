import { Eot, fonts, minify, Ttf, Woff } from '../src'

async function init(): Promise<void> {
  // await fonts.load({ family: 'source', url: 'https://opentype.js.org/fonts/FiraSansMedium.woff' })
  await fonts.load({ family: 'source', url: '1.woff' })

  const view = new DataView(fonts.get('source')!.data)
  let woff: Woff | undefined
  let ttf: Ttf | undefined
  let eot: Eot | undefined
  if (Woff.is(view)) {
    woff = new Woff(view)
    const sfnt = woff.getSfnt()
    ttf = Ttf.from(sfnt)
    eot = Eot.from(ttf)
    const ctx = document.querySelector('canvas')!.getContext('2d')!
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    console.warn(sfnt.getPathCommands('你', 100, 100))
    console.warn(sfnt.getPathCommands('好', 200, 200))
    console.warn(sfnt)
  }
  else if (Ttf.is(view)) {
    ttf = new Ttf(view)
    woff = Woff.from(ttf.getSfnt())
    eot = Eot.from(ttf)
  }
  let minifyWoff
  if (woff) {
    minifyWoff = minify(woff, 'minify')
    fonts.injectFontFace('woff', woff.toArrayBuffer())
    fonts.injectFontFace('minifyWoff', minifyWoff.toArrayBuffer())
  }
  if (ttf) {
    fonts.injectFontFace('ttf', ttf.toArrayBuffer())
  }
  if (eot) {
    fonts.injectFontFace('eot', eot.toArrayBuffer())
  }
  console.warn(woff, ttf, eot, minifyWoff)
}

init()
