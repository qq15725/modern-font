import { toBuffer, toDataView } from '../utils'

export type DataType
  = | 'int8'
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

export class FontDataView extends DataView<ArrayBuffer> {
  cursor = 0

  readInt8 = (byteOffset?: number): number => this.read('int8', byteOffset)
  readInt16 = (byteOffset?: number, littleEndian?: boolean): number => this.read('int16', byteOffset, littleEndian)
  readInt32 = (byteOffset?: number, littleEndian?: boolean): number => this.read('int32', byteOffset, littleEndian)
  readUint8 = (byteOffset?: number): number => this.read('uint8', byteOffset)
  readUint16 = (byteOffset?: number, littleEndian?: boolean): number => this.read('uint16', byteOffset, littleEndian)
  readUint32 = (byteOffset?: number, littleEndian?: boolean): number => this.read('uint32', byteOffset, littleEndian)
  readFloat32 = (byteOffset?: number, littleEndian?: boolean): number => this.read('float32', byteOffset, littleEndian)
  readFloat64 = (byteOffset?: number, littleEndian?: boolean): number => this.read('float64', byteOffset, littleEndian)
  writeInt8 = (value: number, byteOffset?: number): this => this.write('int8', value, byteOffset)
  writeInt16 = (value: number, byteOffset?: number, littleEndian?: boolean): this => this.write('int16', value, byteOffset, littleEndian)
  writeInt32 = (value: number, byteOffset?: number, littleEndian?: boolean): this => this.write('int32', value, byteOffset, littleEndian)
  writeUint8 = (value: number, byteOffset?: number): this => this.write('uint8', value, byteOffset)
  writeUint16 = (value: number, byteOffset?: number, littleEndian?: boolean): this => this.write('uint16', value, byteOffset, littleEndian)
  writeUint32 = (value: number, byteOffset?: number, littleEndian?: boolean): this => this.write('uint32', value, byteOffset, littleEndian)
  writeFloat32 = (value: number, byteOffset?: number, littleEndian?: boolean): this => this.write('float32', value, byteOffset, littleEndian)
  writeFloat64 = (value: number, byteOffset?: number, littleEndian?: boolean): this => this.write('float64', value, byteOffset, littleEndian)

  constructor(
    source: BufferSource,
    byteOffset?: number,
    byteLength?: number,
    public littleEndian?: boolean,
  ) {
    super(toBuffer(source), byteOffset as any, byteLength as any)
  }

  readColumn(column: Column): any {
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

  writeColumn(column: Column, value: any): any {
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
    let result
    switch (type) {
      case 'int8':
        result = this.getInt8(byteOffset)
        break
      case 'int16':
        result = this.getInt16(byteOffset, littleEndian)
        break
      case 'int32':
        result = this.getInt32(byteOffset, littleEndian)
        break
      case 'uint8':
        result = this.getUint8(byteOffset)
        break
      case 'uint16':
        result = this.getUint16(byteOffset, littleEndian)
        break
      case 'uint32':
        result = this.getUint32(byteOffset, littleEndian)
        break
      case 'float32':
        result = this.getFloat32(byteOffset, littleEndian)
        break
      case 'float64':
        result = this.getFloat64(byteOffset, littleEndian)
        break
      case 'fixed':
        result = this.readFixed(byteOffset, littleEndian)
        break
      case 'longDateTime':
        result = this.readLongDateTime(byteOffset, littleEndian)
        break
      case 'char':
        result = this.readChar(byteOffset)
        break
    }
    this.cursor += dataTypeToByteLength[type]
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
    const bytes = this.readBytes(byteOffset, length)
    let str = ''
    for (let i = 0, len = bytes.length; i < len; i++) {
      str += String.fromCharCode(bytes[i])
    }
    return str
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

  write(type: DataType, value: any, byteOffset = this.cursor, littleEndian = this.littleEndian): this {
    switch (type) {
      case 'int8':
        this.setInt8(byteOffset, value)
        break
      case 'int16':
        this.setInt16(byteOffset, value, littleEndian)
        break
      case 'int32':
        this.setInt32(byteOffset, value, littleEndian)
        break
      case 'uint8':
        this.setUint8(byteOffset, value)
        break
      case 'uint16':
        this.setUint16(byteOffset, value, littleEndian)
        break
      case 'uint32':
        this.setUint32(byteOffset, value, littleEndian)
        break
      case 'float32':
        this.setFloat32(byteOffset, value, littleEndian)
        break
      case 'float64':
        this.setFloat64(byteOffset, value, littleEndian)
        break
      case 'char':
        this.writeChar(value, byteOffset)
        break
      case 'fixed':
        this.writeFixed(value, byteOffset)
        break
      case 'longDateTime':
        this.writeLongDateTime(value, byteOffset)
        break
    }
    this.cursor += dataTypeToByteLength[type]
    return this
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

  writeBytes(value: BufferSource | number[], byteOffset = this.cursor): this {
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
