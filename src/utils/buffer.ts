export function toBuffer(source: BufferSource): ArrayBuffer {
  if ('buffer' in source) {
    const buffer = source.buffer as ArrayBuffer
    if (source.byteOffset > 0 || source.byteLength < source.buffer.byteLength) {
      return buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
    }
    return buffer
  }
  else {
    return source
  }
}

export function toDataView(source: BufferSource): DataView {
  if ('buffer' in source) {
    return new DataView(source.buffer, source.byteOffset, source.byteLength)
  }
  else {
    return new DataView(source)
  }
}
