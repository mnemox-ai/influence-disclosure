# influence-disclosure

**What it is.** An open, signed, machine-readable section that states the paid
relationships behind one AI recommendation: who paid whom, in what form, how much, and
what it did to the outcome. It is a *section*, not a receipt format, so it drops into
receipt formats that already exist rather than competing with them.

**Who it is for.** Anyone whose agent recommends things it earns money from, and anyone who
has to answer for that later: agent platforms and shopping agents, financial firms under
disclosure duties, and the auditors and supervisors reading the record afterwards.

**Verify one in under five minutes.**

```bash
npx influence-disclosure-cli validate ./disclosure.json
```

```
valid — found in verifiable credential
  1 relationship(s), 1 affected the outcome (completeness: partial)
  partial disclosure: jurisdictional_restriction
```

No key, no account, no network call. The validator also finds the section inside a host
document and tells you which one it found.

## Install

```bash
npm install influence-disclosure          # library
npx influence-disclosure-cli validate x   # validator, no install
```

The section is keyed under `urn:influence-disclosure:v0` in every host format:

```ts
import { toCredentialSubject, toDsse, toA2AMetadata, toMcpExtension } from 'influence-disclosure'

toCredentialSubject(section) // → property of a W3C Verifiable Credential credentialSubject
toDsse(section)              // → DSSE payload, application/vnd.influence-disclosure+json
toA2AMetadata(section)       // → property of A2A Task.metadata or Message.metadata
toMcpExtension(section)      // → property of an MCP audit record extensions map
```

Each has a matching reader (`fromCredentialSubject`, `fromDsse`, …) that validates on the
way out and never throws on untrusted input.

## Read

- [docs/ARTICLE-10-MAPPING.md](docs/ARTICLE-10-MAPPING.md) — 台灣證券商公會第十條逐字對照表：條文的哪個字對應這段的哪個欄位，以及本段做不到什麼
- [docs/WHY-LABELS-FAIL.md](docs/WHY-LABELS-FAIL.md) — why human disclosure labels fail under agent readers, with every source checked against its publisher record
- [docs/PRIOR-ART.md](docs/PRIOR-ART.md) — what already exists, and what this project deliberately does not build

## What a disclosure looks like

```json
{
  "spec_version": "0.1.0",
  "completeness": "complete",
  "relationships": [
    {
      "id": "hotel-partner",
      "counterparty": { "ref": "partner-hotels.example", "kind": "merchant" },
      "direction": "inbound",
      "form": "commission",
      "compensation": { "type": "rate", "rate": 0.12 },
      "effect": { "kind": "ranking", "targets": ["opt:hotel-2"] },
      "disclosed_to_principal": "in_band"
    }
  ]
}
```

## Two design points worth knowing before you use it

**An empty list is a claim.** `relationships: []` under `completeness: "complete"` is a
signed statement that no paid relationship bore on this decision. Omitting the section
claims nothing. The two are not interchangeable, and the empty form is the one to emit.

**A signature cannot prove completeness.** It proves the document was not altered and who
signed it. For this section, leaving something out is the whole attack, and the party
holding the key is the party that benefits from leaving it out. `completeness` is the
honest answer available without a trusted third party: it turns a later-discovered
omission into an attributable false statement rather than silence. That is a legal lever,
not a cryptographic one, and the specification says so rather than hiding it.

## Repository

| Path | Contents |
|---|---|
| [spec/SPEC.md](spec/SPEC.md) | Normative specification |
| [spec/schema/influence.v0.json](spec/schema/influence.v0.json) | JSON Schema, draft 2020-12 |
| [spec/examples/](spec/examples/) | Valid and invalid documents, used as tests |
| `packages/core` | Types, validator, four adapters, subject pseudonymity |
| `packages/cli` | The validator as a command |
| [DECISIONS.md](DECISIONS.md) | Decisions taken, each with what would reverse it |

## Develop

```bash
pnpm install && pnpm test && pnpm build
node packages/cli/dist/index.js validate spec/examples/valid/02-commission-affected-ranking.json
```

The normative schema is `spec/schema/influence.v0.json`. The library compiles that file
directly, and a test regenerates it and fails on any difference, so the library cannot
enforce a different schema from the one published here.

## Status

v0.1.0. Breaking changes expected throughout 0.x. `spec_version` is a constant, so a
document written against a later version fails loudly rather than being half-understood.

Apache-2.0.
