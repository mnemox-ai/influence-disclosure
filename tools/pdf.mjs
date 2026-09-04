/**
 * Renders docs/ARTICLE-10-MAPPING.md to site/public/article-10-mapping.pdf.
 *
 * The site is black on white-text; the PDF is the opposite, because this one gets
 * printed and handed to a compliance officer.
 */
import puppeteer from 'puppeteer-core'
import { marked } from 'marked'
import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SRC = fileURLToPath(new URL('../docs/ARTICLE-10-MAPPING.md', import.meta.url))
const OUT_DIR = fileURLToPath(new URL('../site/public/', import.meta.url))
const OUT = `${OUT_DIR}article-10-mapping.pdf`

// Embed the same typeface the site uses, read from disk, so the PDF does not depend on
// which CJK fonts happen to be installed on the machine that renders it.
const FONT_DIR = fileURLToPath(new URL('../site/node_modules/@fontsource/noto-sans-tc/files/', import.meta.url))
const readCss = async (weight) => readFile(`${FONT_DIR}../${weight}.css`, 'utf8')

// The chinese-traditional subset carries the ideographs but not fullwidth punctuation
// （）：，；！？－, which fontsource keeps in four of its numbered subsets. Embedding the
// ideograph subset first and the numbered ones after (they declare unicode-range, so the
// later rule wins for the characters it covers) keeps every glyph in Noto Sans TC instead
// of letting Chrome fall back to a system face for the punctuation.
const PUNCT_SUBSETS = [112, 115, 118, 119]

const face = async (file, weight, range) => {
  const b64 = (await readFile(FONT_DIR + file)).toString('base64')
  return (
    `@font-face{font-family:'Noto Sans TC';font-style:normal;font-weight:${weight};` +
    `src:url(data:font/woff2;base64,${b64}) format('woff2');` +
    (range ? `unicode-range:${range};` : '') +
    '}'
  )
}

const facesFor = async (weight) => {
  const css = await readCss(weight)
  const out = [await face(`noto-sans-tc-chinese-traditional-${weight}-normal.woff2`, weight)]
  for (const n of PUNCT_SUBSETS) {
    const block = css.split('@font-face').find((b) => b.includes(`noto-sans-tc-${n}-${weight}-normal.woff2`))
    const range = block?.match(/unicode-range:\s*([^;}]+)/)?.[1]?.trim()
    out.push(await face(`noto-sans-tc-${n}-${weight}-normal.woff2`, weight, range))
  }
  return out.join('')
}

const fonts = (await Promise.all([400, 500].map(facesFor))).join('')

const md = await readFile(SRC, 'utf8')
const body = marked.parse(md, { gfm: true, breaks: false })

const html = `<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><title>第十條對照表</title>
<style>
${fonts}
  @page { size: A4; margin: 18mm 16mm 20mm; }
  :root { --ink:#111; --ink-2:#3d3d3d; --line:#dcdcdc; --accent:#0060c0; }
  * { box-sizing: border-box; }
  body {
    font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif;
    color: var(--ink); font-size: 10.5pt; line-height: 1.75; margin: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1, h2, h3 { font-weight: 500; }
  h1 { font-size: 20pt; line-height: 1.3; margin: 0 0 4pt; letter-spacing: -0.01em; }
  h2 { font-size: 13pt; margin: 20pt 0 6pt; padding-top: 8pt; border-top: 1px solid var(--line);
       break-after: avoid; letter-spacing: -0.01em; }
  h3 { font-size: 11pt; margin: 14pt 0 4pt; break-after: avoid; }
  p { margin: 0 0 7pt; }
  strong { font-weight: 500; }
  blockquote { margin: 8pt 0; padding: 8pt 12pt; border-left: 2.5pt solid var(--accent);
               background: #f4f8fd; color: var(--ink-2); break-inside: avoid; }
  blockquote p:last-child { margin-bottom: 0; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-size: 9.5pt; break-inside: auto; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th, td { border: 1px solid var(--line); padding: 5pt 7pt; text-align: left; vertical-align: top; }
  th { background: #f2f2f2; font-weight: 500; font-size: 9pt; }
  code { font-family: ui-monospace, Consolas, monospace; font-size: 9pt;
         background: #f0f2f5; padding: 1pt 3pt; border-radius: 2pt; }
  pre { background: #f7f8fa; border: 1px solid var(--line); border-radius: 3pt;
        padding: 8pt 10pt; overflow: hidden; break-inside: avoid; font-size: 8.5pt; line-height: 1.55; }
  pre code { background: none; padding: 0; font-size: inherit; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 16pt 0; }
  ul { margin: 0 0 8pt; padding-left: 16pt; }
  li { margin-bottom: 3pt; }
  a { color: var(--accent); text-decoration: none; }
  .foot { margin-top: 18pt; padding-top: 8pt; border-top: 1px solid var(--line);
          font-size: 8.5pt; color: #666; }
</style></head><body>
${body}
<p class="foot">influence-disclosure &middot; Apache-2.0 &middot;
github.com/mnemox-ai/influence-disclosure &middot; v0.1.0，0.x 期間隨時破壞相容。
本文件為規格對照說明，非法律意見。</p>
</body></html>`

await mkdir(OUT_DIR, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
try {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  // data: URI faces are not covered by networkidle; without this Chrome lays the page
  // out in a system fallback and embeds that instead of Noto Sans TC
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() =>
    Promise.all([...document.fonts].map((f) => (f.status === 'loaded' ? null : f.load()))),
  )
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-size:8pt;color:#888;padding:0 16mm;font-family:sans-serif;text-align:right;">' +
      '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '18mm', right: '16mm', bottom: '20mm', left: '16mm' },
  })
} finally {
  await browser.close()
}
const { size } = await import('node:fs').then((m) => m.promises.stat(OUT))
console.log(`wrote ${OUT} (${Math.round(size / 1024)} KB)`)
