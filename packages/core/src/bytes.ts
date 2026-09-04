/** Minimal byte/base64url helpers that work identically in Node and the browser. */

const B64URL_RE = /^[A-Za-z0-9_-]*$/

export function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string): Uint8Array {
  if (!B64URL_RE.test(s)) throw new Error('not base64url')
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Concatenate with a 0x00 separator so ("ab","c") and ("a","bc") never collide. */
export function domainSeparated(...parts: string[]): Uint8Array {
  const encoded = parts.map(utf8)
  const total = encoded.reduce((n, p) => n + p.length, 0) + (encoded.length - 1)
  const out = new Uint8Array(total)
  let off = 0
  encoded.forEach((p, i) => {
    if (i > 0) out[off++] = 0x00
    out.set(p, off)
    off += p.length
  })
  return out
}
