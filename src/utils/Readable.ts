import type { Column, DataType } from './IDataView'
import { dataTypeToByteLength, IDataView } from './IDataView'

export type ColumnOptions = Partial<Column> & { type: DataType }

export interface IDataViewDefinition {
  columns: Column[]
  byteLength: number
}

const definitions = new WeakMap<any, IDataViewDefinition>()

export function defineColumn(options: ColumnOptions) {
  const { size = 1, type } = options
  return (target: any, name: PropertyKey) => {
    if (typeof name !== 'string')
      return
    let definition = definitions.get(target)
    if (!definition) {
      definition = {
        columns: [],
        byteLength: 0,
      }
      definitions.set(target, definition)
    }
    const column = {
      ...options,
      name,
      byteLength: size * dataTypeToByteLength[type],
      offset: options.offset ?? definition.columns.reduce((offset, column) => offset + column.byteLength, 0),
    }
    definition.columns.push(column)
    definition.byteLength = definition.columns.reduce((byteLength, column) => {
      return byteLength + dataTypeToByteLength[column.type] * (column.size ?? 1)
    }, 0)
    Object.defineProperty(target.constructor.prototype, name, {
      get() { return (this as Readable).view.getColumn(column) },
      set(value) { (this as Readable).view.setColumn(column, value) },
      configurable: true,
      enumerable: true,
    })
  }
}

export class Readable {
  view: IDataView

  constructor(
    source: BufferSource,
    byteOffset?: number,
    byteLength?: number,
    littleEndian?: boolean,
  ) {
    this.view = new IDataView(source, byteOffset, byteLength, littleEndian)
  }
}
