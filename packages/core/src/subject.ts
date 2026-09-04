/**
 * Subject pseudonymisation.
 *
 * A receipt never carries the principal's real identifier. It carries a pseudonym
 * that is stable within one correlation scope and unlinkable outside it, so that:
 *   - the issuer and a regulator can group one principal's receipts (same scope), and
 *   - two counterparties cannot join their receipt sets into one profile (different scopes).
 *
 * The salt is the whole security boundary: it never appears in a receipt, and if it
 * leaks, every pseudonym derived with it is re-identifiable by brute force over the
 * identifier space (national IDs, phone numbers and e-mail addresses are all small
 * enough to enumerate). See SPEC.md "Subject pseudonymity" for the operational rules.
 */
import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { domainSeparated, toBase64Url } from './bytes.js'

/** 128 bits, base64url, no padding. */
export const PSEUDONYM_PATTERN = /^psu:[A-Za-z0-9_-]{22}$/
export const MIN_SALT_BYTES = 32
const ID_BYTES = 16
const HMAC_DOMAIN = 'adr/subject/hmac-sha256/v1'

export type SubjectMethod = 'hmac-sha256:v1' | 'random:v1'

export interface Subject {
  /** Opaque pseudonym, `psu:` + 22 base64url chars. Never a real identifier. */
  id: string
  /**
   * How `id` was produced. `hmac-sha256:v1` is stable for the same principal within
   * `scope`; `random:v1` is fresh per receipt and therefore unlinkable even to the issuer.
   */
  method: SubjectMethod
  /**
   * Correlation scope label. Receipts sharing an (issuer, scope) pair may be linked;
   * receipts in different scopes may not. Rotate by changing the label, e.g.
   * `issuer` -> `issuer:2026H2`. Must not itself contain an identifier.
   */
  scope: string
}

export interface DeriveSubjectInput {
  /** The real identifier being protected. Stays local; never returned or logged. */
  subjectRef: string
  /** >= 32 random bytes, held by the issuer, never published, never in a receipt. */
  salt: Uint8Array
  /** Correlation scope label. */
  scope: string
}

function assertScope(scope: string): void {
  if (scope.length === 0 || scope.length > 64) {
    throw new Error('subject.scope must be 1-64 characters')
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:+-]*$/.test(scope)) {
    throw new Error('subject.scope must match [A-Za-z0-9][A-Za-z0-9._:+-]*')
  }
}

/** Deterministic pseudonym: same (subjectRef, salt, scope) always yields the same id. */
export function deriveSubject({ subjectRef, salt, scope }: DeriveSubjectInput): Subject {
  if (subjectRef.length === 0) throw new Error('subjectRef must not be empty')
  if (salt.length < MIN_SALT_BYTES) {
    throw new Error(`salt must be at least ${MIN_SALT_BYTES} bytes, got ${salt.length}`)
  }
  assertScope(scope)
  const mac = hmac(sha256, salt, domainSeparated(HMAC_DOMAIN, scope, subjectRef))
  return { id: `psu:${toBase64Url(mac.slice(0, ID_BYTES))}`, method: 'hmac-sha256:v1', scope }
}

/** Fresh pseudonym with no link to any other receipt. Use when correlation is not needed. */
export function randomSubject(scope: string, rng: (n: number) => Uint8Array = randomBytes): Subject {
  assertScope(scope)
  const bytes = rng(ID_BYTES)
  if (bytes.length !== ID_BYTES) throw new Error(`rng must return ${ID_BYTES} bytes`)
  return { id: `psu:${toBase64Url(bytes)}`, method: 'random:v1', scope }
}

/** A fresh salt for a new (issuer, scope) pair. Store it like a private key. */
export function generateSubjectSalt(rng: (n: number) => Uint8Array = randomBytes): Uint8Array {
  return rng(MIN_SALT_BYTES)
}

export function isPseudonym(id: string): boolean {
  return PSEUDONYM_PATTERN.test(id)
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  crypto.getRandomValues(out)
  return out
}
