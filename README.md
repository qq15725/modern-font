<h1 align="center">modern-font</h1>

<p align="center">
  <a href="https://unpkg.com/modern-font">
    <img src="https://img.shields.io/bundlephobia/minzip/modern-font" alt="Minzip">
  </a>
  <a href="https://www.npmjs.com/package/modern-font">
    <img src="https://img.shields.io/npm/v/modern-font.svg" alt="Version">
  </a>
  <a href="https://www.npmjs.com/package/modern-font">
    <img src="https://img.shields.io/npm/dm/modern-font" alt="Downloads">
  </a>
  <a href="https://github.com/qq15725/modern-font/issues">
    <img src="https://img.shields.io/github/issues/qq15725/modern-font" alt="Issues">
  </a>
  <a href="https://github.com/qq15725/modern-font/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/modern-font.svg" alt="License">
  </a>
</p>

## Features

- Encode, Decode

- Get glyph path commands

- Format conversion

- Minify

- TypeScript

## 📦 Install

```shell
npm i modern-font
```

## 🦄 Usage

```ts
import { Eot, minifyFont, Ttf, Woff } from 'modern-font'

fetch('font.woff')
  .then(rep => rep.arrayBuffer())
  .then((buffer) => {
    let woff, ttf, eot
    if (Woff.is(buffer)) {
      woff = new Woff(buffer)
      ttf = Ttf.from(woff.sfnt)
      eot = Eot.from(ttf)
    }
    else if (Ttf.is(buffer)) {
      ttf = new Ttf(buffer)
      woff = Woff.from(ttf.sfnt)
      eot = Eot.from(ttf)
    }
    const minifyWoff = minifyFont(woff, 'minify')
    document.fonts.add(woff.toFontFace('woff'))
    document.fonts.add(ttf.toFontFace('ttf'))
    document.fonts.add(eot.toFontFace('eot'))
    document.fonts.add(minifyWoff.toFontFace('minifyWoff'))
    console.log(woff, ttf, eot, minifyWoff)
  })
```

## 🚀 WOFF to TTF

```ts
import { Ttf, Woff } from 'modern-font'

fetch('font.woff')
  .then(rep => rep.arrayBuffer())
  .then((buffer) => {
    const ttf = Ttf.from(new Woff(buffer).sfnt)

    // ttf file
    window.open(URL.createObjectURL(ttf.toBlob()))
  })
```

## 🚀 TTF to WOFF

```ts
import { Ttf, Woff } from 'modern-font'

fetch('font.ttf')
  .then(rep => rep.arrayBuffer())
  .then((buffer) => {
    const woff = Woff.from(new Ttf(buffer).sfnt)

    // woff file
    window.open(URL.createObjectURL(woff.toBlob()))
  })
```

## 🚀 TTF to EOT

```ts
import { Eot, Ttf } from 'modern-font'

fetch('font.ttf')
  .then(rep => rep.arrayBuffer())
  .then((buffer) => {
    const eot = Eot.from(new Ttf(buffer))

    // eot file
    window.open(URL.createObjectURL(eot.toBlob()))
  })
```

## 🚀 Minify

```ts
import { minifyFont } from 'modern-font'

fetch('font.woff')
  .then(rep => rep.arrayBuffer())
  .then((rawBuffer) => {
    const buffer = minifyFont(rawBuffer, 'A set of text cropped from a font file')

    console.log(
      `raw size: ${rawBuffer.byteLength / 1024 / 1024}`,
      `minimized size: ${buffer.byteLength / 1024 / 1024}`,
    )

    // minimized woff file
    const woff = new Blob([buffer], { type: 'font/woff' })
    window.open(URL.createObjectURL(woff))
  })
```

## TODO

- [WOFF2](https://www.w3.org/TR/WOFF2)
