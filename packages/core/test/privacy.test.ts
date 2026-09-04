import { describe, expect, it } from 'vitest'
import { scanForLeaks } from '../src/privacy.js'

const codes = (v: unknown): string[] => scanForLeaks(v).map((w) => w.code)

describe('identifier detection', () => {
  it.each([
    ['sean@example.com', 'email_like'],
    ['A123456789', 'tw_national_id_like'],
    ['0912345678', 'phone_like'],
    ['4111 1111 1111 1111', 'card_number_like'],
  ])('flags %j as %s', (value, code) => {
    expect(codes({ context: [{ source_id: value }] })).toContain(code)
  })

  it('does not flag a digit run that fails Luhn', () => {
    expect(codes({ source_id: '1234567812345678' })).not.toContain('card_number_like')
  })

  it('flags identifiers even inside fields that are allowed to be long', () => {
    expect(codes({ signature: 'sean@example.com' })).toContain('email_like')
  })
})

describe('content detection', () => {
  it('flags a string longer than the cap', () => {
    expect(codes({ note: 'x'.repeat(121) })).toContain('long_string')
  })

  it('flags English prose', () => {
    expect(codes({ note: 'the user said they would rather not fly on a red eye if there is any other option' })).toContain(
      'prose_like',
    )
  })

  it('flags CJK prose', () => {
    expect(codes({ note: '使用者偏好晚上不要搭紅眼班機除非沒有其他選擇' })).toContain('cjk_prose')
  })

  it('flags an embedded encoded payload', () => {
    expect(codes({ note: 'A'.repeat(256) })).toContain('blob_like')
  })

  it('does not double-report a blob as a long string', () => {
    expect(codes({ note: 'A'.repeat(256) })).not.toContain('long_string')
  })

  it('leaves opaque fields alone', () => {
    const long = 'e'.repeat(400)
    expect(codes({ signature: long, hash: long, receipt_id: long })).toEqual([])
  })

  it('passes a clean reference-only context', () => {
    expect(
      codes({
        context: [
          { source_id: 'pref:travel', version: '3', hash: `sha256:${'a'.repeat(64)}` },
          { source_id: 'pref:budget', version: '1', hash: `sha256:${'b'.repeat(64)}` },
        ],
        subject: { id: 'psu:AQEBAQEBAQEBAQEBAQEBAQ', method: 'hmac-sha256:v1', scope: 'issuer' },
      }),
    ).toEqual([])
  })
})

describe('traversal', () => {
  it('reports RFC 6901 pointers, including array indices', () => {
    const [warning] = scanForLeaks({ context: [{ ok: 'x' }, { source_id: 'sean@example.com' }] })
    expect(warning?.path).toBe('/context/1/source_id')
  })

  it('escapes ~ and / in keys', () => {
    const [warning] = scanForLeaks({ 'a/b~c': 'sean@example.com' })
    expect(warning?.path).toBe('/a~1b~0c')
  })

  it('handles primitives, nulls and empty input', () => {
    expect(codes(null)).toEqual([])
    expect(codes(42)).toEqual([])
    expect(codes({ a: null, b: 1, c: true, d: [] })).toEqual([])
  })

  it('flags a bare string at the document root', () => {
    const [warning] = scanForLeaks('sean@example.com')
    expect(warning?.path).toBe('')
  })

  it('does not loop forever on a cycle', () => {
    const node: Record<string, unknown> = { source_id: 'sean@example.com' }
    node['self'] = node
    expect(codes(node)).toEqual(['email_like'])
  })

  it('respects custom thresholds', () => {
    expect(scanForLeaks({ note: 'x'.repeat(30) }, { maxStringLength: 20 }).map((w) => w.code)).toContain('long_string')
  })
})
