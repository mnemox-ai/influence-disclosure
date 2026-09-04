import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { influenceSchemaV0 } from '../src/schema.generated.js'

const root = new URL('../../../', import.meta.url)
const specPath = new URL('spec/schema/influence.v0.json', root)
const generatedPath = new URL('packages/core/src/schema.generated.ts', root)

describe('the published schema is the one the library enforces', () => {
  it('matches spec/schema/influence.v0.json exactly', () => {
    expect(influenceSchemaV0).toEqual(JSON.parse(readFileSync(specPath, 'utf8')))
  })

  it('is byte-identical to a fresh generation, so drift fails CI', () => {
    const before = readFileSync(generatedPath, 'utf8')
    execFileSync(process.execPath, ['scripts/gen-schema.mjs'], { cwd: new URL('.', root) })
    expect(readFileSync(generatedPath, 'utf8')).toBe(before)
  })
})
