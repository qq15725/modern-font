import type { Column, DataType } from './FontDataView'
import { dataTypeToByteLength, FontDataView } from './FontDataView'

export type ColumnOptions = DataType | (Partial<Column> & { type: DataType })

export interface FontDataViewDefinition {
  columns: Column[]
  byteLength: number
}

const definitions = new WeakMap<any, FontDataViewDefinition>()

export function defineColumn(options: ColumnOptions) {
  const config = typeof options === 'object' ? options : { type: options }
  const { size = 1, type } = config
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
      ...config,
      name,
      byteLength: size * dataTypeToByteLength[type],
      offset: config.offset ?? definition.columns.reduce((offset, column) => offset + column.byteLength, 0),
    }
    definition.columns.push(column)
    definition.byteLength = definition.columns.reduce((byteLength, column) => {
      return byteLength + dataTypeToByteLength[column.type] * (column.size ?? 1)
    }, 0)
    Object.defineProperty(target.constructor.prototype, name, {
      get() { return (this as FontDataObject).view.readColumn(column) },
      set(value) { (this as FontDataObject).view.writeColumn(column, value) },
      configurable: true,
      enumerable: true,
    })
  }
}

export class FontDataObject {
  view: FontDataView

  constructor(
    source: BufferSource,
    byteOffset?: number,
    byteLength?: number,
    littleEndian?: boolean,
  ) {
    this.view = new FontDataView(source, byteOffset, byteLength, littleEndian)
  }
}
