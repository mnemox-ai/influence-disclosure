import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { fromCredentialSubject } from '../src/adapters.js'
import { validateInfluence } from '../src/influence.js'

const dir = (kind: string): string => fileURLToPath(new URL(`../../../spec/examples/${kind}/`, import.meta.url))
const load = (kind: string, name: string): unknown => JSON.parse(readFileSync(`${dir(kind)}${name}`, 'utf8'))
const names = (kind: string): string[] => readdirSync(dir(kind)).filter((n) => n.endsWith('.json')).sort()

describe('spec/examples', () => {
  it('has examples of both kinds', () => {
    expect(names('valid').length).toBeGreaterThanOrEqual(3)
    expect(names('invalid').length).toBeGreaterThanOrEqual(2)
  })

  it.each(names('valid'))('valid/%s validates', (name) => {
    const doc = load('valid', name)
    const embedded = fromCredentialSubject(doc)
    const section = embedded.present && embedded.valid ? embedded.section : doc
    const result = validateInfluence(section)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it.each(names('invalid'))('invalid/%s is rejected with a reason', (name) => {
    const result = validateInfluence(load('invalid', name))
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    for (const e of result.errors) expect(e.message).not.toBe('')
  })

  it('rejects prose in a counterparty ref, the case a human reviewer would miss', () => {
    const result = validateInfluence(load('invalid', '03-prose-in-counterparty.json'))
    expect(result.errors.some((e) => e.path.endsWith('/counterparty/ref'))).toBe(true)
  })
})
