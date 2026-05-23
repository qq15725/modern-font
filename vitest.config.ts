import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Tests run heavy zlib (de)compression and glyph parsing on a 3 MB CJK font;
    // under parallel load (and the deliberately slow async/worker path) the
    // default 5s per-test timeout is too tight.
    testTimeout: 30_000,
  },
})
