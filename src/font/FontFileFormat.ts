import { Readable } from '../utils'

export abstract class FontFileFormat extends Readable {
  readonly abstract mimeType: string

  toBlob(): Blob {
    return new Blob(
      [new Uint8Array(this.view.buffer, this.view.byteOffset, this.view.byteLength)],
      { type: this.mimeType },
    )
  }

  toFontFace(family: string): FontFace {
    return new FontFace(family, this.view.buffer)
  }
}
