import type { SfntTable } from './sfnt-table'

export type SfntTableTag =
  // required
  | 'cmap' | 'glyf' | 'head' | 'hhea' | 'hmtx' | 'loca' | 'maxp' | 'name' | 'post'
  // optional
  | 'cvt' | 'fpgm' | 'hdmx' | 'kern' | 'OS/2' | 'prep'
  | 'vhea' | 'vmtx'
  | string

export class Sfnt {
  static registeredTableViews = new Map<string, Function>()

  static table(tag: SfntTableTag) {
    return (constructor: Function) => {
      this.registeredTableViews.set(tag, constructor)
      Object.defineProperty(this.prototype, tag, {
        get() { return this.getTableView(tag) },
        set(table) { return this.setTableView(tag, table) },
        configurable: true,
        enumerable: true,
      })
    }
  }

  tableViews = new Map<string, SfntTable>()

  constructor(
    public tables: Array<{ tag: SfntTableTag; view: DataView }>,
  ) {
    //
  }

  setTableView(tag: SfntTableTag, view: SfntTable): this {
    this.tableViews.set(tag, view)
    const table = this.tables.find(table => table.tag === tag)
    if (table) table.view = view
    return this
  }

  getTableView(tag: SfntTableTag): SfntTable | undefined {
    let view = this.tableViews.get(tag)
    if (!view) {
      const Table = Sfnt.registeredTableViews.get(tag) as any
      if (Table) {
        const rawView = this.tables.find(table => table.tag === tag)!.view
        view = new Table(rawView.buffer, rawView.byteOffset, rawView.byteLength).setSfnt(this) as any
        this.setTableView(tag, view!)
      }
    }
    return view
  }
}
