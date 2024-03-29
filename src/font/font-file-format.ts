import { Entity } from '../utils'

export abstract class FontFileFormat extends Entity {
  readonly abstract mimeType: string

  toBlob(): Blob {
    return new Blob(
      [new Uint8Array(this.buffer, this.byteOffset, this.byteLength)],
      { type: this.mimeType },
    )
  }

  toFontFace(family: string): FontFace {
    return new FontFace(family, this.buffer)
  }
}
