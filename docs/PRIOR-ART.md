# Prior art scan — 2026-09-05

Scope: does an open spec already cover a signed, independently verifiable, three-party
agent decision receipt? Four parallel searches (credential standards, provenance and
regulatory logging, agent protocols and agentic payments, direct competitors).

Verification legend: **[1st]** verified first-hand from the primary source during this
session. **[2nd]** reported by a search agent, primary link recorded, not re-fetched.

## Verdict

The envelope is taken. The money is not.

| Layer | State of the art | Our position |
|---|---|---|
| Signature envelope | Solved 3x over (W3C VC 2.0 + Data Integrity, SD-JWT, DSSE) | Adopt, do not author |
| Receipt of an agent action | At least 6 live implementations | Align, do not compete |
| Delegation chain | At least 5 proposals in A2A alone | Align vocabulary |
| Citations of principal context | Partially covered (MCP SEP-2817) | Extend |
| Options considered / **rejected** | Near-empty | **Open** |
| **Paid influence disclosure** | **Empty** | **Open** |

## The closest existing thing

**Agent Receipts v0.5.0** — `agentreceipts.ai`, repo `agent-receipts/obsigna`. **[1st]**

- Is a W3C Verifiable Credential: `"type": ["VerifiableCredential", "AgentReceipt"]`.
- Ed25519 (`Ed25519Signature2020`), RFC 8785 JCS canonicalisation, offline verifiable.
- Has delegation: `delegation.parent_chain_id`, `delegation.parent_receipt_id`,
  `delegation.delegator.id`, and `chain.previous_receipt_hash` (required, null on first).
- Ships SDKs in Go, TypeScript and Python plus an MCP proxy.
- Apache-2.0. Created 2026-04-02, last push 2026-09-01, 20 stars, 3 forks,
  one human contributor (1,120 commits) plus dependabot. **[1st, `gh api`]**
- **Has no field for payment, commission, sponsorship, affiliate relationship or any
  other financial disclosure.** **[1st]**
- **Has no enumeration of options considered or options rejected.** **[1st]**

This is 2/3 of what we planned to build, shipped five months ago, under a licence that
lets us extend it. Building our own envelope would be a later, thinner clone.

## Regulatory demand for the part nobody has built

- FTC (2026): a product surfaced or ranked higher because of a payment or other material
  connection between the brand and the platform operating the AI agent must be
  disclosed. **[1st, web search]**
- EU AI Act Article 50 transparency obligations in application from 2026-08-02;
  machine-readable marking is required for synthetic content, not for influence. **[1st]**
- SEC has proposed conflict-of-interest rules for broker-dealer and investment-adviser
  use of predictive technologies. **[1st]**

Demand is stated in regulation; no machine-readable format exists to satisfy it. That
mismatch is the gap this project should occupy.

## Standards to adopt rather than re-author **[2nd]**

| Spec | Status | Use |
|---|---|---|
| W3C VC Data Model 2.0 | Recommendation, 2025-05-15 | Envelope |
| W3C VC Data Integrity 1.0 (`eddsa-jcs-2022`) | Recommendation, 2025-05-15 | Proof |
| SD-JWT | RFC 9901, 2025-11 | Selective disclosure |
| SD-JWT VC | draft-19, IETF Last Call to 2026-09-15 | Watch, do not front-run |
| ISO/IEC TS 27560:2023 | Technical Specification | Consent-record field alignment |
| MCP SEP-3004 | Open PR | Tamper-evident audit record, extension point |
| A2A extensions | Core v1.0 | `capabilities.extensions[]` + `A2A-Extensions` header |
| IAB sellers.json / SupplyChain Object | Live | `nodes[]` vocabulary for who was paid |

## Warning that changes an approved decision **[2nd]**

`did:key` is a W3C CCG draft (v0.9), not a standard, and its own spec warns that it
supports neither key rotation nor deactivation and is correlatable across contexts.
Acceptable for offline demo and short-lived agents; not acceptable as the long-term
identity of an institutional issuer. See DECISIONS.md ENV-002.

## Taiwan compliance basis — corrected **[1st, PDF text extraction]**

The requirement is real, but the usual citation is wrong.

**Not** the FSC guideline. 金管會 113/06/20「金融業運用人工智慧（AI）指引」contains the word
軌跡 **zero** times and states its expectations as 宜 (advisory).

