export { INFLUENCE_MEDIA_TYPE, INFLUENCE_NS, A2A_EXTENSIONS_HEADER } from './adapters.js'
export {
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
  type A2AExtensionDeclaration,
  type DsseEnvelope,
  type Extracted,
} from './adapters.js'
export {
  SPEC_VERSION,
  isInfluenceSection,
  noInfluence,
  validateInfluence,
  type Compensation,
  type Completeness,
  type Counterparty,
  type Effect,
  type EffectKind,
  type InfluenceSection,
  type Relationship,
  type RelationshipForm,
  type ValidationError,
  type ValidationResult,
  type WithheldReason,
} from './influence.js'
export { scanForLeaks, type PrivacyWarning, type PrivacyWarningCode, type ScanOptions } from './privacy.js'
export {
  MIN_SALT_BYTES,
  PSEUDONYM_PATTERN,
  deriveSubject,
  generateSubjectSalt,
  isPseudonym,
  randomSubject,
  type Subject,
  type SubjectMethod,
} from './subject.js'
export { influenceSchemaV0 } from './schema.generated.js'
