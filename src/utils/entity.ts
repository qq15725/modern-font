import { dataTypeToByteLength } from './data-type'
import { ReadWriter } from './read-writer'
import { toBuffer } from './buffer'
import type { DataType } from './data-type'

export interface Column {
  name: string
  type: DataType
  offset: number
  byteLength: number
  size?: number
  default?: any
}

export type ColumnOptions = Partial<Column> & { type: DataType }

const columnsMap = new WeakMap<any, Array<Column>>()

export class Entity {
  static column(options: ColumnOptions) {
    const { size = 1, type } = options
    return function (table: Entity, name: PropertyKey) {
      if (typeof name !== 'string') return
      let columns = columnsMap.get(table)
      if (!columns) columnsMap.set(table, columns = [])
      const offset = options.offset ?? columns.reduce((offset, column) => offset + column.byteLength, 0)
      const byteLength = size * dataTypeToByteLength[type]
      const column = {
        ...options,
        name,
        byteLength,
        offset,
      }
      columns.push(column)
      Object.defineProperty(table.constructor.prototype, name, {
        get() {
          return this._getColumnValue(column)
        },
        set(value) {
          this._setColumnValue(column, value)
        },
        configurable: true,
        enumerable: true,
      })
    }
  }

  readonly readWriter: ReadWriter

  get buffer() { return this.readWriter.buffer }
  get columns() { return columnsMap.get(this.constructor) ?? [] }
  get byteLength() {
    return this.columns.reduce((byteLength, column) => {
      return byteLength + dataTypeToByteLength[column.type] * (column.size ?? 1)
    }, 0)
  }

  constructor(
    source: BufferSource = new ArrayBuffer(this.byteLength),
    public offset = 0,
  ) {
    this.readWriter = new ReadWriter(toBuffer(source), offset)
  }

  protected _getColumnValue(column: Column): any {
    const { type, size, offset } = column

    if (size) {
      const array = Array.from({ length: size }, (_, i) => {
        return this.readWriter.read(type, this.offset + offset + i)
      })
      switch (type) {
        case 'char':
          return array.join('')
        default:
          return array
      }
    } else {
      return this.readWriter.read(type, this.offset + offset)
    }
  }

  protected _setColumnValue(column: Column, value: any): any {
    const { type, size, offset } = column

    if (size) {
      // eslint-disable-next-line array-callback-return
      Array.from({ length: size }, (_, i) => {
        this.readWriter.write(type, value[i], this.offset + offset)
      })
    } else {
      this.readWriter.write(type, value, this.offset + offset)
    }
  }
}