**The actual source** is the securities association's self-regulatory rule:
中華民國證券商業同業公會「證券商運用人工智慧技術自律規範」**第十條（落實可驗證）**,
filed under 金管會 113/11/19 金管證券字第 1130361481 號函, published 113/11/21
中證商業一字第 1130006063 號. It uses 應 (mandatory):

> 證券商自行開發、優化人工智慧技術時，應保存必要技術文件及相關紀錄，包括開發者在設計、開發和實施
> 過程中，如為可能影響決策的重要資料、模型或演算法等紀錄，以確保其在必要時可被查驗。
> 證券商使用第三方人工智慧技術時應執行調查、評估及監督作業，以確保第三方業者在人工智慧運算有
> 留存軌跡紀錄，俾利後續查驗。

軌跡 appears exactly once in the whole document, in the third-party clause. The duty sits
with the securities firm but flows down the outsourcing chain to the AI vendor. A signed,
offline-verifiable receipt is the artefact the vendor hands over to discharge it.

The rule specifies no field list, no retention period and no format. That blank is ours
to fill, and 可被查驗 maps directly onto offline signature verification.

## Field-level regulatory precedent to copy **[2nd]**

MiFID II RTS 6 (Reg. 2017/589) Art. 28 + Annex II Tables 2 and 3 is the only field-level
legal precedent found. Table 2 carries `Investment decision within firm`,
`Initial order designation`, `Date and time`, `Additional information from the client`;
Table 3 carries `Execution within firm`, `Order receiver identification code`,
`Sequence number`, `Routing Strategy` and paired send/receive timestamps. That
decision-maker / executor / receiver / routing-strategy shape is what a delegation record
should look like. Art. 5(7) additionally requires recording when an algorithm changed,
who changed it, who approved it and what changed. Retention is five years.

EU AI Act Art. 12 requires high-risk systems to support automatic event logging but
prescribes no format; Art. 19 sets a six-month floor and, at 19(2), folds financial
institutions into their existing record-keeping regimes.

## Envelope: the recommendation split, and why that no longer matters

The credential-standards search recommended a W3C VC envelope with Data Integrity
`eddsa-jcs-2022`. The provenance search recommended a bare DSSE envelope with our own
`payloadType`, because DSSE signs `PAE(payloadType, payload)` and so keeps
canonicalisation off the spec surface, natively supports multiple signatures (a
three-party co-signature comes free), and avoids JOSE algorithm confusion. Both are
defensible and they contradict each other.

The contradiction dissolves under the scope decision in DECISIONS.md ENV-001: if what we
author is a payload section rather than an envelope, we do not pick one. The section must
be embeddable in a VC `credentialSubject`, a DSSE payload, an A2A `metadata` extension and
an MCP SEP-3004 extension record alike.

## Correction: the two "empty" sections are not empty **[1st]**

The competitor search overturned half of the verdict above. Both findings verified
first-hand.

**Stub — `getstub.dev`, live since 2026-07-20.** Ships influence disclosure today.
Eight fields: `operator`, `principal` (hashed), `requested`, `done`, `value_moved`,
`not_disclosed`, `issued_at`, `signature`. `not_disclosed` carries commission
percentages, paid placement, partner filtering, engagement weighting, source primacy.
So "nobody is doing paid-influence disclosure" is **false**.

What Stub does not have: an open specification, a JSON Schema, delegation chains, or
offline verification. Verification goes through `api.getstub.dev`, and the registry
countersigns every check. Their stated reason is a real argument, not an oversight:

> "A receipt you verify on the seller's machine proves nothing. Neutrality is the product."

**Signatrust ADR v1.0 — `signatrust.net/adr`, published 2026, CC BY 4.0.** Named
"AI Decision Receipt". Fields: `version`, `id`, `type`, `sequence`, `agent`, `model`,
`decision`, `metadata`, `timestamp`, `previous_hash`, `receipt_hash`, `signature`, with
`scope_declaration.domains_evaluated` and `scope_declaration.domains_excluded` classifying
factors as assessed or omitted with structured reasons. That is the "what was excluded"
idea, published. No financial disclosure fields, no delegation chain, single-key signature.

So the corrected map is:

| Section | Occupied by | Left open |
|---|---|---|
| Envelope, signature, chain | 6+ implementations | nothing |
| Options excluded | Signatrust ADR v1.0 (open spec, CC BY 4.0) | nothing meaningful |
| Paid influence disclosure | Stub (closed SaaS, registry-bound) | **the open, embeddable spec of it** |

