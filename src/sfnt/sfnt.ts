import type { Entity } from '../utils'

export type SfntTableTag =
  | 'head'
  | 'hhea'
  | 'hmtx'
  | 'maxp'
  | 'name'
  | 'OS/2'
  | 'post'
  | string

export class Sfnt {
  static registeredTable = new Map<string, Function>()

  static table(tag: SfntTableTag) {
    return (constructor: Function) => {
      this.registeredTable.set(tag, constructor)
      Object.defineProperty(this.prototype, tag, {
        get() { return this.getTable(tag) },
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

  getTable(tag: SfntTableTag): Entity | undefined {
    const Table = Sfnt.registeredTable.get(tag)
    if (Table) {
      const view = this.tables.find(table => table.tag === tag).view
      return new Table(view) as any
    }
    return undefined
  }
}
