import { dataTypeToByteLength } from './data-type'
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

export interface EntityDefinition {
  columns: Array<Column>
  byteLength: number
}

const entityDefinitions = new WeakMap<any, EntityDefinition>()

export class Entity extends DataView {
  @Entity.method() declare readInt8: (byteOffset?: number) => number
  @Entity.method() declare readInt16: (byteOffset?: number, littleEndian?: boolean) => number
  @Entity.method() declare readInt32: (byteOffset?: number, littleEndian?: boolean) => number
  @Entity.method() declare readUint8: (byteOffset?: number) => number
  @Entity.method() declare readUint16: (byteOffset?: number, littleEndian?: boolean) => number
  @Entity.method() declare readUint32: (byteOffset?: number, littleEndian?: boolean) => number
  @Entity.method() declare readFloat32: (byteOffset?: number, littleEndian?: boolean) => number
  @Entity.method() declare readFloat64: (byteOffset?: number, littleEndian?: boolean) => number
  @Entity.method() declare writeInt8: (value: number, byteOffset?: number) => this
  @Entity.method() declare writeInt16: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @Entity.method() declare writeInt32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @Entity.method() declare writeUint8: (value: number, byteOffset?: number) => this
  @Entity.method() declare writeUint16: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @Entity.method() declare writeUint32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @Entity.method() declare writeFloat32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @Entity.method() declare writeFloat64: (value: number, byteOffset?: number, littleEndian?: boolean) => this

  static column(options: ColumnOptions) {
    const { size = 1, type } = options
    return (target: any, name: PropertyKey) => {
      if (typeof name !== 'string') return
      let definition = entityDefinitions.get(target)
      if (!definition) {
        definition = {
          columns: [],
          byteLength: 0,
        }
        entityDefinitions.set(target, definition)
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
        get() { return this.getColumn(column) },
        set(value) { this.setColumn(column, value) },
        configurable: true,
        enumerable: true,
      })
    }
  }

  static method() {
    return function (target: any, name: PropertyKey) {
      Object.defineProperty(target.constructor.prototype, name, {
        get() {
          if (typeof name === 'string') {
            if (name.startsWith('read')) {
              return (...args: Array<any>) => this.read(name.substring('read'.length).toLowerCase(), ...args)
            } else if (name.startsWith('write')) {
              return (...args: Array<any>) => this.write(name.substring('write'.length).toLowerCase(), ...args)
            }
          }
          return undefined
        },
        configurable: true,
        enumerable: true,
      })
    }
  }

  cursor = 0

  constructor(
    source: BufferSource,
    byteOffset?: number,
    byteLength?: number,
    public littleEndian?: boolean,
  ) {
    super(toBuffer(source), byteOffset as any, byteLength as any)
  }

  getColumn(column: Column): any {
    if (column.size) {
      const array = Array.from({ length: column.size }, (_, i) => {
        return this.read(column.type, column.offset + i)
      })
      switch (column.type) {
        case 'char':
          return array.join('')
        default:
          return array
      }
    } else {
      return this.read(column.type, column.offset)
    }
  }

  setColumn(column: Column, value: any): any {
    if (column.size) {
      // eslint-disable-next-line array-callback-return
      Array.from({ length: column.size }, (_, i) => {
        this.write(column.type, value[i], column.offset + i)
      })
    } else {
      this.write(column.type, value, column.offset)
    }
  }

  read(type: DataType, byteOffset = this.cursor, littleEndian = this.littleEndian) {
    switch (type) {
      case 'char':
        return this.readChar(byteOffset)
      case 'fixed':
        return this.readFixed(byteOffset, littleEndian)
      case 'longDateTime':
        return this.readLongDateTime(byteOffset, littleEndian)
    }
    const method = `get${ type.replace(/^\S/, s => s.toUpperCase()) }`
    const result = (this as any)[method](byteOffset, littleEndian)
    this.cursor += (dataTypeToByteLength as any)[type]
    return result
  }

  readBytes(byteOffset: number, length?: number): Array<number> {
    if (length == null) {
      length = byteOffset
      byteOffset = this.cursor
    }
    const array = []
    for (let i = 0; i < length; ++i) {
      array.push(this.getUint8(byteOffset + i))
    }
    this.cursor = byteOffset + length
    return array
  }

  readString(byteOffset: number, length?: number): string {
    if (length === undefined) {
      length = byteOffset
      byteOffset = this.cursor
    }
    let value = ''
    for (let i = 0; i < length; ++i) {
      value += String.fromCharCode(this.readUint8(byteOffset + i))
    }
    this.cursor = byteOffset + length
    return value
  }

  readFixed(byteOffset?: number, littleEndian?: boolean): number {
    const val = this.readInt32(byteOffset, littleEndian) / 65536.0
    return Math.ceil(val * 100000) / 100000
  }

  readLongDateTime(byteOffset = this.cursor, littleEndian?: boolean): Date {
    const time = this.readUint32(byteOffset + 4, littleEndian)
    const date = new Date()
    date.setTime(time * 1000 + -2077545600000)
    return date
  }

  readChar(byteOffset: number) {
    return this.readString(byteOffset, 1)
  }

  write(type: DataType, value: any, byteOffset = this.cursor, littleEndian = this.littleEndian) {
    switch (type) {
      case 'char':
        return this.writeChar(value, byteOffset)
      case 'fixed':
        return this.writeFixed(value, byteOffset)
      case 'longDateTime':
        return this.writeLongDateTime(value, byteOffset)
    }
    const method = `set${ type.replace(/^\S/, s => s.toUpperCase()) }`
    const result = (this as any)[method](byteOffset, value, littleEndian)
    this.cursor += (dataTypeToByteLength as any)[type.toLowerCase()]
    return result
  }

  writeString(str = '', byteOffset = this.cursor) {
    // eslint-disable-next-line no-control-regex
    const length = str.replace(/[^\x00-\xFF]/g, '11').length
    this.seek(byteOffset)
    for (let i = 0, l = str.length, charCode; i < l; ++i) {
      charCode = str.charCodeAt(i) || 0
      if (charCode > 127) {
        this.writeUint16(charCode)
      } else {
        this.writeUint8(charCode)
      }
    }
    this.cursor += length
    return this
  }

  writeChar(value: string, byteOffset?: number) {
    return this.writeString(value, byteOffset)
  }

  writeFixed(value: number, byteOffset?: number) {
    this.writeInt32(Math.round(value * 65536), byteOffset)
    return this
  }

  writeLongDateTime(value: any, byteOffset = this.cursor) {
    const delta = -2077545600000
    if (typeof value === 'undefined') {
      value = delta
    } else if (typeof value.getTime === 'function') {
      value = value.getTime()
    } else if (/^\d+$/.test(value)) {
      value = +value
    } else {
      value = Date.parse(value)
    }
    const time = Math.round((value - delta) / 1000)
    this.writeUint32(0, byteOffset)
    this.writeUint32(time, byteOffset + 4)
    return this
  }

  writeBytes(value: DataView | Array<number>, byteOffset = this.cursor): this {
    let len
    if (ArrayBuffer.isView(value)) {
      len = value.byteLength
      for (let i = 0; i < len; ++i) {
        this.setUint8(byteOffset + i, value.getUint8(i))
      }
    } else {
      len = value.length
      for (let i = 0; i < len; ++i) {
        this.setUint8(byteOffset + i, value[i])
      }
    }
    this.cursor = byteOffset + len
    return this
  }

  seek(byteOffset: number): this {
    this.cursor = byteOffset
    return this
  }
}
