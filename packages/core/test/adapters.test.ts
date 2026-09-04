import { describe, expect, it } from 'vitest'
import {
  A2A_EXTENSIONS_HEADER,
  INFLUENCE_MEDIA_TYPE,
  INFLUENCE_NS,
  a2aExtensionDeclaration,
  dssePreAuthEncoding,
  fromA2AMetadata,
  fromCredentialSubject,
  fromDsse,
  fromMcpExtension,
  toA2AMetadata,
  toCredentialSubject,
  toDsse,
  toMcpExtension,
} from '../src/adapters.js'
import { utf8 } from '../src/bytes.js'
import { noInfluence, type InfluenceSection } from '../src/influence.js'

const section: InfluenceSection = {
  spec_version: '0.1.0',
  completeness: 'complete',
  relationships: [
    {
      id: 'hotel-partner',
      counterparty: { ref: 'partner.example', kind: 'merchant' },
      direction: 'inbound',
      form: 'commission',
      compensation: { type: 'rate', rate: 0.12 },
      effect: { kind: 'ranking', targets: ['opt:2'] },
    },
  ],
}

const invalid = { spec_version: '0.1.0', completeness: 'partial', relationships: [] }

describe('round trips', () => {
  it('through a verifiable credential', () => {
    const credential = { type: ['VerifiableCredential', 'AgentReceipt'], credentialSubject: { id: 'x', ...toCredentialSubject(section) } }
    const out = fromCredentialSubject(credential)
    expect(out).toEqual({ present: true, valid: true, section })
  })

  it('through a bare credentialSubject', () => {
    expect(fromCredentialSubject(toCredentialSubject(section))).toEqual({ present: true, valid: true, section })
  })

  it('through DSSE', () => {
    const envelope = toDsse(section)
    expect(envelope.payloadType).toBe(INFLUENCE_MEDIA_TYPE)
    expect(envelope.signatures).toEqual([])
    expect(fromDsse(envelope)).toEqual({ present: true, valid: true, section })
  })

  it('through A2A task metadata', () => {
    const task = { id: 't1', metadata: { 'other/ext': {}, ...toA2AMetadata(section) } }
    expect(fromA2AMetadata(task)).toEqual({ present: true, valid: true, section })
  })

  it('through an MCP audit record', () => {
    const record = { action: 'search', extensions: toMcpExtension(section) }
    expect(fromMcpExtension(record)).toEqual({ present: true, valid: true, section })
  })

  it('carries an empty disclosure without losing its meaning', () => {
    const clean = noInfluence()
    const out = fromDsse(toDsse(clean))
    expect(out).toEqual({ present: true, valid: true, section: clean })
  })
})

describe('all four adapters agree on the namespace', () => {
  it.each([
    ['credentialSubject', toCredentialSubject(section)],
    ['a2a', toA2AMetadata(section)],
    ['mcp', toMcpExtension(section)],
  ])('%s keys the section under the shared URN', (_name, fragment) => {
    expect(Object.keys(fragment)).toEqual([INFLUENCE_NS])
  })

  it('declares the A2A extension under the same URI', () => {
    expect(a2aExtensionDeclaration()).toEqual({
      uri: INFLUENCE_NS,
      description: expect.any(String),
      required: false,
    })
    expect(A2A_EXTENSIONS_HEADER).toBe('A2A-Extensions')
  })
})

describe('absence and malformed input', () => {
  it.each([
    ['credential', fromCredentialSubject],
    ['a2a', fromA2AMetadata],
    ['mcp', fromMcpExtension],
    ['dsse', fromDsse],
  ])('%s reports absence rather than throwing', (_name, read) => {
    for (const value of [null, undefined, 42, 'text', {}, { metadata: {} }, { extensions: null }]) {
      expect(read(value).present).toBe(false)
    }
  })

  it('reports a present but invalid section instead of silently dropping it', () => {
    const out = fromA2AMetadata({ metadata: { [INFLUENCE_NS]: invalid } })
    expect(out.present).toBe(true)
    expect(out).toMatchObject({ valid: false })
    if (out.present && !out.valid) {
      expect(out.errors[0]?.message).toContain('withheld_reason is required')
    }
  })

  it('ignores a DSSE envelope carrying somebody else payload type', () => {
    expect(fromDsse({ payload: 'e30', payloadType: 'application/vnd.other+json' }).present).toBe(false)
  })

  it('reports unparseable DSSE payload as invalid, not absent', () => {
    const out = fromDsse({ payload: 'bm90IGpzb24', payloadType: INFLUENCE_MEDIA_TYPE })
    expect(out).toEqual({
      present: true,
      valid: false,
      errors: [{ path: '/payload', message: 'payload is not valid JSON' }],
    })
  })
})

describe('DSSE pre-authentication encoding', () => {
  it('matches the spec byte string', () => {
    const pae = dssePreAuthEncoding('http://example.com/HelloWorld', utf8('hello world'))
    expect(new TextDecoder().decode(pae)).toBe('DSSEv1 29 http://example.com/HelloWorld 11 hello world')
  })

  it('counts bytes, not characters', () => {
    const pae = dssePreAuthEncoding('t', utf8('金流'))
    expect(new TextDecoder().decode(pae)).toBe('DSSEv1 1 t 6 金流')
  })

  it('covers the payload of an envelope it produced', () => {
    const envelope = toDsse(section)
    const bytes = utf8(JSON.stringify(section))
    const pae = new TextDecoder().decode(dssePreAuthEncoding(envelope.payloadType, bytes))
    expect(pae.startsWith(`DSSEv1 ${INFLUENCE_MEDIA_TYPE.length} ${INFLUENCE_MEDIA_TYPE} ${bytes.length} `)).toBe(true)
  })
})
