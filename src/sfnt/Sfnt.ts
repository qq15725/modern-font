import type { Path2D } from '../path'
import type { Glyph } from './Glyph'
import type { SfntTable } from './SfntTable'

export type SfntTableTag =
// required
  | 'cmap' | 'glyf' | 'head' | 'hhea' | 'hmtx' | 'loca' | 'maxp' | 'name' | 'post'
  // optional
  | 'cvt' | 'fpgm' | 'hdmx' | 'kern' | 'OS/2' | 'prep'
  | 'vhea' | 'vmtx'
  | 'GSUB' | 'GPOS' | 'VORG'
  | string

export function defineSfntTable(tag: SfntTableTag, prop: string = tag) {
  return (constructor: any) => {
    Sfnt.tableDefinitions.set(tag, { tag, prop, class: constructor })
    Object.defineProperty(Sfnt.prototype, prop, {
      get() { return this.get(tag) },
      set(table) { return this.set(tag, table) },
      configurable: true,
      enumerable: true,
    })
  }
}

export class Sfnt {
  static tableDefinitions = new Map<string, {
    tag: string
    prop: string
    class: new (...args: any[]) => SfntTable
  }>()

  tables = new Map<string, SfntTable>()
  tableViews = new Map<SfntTableTag, DataView>()

  get names(): Record<string, any> { return this.name.getNames() }
  get unitsPerEm(): number { return this.head.unitsPerEm }
  get ascender(): number { return this.hhea.ascent }
  get descender(): number { return this.hhea.descent }
  get createdTimestamp(): Date { return this.head.created }
  get modifiedTimestamp(): Date { return this.head.modified }

  charToGlyphIndex(char: string): number {
    return this.cmap.getUnicodeGlyphIndexMap().get(char.codePointAt(0)!) ?? 0
  }

  charToGlyph(char: string): Glyph {
    return this.glyf.getGlyphs().get(this.charToGlyphIndex(char))
  }

  textToGlyphIndexes(text: string): number[] {
    const unicodeGlyphIndexMap = this.cmap.getUnicodeGlyphIndexMap()
    const indexes: number[] = []
    for (const char of text) {
      const unicode = char.codePointAt(0)!
      indexes.push(unicodeGlyphIndexMap.get(unicode) ?? 0)
    }
    return indexes
  }

  textToGlyphs(text: string): Glyph[] {
    const _glyphs = this.glyf.getGlyphs()
    const indexes = this.textToGlyphIndexes(text)
    const length = indexes.length
    const glyphs: Glyph[] = Array.from({ length })
    const notdef = _glyphs.get(0)
    for (let i = 0; i < length; i += 1) {
      glyphs[i] = _glyphs.get(indexes[i]) || notdef
    }
    return glyphs
  }

  getPath(text: string, x: number, y: number, fontSize?: number, options?: Record<string, any>): Path2D | undefined {
    return this.charToGlyph(text)?.getPath(x, y, fontSize, options, this)
  }

  getAdvanceWidth(text: string, fontSize?: number, options?: Record<string, any>): number {
    return this.forEachGlyph(text, 0, 0, fontSize, options, () => {})
  }

  forEachGlyph(text: string, x = 0, y = 0, fontSize = 72, options: Record<string, any> = {}, callback: any): number {
    const fontScale = 1 / this.unitsPerEm * fontSize
    const glyphs = this.textToGlyphs(text)
    for (let i = 0; i < glyphs.length; i += 1) {
      const glyph = glyphs[i]
      callback.call(this, glyph, x, y, fontSize, options)
      if (glyph.advanceWidth) {
        x += glyph.advanceWidth * fontScale
      }
      if (options.letterSpacing) {
        x += options.letterSpacing * fontSize
      }
      else if (options.tracking) {
        x += (options.tracking / 1000) * fontSize
      }
    }
    return x
  }

  constructor(
    tableViews: Record<SfntTableTag, DataView> | Map<SfntTableTag, DataView>,
  ) {
    const _tableViews = tableViews instanceof Map ? tableViews : new Map(Object.entries(tableViews))
    _tableViews.forEach((view, key) => {
      this.tableViews.set(key, new DataView(
        view.buffer.slice(
          view.byteOffset,
          view.byteOffset + view.byteLength,
        ),
      ))
    })
  }

  clone(): Sfnt {
    return new Sfnt(this.tableViews)
  }

  delete(tag: SfntTableTag): this {
    const definition = Sfnt.tableDefinitions.get(tag)
    if (!definition)
      return this
    this.tableViews.delete(tag)
    this.tables.delete(definition.prop)
    return this
  }

  set(tag: SfntTableTag, table: SfntTable): this {
    const definition = Sfnt.tableDefinitions.get(tag)
    if (definition) {
      this.tables.set(definition.prop, table)
    }
    this.tableViews.set(tag, table.view)
    return this
  }

  get(tag: SfntTableTag): SfntTable | undefined {
    const definition = Sfnt.tableDefinitions.get(tag)
    if (!definition)
      return undefined
    let table = this.tables.get(definition.prop)
    if (!table) {
      const Class = definition.class
      if (Class) {
        const view = this.tableViews.get(tag)
        if (view) {
          table = new Class(view.buffer, view.byteOffset, view.byteLength).setSfnt(this) as any
        }
        else {
          table = new Class().setSfnt(this) as any
        }
        this.tables.set(definition.prop, table!)
      }
    }
    return table
  }
}