## The hole in our own threat model

A signature proves integrity and authorship. It cannot prove **completeness**. For
`context` and `decision`, omission is a weak attack because the principal can cross-check
against their own data. For `influence`, omission *is* the attack: the party with the
incentive to hide a commission is the same party holding the signing key. A self-signed
offline receipt from the agent operator is signed by the entity that benefits from lying.

Stub answers this with a neutral countersigning registry, at the cost of offline
verification. Three other answers exist and none of them require giving that up:

1. **Co-signature by the payer.** The merchant or fund that paid the commission signs the
   same disclosure. A disclosure attested by both payer and payee is materially harder to
   falsify than one self-attested by the payee. DSSE carries multiple signatures natively;
   W3C Data Integrity allows a `proof` array.
2. **Transparency log.** Inclusion proofs over a corpus make selective omission detectable
   after the fact, Certificate-Transparency style. Needs a log, not a trusted verifier.
3. **Regulator-side sampling.** Weakest technically, but it is what 證券商公會第十條
   actually asks for: 必要時可被查驗.

Option 1 is the one that distinguishes us from everything found in this scan, and it is a
design claim rather than a field list. **It has not itself been checked for prior art.**
Given that four theses died in this codebase on exactly that mistake, that check is a
precondition, not a follow-up.

## Academic layer **[2nd, all arXiv IDs verified via the arXiv API by the reporting agent]**

The mechanism half is occupied. The problem half is loud and has no mechanism.

**Occupied (a) + (c).** HDP: Human Delegation Provenance (2604.04522) is the closest:
Ed25519, fully offline verification, append-only signed hop chain. Also
Offline-Verifiable Accountability for Cross-Org Agent Messaging (2608.28542),
Policy-Decision Receipts (2608.17176), Mandato (2608.14074), Agent Flight Recorder
(2609.01931), SentinelAgent (2604.02767), plus peer-reviewed work: VET Your Agent
(ACM AsiaCCS 2026), Authenticated and Offline-Verifiable A2A Messaging (IEEE CCWC 2026),
Lineage UMA2.0 multi-hop delegation (IEEE Access 2026), AI Agents Need Authenticated
Delegation (ICML 2025).

**Trust-boundary inversion is also published.** Notarized Agents (2606.04193, 2026-06-02)
has the receiving party sign the receipt rather than the acting agent, published to a
witness-cosigned Merkle log, opening with: the entity producing the activity log is the
same entity whose activity is being logged. **[1st]** So the co-signature idea in the
section above is not novel as a mechanism. It is unpublished only in combination with
influence disclosure.

**Unoccupied (b), with unusually strong demand evidence.** Every paper on commercial
influence in agent recommendations measures the problem; none proposes a format.

- Ads in AI Chatbots (ICLR 2026 Workshop AFAA): 23-model audit finds sponsored-product
  steering with roughly 0.65 mean sponsorship *concealment*.
- TourMart (2605.10440): commission steering in LLM travel agents.
- Whose hotel does the AI recommend? (2606.16344): list position alone is worth about
  $12 a night.
- Ads that Talk Back (PACM IMWUT 2025): users failed to notice injected ads **and ignored
  the formal disclosure UI**.
- What Is Your AI Agent Buying? (WWW 2026): agents penalise explicit "Sponsored" tags but
  reward platform endorsements, so today's human-facing labels invert under agent readers.
- The Invisible Editorial Layer (2608.24662): proves attribution of commercial influence
  is unidentifiable from black-box outputs, which is an argument that disclosure has to be
  issuer-signed rather than inferred.

Two independent sweeps (arXiv exact-phrase plus a Crossref sweep over ACM 10.1145 and
IEEE 10.1109 proceedings from 2025-01) returned **nothing** proposing affiliate,
commission or sponsorship disclosure machinery for AI assistants.

## Where that leaves the project

| Leg | Status |
|---|---|
| Signed, offline-verifiable receipt | Crowded. Do not build. |
| Delegation chain | Crowded. Do not build. |
| Options excluded | Published 2026-09-03 by Signatrust ADR v1.0. |
| Trust-boundary inversion / co-signing | Published 2026-06-02 by Notarized Agents. |
| **Machine-readable paid-influence disclosure** | **Open, in both literature and standards.** |

The surviving thesis is one section, not a platform: an open, embeddable, signed
influence-disclosure section that rides inside receipt formats other people already
maintain. Everything else in the original plan is a reimplementation of shipped work.
