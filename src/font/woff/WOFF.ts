import type { SFNTTableTag } from '../../sfnt'
import { unzlib, unzlibSync, zlib, zlibSync } from 'fflate'
import { defineColumn } from '../../core'
import { SFNT } from '../../sfnt'
import { toDataView } from '../../utils'
import { BaseFont } from '../BaseFont'
import { OTF } from '../otf'
import { TTF } from '../ttf'
import { WOFFTableDirectoryEntry } from './WOFFTableDirectoryEntry'

interface WOFFTable {
  tag: string
  view: DataView<ArrayBuffer>
  rawView: DataView<ArrayBuffer>
}

function toUint8(view: DataView<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength) as Uint8Array<ArrayBuffer>
}

// fflate's async zlib/unzlib run on a worker pool in the browser, keeping the
// (de)compression off the main thread. Promisify them.
function zlibAsync(data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    zlib(data, (err, out) => (err ? reject(err) : resolve(out as Uint8Array<ArrayBuffer>)))
  })
}

function unzlibAsync(data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    unzlib(data, (err, out) => (err ? reject(err) : resolve(out as Uint8Array<ArrayBuffer>)))
  })
}

/**
 * WOFF
 *
 * @link https://www.w3.org/submissions/WOFF
 */
export class WOFF extends BaseFont {
  format = 'WOFF'
  mimeType = 'font/woff'
  @defineColumn('uint32') declare signature: number
  @defineColumn('uint32') declare flavor: number
  @defineColumn('uint32') declare length: number
  @defineColumn('uint16') declare numTables: number
  @defineColumn('uint16') declare reserved: number
  @defineColumn('uint32') declare totalSFNTSize: number
  @defineColumn('uint16') declare majorVersion: number
  @defineColumn('uint16') declare minorVersion: number
  @defineColumn('uint32') declare metaOffset: number
  @defineColumn('uint32') declare metaLength: number
  @defineColumn('uint32') declare metaOrigLength: number
  @defineColumn('uint32') declare privOffset: number
  @defineColumn('uint32') declare privLength: number

  get subfontFormat(): 'TrueType' | 'OpenType' | 'Open' {
    if (TTF.is(this.flavor)) {
      return 'TrueType'
    }
    else if (OTF.is(this.flavor)) {
      return 'OpenType'
    }
    else {
      return 'Open'
    }
  }

  protected _sfnt?: SFNT
  get sfnt(): SFNT {
    if (!this._sfnt) {
      this._sfnt = this.createSFNT()
    }
    return this._sfnt
  }

  static signature = new Set([
    0x774F4646, // wOFF
  ])

  static is(source: BufferSource | number): boolean {
    if (typeof source === 'number') {
      return this.signature.has(source)
    }
    else {
      return this.signature.has(toDataView(source).getUint32(0))
    }
  }

  static checkSum(source: BufferSource): number {
    const view = toDataView(source)
    const length = view.byteLength
    const nLongs = Math.floor(length / 4)
    let sum = 0
    let i = 0
    while (i < nLongs) {
      sum += view.getUint32(4 * i++, false)
    }
    let leftBytes = length - nLongs * 4
    if (leftBytes) {
      let offset = nLongs * 4
      while (leftBytes > 0) {
        sum += view.getUint8(offset) << (leftBytes * 8)
        offset++
        leftBytes--
      }
    }
    return sum % 0x100000000
  }

  /** Keep whichever of the raw/compressed view is smaller (WOFF stores per-table). */
  protected static _pickTable(tag: string, rawView: DataView<ArrayBuffer>, compressed: DataView<ArrayBuffer>): WOFFTable {
    return { tag, view: compressed.byteLength < rawView.byteLength ? compressed : rawView, rawView }
  }

  static from(sfnt: SFNT, rest = new ArrayBuffer(0)): WOFF {
    const tables = sfnt.tableTags.map((tag) => {
      const view = sfnt.getTableView(tag)!
      return this._pickTable(tag, view, toDataView(zlibSync(toUint8(view)) as Uint8Array<ArrayBuffer>))
    })
    return this._assemble(tables, rest)
  }

