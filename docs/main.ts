import type { SFNT } from '../src'
import { EOT, fonts, minifyFont, TTF, WOFF } from '../src'

const app = document.querySelector<HTMLDivElement>('#app')!

function section(title: string, body: Node): void {
  const el = document.createElement('section')
  const h = document.createElement('h2')
  h.textContent = title
  el.append(h, body)
  app.append(el)
}

function table(rows: [string, unknown][]): HTMLTableElement {
  const t = document.createElement('table')
  for (const [k, v] of rows) {
    const tr = document.createElement('tr')
    const value = typeof v === 'number' ? Math.round(v * 100) / 100 : v
    tr.innerHTML = `<td>${k}</td><td>${value}</td>`
    t.append(tr)
  }
  return t
}

// Render text as an SVG path via the new getPathData() API.
function glyphSvg(sfnt: SFNT, text: string, fontSize = 80): SVGSVGElement {
  const scale = fontSize / sfnt.unitsPerEm
  const ascent = sfnt.ascender * scale
  const width = Math.ceil(sfnt.getAdvanceWidth(text, fontSize)) + 20
  const height = Math.ceil((sfnt.ascender - sfnt.descender) * scale) + 20
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', sfnt.getPathData(text, 10, ascent + 10, fontSize))
  path.setAttribute('fill', '#222')
  svg.append(path)
  return svg
}

function glyphMetrics(sfnt: SFNT, content: string, fontSize: number): [string, unknown][] {
  const { hhea, os2, post, head } = sfnt
  const rate = head.unitsPerEm / fontSize
  const ascender = hhea.ascent
  return [
    ['advanceWidth', sfnt.getAdvanceWidth(content, fontSize)],
    ['advanceHeight', sfnt.getAdvanceHeight(content, fontSize)],
    ['ascender', ascender / rate],
    ['descender', hhea.descent / rate],
    ['baseline', ascender / rate],
    ['underlinePosition', (ascender - post.underlinePosition) / rate],
    ['strikeoutPosition', (ascender - os2.yStrikeoutPosition) / rate],
    ['capHeight', os2.version > 1 ? os2.sCapHeight / rate : 0],
    ['xHeight', os2.version > 1 ? os2.sxHeight / rate : 0],
  ]
}

const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`
const pct = (r: number): string => (r < 0.01 ? '<1%' : `${Math.round(r * 100)}%`)

async function init(): Promise<void> {
  await fonts.load({ family: 'source', src: 'opentype.woff' })
  const font = fonts.get('source')?.getFont()
  if (!(font instanceof WOFF) && !(font instanceof TTF)) {
    app.textContent = 'failed to load font'
    return
  }
  const sfnt = font.sfnt
  app.textContent = ''

  section('Source font', table([
    ['family', sfnt.names.fontFamily],
    ['format', font.format],
    ['numGlyphs', sfnt.numGlyphs],
    ['unitsPerEm', sfnt.unitsPerEm],
  ]))

  section('getPathData() → SVG', glyphSvg(sfnt, '你好世界 Ag'))

  section('Glyph metrics (你, 100px)', table(glyphMetrics(sfnt, '你', 100)))

  section('Advance & kerning', table([
    ['getAdvanceWidth("你好", 100)', sfnt.getAdvanceWidth('你好', 100)],
    ['getAdvanceHeight("你", 100)', sfnt.getAdvanceHeight('你', 100)],
    ['getKerningValue(4, 16)', sfnt.getKerningValue(4, 16)],
  ]))

  const ttf = TTF.from(sfnt)
  const woff = font instanceof WOFF ? font : WOFF.from(sfnt)
  const eot = EOT.from(ttf)
  const minified = minifyFont(woff, '你好世界')
  const woffSize = woff.toBuffer().byteLength
  const minSize = minified.toBuffer().byteLength
  section('Format conversion & minify', table([
    ['woff', kb(woffSize)],
    ['ttf', kb(ttf.toBuffer().byteLength)],
    ['eot', kb(eot.toBuffer().byteLength)],
    ['minify("你好世界")', `${kb(minSize)} (${pct(minSize / woffSize)})`],
  ]))

  await fonts.injectFontFace('woff', woff.toBuffer())
  await fonts.injectFontFace('ttf', ttf.toBuffer())
  await fonts.injectFontFace('eot', eot.toBuffer())
  await fonts.injectFontFace('minifyWoff', minified.toBuffer())
}

init()
