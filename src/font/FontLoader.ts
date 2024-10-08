import { PKG_NAME } from '../utils'

export interface FontLoaderRequest {
  url: string
  when: Promise<ArrayBuffer>
  cancel: () => void
}

export interface FontLoaderFont {
  [key: string]: any
  name: string | string[]
  url: string
}

export interface FontLoaderLoadedFont extends FontLoaderFont {
  data: ArrayBuffer
}

export interface FontLoaderOptions extends RequestInit {
  injectStyleTag?: boolean
}

export interface FontLoaderLoadOptions {
  cancelOther?: boolean
}

export class FontLoader {
  static defaultRequestInit: Partial<RequestInit> = {
    cache: 'force-cache',
  }

  injectStyleTag?: boolean
  requestInit: RequestInit

  protected _loading = new Map<string, FontLoaderRequest>()
  protected _loaded = new Map<string, FontLoaderLoadedFont>()
  protected _namesUrls = new Map<string, string>()

  constructor(options: FontLoaderOptions = {}) {
    const {
      injectStyleTag = true,
      ...requestInit
    } = options

    this.injectStyleTag = injectStyleTag

    this.requestInit = {
      ...FontLoader.defaultRequestInit,
      ...requestInit,
    }
  }

  protected _createRequest(url: string): FontLoaderRequest {
    const controller = new AbortController()
    return {
      url,
      when: fetch(url, { ...this.requestInit, signal: controller.signal }).then(rep => rep.arrayBuffer()),
      cancel: () => controller.abort(),
    }
  }

  protected _appendStyleTagToHead(name: string, url: string): this {
    const style = document.createElement('style')
    style.dataset.name = name.replace(/"/g, '')
    style.dataset.from = PKG_NAME
    style.appendChild(
      document.createTextNode(`@font-face {
  font-family: "${name}";
  src: url(${url});
}`),
    )
    document.head.appendChild(style)
    return this
  }

  get(name: string): FontLoaderLoadedFont | undefined {
    const url = this._namesUrls.get(name) ?? name
    return this._loaded.get(url)
  }

  set(name: string, font: FontLoaderLoadedFont): this {
    this._namesUrls.set(name, font.url)
    this._loaded.set(font.url, font)
    return this
  }

  delete(name: string): this {
    const url = this._namesUrls.get(name) ?? name
    this._namesUrls.delete(name)
    this._loaded.delete(url)
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
    } = options

    const { name, url } = font

    if (this._loaded.has(url)) {
      if (cancelOther) {
        this._loading.forEach(val => val.cancel())
        this._loading.clear()
      }
      return this._loaded.get(url)!
    }

    let request = this._loading.get(url)
    if (!request) {
      request = this._createRequest(url)
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
          new Set(Array.isArray(name) ? name : [name]).forEach((name) => {
            this._namesUrls.set(name, url)
            document.fonts.add(new FontFace(name, data))
            if (this.injectStyleTag) {
              this._appendStyleTagToHead(name, url)
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
