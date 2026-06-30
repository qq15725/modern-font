import type { SFNT } from '../sfnt'
import type { Font } from './Font'
import { base64ToArrayBuffer, EMBEDDED_FALLBACK_FONT_BASE64 } from './fallbackFontData'
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

  loading = new Map<string, FontRequest>()
  loaded = new Map<string, FontLoadedResult>()
  familyToUrl = new Map<string, string>()

  /**
   * 字体可用通知。加载完成 / 设置兜底字体时触发，携带刚就绪的字体。
   * 消费方（如渲染层的文字元素）据此在字体到位后重新测量——避免「字体未就绪即测量，glyph 宽度为 0」。
   */
  protected _loadListeners = new Set<(font: FontLoadedResult) => void>()

  on(event: 'load', listener: (font: FontLoadedResult) => void): this {
    if (event === 'load') {
      this._loadListeners.add(listener)
    }
    return this
  }

  off(event: 'load', listener: (font: FontLoadedResult) => void): this {
    if (event === 'load') {
      this._loadListeners.delete(listener)
    }
    return this
  }

  protected _emitLoad(font: FontLoadedResult): void {
    this._loadListeners.forEach(listener => listener(font))
  }

  // fallbackFont 做成 setter：无论走 setFallbackFont 还是直接赋值（消费方常这么干），
  // 兜底字体一就绪就 emit 'load'，让订阅方（渲染层）可靠地在字体到位后重排文字。
  protected _fallbackFont?: FontLoadedResult
  get fallbackFont(): FontLoadedResult | undefined {
    return this._fallbackFont
  }

  set fallbackFont(font: FontLoadedResult | undefined) {
    this._fallbackFont = font
    if (font) {
      this._emitLoad(font)
    }
  }

  setFallbackFont(loadedFont: FontLoadedResult): void {
    this.fallbackFont = loadedFont
  }

  /**
   * 加载兜底字体。
   *
   * 传 `source` 时按常规加载该字体作为兜底。
   *
   * 不传 `source` 时启用「自动两手兜底」——当应用没有指定兜底字体、又不想随包附带一个
   * woff 时用：
   * 1. **Local Font Access API**（`queryLocalFonts`）：拿一个本机系统字体（覆盖最全，含
   *    CJK）。仅 Chromium / HTTPS 可用，且需用户手势 + 权限，失败则跳到下一步。
   * 2. **内嵌豆腐字体**：随包附带的 552 字节占位字体，保证任何环境都不会因缺字体而崩。
   */
  async loadFallbackFont(source?: FontSource, options: FontLoadOptions = {}): Promise<void> {
    if (source != null) {
      this.fallbackFont = await this.load(source, options)
      return
    }
    const system = await this._loadSystemFallbackFont().catch(() => undefined)
    this.fallbackFont = system ?? this._loadEmbeddedFallbackFont()
  }

  /** 第一手：经 Local Font Access API 取一个本机系统字体作兜底；不支持/无权限时返回 undefined。 */
  protected async _loadSystemFallbackFont(): Promise<FontLoadedResult | undefined> {
    const query = (globalThis as any)?.queryLocalFonts
    if (typeof query !== 'function') {
      return undefined
    }
    const available: any[] = await query() // 无用户手势 / 拒绝权限会 reject → 由调用方 catch
    if (!available?.length) {
      return undefined
    }
    // 优先常见的全覆盖西文字体，否则退回第一个。
    const preferred = ['Arial', 'Helvetica', 'Helvetica Neue', 'Roboto', 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans']
    const data = available.find(f => preferred.includes(f.family)) ?? available[0]
    const buffer = await (await data.blob()).arrayBuffer()
    const family = data.family ?? data.fullName ?? data.postscriptName ?? 'system-fallback'
    return this._createLoadedFont(`local-font:${family}`, [family], buffer)
  }

  /** 第二手：随包内嵌的极小豆腐字体（始终可用）。 */
  protected _loadEmbeddedFallbackFont(): FontLoadedResult {
    const buffer = base64ToArrayBuffer(EMBEDDED_FALLBACK_FONT_BASE64)
    return this._createLoadedFont('modern-font:embedded-fallback', ['ModernFallback'], buffer)
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

  async injectFontFace(family: string, data: ArrayBuffer): Promise<void> {
    if (!document.fonts.check(`14px "${family}"`)) {
      const face = new FontFace(family, data)
      await face.load()
      document.fonts.add(face)
    }
  }

  injectStyleTag(family: string, url: string): this {
    const escapedFamily = CSS.escape(family)
    if (!document.querySelector(`style[data-family="${escapedFamily}"]`)) {
      const style = document.createElement('style')
      style.type = 'text/css'
      style.dataset.family = family
      style.appendChild(
        document.createTextNode(`@font-face {
  font-family: "${family}";
  src: url(${url});
}`),
      )
      document.head.appendChild(style)
    }
    return this
  }

  protected _parseUrls(familyOrUrl: string): string[] {
    const items = [...new Set([
      ...familyOrUrl.split(','),
      familyOrUrl,
    ])]

    return [...new Set(
      items
        .map((v) => {
          return this.familyToUrl.get(v.trim())
            ?? this.familyToUrl.get(v)
            ?? v
        }),
    )]
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

  protected _parseFamilies(family: string | string[] | undefined): string[] {
    if (!family)
      return []
    return (Array.isArray(family) ? family : [family])
      .flatMap(item => item.split(',').map(v => v.trim()))
  }

  async load(source: FontSource, options: FontLoadOptions = {}): Promise<FontLoadedResult> {
    const {
      cancelOther,
      injectStyleTag = false,
      injectFontFace = false,
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

    const families = this._parseFamilies(family)

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
        let loadedFont
        if (this.loaded.has(src)) {
          loadedFont = onLoaded(this.loaded.get(src)!)
        }
        else {
          loadedFont = this._createLoadedFont(src, families, buffer)
          if (!options.noAdd) {
            this.loaded.set(src, loadedFont)
          }
        }
        return Promise.all(
          Array.from(loadedFont.familySet, async (family) => {
            this.familyToUrl.set(family, src)
            if (typeof document !== 'undefined') {
              if (injectFontFace) {
                await this.injectFontFace(family, buffer)
              }
              if (injectStyleTag) {
                this.injectStyleTag(family, src)
              }
              if (injectFontFace || injectStyleTag) {
                return await document.fonts.load(`14px "${family}"`)
              }
            }
          }),
        )
          .then(() => {
            this._emitLoad(loadedFont)
            return loadedFont
          })
      })
      .catch((err) => {
        if (err instanceof DOMException) {
          if (err.message === 'The user aborted a request.') {
            return this._createLoadedFont(src, families)
          }
        }
        throw err
      })
      .finally(() => {
        this.loading.delete(src)
      })

    function onLoaded(font: FontLoadedResult): FontLoadedResult {
      families.forEach((family) => {
        font.familySet.add(family)
      })
      return font
    }
  }

  /** 把已下载的字体二进制包装成 FontLoadedResult（懒解析 Font / SFNT）。 */
  protected _createLoadedFont(src: string, families: string[], buffer = new ArrayBuffer(0)): FontLoadedResult {
    let font: Font | undefined
    function getFont(): Font | undefined {
      if (!font) {
        font = buffer.byteLength ? parseFont(buffer, false) : undefined
      }
      return font
    }
    function getSFNT(): SFNT | undefined {
      const font = getFont()
      // OTF extends TTF，TTC 解析后也得到 TTF/OTF，故 instanceof TTF 已覆盖；WOFF 单列。
      if (font instanceof TTF || font instanceof WOFF) {
        return font.sfnt
      }
      return undefined
    }
    return {
      src,
      family: families.length === 1 ? families[0] : families,
      buffer,
      familySet: new Set(families),
      getFont,
      getSFNT,
    }
  }

  async waitUntilLoad(): Promise<void> {
    await Promise.all(Array.from(this.loading.values(), v => v.when))
  }
}

export const fonts = new Fonts()
