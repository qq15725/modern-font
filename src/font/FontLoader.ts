export interface FontLoaderRequest {
  url: string
  when: Promise<ArrayBuffer>
  cancel: () => void
}

export interface FontLoaderFont {
  [key: string]: any
  family: string | string[]
  url: string
}

export interface FontLoaderLoadedFont extends FontLoaderFont {
  data: ArrayBuffer
}

export interface FontLoaderLoadOptions extends RequestInit {
  injectFontFace?: boolean
  injectStyleTag?: boolean
  cancelOther?: boolean
}

export class FontLoader {
  static defaultRequestInit: Partial<FontLoaderLoadOptions> = {
    cache: 'force-cache',
  }

  protected _loading = new Map<string, FontLoaderRequest>()
  protected _loaded = new Map<string, FontLoaderLoadedFont>()
  protected _namesUrls = new Map<string, string>()

  protected _createRequest(url: string, requestInit: RequestInit): FontLoaderRequest {
    const controller = new AbortController()
    return {
      url,
      when: fetch(url, {
        ...FontLoader.defaultRequestInit,
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
    style.appendChild(
      document.createTextNode(`@font-face {
  font-family: "${family}";
  src: url(${url});
}`),
    )
    document.head.appendChild(style)
    return this
  }

  get(family: string): FontLoaderLoadedFont | undefined {
    const url = this._namesUrls.get(family) ?? family
    return this._loaded.get(url)
  }

  set(family: string, font: FontLoaderLoadedFont): this {
    this._namesUrls.set(family, font.url)
    this._loaded.set(font.url, font)
    return this
  }

  delete(family: string): this {
    const url = this._namesUrls.get(family) ?? family
    this._namesUrls.delete(family)
    this._loaded.delete(url)
    return this
  }

  clear(): this {
    this._namesUrls.clear()
    this._loaded.clear()
    return this
  }

  async waitUntilLoad(): Promise<void> {
    await Promise.all(Array.from(this._loading.values()).map(v => v.when))
  }

  async load(
    font: FontLoaderFont,
    options: FontLoaderLoadOptions = {},
  ): Promise<FontLoaderLoadedFont> {
    const {
      cancelOther,
      injectFontFace = true,
      injectStyleTag = true,
      ...requestInit
    } = options

    const { family, url } = font

    if (this._loaded.has(url)) {
      if (cancelOther) {
        this._loading.forEach(val => val.cancel())
        this._loading.clear()
      }
      return this._loaded.get(url)!
    }

    let request = this._loading.get(url)
    if (!request) {
      request = this._createRequest(url, requestInit)
      this._loading.set(url, request)
    }

    if (cancelOther) {
      this._loading.forEach((val, key) => {
        if (val !== request) {
          val.cancel()
          this._loading.delete(key)
        }
      })
    }

    return request
      .when
      .then((data) => {
        const result = { ...font, data } as any
        if (!this._loaded.has(url)) {
          this._loaded.set(url, result)
          new Set(Array.isArray(family) ? family : [family]).forEach((family) => {
            this._namesUrls.set(family, url)

            if (typeof document !== 'undefined') {
              if (injectFontFace) {
                this.injectFontFace(family, data)
              }

              if (injectStyleTag) {
                this.injectStyleTag(family, url)
              }
            }
          })
        }
        return result
      })
      .catch((err) => {
        if (err instanceof DOMException) {
          if (err.message === 'The user aborted a request.') {
            return { ...font, data: new ArrayBuffer(0) }
          }
        }
        throw err
      })
      .finally(() => {
        this._loading.delete(url)
      })
  }
}

export const fontLoader = new FontLoader()
