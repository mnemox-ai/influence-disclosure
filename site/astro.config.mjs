import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'static',
  // zh-TW is the default and lives at /, English at /en/
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Safe to inline now that the CJK font is subset: the whole sheet is ~18 kB, and
  // inlining removes a render-blocking request. With the general-purpose unicode-range
  // font build this was 395 kB and had to stay external.
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
})
