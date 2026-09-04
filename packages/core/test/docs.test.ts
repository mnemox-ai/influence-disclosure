import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { fromCredentialSubject } from '../src/adapters.js'
import { validateInfluence } from '../src/influence.js'

const root = new URL('../../../', import.meta.url)
// SPEC.md deliberately carries no inline examples; it points at spec/examples/, which
// examples.test.ts covers. These two teach by example, so their blocks must stay valid.
const DOCS = ['README.md', 'docs/ARTICLE-10-MAPPING.md']

function jsonBlocks(doc: string): string[] {
  const text = readFileSync(fileURLToPath(new URL(doc, root)), 'utf8')
  return [...text.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1] ?? '')
}

describe('every JSON block in the documentation is a valid document', () => {
  it.each(DOCS)('%s', (doc) => {
    const blocks = jsonBlocks(doc)
    expect(blocks.length).toBeGreaterThan(0)
    for (const [i, block] of blocks.entries()) {
      const parsed: unknown = JSON.parse(block)
      const embedded = fromCredentialSubject(parsed)
      const section = embedded.present && embedded.valid ? embedded.section : parsed
      const result = validateInfluence(section)
      expect(result.errors, `${doc} block ${i}`).toEqual([])
    }
  })
})
