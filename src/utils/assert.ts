import { PKG_NAME } from './constants'

export function assert(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`[${PKG_NAME}] ${msg}`)
  }
}
