import type { Entity } from '../utils'

export type SfntTableTag =
  // required
  | 'cmap' | 'glyf' | 'head' | 'hhea' | 'hmtx' | 'loca' | 'maxp' | 'name' | 'post'
  // optional
  | 'cvt' | 'fpgm' | 'hdmx' | 'kern' | 'OS/2' | 'prep'
  | 'vhea' | 'vmtx'
  | string

export class Sfnt {
  static registeredTable = new Map<string, Function>()

  static table(tag: SfntTableTag) {
    return (constructor: Function) => {
      this.registeredTable.set(tag, constructor)
      Object.defineProperty(this.prototype, tag, {
        get() { return this._getTable(tag) },
        configurable: true,
        enumerable: true,
      })
    }
  }

  constructor(
    public tables: Array<{ tag: SfntTableTag; view: DataView }>,
  ) {
    //
  }

  protected _getTable(tag: SfntTableTag): Entity | undefined {
    const Table = Sfnt.registeredTable.get(tag) as any
    if (Table) {
      const view = this.tables.find(table => table.tag === tag)!.view
      return new Table(view.buffer, view.byteOffset, view.byteLength) as any
    }
    return undefined
  }
}
