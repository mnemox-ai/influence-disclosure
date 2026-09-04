/**
 * Adapters onto the four host formats.
 *
 * This section is deliberately not a receipt, so it never carries its own signature,
 * identity or chain. It is placed inside a format somebody else already maintains, and
 * inherits that format's signature. Each adapter is one pair: put the section in, take
 * it back out with validation on the way.
 *
 * The namespace is a URN rather than an https URI on purpose. A URN needs no domain, so
 * nothing has to be renamed when the project gets one. See DECISIONS.md ENV-008.
 */
import { toBase64Url, utf8 } from './bytes.js'
import { validateInfluence, type InfluenceSection } from './influence.js'

/** Property key and extension identifier for the section, across every host format. */
export const INFLUENCE_NS = 'urn:influence-disclosure:v0'

/** DSSE payload type for a bare section signed on its own. */
export const INFLUENCE_MEDIA_TYPE = 'application/vnd.influence-disclosure+json'

/** Extraction never throws: a host document from elsewhere is untrusted input. */
export type Extracted =
  | { present: true; valid: true; section: InfluenceSection }
  | { present: true; valid: false; errors: { path: string; message: string }[] }
  | { present: false }

function extract(value: unknown): Extracted {
  if (value === undefined || value === null) return { present: false }
  const result = validateInfluence(value)
  return result.valid
    ? { present: true, valid: true, section: value as InfluenceSection }
    : { present: true, valid: false, errors: result.errors }
}

function readNamespaced(container: unknown): unknown {
  if (container === null || typeof container !== 'object') return undefined
  return (container as Record<string, unknown>)[INFLUENCE_NS]
}

/* --------------------------------------------------------------------------
 * 1. W3C Verifiable Credential credentialSubject (obsigna AgentReceipt et al.)
 * ----------------------------------------------------------------------- */

/** Fragment to merge into an existing `credentialSubject`. */
export function toCredentialSubject(section: InfluenceSection): Record<string, InfluenceSection> {
  return { [INFLUENCE_NS]: section }
}

/** Read the section out of a whole credential, or out of a bare credentialSubject. */
export function fromCredentialSubject(credential: unknown): Extracted {
  if (credential === null || typeof credential !== 'object') return { present: false }
  const subject = (credential as Record<string, unknown>)['credentialSubject'] ?? credential
  return extract(readNamespaced(subject))
}

/* --------------------------------------------------------------------------
 * 2. DSSE
 * ----------------------------------------------------------------------- */

export interface DsseEnvelope {
  payload: string
  payloadType: string
  signatures: { keyid?: string; sig: string }[]
}

/**
 * An unsigned DSSE envelope carrying the section. Signing belongs to the host, so the
 * signature list comes back empty; feed `dssePreAuthEncoding` to whatever holds the key.
 */
export function toDsse(section: InfluenceSection): DsseEnvelope {
  return {
    payload: toBase64Url(utf8(JSON.stringify(section))),
    payloadType: INFLUENCE_MEDIA_TYPE,
    signatures: [],
  }
}

/**
 * DSSE PAE: `"DSSEv1" SP LEN(type) SP type SP LEN(body) SP body`, where each LEN is the
 * ASCII decimal *byte* length. This is the exact byte string a DSSE signature covers.
 */
export function dssePreAuthEncoding(payloadType: string, payload: Uint8Array): Uint8Array {
  const prefix = utf8(`DSSEv1 ${utf8(payloadType).length} ${payloadType} ${payload.length} `)
  const out = new Uint8Array(prefix.length + payload.length)
  out.set(prefix, 0)
  out.set(payload, prefix.length)
  return out
}

export function fromDsse(envelope: unknown): Extracted {
  if (envelope === null || typeof envelope !== 'object') return { present: false }
  const { payload, payloadType } = envelope as Record<string, unknown>
  if (typeof payload !== 'string' || payloadType !== INFLUENCE_MEDIA_TYPE) return { present: false }
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(base64ToBytes(payload)))
  } catch {
    return { present: true, valid: false, errors: [{ path: '/payload', message: 'payload is not valid JSON' }] }
  }
  return extract(parsed)
}

/** DSSE uses standard base64; accept the url-safe alphabet too rather than be brittle. */
function base64ToBytes(s: string): Uint8Array {
  const normalised = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalised.length % 4 === 0 ? '' : '='.repeat(4 - (normalised.length % 4))
  const bin = atob(normalised + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/* --------------------------------------------------------------------------
 * 3. A2A extension
 * ----------------------------------------------------------------------- */

/** Declared in an Agent Card under `capabilities.extensions[]`. */
export interface A2AExtensionDeclaration {
  uri: string
  description: string
  required: boolean
}

export function a2aExtensionDeclaration(): A2AExtensionDeclaration {
  return {
    uri: INFLUENCE_NS,
    description: 'Paid influence disclosure for the decision carried by this task.',
    required: false,
  }
}

/**
 * A2A activation is opt-in per request: the client sends the extension URI in an
 * `A2A-Extensions` header. This is the value for that header.
 */
export const A2A_EXTENSIONS_HEADER = 'A2A-Extensions'

/** Fragment to merge into a `Task.metadata` or `Message.metadata` map. */
export function toA2AMetadata(section: InfluenceSection): Record<string, InfluenceSection> {
  return { [INFLUENCE_NS]: section }
}

/** Read from a whole Task or Message, or from a bare metadata map. */
export function fromA2AMetadata(taskOrMetadata: unknown): Extracted {
  if (taskOrMetadata === null || typeof taskOrMetadata !== 'object') return { present: false }
  const metadata = (taskOrMetadata as Record<string, unknown>)['metadata'] ?? taskOrMetadata
  return extract(readNamespaced(metadata))
}

/* --------------------------------------------------------------------------
 * 4. MCP tamper-evident audit record (SEP-3004)
 * ----------------------------------------------------------------------- */

/** Fragment to merge into the record's type-keyed `extensions` map. */
export function toMcpExtension(section: InfluenceSection): Record<string, InfluenceSection> {
  return { [INFLUENCE_NS]: section }
}

/** Read from a whole audit record, or from a bare extensions map. */
export function fromMcpExtension(record: unknown): Extracted {
  if (record === null || typeof record !== 'object') return { present: false }
  const extensions = (record as Record<string, unknown>)['extensions'] ?? record
  return extract(readNamespaced(extensions))
}
