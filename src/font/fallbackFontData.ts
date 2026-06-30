// 内嵌的极小「豆腐」兜底字体（glyf TTF，552 字节）。
// 只含一个 .notdef 实心方块 + 空 cmap：任意字符都落到 glyph 0，渲染成方块占位。
// 用途：Fonts.loadFallbackFont() 无参兜底链的最后一手——当 Local Font Access 不可用
// （非 Chromium / 未授权 / 无用户手势）时，至少保证文字不会因「无字体→glyph 宽度为 0」
// 而崩溃或整片空白。真正的排版字体（尤其 CJK）仍由应用按需加载。
//
// 由 scripts 手写生成（glyf 而非 CFF：glyf 下 cmap 未命中直接返回 glyph 0，
// 不会触碰 CFF charset 解析）。如需重新生成，见提交记录里的生成脚本。
export const EMBEDDED_FALLBACK_FONT_BASE64
  = 'AAEAAAAKAIAAAwAgT1MvMl9CWIkAAACsAAAAYGNtYXAADAAmAAABDAAAACRnbHlmA74GaAAAATAAAAAkaGVhZGEnQtkAAAFUAAAANmhoZWEFegHiAAABjAAAACRobXR4AlgAUAAAAbAAAAAEbG9jYQAAABIAAAG0AAAABG1heHAAAwAGAAABuAAAACBuYW1lAu8GwwAAAdgAAAAucG9zdP+fADIAAAIIAAAAIAADAlgBkAAFAAACigK8AAAAAAKKArwAAAHgADIBLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABOT05FAEAAIP//AyD/OAAAAyAAyAAAAAAAAAAAAAACvAAAACAAAAAAAAEAAwABAAAADAAEABgAAAACAAIAAAAA//8AAP//AAEAAAABAFAAAAIIArwAAwAAAQEBAQBQAbgAAP5IAAAAAAK8AAAAAAABAAAAAQAACGtGkV8PPPUACwPoAAAAAAAAAAAAAAAAAAAAAAAA/zgCCAK8AAAACAACAAAAAAAAAAEAAAMg/zgAAAJYAFAAUAIIAAEAAAAAAAAAAAAAAAAAAAABAlgAUAAAABIAAQAAAAEABAABAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAEAEgADAAEECQABABwAAABNAG8AZABlAHIAbgBGAGEAbABsAGIAYQBjAGsAAAADAAAAAAAA/5wAMgAAAAAAAAAAAAAAAAAAAAAAAAAA'

/** base64 → ArrayBuffer（`atob` 在浏览器与 Node 18+ 均为全局）。 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
