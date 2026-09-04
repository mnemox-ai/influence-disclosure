import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { serve } from './serve.mjs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = fileURLToPath(new URL('../site/screenshots/', import.meta.url))
const DIST = fileURLToPath(new URL('../site/dist/', import.meta.url))
const REF = 'https://tranquil-495tmg.peachworlds.com/'

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}

const shoot = async (page, url, file, { full = false, viewport }) => {
  await page.setViewport(viewport)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, full ? 2000 : 4000))

  if (full) {
    // Settle every entrance animation. scroll-behavior: smooth turns each scrollTo into
    // an animation whose intermediate positions never render, so it is disabled first.
    await page.evaluate(async () => {
      const prev = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 110))
      }
      window.scrollTo(0, 0)
      document.documentElement.style.scrollBehavior = prev
    })
    await new Promise((r) => setTimeout(r, 600))

    // Grow the viewport to the whole document and capture in one pass. Puppeteer's
    // fullPage stitches tiles, and with a position:fixed header that reprints the header
    // (and on tall mobile pages, a whole second copy of the top of the page) mid-capture.
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.setViewport({ ...viewport, height })
    await new Promise((r) => setTimeout(r, 500))
  }

  await page.screenshot({ path: `${OUT}${file}` })
  console.log(`  ${file}`)
}

const { server, url } = await serve(DIST, 4321)
await mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

try {
  const page = await browser.newPage()
  console.log('ours:')
  await shoot(page, `${url}/`, 'site-desktop-zh.png', { full: true, viewport: VIEWPORTS.desktop })
  await shoot(page, `${url}/`, 'site-mobile-zh.png', { full: true, viewport: VIEWPORTS.mobile })
  await shoot(page, `${url}/en/`, 'site-desktop-en.png', { full: true, viewport: VIEWPORTS.desktop })
  await shoot(page, `${url}/`, 'site-desktop-hero.png', { full: false, viewport: VIEWPORTS.desktop })
  await shoot(page, `${url}/`, 'site-mobile-hero.png', { full: false, viewport: VIEWPORTS.mobile })

  console.log('reference (hero only, same viewports):')
  await shoot(page, REF, 'ref-desktop-hero.png', { full: false, viewport: VIEWPORTS.desktop })
  await shoot(page, REF, 'ref-mobile-hero.png', { full: false, viewport: VIEWPORTS.mobile })
} finally {
  await browser.close()
  server.close()
}
console.log('done ->', OUT)
