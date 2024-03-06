import { dataTypeToByteLength } from './data-type'
import type { DataType } from './data-type'

export class ReadWriter extends DataView {
  @ReadWriter.method() declare readInt8: (byteOffset?: number) => number
  @ReadWriter.method() declare readInt16: (byteOffset?: number, littleEndian?: boolean) => number
  @ReadWriter.method() declare readInt32: (byteOffset?: number, littleEndian?: boolean) => number
  @ReadWriter.method() declare readUint8: (byteOffset?: number) => number
  @ReadWriter.method() declare readUint16: (byteOffset?: number, littleEndian?: boolean) => number
  @ReadWriter.method() declare readUint32: (byteOffset?: number, littleEndian?: boolean) => number
  @ReadWriter.method() declare readFloat32: (byteOffset?: number, littleEndian?: boolean) => number
  @ReadWriter.method() declare readFloat64: (byteOffset?: number, littleEndian?: boolean) => number
  @ReadWriter.method() declare writeInt8: (value: number, byteOffset?: number) => this
  @ReadWriter.method() declare writeInt16: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @ReadWriter.method() declare writeInt32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @ReadWriter.method() declare writeUint8: (value: number, byteOffset?: number) => this
  @ReadWriter.method() declare writeUint16: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @ReadWriter.method() declare writeUint32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @ReadWriter.method() declare writeFloat32: (value: number, byteOffset?: number, littleEndian?: boolean) => this
  @ReadWriter.method() declare writeFloat64: (value: number, byteOffset?: number, littleEndian?: boolean) => this

  protected static method() {
    return function (target: ReadWriter, name: PropertyKey) {
      Object.defineProperty(target.constructor.prototype, name, {
        get() {
          if (typeof name === 'string') {
            if (name.startsWith('read')) {
              return (...args) => this.read(name.substring('read'.length).toLowerCase(), ...args)
            } else if (name.startsWith('write')) {
              return (...args) => this.write(name.substring('write'.length).toLowerCase(), ...args)
            }
          }
          return undefined
        },
        configurable: true,
        enumerable: true,
      })
    }
  }

  constructor(
    buffer: ArrayBuffer,
    public offset = 0,
    public littleEndian?: boolean,
  ) {
    super(buffer)
  }

  read(type: DataType, byteOffset = this.offset, littleEndian = this.littleEndian) {
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
    this.offset += dataTypeToByteLength[type]
    return result
  }

  readBytes(byteOffset: number, length?: number): Array<number> {
    if (length == null) {
      length = byteOffset
      byteOffset = this.offset
    }
    const array = []
    for (let i = 0; i < length; ++i) {
      array.push(this.getUint8(byteOffset + i))
    }
    this.offset = byteOffset + length
    return array
  }

  readString(byteOffset: number, length?: number): string {
    if (length === undefined) {
      length = byteOffset
      byteOffset = this.offset
    }
    let value = ''
    for (let i = 0; i < length; ++i) {
      value += String.fromCharCode(this.readUint8(byteOffset + i))
    }
    this.offset = byteOffset + length
    return value
  }

  readFixed(byteOffset = this.offset, littleEndian?: boolean): number {
    const val = this.readInt32(byteOffset, littleEndian) / 65536.0
    return Math.ceil(val * 100000) / 100000
  }

  readLongDateTime(byteOffset = this.offset, littleEndian?: boolean): Date {
    const time = this.readUint32(byteOffset + 4, littleEndian)
    const date = new Date()
    date.setTime(time * 1000 + -2077545600000)
    return date
  }

  readChar(byteOffset: number) {
    return this.readString(byteOffset, 1)
  }

  write(type: DataType, value: number, byteOffset = this.offset, littleEndian = this.littleEndian) {
    const method = `set${ type.replace(/^\S/, s => s.toUpperCase()) }`
    const result = (this as any)[method](byteOffset, value, littleEndian)
    this.offset += dataTypeToByteLength[type.toLowerCase()]
    return result
  }

  writeBytes(value: ArrayBuffer | Array<number>, length?: number, byteOffset = this.offset): this {
    if (value instanceof ArrayBuffer) {
      length ??= value.byteLength
      const view = new DataView(value, 0, length)
      for (let i = 0; i < length; ++i) {
        this.setUint8(byteOffset + i, view.getUint8(i))
      }
    } else {
      length ??= value.length
      for (let i = 0; i < length; ++i) {
        this.setUint8(byteOffset + i, value[i])
      }
    }
    this.offset = byteOffset + length
    return this
  }

  seek(byteOffset: number): this {
    this.offset = byteOffset
    return this
  }
}
