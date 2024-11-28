import { FontDataObject } from '../core'

export abstract class BaseFont extends FontDataObject {
  abstract format: string
  abstract mimeType: string

  get buffer(): ArrayBuffer {
    return this.view.buffer
  }

  toBuffer(): ArrayBuffer {
    return this.view.buffer.slice(this.view.byteOffset, this.view.byteOffset + this.view.byteLength)
  }

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
