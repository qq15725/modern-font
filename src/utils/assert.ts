export function assert(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`[modern-font] ${msg}`)
  }
}
