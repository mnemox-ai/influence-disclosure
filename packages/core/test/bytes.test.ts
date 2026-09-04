import { describe, expect, it } from 'vitest'
import { domainSeparated, fromBase64Url, toBase64Url, utf8 } from '../src/bytes.js'

describe('base64url', () => {
  it.each([0, 1, 2, 3, 16, 32, 64])('round-trips %i bytes', (n) => {
    const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 251) % 256)
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes)
  })

  it('emits no padding and no + or /', () => {
    const encoded = toBase64Url(Uint8Array.from([251, 255, 190, 0, 1]))
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('rejects input that is not base64url', () => {
    expect(() => fromBase64Url('a+b/c=')).toThrow(/not base64url/)
  })
})

describe('domainSeparated', () => {
  it('separates parts so concatenations cannot collide', () => {
    expect(domainSeparated('ab', 'c')).not.toEqual(domainSeparated('a', 'bc'))
  })

  it('is plain utf8 for a single part', () => {
    expect(domainSeparated('abc')).toEqual(utf8('abc'))
  })
})
