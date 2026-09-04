import { describe, expect, it } from 'vitest'
import {
  SPEC_VERSION,
  isInfluenceSection,
  noInfluence,
  validateInfluence,
  type InfluenceSection,
  type Relationship,
} from '../src/influence.js'

const commission: Relationship = {
  id: 'booking-partner',
  counterparty: { ref: 'partner.example', kind: 'merchant' },
  direction: 'inbound',
  form: 'commission',
  compensation: { type: 'rate', rate: 0.12 },
  effect: { kind: 'ranking', targets: ['opt:2'] },
  disclosed_to_principal: 'in_band',
}

const section = (over: Partial<InfluenceSection> = {}): unknown => ({
  spec_version: SPEC_VERSION,
  completeness: 'complete',
  relationships: [commission],
  ...over,
})

const messages = (value: unknown): string[] => validateInfluence(value).errors.map((e) => e.message)

describe('accepts', () => {
  it('a section with one commission relationship', () => {
    expect(validateInfluence(section()).errors).toEqual([])
  })

  it('the positive claim of no influence', () => {
    const clean = noInfluence()
    expect(validateInfluence(clean).valid).toBe(true)
    expect(clean.relationships).toEqual([])
    expect(clean.completeness).toBe('complete')
  })

  it('a relationship that exists but did not bear on the decision', () => {
    expect(
      validateInfluence(
        section({ relationships: [{ ...commission, effect: { kind: 'none' } }] as Relationship[] }),
      ).valid,
    ).toBe(true)
  })

  it.each([
    { type: 'rate', rate: 0 },
    { type: 'rate', rate: 1 },
    { type: 'fixed', amount: '12.50', currency: 'TWD' },
    { type: 'none' },
    { type: 'withheld', reason: 'commercially_confidential' },
  ])('compensation %j', (compensation) => {
    expect(
      validateInfluence(section({ relationships: [{ ...commission, compensation }] as Relationship[] })).valid,
    ).toBe(true)
  })

  it('a partial disclosure that says why', () => {
    expect(
      validateInfluence(section({ completeness: 'partial', withheld_reason: 'commercially_confidential' })).valid,
    ).toBe(true)
  })
})

describe('rejects', () => {
  it('an unknown property, because the section is closed', () => {
    expect(messages(section({ note: 'extra' } as object))).toContain(
      'unknown property "note"; this section is closed by design',
    )
  })

  it('a partial disclosure with no reason', () => {
    expect(messages(section({ completeness: 'partial' }))).toContain(
      'completeness is "partial", so withheld_reason is required',
    )
  })

  it('a reason attached to a complete disclosure', () => {
    expect(messages(section({ withheld_reason: 'other' }))).toContain(
      'withheld_reason is only meaningful when completeness is "partial"',
    )
  })

  it('an effect that does not say what it affected', () => {
    const bad = section({ relationships: [{ ...commission, effect: { kind: 'ranking' } }] as Relationship[] })
    expect(messages(bad)).toContain('an effect other than "none" must say which options it affected')
  })

  it('a compensation shape that is not one of the four', () => {
    const bad = section({
      relationships: [{ ...commission, compensation: { type: 'rate', amount: '5' } }] as unknown as Relationship[],
    })
    expect(messages(bad).some((m) => m.startsWith('compensation must be exactly one of'))).toBe(true)
  })

  it('a rate outside 0..1', () => {
    const bad = section({
      relationships: [{ ...commission, compensation: { type: 'rate', rate: 12 } }] as Relationship[],
    })
    expect(validateInfluence(bad).valid).toBe(false)
  })

  it('a float amount, which would lose value to binary floating point', () => {
    const bad = section({
      relationships: [
        { ...commission, compensation: { type: 'fixed', amount: 12.5, currency: 'TWD' } },
      ] as unknown as Relationship[],
    })
    expect(validateInfluence(bad).valid).toBe(false)
  })

  it('a future spec version', () => {
    expect(messages(section({ spec_version: '0.2.0' } as object))).toContain(
      `spec_version must be "${SPEC_VERSION}"; 0.x makes no compatibility promise`,
    )
  })

  it.each([['has space'], [''], ['Uppercase'], ['x'.repeat(33)]])('a malformed relationship id %j', (id) => {
    expect(validateInfluence(section({ relationships: [{ ...commission, id }] as Relationship[] })).valid).toBe(false)
  })

  it('a counterparty ref containing whitespace, which would be prose', () => {
    const bad = section({
      relationships: [{ ...commission, counterparty: { ref: 'Partner Travel Ltd' } }] as Relationship[],
    })
    expect(validateInfluence(bad).valid).toBe(false)
  })

  it.each([[null], [42], ['string'], [[]]])('a non-object section %j', (value) => {
    expect(validateInfluence(value).valid).toBe(false)
  })
})

describe('error messages a person can act on', () => {
  const withCompensation = (compensation: unknown): unknown =>
    section({ relationships: [{ ...commission, compensation }] as unknown as Relationship[] })

  it.each([
    [withCompensation({ type: 'fixed', amount: '12.5.0', currency: 'TWD' }), 'must be a decimal string, for example "12.50"'],
    [withCompensation({ type: 'fixed', amount: '12.50', currency: 'twd' }), 'must be a three-letter ISO 4217 code, for example "TWD"'],
    [
      section({ relationships: [{ ...commission, counterparty: { ref: 'Partner Hotels Ltd' } }] as Relationship[] }),
      'must be an identifier with no whitespace, such as a domain or an entity id, not prose',
    ],
    [
      section({ relationships: [{ ...commission, id: 'Not An Id' }] as Relationship[] }),
      'must be lowercase letters, digits, - or _, at most 32 characters',
    ],
  ])('explains the problem instead of quoting the pattern', (value, expected) => {
    expect(messages(value)).toContain(expected)
  })

  it('does not report the same problem twice through the if/then branch', () => {
    const errors = validateInfluence(section({ completeness: 'partial' })).errors
    expect(errors).toHaveLength(1)
    expect(errors[0]?.message).toBe('completeness is "partial", so withheld_reason is required')
  })
})

describe('reporting', () => {
  it('points at the offending location with a JSON Pointer', () => {
    const bad = section({ relationships: [{ ...commission, effect: { kind: 'ranking' } }] as Relationship[] })
    expect(validateInfluence(bad).errors[0]?.path).toBe('/relationships/0/effect')
  })

  it('warns without failing when a field carries prose instead of an identifier', () => {
    const wordy = section({
      relationships: [
        { ...commission, effect: { kind: 'ranking', targets: ['sean@example.com'] } },
      ] as Relationship[],
    })
    const result = validateInfluence(wordy)
    expect(result.valid).toBe(true)
    expect(result.warnings.map((w) => w.code)).toContain('email_like')
  })

  it('narrows the type for callers that only need a yes or no', () => {
    const value: unknown = section()
    expect(isInfluenceSection(value)).toBe(true)
    expect(isInfluenceSection({ spec_version: SPEC_VERSION })).toBe(false)
  })
})
