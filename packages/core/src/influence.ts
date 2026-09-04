/**
 * The influence disclosure section.
 *
 * What it is: a signed statement of the paid relationships that did, or did not, shape
 * one agent decision. It is a section, not a receipt. It rides inside a receipt format
 * that somebody else maintains (see `adapters.ts`).
 *
 * What it does not claim: a signature proves integrity and authorship. It cannot prove
 * completeness, and for this section omission is the whole attack, because the party
 * with the incentive to hide a commission is the same party holding the signing key.
 * The `completeness` field is the honest answer available without a trusted registry:
 * it turns a later-discovered omission from silence into an attributable false statement
 * by the issuer. That is a legal lever, not a cryptographic one. Say so in the docs.
 */
import { Ajv2020 } from 'ajv/dist/2020.js'
import type { ErrorObject, ValidateFunction } from 'ajv'
import { scanForLeaks, type PrivacyWarning } from './privacy.js'
import { influenceSchemaV0 } from './schema.generated.js'

export const SPEC_VERSION = '0.1.0'

export type Completeness = 'complete' | 'partial'
export type WithheldReason =
  | 'commercially_confidential'
  | 'not_known_at_issue_time'
  | 'jurisdictional_restriction'
  | 'other'

export type RelationshipForm =
  | 'commission'
  | 'paid_placement'
  | 'affiliate'
  | 'sponsorship'
  | 'revenue_share'
  | 'ownership'
  | 'exclusivity'
  | 'data_supply'
  | 'other'

/** `none` records a relationship that exists but did not bear on this decision. */
export type EffectKind = 'none' | 'inclusion' | 'ranking' | 'exclusion' | 'filtering' | 'presentation'

export type Compensation =
  | { type: 'rate'; rate: number }
  | { type: 'fixed'; amount: string; currency: string }
  | { type: 'none' }
  | { type: 'withheld'; reason: WithheldReason }

export interface Counterparty {
  ref: string
  kind?: 'merchant' | 'publisher' | 'advertiser' | 'platform' | 'agent' | 'other'
}

export interface Effect {
  kind: EffectKind
  /** Opaque references into the host format's option list. Required unless kind is `none`. */
  targets?: string[]
}

export interface Relationship {
  id: string
  counterparty: Counterparty
  /** `inbound`: the issuer receives value. `outbound`: the issuer pays it. */
  direction: 'inbound' | 'outbound'
  form: RelationshipForm
  compensation: Compensation
  effect: Effect
  disclosed_to_principal?: 'in_band' | 'on_request' | 'not_disclosed'
}

export interface InfluenceSection {
  spec_version: typeof SPEC_VERSION
  completeness: Completeness
  withheld_reason?: WithheldReason
  /** Empty under `complete` is a positive claim of no paid influence, not an absence. */
  relationships: Relationship[]
}

export interface ValidationError {
  /** RFC 6901 JSON Pointer into the section. */
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  /** Heuristic, never fatal. See `privacy.ts`. */
  warnings: PrivacyWarning[]
}

let compiled: ValidateFunction | undefined

function validator(): ValidateFunction {
  if (compiled === undefined) {
    // strictRequired is an Ajv lint, not a JSON Schema rule: it objects to `required`
    // inside an if/then branch that does not restate the property. Restating would
    // duplicate the definitions and let them drift, and other validators accept the
    // schema as written, so the lint is off and the rest of strict mode stays on.
    compiled = new Ajv2020({ allErrors: true, strict: true, strictRequired: false }).compile(influenceSchemaV0)
  }
  return compiled
}

/**
 * Ajv messages are precise but written for schema authors. Rewrite the ones a person
 * issuing a disclosure will actually hit; pass everything else through.
 */
function readable(error: ErrorObject): string {
  const { keyword, params, message } = error
  if (keyword === 'additionalProperties') {
    return `unknown property "${String(params['additionalProperty'])}"; this section is closed by design`
  }
  if (keyword === 'required') {
    const prop = String(params['missingProperty'])
    if (prop === 'withheld_reason') return 'completeness is "partial", so withheld_reason is required'
    if (prop === 'targets') return 'an effect other than "none" must say which options it affected'
    return `missing required property "${prop}"`
  }
  if (keyword === 'not' && error.instancePath === '') {
    return 'withheld_reason is only meaningful when completeness is "partial"'
  }
  if (keyword === 'oneOf') {
    return 'compensation must be exactly one of: {type:"rate",rate}, {type:"fixed",amount,currency}, {type:"none"}, {type:"withheld",reason}'
  }
  if (keyword === 'const' && error.instancePath === '/spec_version') {
    return `spec_version must be "${SPEC_VERSION}"; 0.x makes no compatibility promise`
  }
  if (keyword === 'pattern') {
    if (error.instancePath.endsWith('/ref')) {
      return 'must be an identifier with no whitespace, such as a domain or an entity id, not prose'
    }
    if (error.instancePath.endsWith('/id')) {
      return 'must be lowercase letters, digits, - or _, at most 32 characters'
    }
    if (error.instancePath.endsWith('/amount')) return 'must be a decimal string, for example "12.50"'
    if (error.instancePath.endsWith('/currency')) return 'must be a three-letter ISO 4217 code, for example "TWD"'
  }
  return message ?? keyword
}

/**
 * Ajv reports the failed branch of an if/then as its own error alongside the real one.
 * Keeping both would show every reader the same problem twice, once unreadably.
 */
function isBranchNoise(error: ErrorObject): boolean {
  return error.keyword === 'if'
}

/**
 * Validate a section against the normative schema, then scan it for content that looks
 * like it should not be in a machine-readable disclosure. Schema failures are errors;
 * the scan only ever produces warnings.
 */
export function validateInfluence(value: unknown): ValidationResult {
  const validate = validator()
  const valid = validate(value) as boolean
  const errors: ValidationError[] = (validate.errors ?? [])
    .filter((e) => !isBranchNoise(e))
    .map((e) => ({ path: e.instancePath, message: readable(e) }))
  return { valid, errors, warnings: scanForLeaks(value) }
}

/** Narrowing helper for callers that only care whether the value is usable. */
export function isInfluenceSection(value: unknown): value is InfluenceSection {
  return validateInfluence(value).valid
}

/**
 * The disclosure that a decision was clean. Distinct from omitting the section: this is
 * a positive, signed claim that the issuer had no paid relationship bearing on it.
 */
export function noInfluence(): InfluenceSection {
  return { spec_version: SPEC_VERSION, completeness: 'complete', relationships: [] }
}
