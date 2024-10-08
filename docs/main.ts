import { Eot, fontLoader, minify, Ttf, Woff } from '../src'

async function init(): Promise<void> {
  await fontLoader.load({ family: 'source', url: '1.woff' })

  const view = new DataView(fontLoader.get('source')!.data)
  let woff: Woff | undefined
  let ttf: Ttf | undefined
  let eot: Eot | undefined
  if (Woff.is(view)) {
    woff = new Woff(view)
    ttf = Ttf.from(woff.getSfnt())
    eot = Eot.from(ttf)
    const path = woff.getSfnt().getPath('好', 100, 100)
    const ctx = document.querySelector('canvas')!.getContext('2d')!
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    path?.strokeTo(ctx)
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
