import type { CffIndex } from './CffIndex'
import { Readable } from '../utils'
import { getCffString } from './CffString'

export type CffDictPropType = 'string' | 'number' | 'number[]'

export interface CffDictProp {
  type: CffDictPropType
  operator: number
  default?: any
}

export function defineCffDictProp(operator: number, type: CffDictPropType = 'number', defaultValue?: any) {
  return (target: any, name: PropertyKey) => {
    if (typeof name !== 'string')
      return
    const prop: CffDictProp = {
      type,
      operator,
      default: defaultValue ?? type === 'number' ? 0 : undefined,
    }
    Object.defineProperty(target.constructor.prototype, name, {
      get() { return (this as CffDict)._getProp(prop) },
      set(value) { (this as CffDict)._setProp(prop, value) },
      configurable: true,
      enumerable: true,
    })
  }
}

export class CffDict extends Readable {
  protected _dict?: Record<number, number[]>
  get dict(): Record<number, number[]> {
    return this._dict ??= this._readDict()
  }

  protected _stringIndex?: CffIndex<string>
  setStringIndex(val: CffIndex<string>): this {
    this._stringIndex = val
    return this
  }

  protected _readFloatOperand(): number {
    const reader = this.view
    let s = ''
    const eof = 15
    const lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'E', 'E-', null, '-']
    while (true) {
      const b = reader.readUint8()
      const n1 = b >> 4
      const n2 = b & 15
      if (n1 === eof) {
        break
      }
      s += lookup[n1]
      if (n2 === eof) {
        break
      }
      s += lookup[n2]
    }
    return Number.parseFloat(s)
  }

  protected _readOperand(b0: number): number {
    const reader = this.view
    let b1
    let b2
    let b3
    let b4
    if (b0 === 28) {
      b1 = reader.readUint8()
      b2 = reader.readUint8()
      return b1 << 8 | b2
    }
    if (b0 === 29) {
      b1 = reader.readUint8()
      b2 = reader.readUint8()
      b3 = reader.readUint8()
      b4 = reader.readUint8()
      return b1 << 24 | b2 << 16 | b3 << 8 | b4
    }
    if (b0 === 30) {
      return this._readFloatOperand()
    }
    if (b0 >= 32 && b0 <= 246) {
      return b0 - 139
    }
    if (b0 >= 247 && b0 <= 250) {
      b1 = reader.readUint8()
      return (b0 - 247) * 256 + b1 + 108
    }
    if (b0 >= 251 && b0 <= 254) {
      b1 = reader.readUint8()
      return -(b0 - 251) * 256 - b1 - 108
    }
    throw new Error(`invalid b0 ${b0}, at: ${reader.cursor}`)
  }

  protected _readDict(): Record<number, number[]> {
    const reader = this.view
    reader.seek(0)
    let operands: number[] = []
    const lastOffset = reader.cursor + reader.byteLength
    const dict: Record<number, number[]> = {}
    while (reader.cursor < lastOffset) {
      let op = reader.readUint8()
      if (op <= 21) {
        if (op === 12) {
          op = 1200 + reader.readUint8()
        }
        dict[op] = operands
        operands = []
      }
      else {
        operands.push(this._readOperand(op))
      }
    }
    return dict
  }

  _getProp(prop: CffDictProp): any {
    const value = this.dict[prop.operator] ?? prop.default
    switch (prop.type) {
      case 'number':
        return value[0]
      case 'string':
        return getCffString(this._stringIndex?.objects ?? [], value[0])
      case 'number[]':
        return value
    }
    return value
  }

  _setProp(_prop: CffDictProp, _value: any): void {
    // TODO
  }
}
