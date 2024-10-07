import type { Glyph } from './Glyph'
import type { SfntTable } from './SfntTable'

export type SfntTableTag =
  // required
  | 'cmap' | 'glyf' | 'head' | 'hhea' | 'hmtx' | 'loca' | 'maxp' | 'name' | 'post'
  // optional
  | 'cvt' | 'fpgm' | 'hdmx' | 'kern' | 'os2' | 'prep'
  | 'vhea' | 'vmtx'
  | string

export function defineSfntTable(tag: SfntTableTag) {
  return (constructor: any) => {
    Sfnt.registered.set(tag, constructor)
    Object.defineProperty(Sfnt.prototype, tag, {
      get() { return this.get(tag) },
      set(table) { return this.set(tag, table) },
      configurable: true,
      enumerable: true,
    })
  }
}

export class Sfnt {
  static registered = new Map<string, new () => SfntTable>()

  tableViews = new Map<string, SfntTable>()

  get names(): Record<string, any> {
    return this.name.getNames()
  }

  get unitsPerEm(): number {
    return this.head.unitsPerEm
  }

  get ascender(): number {
    return this.hhea.ascent
  }

  get descender(): number {
    return this.hhea.descent
  }

  get createdTimestamp(): Date {
    return this.head.created
  }

  get modifiedTimestamp(): Date {
    return this.head.modified
  }

  charToGlyphIndex(char: string): number {
    const unicodeGlyphIndexMap = this.cmap.getUnicodeGlyphIndexMap()
    const unicode = char.codePointAt(0)!
    return unicodeGlyphIndexMap.get(unicode) ?? 0
  }

  charToGlyph(char: string): Glyph {
    return this.glyf.getGlyphs().get(this.charToGlyphIndex(char))
  }

  constructor(
    public tables: { tag: SfntTableTag, view: DataView }[],
  ) {
    //
  }

  clone(): Sfnt {
    return new Sfnt(this.tables.map(({ tag, view }) => {
      return {
        tag,
        view: new DataView(
          view.buffer.slice(
            view.byteOffset,
            view.byteOffset + view.byteLength,
          ),
        ),
      }
    }))
  }

  delete(tag: SfntTableTag): this {
    this.tableViews.delete(tag)
    const index = this.tables.findIndex(table => table.tag === tag)
    if (index > -1)
      this.tables.splice(index, 1)
    return this
  }

  set(tag: SfntTableTag, view: SfntTable): this {
    this.tableViews.set(tag, view)
    const table = this.tables.find(table => table.tag === tag)
    if (table)
      table.view = view.view
    return this
  }

  get(tag: SfntTableTag): SfntTable | undefined {
    let view = this.tableViews.get(tag)
    if (!view) {
      const Table = Sfnt.registered.get(tag) as any
      if (Table) {
        const rawView = this.tables.find(table => table.tag === tag)?.view
        if (rawView) {
          view = new Table(rawView.buffer, rawView.byteOffset, rawView.byteLength).setSfnt(this) as any
          this.set(tag, view!)
        }
      }
    }
    return view
  }
}
