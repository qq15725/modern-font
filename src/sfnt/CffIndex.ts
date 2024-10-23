import { defineColumn, Readable } from '../utils'

export abstract class CffIndex<T extends string | number[]> extends Readable {
  @defineColumn('uint16') declare count: number
  @defineColumn('uint8') declare offsetSize: number

  protected abstract _isString: boolean
  declare objectOffset: number
  declare endOffset: number

  protected _offsets?: number[]
  get offsets(): number[] {
    return this._offsets ??= this.readOffsets()
  }

  protected _objects?: T[]
  get objects(): T[] {
    return this._objects ??= this.readObjects()
  }

  constructor(
    source: BufferSource,
    byteOffset?: number,
    byteLength?: number,
    littleEndian?: boolean,
  ) {
    super(source, byteOffset, byteLength, littleEndian)
    this._init()
  }

  protected _init(): void {
    const reader = this.view
    const count = this.count
    const offsetSize = this.offsetSize
    this.objectOffset = ((count + 1) * offsetSize) + 2
    this.endOffset = reader.byteOffset + this.objectOffset + this.offsets[count]
  }

  readOffsets(): number[] {
    const reader = this.view
    const count = this.count
    const offsetSize = this.offsetSize
    reader.seek(3)
    const offsets: number[] = []
    for (let i = 0, l = count + 1; i < l; i++) {
      const reader = this.view
      let v = 0
      for (let i = 0; i < offsetSize; i++) {
        v <<= 8
        v += reader.readUint8()
      }
      offsets.push(v)
    }
    return offsets
  }

  readObjects(): T[] {
    const objects: any[] = []
    for (let i = 0, len = this.count; i < len; i++) {
      objects.push(this.get(i))
    }
    return objects as any[]
  }

  get(index: number): T {
    const offsets = this.offsets
    const objectOffset = this.objectOffset
    const start = objectOffset + offsets[index]
    const end = objectOffset + offsets[index + 1]
    const len = end - start
    if (this._isString) {
      return this.view.readString(start, len) as any
    }
    else {
      return this.view.readBytes(start, len) as any
    }
  }
}

export class CffNumberIndex extends CffIndex<number[]> {
  protected _isString = false
}

export class CffStringIndex extends CffIndex<string> {
  protected _isString = true
}
