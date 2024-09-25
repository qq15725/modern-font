export function toBuffer(source: BufferSource): ArrayBuffer {
  if (ArrayBuffer.isView(source)) {
    if (source.byteOffset > 0 || source.byteLength < source.buffer.byteLength) {
      return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
    }
    return source.buffer
  }
  else {
    return source
  }
}

export function toDataView(source: BufferSource): DataView {
  if (ArrayBuffer.isView(source)) {
    return new DataView(source.buffer, source.byteOffset, source.byteLength)
  }
  else {
    return new DataView(source)
  }
}
