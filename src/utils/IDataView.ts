import { toBuffer, toDataView } from './buffer'

export type DataType =
  | 'int8'
  | 'int16'
  | 'int32'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'float32'
  | 'float64'
  | 'fixed'
  | 'longDateTime'
  | 'char'

export const dataTypeToByteLength: Record<DataType, number> = {
  int8: 1,
  int16: 2,
  int32: 4,
  uint8: 1,
  uint16: 2,
  uint32: 4,
  float32: 4,
  float64: 8,
  fixed: 4,
  longDateTime: 8,
  char: 1,
}

export interface Column {
  name: string
  type: DataType
  offset: number
  byteLength: number
  size?: number
  default?: any
}

export function defineMethod() {
  return function (target: any, name: PropertyKey) {
    Object.defineProperty(target.constructor.prototype, name, {
      get() {
        if (typeof name === 'string') {
          if (name.startsWith('read')) {
            // @ts-expect-error ...args
            return (...args: any[]) => (this as IDataView).read(name.substring('read'.length).toLowerCase(), ...args)
          }
          else if (name.startsWith('write')) {
            // @ts-expect-error ...args
            return (...args: any[]) => (this as IDataView).write(name.substring('write'.length).toLowerCase(), ...args)
          }
        }
        return undefined
      },
      configurable: true,
      enumerable: true,
    })
  }
}

export class IDataView extends DataView {
  @defineMethod() declare readInt8: (byteOffset?: number) => number
  @defineMethod() declare readInt16: (byteOffset?: number, littleEndian?: boolean) => number
  @defineMethod() declare readInt32: (byteOffset?: number, littleEndian?: boolean) => number
  @defineMethod() declare readUint8: (byteOffset?: number) => number
  @defineMethod() declare readUint16: (byteOffset?: number, littleEndian?: boolean) => number
  @defineMethod() declare readUint32: (byteOffset?: number, littleEndian?: boolean) => number
  @defineMethod() declare readFloat32: (byteOffset?: number, littleEndian?: boolean) => number
  @defineMethod() declare readFloat64: (byteOffset?: number, littleEndian?: boolean) => number
  @defineMethod() declare writeInt8: (value: number, byteOffset?: number) => this
  @defineMethod() declare writeInt16: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @defineMethod() declare writeInt32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @defineMethod() declare writeUint8: (value: number, byteOffset?: number) => this
  @defineMethod() declare writeUint16: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @defineMethod() declare writeUint32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @defineMethod() declare writeFloat32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @defineMethod() declare writeFloat64: (value: number, byteOffset?: number, littleEndian?: boolean) => this

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
    }
    else {
      return this.read(column.type, column.offset)
    }
  }

  setColumn(column: Column, value: any): any {
    if (column.size) {
      // eslint-disable-next-line array-callback-return
      Array.from({ length: column.size }, (_, i) => {
        this.write(column.type, value[i], column.offset + i)
      })
    }
    else {
      this.write(column.type, value, column.offset)
    }
  }

  read(type: DataType, byteOffset = this.cursor, littleEndian = this.littleEndian): any {
    switch (type) {
      case 'char':
        return this.readChar(byteOffset)
      case 'fixed':
        return this.readFixed(byteOffset, littleEndian)
      case 'longDateTime':
        return this.readLongDateTime(byteOffset, littleEndian)
    }
    const method = `get${type.replace(/^\S/, s => s.toUpperCase())}`
    const result = (this as any)[method](byteOffset, littleEndian)
    this.cursor += (dataTypeToByteLength as any)[type]
    return result
  }

  readUint24(byteOffset = this.cursor): number {
    const [i, j, k] = this.readBytes(byteOffset, 3)
    return (i << 16) + (j << 8) + k
  }

  readBytes(byteOffset: number, length?: number): number[] {
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

  readChar(byteOffset: number): string {
    return this.readString(byteOffset, 1)
  }

  write(type: DataType, value: any, byteOffset = this.cursor, littleEndian = this.littleEndian): any {
    switch (type) {
      case 'char':
        return this.writeChar(value, byteOffset)
      case 'fixed':
        return this.writeFixed(value, byteOffset)
      case 'longDateTime':
        return this.writeLongDateTime(value, byteOffset)
    }
    const method = `set${type.replace(/^\S/, s => s.toUpperCase())}`
    const result = (this as any)[method](byteOffset, value, littleEndian)
    this.cursor += (dataTypeToByteLength as any)[type.toLowerCase()]
    return result
  }

  writeString(str = '', byteOffset = this.cursor): this {
    // eslint-disable-next-line no-control-regex
    const length = str.replace(/[^\x00-\xFF]/g, '11').length
    this.seek(byteOffset)
    for (let i = 0, l = str.length, charCode; i < l; ++i) {
      charCode = str.charCodeAt(i) || 0
      if (charCode > 127) {
        this.writeUint16(charCode)
      }
      else {
        this.writeUint8(charCode)
      }
    }
    this.cursor += length
    return this
  }

  writeChar(value: string, byteOffset?: number): this {
    return this.writeString(value, byteOffset)
  }

  writeFixed(value: number, byteOffset?: number): this {
    this.writeInt32(Math.round(value * 65536), byteOffset)
    return this
  }

  writeLongDateTime(value: any, byteOffset = this.cursor): this {
    const delta = -2077545600000
    if (typeof value === 'undefined') {
      value = delta
    }
    else if (typeof value.getTime === 'function') {
      value = value.getTime()
    }
    else if (/^\d+$/.test(value)) {
      value = +value
    }
    else {
      value = Date.parse(value)
    }
    const time = Math.round((value - delta) / 1000)
    this.writeUint32(0, byteOffset)
    this.writeUint32(time, byteOffset + 4)
    return this
  }

  writeBytes(value: BufferSource | Array<number>, byteOffset = this.cursor): this {
    let len
    if (Array.isArray(value)) {
      len = value.length
      for (let i = 0; i < len; ++i) {
        this.setUint8(byteOffset + i, value[i])
      }
    }
    else {
      const view = toDataView(value)
      len = view.byteLength
      for (let i = 0; i < len; ++i) {
        this.setUint8(byteOffset + i, view.getUint8(i))
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
