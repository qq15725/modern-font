import type { SfntTable } from './sfnt-table'

export type SfntTableTag =
  // required
  | 'cmap' | 'glyf' | 'head' | 'hhea' | 'hmtx' | 'loca' | 'maxp' | 'name' | 'post'
  // optional
  | 'cvt' | 'fpgm' | 'hdmx' | 'kern' | 'OS/2' | 'prep'
  | 'vhea' | 'vmtx'
  | string

export class Sfnt {
  static registeredTableViews = new Map<string, new () => SfntTable>()

  static table(tag: SfntTableTag) {
    return (constructor: any) => {
      this.registeredTableViews.set(tag, constructor)
      Object.defineProperty(this.prototype, tag, {
        get() { return this.get(tag) },
        set(table) { return this.set(tag, table) },
        configurable: true,
        enumerable: true,
      })
    }
  }

  tableViews = new Map<string, SfntTable>()

  constructor(
    public tables: Array<{ tag: SfntTableTag, view: DataView }>,
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
      table.view = view
    return this
  }

  get(tag: SfntTableTag): SfntTable | undefined {
    let view = this.tableViews.get(tag)
    if (!view) {
      const Table = Sfnt.registeredTableViews.get(tag) as any
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
