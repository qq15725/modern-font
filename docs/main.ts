import { Eot, minify, Ttf, Woff } from '../src'

async function init(): Promise<void> {
  const buffer = await fetch('1.woff').then(rep => rep.arrayBuffer())
  const view = new DataView(buffer)
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
    path.strokeTo(ctx)
  }
  else if (Ttf.is(view)) {
    ttf = new Ttf(view)
    woff = Woff.from(ttf.getSfnt())
    eot = Eot.from(ttf)
  }
  let minifyWoff
  if (woff) {
    minifyWoff = minify(woff, 'minify')
    document.fonts.add(woff.toFontFace('woff'))
    document.fonts.add(minifyWoff.toFontFace('minifyWoff'))
  }
  if (ttf) {
    document.fonts.add(ttf.toFontFace('ttf'))
  }
  if (eot) {
    document.fonts.add(eot.toFontFace('eot'))
  }
  console.warn(woff, ttf, eot, minifyWoff)
}

init()
