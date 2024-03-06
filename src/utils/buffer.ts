export function toBuffer(source: BufferSource): ArrayBuffer {
  if (ArrayBuffer.isView(source)) {
    if (source.byteOffset > 0 || source.byteLength < source.buffer.byteLength) {
      return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
    }
    return source.buffer
  } else {
    return source
  }
}
