import { describe, expect, it } from 'vitest'
import {
  MIN_SALT_BYTES,
  PSEUDONYM_PATTERN,
  deriveSubject,
  generateSubjectSalt,
  isPseudonym,
  randomSubject,
} from '../src/subject.js'

const salt = new Uint8Array(32).fill(7)
const otherSalt = new Uint8Array(32).fill(8)
const REAL = 'A123456789'

describe('deriveSubject', () => {
  it('is deterministic for the same inputs', () => {
    expect(deriveSubject({ subjectRef: REAL, salt, scope: 'issuer' })).toEqual(
      deriveSubject({ subjectRef: REAL, salt, scope: 'issuer' }),
    )
  })

  it('produces a 128-bit pseudonym', () => {
    const s = deriveSubject({ subjectRef: REAL, salt, scope: 'issuer' })
    expect(s.id).toMatch(PSEUDONYM_PATTERN)
    expect(s.id.slice(4)).toHaveLength(22)
    expect(s.method).toBe('hmac-sha256:v1')
    expect(s.scope).toBe('issuer')
  })

  it('never echoes the real identifier', () => {
    const s = deriveSubject({ subjectRef: REAL, salt, scope: 'issuer' })
    expect(JSON.stringify(s)).not.toContain(REAL)
  })

  it('is unlinkable across scopes', () => {
    const a = deriveSubject({ subjectRef: REAL, salt, scope: 'issuer' })
    const b = deriveSubject({ subjectRef: REAL, salt, scope: 'issuer:2026H2' })
    expect(a.id).not.toBe(b.id)
  })

  it('is unlinkable across salts', () => {
    const a = deriveSubject({ subjectRef: REAL, salt, scope: 'issuer' })
    const b = deriveSubject({ subjectRef: REAL, salt: otherSalt, scope: 'issuer' })
    expect(a.id).not.toBe(b.id)
  })

  it('separates scope from subjectRef so concatenations cannot collide', () => {
    const a = deriveSubject({ subjectRef: 'c', salt, scope: 'ab' })
    const b = deriveSubject({ subjectRef: 'bc', salt, scope: 'a' })
    expect(a.id).not.toBe(b.id)
  })

  it('rejects a salt below the minimum', () => {
    expect(() => deriveSubject({ subjectRef: REAL, salt: new Uint8Array(31), scope: 'issuer' })).toThrow(
      /at least 32 bytes/,
    )
  })

  it('rejects an empty subjectRef', () => {
    expect(() => deriveSubject({ subjectRef: '', salt, scope: 'issuer' })).toThrow(/must not be empty/)
  })

  it.each([['', /1-64/], ['x'.repeat(65), /1-64/], ['has space', /must match/], ['-leading', /must match/]])(
    'rejects scope %j',
    (scope, message) => {
      expect(() => deriveSubject({ subjectRef: REAL, salt, scope: scope as string })).toThrow(message as RegExp)
    },
  )
})

describe('randomSubject', () => {
  it('is different every time', () => {
    expect(randomSubject('issuer').id).not.toBe(randomSubject('issuer').id)
  })

  it('has the same shape as a derived pseudonym', () => {
    const s = randomSubject('issuer')
    expect(s.id).toMatch(PSEUDONYM_PATTERN)
    expect(s.method).toBe('random:v1')
  })

  it('accepts an injected rng', () => {
    const s = randomSubject('issuer', (n) => new Uint8Array(n).fill(1))
    expect(s.id).toBe('psu:AQEBAQEBAQEBAQEBAQEBAQ')
  })

  it('rejects an rng that returns the wrong length', () => {
    expect(() => randomSubject('issuer', () => new Uint8Array(4))).toThrow(/16 bytes/)
  })

  it('validates scope', () => {
    expect(() => randomSubject('bad scope')).toThrow(/must match/)
  })
})

describe('salt and pattern helpers', () => {
  it('generates a salt of the minimum size', () => {
    expect(generateSubjectSalt()).toHaveLength(MIN_SALT_BYTES)
    expect(generateSubjectSalt((n) => new Uint8Array(n).fill(2))[0]).toBe(2)
  })

  it('accepts pseudonyms and rejects real identifiers', () => {
    expect(isPseudonym(deriveSubject({ subjectRef: REAL, salt, scope: 'issuer' }).id)).toBe(true)
    expect(isPseudonym('sean@example.com')).toBe(false)
    expect(isPseudonym('psu:tooshort')).toBe(false)
    expect(isPseudonym('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')).toBe(false)
  })
})
