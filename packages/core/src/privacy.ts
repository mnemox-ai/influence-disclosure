/**
 * Heuristic leak detection.
 *
 * The schema is what actually forbids raw content in `context` (closed objects, short
 * string caps, hash patterns). This module is the second layer: it catches content that
 * is structurally legal but looks like it should not be there. Everything here is a
 * WARNING, never an error, because heuristics on natural language are not sound and a
 * false positive must not make a valid receipt unverifiable.
 */

export type PrivacyWarningCode =
  | 'long_string'
  | 'prose_like'
  | 'cjk_prose'
  | 'email_like'
  | 'phone_like'
  | 'tw_national_id_like'
  | 'card_number_like'
  | 'blob_like'

export interface PrivacyWarning {
  code: PrivacyWarningCode
  /** RFC 6901 JSON Pointer to the offending value. */
  path: string
  message: string
}

export interface ScanOptions {
  /** Strings longer than this are reported as `long_string`. */
  maxStringLength?: number
  /** Whitespace-separated tokens at or above this count are reported as `prose_like`. */
  maxWords?: number
  /** CJK characters at or above this count are reported as `cjk_prose`. */
  maxCjkChars?: number
}

const DEFAULTS = { maxStringLength: 120, maxWords: 15, maxCjkChars: 12 } as const

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const PHONE = /(?:\+\d{1,3}[ -]?)?(?:09\d{8}|\d{3}[ -]\d{3,4}[ -]\d{3,4}|\+\d{9,14})/
const TW_ID = /\b[A-Z][12]\d{8}\b/
const DIGIT_RUN = /\b(?:\d[ -]?){13,19}\b/
const BLOB = /^[A-Za-z0-9+/_-]{256,}={0,2}$/
const CJK = /[㐀-䶿一-鿿豈-﫿]/g
/** Values that are supposed to be long opaque strings, so length alone means nothing. */
const OPAQUE_KEYS = new Set(['signature', 'hash', 'receipt_id', 'parent_receipt_id', 'parent_receipt_hash', 'issuer'])

function luhnValid(digits: string): boolean {
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48
    if (alt) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    alt = !alt
  }
  return sum % 10 === 0
}

function escapePointer(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1')
}

function scanString(value: string, path: string, key: string | undefined, opts: Required<ScanOptions>): PrivacyWarning[] {
  const out: PrivacyWarning[] = []
  const push = (code: PrivacyWarningCode, message: string) => out.push({ code, path, message })
  const opaque = key !== undefined && OPAQUE_KEYS.has(key)

  if (EMAIL.test(value)) push('email_like', 'looks like an e-mail address')
  if (TW_ID.test(value)) push('tw_national_id_like', 'looks like a Taiwan national ID')
  if (PHONE.test(value)) push('phone_like', 'looks like a phone number')

  const digits = value.match(DIGIT_RUN)?.[0]?.replace(/[ -]/g, '')
  if (digits !== undefined && luhnValid(digits)) push('card_number_like', 'looks like a payment card number')

  if (opaque) return out

  if (BLOB.test(value)) push('blob_like', 'looks like an embedded encoded payload')
  else if (value.length > opts.maxStringLength) {
    push('long_string', `${value.length} characters; context must reference content, not carry it`)
  }
  if ((value.match(CJK)?.length ?? 0) >= opts.maxCjkChars) push('cjk_prose', 'looks like prose rather than an identifier')
  else if (value.trim().split(/\s+/).length >= opts.maxWords) push('prose_like', 'looks like prose rather than an identifier')

  return out
}

/** Walk any JSON value and report anything that looks like raw personal content. */
export function scanForLeaks(value: unknown, options: ScanOptions = {}): PrivacyWarning[] {
  const opts = { ...DEFAULTS, ...options }
  const out: PrivacyWarning[] = []
  const seen = new WeakSet<object>()

  const walk = (node: unknown, path: string, key: string | undefined): void => {
    if (typeof node === 'string') {
      out.push(...scanString(node, path, key, opts))
      return
    }
    if (node === null || typeof node !== 'object') return
    if (seen.has(node)) return
    seen.add(node)
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}/${i}`, key))
      return
    }
    for (const [k, v] of Object.entries(node)) walk(v, `${path}/${escapePointer(k)}`, k)
  }

  walk(value, '', undefined)
  return out
}
