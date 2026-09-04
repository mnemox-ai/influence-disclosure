/** Builds one side-by-side board: our page next to the reference at the same viewport. */
import puppeteer from 'puppeteer-core'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SHOTS = fileURLToPath(new URL('../site/screenshots/', import.meta.url))

const dataUri = async (name) => `data:image/png;base64,${(await readFile(SHOTS + name)).toString('base64')}`

const [refD, oursD, refM, oursM] = await Promise.all([
  dataUri('ref-desktop-hero.png'),
  dataUri('site-desktop-hero.png'),
  dataUri('ref-mobile-hero.png'),
  dataUri('site-mobile-hero.png'),
])

const panel = (label, sub, src, w) =>
  `<figure style="margin:0;flex:0 0 ${w}px">
     <figcaption style="display:flex;align-items:baseline;gap:10px;margin:0 0 10px">
       <span style="font:600 15px/1 ui-sans-serif,system-ui;color:#111">${label}</span>
       <span style="font:400 12px/1 ui-monospace,Consolas,monospace;color:#777">${sub}</span>
     </figcaption>
     <img src="${src}" style="width:${w}px;display:block;border:1px solid #d8d8d8;border-radius:6px">
   </figure>`

const html = `<!doctype html><meta charset="utf-8">
<body style="margin:0;padding:36px;background:#f4f4f5;font-family:ui-sans-serif,system-ui">
  <h1 style="font:600 22px/1.3 ui-sans-serif,system-ui;color:#111;margin:0 0 4px">
    Skin from the reference, substance our own
  </h1>
  <p style="font:400 13px/1.6 ui-sans-serif,system-ui;color:#666;margin:0 0 28px;max-width:960px">
    Same ground, same single accent, same type scale, same pill buttons, same 12px hairline cards.
    No shared copy, imagery, logo, icon or 3D. Measured values in site/DESIGN.md.
  </p>

  <p style="font:600 13px/1 ui-sans-serif;color:#111;margin:0 0 12px">Desktop, 1440 &times; 900</p>
  <div style="display:flex;gap:20px;margin-bottom:36px">
    ${panel('Reference', 'tranquil-495tmg.peachworlds.com', refD, 640)}
    ${panel('influence-disclosure', 'ours', oursD, 640)}
  </div>

  <p style="font:600 13px/1 ui-sans-serif;color:#111;margin:0 0 12px">Mobile, 390 &times; 844</p>
  <div style="display:flex;gap:20px;align-items:flex-start">
    ${panel('Reference', 'tranquil-495tmg.peachworlds.com', refM, 300)}
    ${panel('influence-disclosure', 'ours', oursM, 300)}
  </div>
</body>`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1420, height: 1200, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewport({ width: 1420, height, deviceScaleFactor: 1 })
  await page.screenshot({ path: SHOTS + 'compare-reference-vs-ours.png' })
  console.log('wrote compare-reference-vs-ours.png', `1420x${height}`)
} finally {
  await browser.close()
}
