import { defineColumn, getUCS2String, getUTF8String } from '../utils'
import { defineSfntTable } from './Sfnt'
import { SfntTable } from './SfntTable'

const nameId = {
  0: 'copyright',
  1: 'fontFamily',
  2: 'fontSubFamily',
  3: 'uniqueSubFamily',
  4: 'fullName',
  5: 'version',
  6: 'postScriptName',
  7: 'tradeMark',
  8: 'manufacturer',
  9: 'designer',
  10: 'description',
  11: 'urlOfFontVendor',
  12: 'urlOfFontDesigner',
  13: 'licence',
  14: 'urlOfLicence',
  16: 'preferredFamily',
  17: 'preferredSubFamily',
  18: 'compatibleFull',
  19: 'sampleText',
}

const platforms = {
  Unicode: 0,
  Macintosh: 1, // mac
  reserved: 2,
  Microsoft: 3, // win
}

// mac encoding id
const mac = {
  'Default': 0, // default use
  'Version1.1': 1,
  'ISO10646': 2,
  'UnicodeBMP': 3,
  'UnicodenonBMP': 4,
  'UnicodeVariationSequences': 5,
  'FullUnicodecoverage': 6,
}

// windows encoding id
const win = {
  Symbol: 0,
  UCS2: 1, // default use
  ShiftJIS: 2,
  PRC: 3,
  BigFive: 4,
  Johab: 5,
  UCS4: 6,
}

/**
 * @link https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6name.html
 */
@defineSfntTable('name')
export class Name extends SfntTable {
  @defineColumn('uint16') declare format: number
  @defineColumn('uint16') declare count: number
  @defineColumn('uint16') declare stringOffset: number

  protected _names?: Record<string, any>
  get names(): Record<string, any> {
    return this._names ??= this.readNames()
  }

  readNames(): Record<string, any> {
    const count = this.count
    this.view.seek(6)
    const nameRecords: Record<string, any>[] = []
    for (let i = 0; i < count; ++i) {
      nameRecords.push({
        platform: this.view.readUint16(),
        encoding: this.view.readUint16(),
        language: this.view.readUint16(),
        nameId: this.view.readUint16(),
        length: this.view.readUint16(),
        offset: this.view.readUint16(),
      })
    }
    const offset = this.stringOffset
    for (let i = 0; i < count; ++i) {
      const nameRecord = nameRecords[i]
      nameRecord.name = this.view.readBytes(
        offset + nameRecord.offset,
        nameRecord.length,
      )
    }

    let platform = platforms.Macintosh
    let encoding = mac.Default
    let language = 0
    if (
      nameRecords.some(
        record => record.platform === platforms.Microsoft
          && record.encoding === win.UCS2
          && record.language === 1033,
      )
    ) {
      platform = platforms.Microsoft
      encoding = win.UCS2
      language = 1033
    }

    const names: Record<string, any> = {}
    for (let i = 0; i < count; ++i) {
      const nameRecord = nameRecords[i]
      if (
        nameRecord.platform === platform
        && nameRecord.encoding === encoding
        && nameRecord.language === language
        && (nameId as any)[nameRecord.nameId]
      ) {
        names[(nameId as any)[nameRecord.nameId]] = language === 0
          ? getUTF8String(nameRecord.name)
          : getUCS2String(nameRecord.name)
      }
    }
    return names
  }
}
