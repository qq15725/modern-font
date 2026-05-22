# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`modern-font` is a zero-runtime-dependency (except `fflate`) JavaScript/TypeScript font codec: it decodes, encodes, format-converts (TTF/OTF/WOFF/EOT), extracts glyph outlines as SVG path commands, and subsets/minifies fonts. It targets both browser and Node.

## Commands

```bash
pnpm dev          # vite dev server serving docs/ (live playground, see docs/main.ts)
pnpm build        # vite build (UMD bundle) + unbuild (ESM/CJS + .d.ts) → dist/
pnpm lint         # eslint src  (@antfu/eslint-config, type: 'lib')
pnpm test         # vitest (watch); CI uses the same command
pnpm typecheck    # tsc --noEmit
pnpm start        # tsx src/index.ts (ad-hoc script entry)

vitest run test/nodejs.test.ts          # run one test file once
vitest run -t 'minify woff'             # run a single test by name
```

`pnpm release` runs `bumpp` (bumps version, commits `release: v%s`, tags, pushes); pushing a `v*` tag triggers npm publish + GitHub release via Actions. Commits must follow the Angular convention (see `.github/commit-convention.md`) — `conventional-changelog` generates `CHANGELOG.md` from them.

## Core architecture

The codebase is four layers, each re-exported through an `index.ts` (a new module must be added to its layer's `index.ts` or it won't be exported):

```
core/   →  sfnt/  →  font/  →  minify/
```

### core/ — declarative binary struct mapping (the foundation)

Fonts are big-endian binary structs. `FontDataView` extends the native `DataView` with a `cursor`, typed read/write helpers, and font-specific types (`fixed`, `longDateTime`, `char`). `FontDataObject` wraps a `FontDataView` over a `(source, byteOffset, byteLength)` slice.

The key pattern is the **`@defineColumn(type)` decorator**: instead of manual offset math, you declare fields on a class and each becomes a getter/setter (via `Object.defineProperty` on the prototype) that reads/writes the backing `DataView` at an auto-computed offset.

```ts
@defineSFNTTable('head')
export class Head extends SFNTTable {
  @defineColumn('fixed')  declare version: number       // offset 0
  @defineColumn('uint16') declare unitsPerEm: number    // offset computed from prior columns
  @defineColumn({ type: 'uint8', size: 10 }) declare panose: number[]  // array column
}
```

Consequences to respect when editing tables:
- **Declaration order defines byte layout.** Offsets accumulate sequentially unless an explicit `offset` is given. Reordering decorated fields changes the binary format.
- Decorated fields use `declare` and must **not** be initialized — they have no real backing storage, only the prototype accessor.
- This relies on `experimentalDecorators`. It is enabled in both `tsconfig.json` and `build.config.ts` (the unbuild/esbuild path re-specifies it). Keep both in sync.

### sfnt/ — the SFNT table container and font tables

`SFNT` is the in-memory model shared by TTF/OTF/WOFF. It holds `tableViews: Map<tag, DataView>` (raw bytes per table, e.g. `'head'`, `'glyf'`, `'CFF '`) and lazily instantiates table objects on access.

The **`@defineSFNTTable(tag)` decorator** registers a table class in `SFNT.tableDefinitions` and installs a lazy getter/setter on `SFNT.prototype` (e.g. `sfnt.head` calls `sfnt.get('head')`, constructing the `Head` from its `DataView` only on first access and caching it). Each table extends `SFNTTable extends FontDataObject` and back-references its `SFNT` via `setSFNT`/`getSFNT` (needed for cross-table reads, e.g. `loca` + `glyf`).

Tables expose a static **`.from(...)` factory** that builds a fresh table from high-level data (e.g. `Glyf.from(views)`, `Loca.from(offsets, format)`, `Cmap.from(unicodeToGlyphIndexMap)`). This is how new fonts are encoded.

High-level glyph/text APIs live on `SFNT`: `charToGlyph`, `textToGlyphs`, `getPathCommands(text, x, y, fontSize)`, `getAdvanceWidth`, `forEachGlyph`. Glyph data is reached through a **`GlyphSet`** (`GlyfGlyphSet` for TrueType `glyf`, `CffGlyphSet` for OpenType `CFF `) which lazily parses individual `Glyph`s on `get(index)`. `sfnt.hasGlyf` selects the TrueType vs CFF path throughout.

### font/ — file-format containers

`BaseFont extends FontDataObject` provides output helpers: `toBuffer()`, `toBlob()`, `toFontFace(family)`, plus `format`/`mimeType`. Concrete formats:

- `TTF` / `OTF` (OTF extends TTF, differs by signature) — `glyf`-based, table directory.
- `WOFF` — wraps SFNT tables with optional per-table zlib compression (`fflate`).
- `EOT` — IE Embedded OpenType, derived from a TTF.

Each format follows the same trio:
- `static is(source)` — detect by reading the 4-byte signature (`TTF.signature`, etc.).
- `static from(sfnt)` — **encode**: lay out header + table directory + (padded to 4 bytes via `round4`) table data into a new buffer.
- `get sfnt` → `createSFNT()` — **decode**: build an `SFNT` from the file's table directory (WOFF decompresses here).

`parseSFNTFont(source)` / `parseFont(source)` dispatch on signature to the right format class (both accept `orFail = false` to return `undefined` instead of throwing).

`Fonts` (and the singleton `fonts`) is a browser-oriented async loader/cache: dedupes in-flight `fetch`es, maps font-family ↔ url, optionally injects `@font-face` / `<style>` and waits via `document.fonts`. `getFont()`/`getSFNT()` on a load result parse lazily. Guarded by `typeof document !== 'undefined'` so it no-ops server-side.

### minify/ — subsetting pipeline

`minifyFont(source, subset)` → `minifySFNT(sfnt, subset)` → `minifyGlyphs(sfnt, subset)`. It keeps only the glyphs whose unicodes appear in `subset` (plus `.notdef` and any composite-glyph components), then rebuilds `loca`, `glyf`, `cmap`, `hmtx`/`vmtx`, `maxp`, `post`, and drops `GPOS`/`GSUB`/`hdmx`. `minifyFont` preserves the input form: a `TTF`/`WOFF` instance in → same class out; an `ArrayBuffer` in → `ArrayBuffer` out (format inferred from signature).

**Minify currently supports TrueType (`glyf`) fonts only — CFF/OpenType subsetting is a TODO** (see comments in `minifyGlyphs.ts`/`minifySFNT.ts`). WOFF2 is also unimplemented (README TODO).

## Conventions & gotchas

- **Endianness**: font data is big-endian; `littleEndian` defaults to undefined/false throughout. Don't pass little-endian unless a sub-format requires it.
- **Lazy everywhere**: tables, glyphs, and parsed fonts are constructed on first access and cached. Mutating a table object updates the live `DataView`; encoding re-reads from `tableViews`.
- `dist/` is committed but git-ignored content is regenerated by `pnpm build` — don't hand-edit it.
- Spec links are in JSDoc above each table/format class; consult them before changing byte layouts.
