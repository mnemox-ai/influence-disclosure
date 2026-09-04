# Influence Disclosure Section

An open, embeddable, signed statement of **the paid relationships that did or did not shape
one agent decision**: who paid whom, in what form, how much, and what it did to the outcome.

It is a section, not a receipt. Signed agent receipts already exist and are maintained by
other people; this drops into them.

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

## Why this exists

Disclosure of paid influence was designed for a human looking at a page. Under agent
readers it fails in a specific and measurable way: agents **penalise sponsored tags and
reward endorsements** ([WWW 2026](https://doi.org/10.1145/3774904.3792943)), so the seller
who discloses honestly is ranked below the one who does not. Users do not perceive the
labels either ([IMWUT 2025](https://doi.org/10.1145/3770640)), and commercial influence
cannot be recovered from model outputs after the fact
([arXiv:2608.24662](https://arxiv.org/abs/2608.24662)).

The argument in full, with sources checked against publisher records:
[docs/WHY-LABELS-FAIL.md](docs/WHY-LABELS-FAIL.md).

## Try it

```bash
pnpm install && pnpm build
node packages/cli/dist/index.js validate spec/examples/valid/02-commission-affected-ranking.json
```

```
valid — found in bare section
  2 relationship(s), 1 affected the outcome (completeness: complete)
```

The validator finds the section inside a host document too, and says where it found it:

```bash
node packages/cli/dist/index.js validate spec/examples/valid/04-inside-verifiable-credential.json
```

```
valid — found in verifiable credential
  1 relationship(s), 1 affected the outcome (completeness: partial)
  partial disclosure: jurisdictional_restriction
```

## Where the section goes

Keyed under `urn:influence-disclosure:v0` in all four:

| Host | Placement |
|---|---|
| W3C Verifiable Credential | property of `credentialSubject` |
| DSSE | payload, `application/vnd.influence-disclosure+json` |
| A2A | `Task.metadata` or `Message.metadata`, declared in the Agent Card |
| MCP tamper-evident audit record | property of the `extensions` map |

```ts
import { toCredentialSubject, fromDsse, validateInfluence } from '@decision-receipt/core'
```

## Two design points worth knowing before you use it

**An empty list is a claim.** `relationships: []` under `completeness: "complete"` is a
signed statement that no paid relationship bore on this decision. Omitting the section
claims nothing. The two are not interchangeable.

**A signature cannot prove completeness.** It proves the document was not altered and who
signed it. For this section, leaving something out is the whole attack, and the party
holding the key is the party that benefits. `completeness` is the honest answer available
without a trusted third party: it turns a later-discovered omission into an attributable
false statement rather than silence. That is a legal lever, not a cryptographic one, and
the specification says so rather than hiding it.

## Repository

| Path | Contents |
|---|---|
| [spec/SPEC.md](spec/SPEC.md) | Normative specification |
| [spec/schema/influence.v0.json](spec/schema/influence.v0.json) | JSON Schema, draft 2020-12 |
| [spec/examples/](spec/examples/) | Valid and invalid documents, used as tests |
| `packages/core` | Types, validator, four adapters, subject pseudonymity |
| `packages/cli` | The validator as a command |
| [docs/WHY-LABELS-FAIL.md](docs/WHY-LABELS-FAIL.md) | The argument, with sources |
| [docs/ARTICLE-10-MAPPING.md](docs/ARTICLE-10-MAPPING.md) | 台灣證券商公會第十條逐字對照表 |
| [docs/PRIOR-ART.md](docs/PRIOR-ART.md) | What already exists, and what this deliberately does not build |
| [DECISIONS.md](DECISIONS.md) | Decisions taken, each with what would reverse it |

## Status

v0.1.0. Breaking changes expected throughout 0.x. `spec_version` is a constant, so a
document from a later version fails loudly rather than being half-understood.

Apache-2.0.
