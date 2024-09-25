function stringify(str: string): string {
  let newStr = ''
  for (let i = 0, l = str.length, ch; i < l; i++) {
    ch = str.charCodeAt(i)
    if (ch === 0) {
      continue
    }
    newStr += String.fromCharCode(ch)
  }
  return newStr
}

export function toUCS2Bytes(str: string): number[] {
  str = stringify(str)
  const byteArray = []
  for (let i = 0, l = str.length, ch; i < l; i++) {
    ch = str.charCodeAt(i)
    byteArray.push(ch >> 8)
    byteArray.push(ch & 0xFF)
  }
  return byteArray
}

export function getUTF8String(bytes: number[]): string {
  let str = ''
  for (let i = 0, l = bytes.length; i < l; i++) {
    if (bytes[i] < 0x7F) {
      str += String.fromCharCode(bytes[i])
    }
    else {
      str += `%${(256 + bytes[i]).toString(16).slice(1)}`
    }
  }
  return unescape(str)
}

export function getUCS2String(bytes: number[]): string {
  let str = ''
  for (let i = 0, l = bytes.length; i < l; i += 2) {
    str += String.fromCharCode((bytes[i] << 8) + bytes[i + 1])
  }
  return str
}
