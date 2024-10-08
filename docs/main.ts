import { Eot, fontLoader, minify, Ttf, Woff } from '../src'

async function init(): Promise<void> {
  // await fontLoader.load({ family: 'source', url: 'https://opentype.js.org/fonts/FiraSansMedium.woff' })
  await fontLoader.load({ family: 'source', url: '1.woff' })

  const view = new DataView(fontLoader.get('source')!.data)
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
    sfnt.getPath('你', 100, 100)?.strokeTo(ctx)
    sfnt.getPath('好', 200, 200)?.strokeTo(ctx)
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
    fontLoader.injectFontFace('woff', woff.toArrayBuffer())
    fontLoader.injectFontFace('minifyWoff', minifyWoff.toArrayBuffer())
  }
  if (ttf) {
    fontLoader.injectFontFace('ttf', ttf.toArrayBuffer())
  }
  if (eot) {
    fontLoader.injectFontFace('eot', eot.toArrayBuffer())
  }
  console.warn(woff, ttf, eot, minifyWoff)
}

init()
