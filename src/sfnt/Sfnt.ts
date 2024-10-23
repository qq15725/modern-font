import type { Cff } from './Cff'
import type { Cmap } from './Cmap'
import type { Glyf } from './Glyf'
import type { Glyph, GlyphPathCommand } from './Glyph'
import type { GlyphSet } from './GlyphSet'
import type { Gpos } from './Gpos'
import type { Gsub } from './Gsub'
import type { Head } from './Head'
import type { Hhea } from './Hhea'
import type { Hmtx } from './Hmtx'
import type { Kern } from './Kern'
import type { Loca } from './Loca'
import type { Maxp } from './Maxp'
import type { Name } from './Name'
import type { Os2 } from './Os2'
import type { Post } from './Post'
import type { SfntTable } from './SfntTable'
import type { Vhea } from './Vhea'
import type { Vmtx } from './Vmtx'

export type SfntTableTag =
  // required
  | 'cmap' | 'head' | 'hhea' | 'hmtx' | 'maxp' | 'name' | 'OS/2' | 'post'
  // only TrueType required
  | 'glyf' | 'loca'
  // only OpenType required
  | 'CFF '
  // optional
  | 'BASE' | 'CBDT' | 'CBLC' | 'CFF2' | 'COLR' | 'CPAL' | 'DSIG' | 'EBDT'
  | 'EBLC' | 'EBSC' | 'GDEF' | 'GPOS' | 'GSUB' | 'gasp' | 'JSTF' | 'kern'
  | 'LTSH' | 'MATH' | 'MERG' | 'Sbix' | 'SVG ' | 'VDMX' | 'vhea' | 'vmtx'
  | 'VORG' | 'hdmx'
  // only TrueType optional
  | 'fpgm' | 'prep' | 'cvt '
  // only OpenType optional
  | 'avar' | 'fvar' | 'gvar' | 'HVAR' | 'MVAR' | 'STAT' | 'VVAR'
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
  declare cmap: Cmap
  declare head: Head
  declare hhea: Hhea
  declare hmtx: Hmtx
  declare maxp: Maxp
  declare name: Name
  declare os2: Os2
  declare post: Post
  declare loca: Loca
  declare glyf: Glyf
  declare cff: Cff

  declare gpos?: Gpos
  declare gsub?: Gsub
  declare kern?: Kern
  declare vhea?: Vhea
  declare vmtx?: Vmtx

  static tableDefinitions = new Map<string, {
    tag: string
    prop: string
    class: new (...args: any[]) => SfntTable
  }>()

  tables = new Map<string, SfntTable>()
  tableViews = new Map<SfntTableTag, DataView>()

  get hasGlyf(): boolean { return this.tableViews.has('glyf') }
  get names(): Record<string, any> { return this.name.names }
  get unitsPerEm(): number { return this.head.unitsPerEm }
  get ascender(): number { return this.hhea.ascent }
  get descender(): number { return this.hhea.descent }
  get createdTimestamp(): Date { return this.head.created }
  get modifiedTimestamp(): Date { return this.head.modified }
  get glyphs(): GlyphSet { return this.hasGlyf ? this.glyf.glyphs : this.cff.glyphs }

  charToGlyphIndex(char: string): number {
    let index = this.cmap.unicodeToGlyphIndexMap.get(char.codePointAt(0)!)
    if (index === undefined && !this.hasGlyf) {
      const { encoding, charset } = this.cff
      index = charset.indexOf(encoding[char.codePointAt(0)!])
    }
    return index ?? 0
  }

  charToGlyph(char: string): Glyph {
    return this.glyphs.get(this.charToGlyphIndex(char))
  }

  textToGlyphIndexes(text: string): number[] {
    const indexes: number[] = []
    for (const char of text) {
      indexes.push(this.charToGlyphIndex(char))
    }
    return indexes
  }

  textToGlyphs(text: string): Glyph[] {
    const _glyphs = this.glyphs
    const indexes = this.textToGlyphIndexes(text)
    const length = indexes.length
    const glyphs: Glyph[] = Array.from({ length })
    const notdef = _glyphs.get(0)
    for (let i = 0; i < length; i += 1) {
      glyphs[i] = _glyphs.get(indexes[i]) || notdef
    }
    return glyphs
  }

  getPathCommands(text: string, x: number, y: number, fontSize?: number, options?: Record<string, any>): GlyphPathCommand[] | undefined {
    return this.charToGlyph(text)?.getPathCommands(x, y, fontSize, options, this)
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
        if (!view) {
          return undefined
        }
        table = new Class(view.buffer, view.byteOffset, view.byteLength).setSfnt(this) as any
        this.tables.set(definition.prop, table!)
      }
    }
    return table
  }
}
