# Influence Disclosure Section, v0.1.0

A signed statement of the paid relationships that did, or did not, shape one agent
decision.

Normative schema: [schema/influence.v0.json](schema/influence.v0.json).
Examples: [examples/](examples/). The rationale for the format is
[WHY-LABELS-FAIL.md](../docs/WHY-LABELS-FAIL.md).

Status: **v0. Breaking changes are expected throughout 0.x.** `spec_version` is a constant,
so a document written against a later version fails loudly here rather than being
half-understood.

## 1. Scope

This is a **section**, not a receipt. It carries no signature, no identity, no timestamp
and no chain of its own, because formats that do those things already exist and are
maintained by other people. This section is placed inside one of them and inherits its
signature.

**In scope:** which paid relationships existed, what form they took, what they were worth,
and what each one did to this decision.

**Out of scope, deliberately:** the envelope; the signature suite; the delegation chain;
the list of options considered; the citation of the principal's data. Every one of those
is covered by shipped work, listed in [PRIOR-ART.md](../docs/PRIOR-ART.md).

## 2. Where it goes

The section is keyed under `urn:influence-disclosure:v0` in every host format. A URN is
used rather than an `https` URI so that no identifier has to change when the project takes
a domain.

| Host | Placement |
|---|---|
| W3C Verifiable Credential | a property of `credentialSubject` |
| DSSE | the payload, with `payloadType: application/vnd.influence-disclosure+json` |
| A2A | a property of `Task.metadata` or `Message.metadata`, declared in the Agent Card under `capabilities.extensions[]` and activated by the `A2A-Extensions` request header |
| MCP tamper-evident audit record | a property of the record's type-keyed `extensions` map |

A consumer that does not understand the section MUST ignore it rather than reject the host
document.

## 3. Fields

### 3.1 Section

| Field | Required | Meaning |
|---|---|---|
| `spec_version` | yes | Exactly `"0.1.0"`. |
| `completeness` | yes | `complete` or `partial`. See §4. |
| `withheld_reason` | when `partial` | Why the list is not exhaustive. MUST NOT be present when `complete`. |
| `relationships` | yes | Array, possibly empty. See §3.2. |

An empty `relationships` under `completeness: complete` is a **positive claim** that no
paid relationship bore on this decision. It is not the same as omitting the section, which
claims nothing. Issuers that have no relationships to declare SHOULD emit the empty form.

### 3.2 Relationship

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Local identifier, unique within the section. Lowercase, digits, `-`, `_`, at most 32 characters. |
| `counterparty.ref` | yes | Stable identifier of the other party: a domain, a legal entity identifier, or an identifier defined by the host. An identifier, never prose, **never a natural person**. |
| `counterparty.kind` | no | `merchant`, `publisher`, `advertiser`, `platform`, `agent`, `other`. |
| `direction` | yes | `inbound` if the issuer receives value, `outbound` if it pays. |
| `form` | yes | `commission`, `paid_placement`, `affiliate`, `sponsorship`, `revenue_share`, `ownership`, `exclusivity`, `data_supply`, `other`. |
| `compensation` | yes | One of four shapes, see §3.3. |
| `effect` | yes | What it did to this decision, see §3.4. |
| `disclosed_to_principal` | no | `in_band`, `on_request`, `not_disclosed`. Records what happened. It does not bless any of the three. |

`form` is an enumeration rather than free text because the distinctions are the whole
point. Agent readers treat sponsorship and endorsement differently, so collapsing them
into one bucket reproduces the loophole this section exists to close.

### 3.3 Compensation

Exactly one of:

- `{"type": "rate", "rate": 0.12}` — fraction of transaction value, 0 to 1.
- `{"type": "fixed", "amount": "40.00", "currency": "TWD"}` — `amount` is a **decimal
  string**, never a JSON number, so no value is lost to binary floating point.
- `{"type": "none"}` — a relationship with no monetary compensation, such as ownership.
- `{"type": "withheld", "reason": "..."}` — the relationship is disclosed, the amount is
  not. Withholding the amount is visible; it does not look like absence.

### 3.4 Effect

`kind` is one of `none`, `inclusion`, `ranking`, `exclusion`, `filtering`, `presentation`.

`targets` is an array of opaque references to the affected options, resolved by the host
format. It is REQUIRED unless `kind` is `none`. This section deliberately does not define
the option list; it points into whatever the host already records.

`kind: none` records a relationship that exists but did not bear on this decision. This is
the disclosure most often skipped and the one that makes the rest usable: without it, any
declared relationship reads as an admission of bias, and the rational move is to declare
nothing.

`exclusion` and `filtering` are the highest-value entries in practice. "A competitor was
removed from consideration because a third party pays us" is the fact least visible in an
output and least likely to be volunteered.

## 4. Completeness, and what a signature does not do

A signature proves that a document was not altered and identifies who signed it. **It does
not prove that nothing was left out.** For this section, omission is the entire attack, and
the party holding the signing key is the party that benefits from omitting.

`completeness` is the honest response available without a trusted third party. Asserting
`complete` converts a later-discovered omission from silence into a false statement
attributable to a named issuer. That is a legal lever, not a cryptographic one, and this
specification does not claim otherwise.

Issuers MUST NOT assert `complete` where a relationship bearing on the decision is known
and unlisted. Consumers MUST NOT treat `complete` as verified.

Three mechanisms would narrow the gap and none is part of v0: counter-signature by the
paying party, publication to a transparency log, and audit sampling by a supervisor. Prior
art for the first two is recorded in [PRIOR-ART.md](../docs/PRIOR-ART.md).

## 5. Privacy

The section describes commercial relationships between organisations. It is not a place
for personal data, and the schema is built to make that difficult rather than merely
discouraged:

- every object is closed (`additionalProperties: false`), so there is nowhere to put
  free text;
- `counterparty.ref` and every `targets` entry must contain no whitespace, which rejects
  prose;
- string lengths are capped.

Implementations SHOULD additionally run the heuristic scan shipped with the reference
implementation, which reports e-mail addresses, phone numbers, national identity numbers,
card numbers, long strings and prose-like content. Those are **warnings, never errors**:
a heuristic over natural language is not sound, and a false positive must never make a
valid disclosure unverifiable.

## 6. Companion: subject pseudonymity

Not part of this section. Host formats often carry an identifier for the principal, and a
raw one defeats the purpose of everything else. The reference implementation provides a
pseudonym of the form `psu:` followed by 22 base64url characters, derived as
`HMAC-SHA-256(salt, scope ‖ 0x00 ‖ subject)` truncated to 128 bits.

Same principal and same scope give the same pseudonym, so a supervisor can group one
principal's records. Different scopes give unlinkable pseudonyms, so two counterparties
cannot join their sets into one profile. Rotation is done by changing the scope label.

The salt is the entire security boundary. It MUST be at least 32 random bytes, MUST NOT
appear in any document, and MUST be protected like a signing key: **if it leaks, every
pseudonym derived with it can be re-identified by brute force**, because identifier spaces
such as national ID numbers are small enough to enumerate exhaustively.

## 7. Conformance

An implementation conforms if it validates documents against
[schema/influence.v0.json](schema/influence.v0.json) and treats the examples in
[examples/valid](examples/valid) as valid and those in [examples/invalid](examples/invalid)
as invalid.

The reference implementation compiles the published schema directly; a test regenerates it
and fails on any difference, so the library cannot enforce a different schema from the one
published here.
