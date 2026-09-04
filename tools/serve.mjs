import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
}

/** Local-only static server. Path segments equal to ".." are dropped rather than escaped. */
export function serve(root, port = 4321) {
  const server = createServer(async (req, res) => {
    try {
      const raw = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      const parts = raw.split('/').filter((s) => s && s !== '.' && s !== '..')
      let file = join(root, ...parts)
      try {
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      } catch {
        if (!extname(file)) file = join(root, ...parts, 'index.html')
      }
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('not found')
    }
  })
  return new Promise((resolve) => server.listen(port, () => resolve({ server, url: `http://localhost:${port}` })))
}
