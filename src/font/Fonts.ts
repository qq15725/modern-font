import type { SFNT } from '../sfnt'
import type { Font } from './Font'
import { parseFont } from './parseFont'
import { TTF } from './ttf'
import { WOFF } from './woff'

export interface FontRequest {
  url: string
  when: Promise<ArrayBuffer>
  cancel: () => void
}

export type FontURL = string

export interface FontObject {
  src: string
  family?: string | string[]
}

export type FontSource = FontURL | FontObject

export interface FontLoadedResult extends FontObject {
  buffer: ArrayBuffer
  familySet: Set<string>
  getFont: () => Font | undefined
  getSFNT: () => SFNT | undefined
}

export interface FontLoadOptions extends RequestInit {
  injectFontFace?: boolean
  injectStyleTag?: boolean
  cancelOther?: boolean
  noAdd?: boolean
}

export class Fonts {
  static defaultRequestInit: Partial<FontLoadOptions> = {
    cache: 'force-cache',
  }

  fallbackFont?: FontLoadedResult
  loading = new Map<string, FontRequest>()
  loaded = new Map<string, FontLoadedResult>()
  familyToUrl = new Map<string, string>()

  setFallbackFont(loadedFont: FontLoadedResult): void {
    this.fallbackFont = loadedFont
  }

  async loadFallbackFont(source: FontSource, options: FontLoadOptions = {}): Promise<void> {
    this.fallbackFont = await this.load(source, options)
  }

  protected _createRequest(url: string, requestInit: RequestInit): FontRequest {
    const controller = new AbortController()
    return {
      url,
      when: fetch(url, {
        ...Fonts.defaultRequestInit,
        ...requestInit,
        signal: controller.signal,
      }).then(rep => rep.arrayBuffer()),
      cancel: () => controller.abort(),
    }
  }

  injectFontFace(family: string, data: ArrayBuffer): this {
    document.fonts.add(new FontFace(family, data))
    return this
  }

  injectStyleTag(family: string, url: string): this {
    const style = document.createElement('style')
    style.dataset.family = family
    style.appendChild(
      document.createTextNode(`@font-face {
  font-family: "${family}";
  src: url(${url});
}`),
    )
    document.head.appendChild(style)
    return this
  }

  protected _parseUrls(familyOrUrl: string): string[] {
    const items = Array.from(
      new Set([
        ...familyOrUrl.split(','),
        familyOrUrl,
      ]),
    )

    return Array.from(
      new Set(
        items
          .map((v) => {
            return this.familyToUrl.get(v.trim())
              ?? this.familyToUrl.get(v)
              ?? v
          }),
      ),
    )
  }

  get(familyOrUrl?: string): FontLoadedResult | undefined {
    let font
    if (familyOrUrl) {
      const urls = this._parseUrls(familyOrUrl)
      font = urls.reduce((res, url) => {
        return res || this.loaded.get(url)
      }, undefined as FontLoadedResult | undefined)
    }
    return font ?? this.fallbackFont
  }

  set(family: string, font: FontLoadedResult): this {
    this.familyToUrl.set(family, font.src)
    this.loaded.set(font.src, font)
    return this
  }

  delete(familyOrUrl: string): this {
    this._parseUrls(familyOrUrl).forEach((url) => {
      this.familyToUrl.delete(url)
      this.loaded.delete(url)
    })
    return this
  }

  clear(): this {
    this.familyToUrl.clear()
    this.loading.clear()
    this.loaded.clear()
    return this
  }

  async load(source: FontSource, options: FontLoadOptions = {}): Promise<FontLoadedResult> {
    const {
      cancelOther,
      injectFontFace = true,
      injectStyleTag = true,
      ...requestInit
    } = options

    let src: string
    let family: string | string[] | undefined
    if (typeof source === 'string') {
      src = source
    }
    else {
      ({ src, family } = source)
    }

    if (this.loaded.has(src)) {
      if (cancelOther) {
        this.loading.forEach(val => val.cancel())
        this.loading.clear()
      }
      return onLoaded(this.loaded.get(src)!)
    }

    let request = this.loading.get(src)
    if (!request) {
      request = this._createRequest(src, requestInit)
      this.loading.set(src, request)
    }

    if (cancelOther) {
      this.loading.forEach((val, key) => {
        if (val !== request) {
          val.cancel()
          this.loading.delete(key)
        }
      })
    }

    return request
      .when
      .then((buffer) => {
        if (this.loaded.has(src)) {
          return onLoaded(this.loaded.get(src)!)
        }
        else {
          const loadedFont = createLoadedFont(buffer)
          if (!options.noAdd) {
            this.loaded.set(src, loadedFont)
          }
          loadedFont.familySet.forEach((family) => {
            this.familyToUrl.set(family, src)
            if (typeof document !== 'undefined') {
              if (injectFontFace) {
                this.injectFontFace(family, buffer)
              }
              if (injectStyleTag) {
                this.injectStyleTag(family, src)
              }
            }
          })
          return loadedFont
        }
      })
      .catch((err) => {
        if (err instanceof DOMException) {
          if (err.message === 'The user aborted a request.') {
            return createLoadedFont()
          }
        }
        throw err
      })
      .finally(() => {
        this.loading.delete(src)
      })

    function getFamilies(): string[] {
      return family
        ? Array.isArray(family) ? family : [family]
        : []
    }

    function onLoaded(font: FontLoadedResult): FontLoadedResult {
      getFamilies().forEach((family) => {
        font.familySet.add(family)
      })
      return font
    }

    function createLoadedFont(buffer = new ArrayBuffer(0)): FontLoadedResult {
      let font: Font | undefined
      function getFont(): Font | undefined {
        if (!font) {
          font = buffer.byteLength ? parseFont(buffer, false) : undefined
        }
        return font
      }
      function getSFNT(): SFNT | undefined {
        const font = getFont()
        if (font instanceof TTF || font instanceof WOFF) {
          return font.sfnt
        }
        return undefined
      }
      return {
        src,
        family,
        buffer,
        familySet: new Set(getFamilies()),
        getFont,
        getSFNT,
      }
    }
  }

  async waitUntilLoad(): Promise<void> {
    await Promise.all(Array.from(this.loading.values()).map(v => v.when))
  }
}

export const fonts = new Fonts()
