import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'
const { server, url } = await serve(fileURLToPath(new URL('../site/dist/', import.meta.url)), 4402)
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'shell' })
const errs = []
const check = async (path, width, label) => {
  const p = await b.newPage()
  p.on('pageerror', e => errs.push(`${label}: ${e.message}`))
  p.on('console', m => { if (m.type() === 'error') errs.push(`${label} console: ${m.text()}`) })
  await p.setViewport({ width, height: 844 })
  await p.goto(url + path, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 800))

  const overflow = await p.evaluate(() => {
    const docW = document.documentElement.scrollWidth
    const guilty = [...document.querySelectorAll('*')].filter(e => {
      const r = e.getBoundingClientRect()
      return r.right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed'
    }).filter(e => {
      // an element inside a scroll container is fine
      let n = e.parentElement
      while (n) { const o = getComputedStyle(n).overflowX; if (o === 'auto' || o === 'scroll') return false; n = n.parentElement }
      return true
    }).filter(e => {
      // overflow:hidden clips just as effectively as a scroll container
      let n = e.parentElement
      while (n) { if (getComputedStyle(n).overflowX === 'hidden') return false; n = n.parentElement }
      return true
    }).slice(0, 5).map(e => e.tagName + '.' + String(e.className).split(' ')[0])
    return { docW, viewport: window.innerWidth, guilty }
  })

  const results = []
  for (const sample of ['clean', 'partial', 'broken']) {
    // set the value directly: p.click hit-testing on a narrow viewport can land on the
    // fixed header instead of the sample button, which silently re-runs the old input.
    // The sample buttons themselves are covered separately.
    await p.evaluate((s) => {
      const el = document.querySelector('#v-input')
      el.value = window.__ID_SAMPLES[s]
      document.querySelector('#v-out').innerHTML = ''
    }, sample)
    await p.click('#v-run')
    await p.waitForFunction(() => document.querySelector('#v-out').textContent.trim().length > 0, { timeout: 15000 })
    results.push({ sample, out: await p.$eval('#v-out', e => e.innerText.replace(/\n+/g, ' | ').slice(0, 150)) })
    await p.$eval('#v-out', e => (e.innerHTML = ''))
  }
  // the prefilled host document
  await p.reload({ waitUntil: 'networkidle2' })
  await p.click('#v-run')
  await p.waitForFunction(() => document.querySelector('#v-out').textContent.trim().length > 0, { timeout: 15000 })
  results.push({ sample: 'prefilled (VC)', out: await p.$eval('#v-out', e => e.innerText.replace(/\n+/g, ' | ').slice(0, 150)) })

  console.log(`\n=== ${label} (${width}px) ===`)
  console.log('doc scrollWidth', overflow.docW, 'vs viewport', overflow.viewport, overflow.guilty.length ? 'OVERFLOW: ' + overflow.guilty.join(', ') : 'no overflow')
  for (const r of results) console.log(` [${r.sample}] ${r.out}`)
  await p.close()
}
await check('/', 380, 'zh mobile')
await check('/en/', 1440, 'en desktop')
console.log('\nerrors:', errs.length ? errs : 'none')
await b.close(); server.close()
