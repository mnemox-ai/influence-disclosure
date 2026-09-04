import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'
const { server, url } = await serve(fileURLToPath(new URL('../site/dist/', import.meta.url)), 4405)
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'shell' })
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 900 })
const fonts = []
p.on('response', r => { if (/\.woff2?$/.test(r.url())) fonts.push({ url: r.url().split('/').pop(), status: r.status() }) })
await p.goto(url + '/', { waitUntil: 'networkidle2' })
await p.evaluate(() => document.fonts.ready)
await new Promise(r => setTimeout(r, 800))
console.log('loaded font files:', fonts)
console.log(await p.evaluate(() => {
  const loaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight}`)
  // which family actually renders a Chinese glyph
  const probe = document.createElement('span')
  probe.textContent = '揭'
  probe.style.cssText = 'font-family:var(--font);font-size:100px;position:absolute;visibility:hidden'
  document.body.append(probe)
  const w = probe.getBoundingClientRect().width
  probe.style.fontFamily = "'Noto Sans TC'"
  const wNoto = probe.getBoundingClientRect().width
  probe.style.fontFamily = 'sans-serif'
  const wFallback = probe.getBoundingClientRect().width
  probe.remove()
  return { loaded, chineseGlyphWidth: w, notoWidth: wNoto, systemFallbackWidth: wFallback,
           usingNoto: Math.abs(w - wNoto) < 0.5 }
}))
await b.close(); server.close()
