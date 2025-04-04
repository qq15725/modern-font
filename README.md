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
import { parseSFNTFont } from 'modern-font'

fetch('font.woff')
  .then(rep => rep.arrayBuffer())
  .then((buffer) => {
    const font = parseSFNTFont(buffer)
    const sfnt = font.sfnt

    // SFNT
    console.log(sfnt)

    // Char to SVG Path commands
    console.log(sfnt.getPathCommands('A', 0, 0))
  })
```

## 🚀 WOFF to TTF

```ts
import { TTF, WOFF } from 'modern-font'

// buffer is WOFF file arrayBuffer
const ttf = TTF.from(new WOFF(buffer).sfnt)

// TTF file
window.open(URL.createObjectURL(ttf.toBlob()))
```

## 🚀 TTF to WOFF

```ts
import { TTF, WOFF } from 'modern-font'

// buffer is TTF file arrayBuffer
const woff = WOFF.from(new TTF(buffer).sfnt)

// WOFF file
window.open(URL.createObjectURL(woff.toBlob()))
```

## 🚀 TTF to EOT

```ts
import { EOT, TTF } from 'modern-font'

// buffer is TTF file arrayBuffer
const eot = EOT.from(new TTF(buffer))

// EOT file
window.open(URL.createObjectURL(eot.toBlob()))
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
