/** Lighthouse against the built static site, both locales, mobile and desktop. */
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { fileURLToPath } from 'node:url'
import { writeFile, mkdir } from 'node:fs/promises'
import { serve } from './serve.mjs'

const DIST = fileURLToPath(new URL('../site/dist/', import.meta.url))
const OUT = fileURLToPath(new URL('../site/screenshots/', import.meta.url))
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

const { server, url } = await serve(DIST, 4404)
await mkdir(OUT, { recursive: true })

const chrome = await chromeLauncher.launch({
  chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
})

const rows = []
let worst = 100
try {
  for (const path of ['/', '/en/']) {
    for (const preset of ['mobile', 'desktop']) {
      const result = await lighthouse(
        url + path,
        { port: chrome.port, output: 'html', logLevel: 'error', onlyCategories: CATEGORIES },
        preset === 'desktop'
          ? {
              extends: 'lighthouse:default',
              settings: {
                formFactor: 'desktop',
                screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
                throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
              },
            }
          : undefined,
      )
      const scores = Object.fromEntries(
        CATEGORIES.map((c) => [c, Math.round((result.lhr.categories[c].score ?? 0) * 100)]),
      )
      worst = Math.min(worst, ...Object.values(scores))
      rows.push({ page: path, preset, ...scores })
      const name = `lighthouse${path === '/' ? '-zh' : '-en'}-${preset}.html`
      await writeFile(OUT + name, result.report)

      const failed = Object.entries(result.lhr.audits)
        .filter(([, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
        .map(([id, a]) => `${id} (${a.score})`)
      if (failed.length) console.log(`  ${path} ${preset} imperfect audits: ${failed.slice(0, 8).join(', ')}`)
    }
  }
} finally {
  // chrome-launcher's temp-dir cleanup throws EPERM on Windows; it must not swallow the report
  try {
    await chrome.kill()
  } catch (e) {
    console.log('  (chrome cleanup:', e.code ?? e.message, ')')
  }
  server.close()
}

console.table(rows)
console.log(worst >= 95 ? `PASS: lowest score ${worst}` : `FAIL: lowest score ${worst}`)
process.exitCode = worst >= 95 ? 0 : 1