  /** Like {@link from}, but compresses tables off the main thread (fflate async). */
  static async fromAsync(sfnt: SFNT, rest = new ArrayBuffer(0)): Promise<WOFF> {
    const tables = await Promise.all(sfnt.tableTags.map(async (tag) => {
      const view = sfnt.getTableView(tag)!
      return this._pickTable(tag, view, toDataView(await zlibAsync(toUint8(view))))
    }))
    return this._assemble(tables, rest)
  }

  protected static _assemble(tables: WOFFTable[], rest: ArrayBuffer): WOFF {
    const round4 = (value: number): number => (value + 3) & ~3
    const numTables = tables.length
    const sfntSize = tables.reduce((total, table) => total + round4(table.view.byteLength), 0)
    const woff = new WOFF(
      new ArrayBuffer(
        44 // WOFFHeader
        + 20 * numTables // TableDirectory
        + sfntSize // FontTables
        + rest.byteLength,
      ),
    )
    woff.signature = 0x774F4646
    woff.flavor = 0x00010000
    woff.length = woff.view.byteLength
    woff.numTables = numTables
    woff.totalSFNTSize = 12 + 16 * numTables + tables.reduce((total, table) => total + round4(table.rawView.byteLength), 0)
    let dataOffset = 44 + numTables * 20
    let i = 0
    const directories = woff.getDirectories()
    tables.forEach((table) => {
      const dir = directories[i++]
      dir.tag = table.tag
      dir.offset = dataOffset
      dir.compLength = table.view.byteLength
      dir.origChecksum = WOFF.checkSum(table.rawView)
      dir.origLength = table.rawView.byteLength
      woff.view.writeBytes(table.view, dataOffset)
      dataOffset += round4(dir.compLength)
    })
    woff.view.writeBytes(rest)
    return woff
  }

  getDirectories(): WOFFTableDirectoryEntry[] {
    let offset = 44
    return Array.from({ length: this.numTables }, () => {
      const dir = new WOFFTableDirectoryEntry(this.view.buffer, offset)
      offset += dir.view.byteLength
      return dir
    })
  }

  protected _decodeTable(start: number, compLength: number, origLength: number): DataView<ArrayBuffer> {
    if (compLength >= origLength) {
      return new DataView(this.view.buffer, start, compLength)
    }
    const out = unzlibSync(new Uint8Array(this.view.buffer.slice(start, start + compLength)))
    return new DataView(out.buffer as ArrayBuffer, out.byteOffset, out.byteLength)
  }

  /** Decode lazily: each table is decompressed only on first access (see SFNT.getTableView). */
  createSFNT(): SFNT {
    const loaders = new Map<SFNTTableTag, () => DataView<ArrayBuffer>>()
    this.getDirectories().forEach((dir) => {
      const tag = dir.tag
      const start = this.view.byteOffset + dir.offset
      const compLength = dir.compLength
      const origLength = dir.origLength
      loaders.set(tag, () => this._decodeTable(start, compLength, origLength))
    })
    return new SFNT(undefined, loaders)
  }

  /** Decode eagerly but off the main thread (fflate async unzlib in parallel). */
  async createSFNTAsync(): Promise<SFNT> {
    const entries = await Promise.all(this.getDirectories().map(async (dir) => {
      const tag = dir.tag
      const start = this.view.byteOffset + dir.offset
      const compLength = dir.compLength
      const origLength = dir.origLength
      let view: DataView<ArrayBuffer>
      if (compLength >= origLength) {
        view = new DataView(this.view.buffer, start, compLength)
      }
      else {
        const out = await unzlibAsync(new Uint8Array(this.view.buffer.slice(start, start + compLength)))
        view = new DataView(out.buffer as ArrayBuffer, out.byteOffset, out.byteLength)
      }
      return [tag, view] as [SFNTTableTag, DataView<ArrayBuffer>]
    }))
    return new SFNT(new Map(entries))
  }
}
