import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'
const { server, url } = await serve(fileURLToPath(new URL('../site/dist/', import.meta.url)), 4399)
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'shell' })
const p = await b.newPage()
const errs = []
p.on('pageerror', e => errs.push('pageerror: ' + e.message))
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
await p.setViewport({ width: 1440, height: 900 })
await p.goto(url + '/', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 1500))
const before = await p.evaluate(() => [...document.querySelectorAll('section')].map(s => {
  const r = s.getBoundingClientRect()
  const rev = s.querySelector('.reveal')
  return { id: s.id || 'hero', top: Math.round(r.top + scrollY), h: Math.round(r.height),
    reveals: s.querySelectorAll('.reveal').length,
    firstRevealOpacity: rev ? getComputedStyle(rev).opacity : null,
    isIn: rev ? rev.classList.contains('is-in') : null }
}))
await p.evaluate(async () => { document.documentElement.style.scrollBehavior='auto'; for (let y=0; y<document.body.scrollHeight; y+=500) { scrollTo(0,y); await new Promise(r=>setTimeout(r,110)) } scrollTo(0,0) })
await new Promise(r => setTimeout(r, 800))
const after = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => !e.classList.contains('is-in')).length)
console.log('sections:'); console.table(before)
console.log('reveals still hidden after scroll:', after)
console.log('page errors:', errs.length ? errs : 'none')
await b.close(); server.close()
