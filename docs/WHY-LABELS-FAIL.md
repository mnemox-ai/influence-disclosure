# Why human disclosure labels fail under agent readers

Disclosure of paid influence was built for a human reader: a "Sponsored" tag, a footnote,
a line in the terms. That design has one assumption behind it, which is that the party
being informed is a person looking at a page. When the reader is an agent acting for
someone, every part of the assumption breaks, and it breaks in a direction that makes the
label worse than useless.

This document is the argument for a machine-readable disclosure section. Every claim below
is sourced, and every source has been checked against its publisher record rather than
quoted from memory.

## 1. The label does not reach the person it was written for

*Ads that Talk Back: Implications and Perceptions of Injecting Personalized Advertising
into LLM Chatbots.* Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous
Technologies, 2025. [10.1145/3770640](https://doi.org/10.1145/3770640)

Users failed to notice advertising injected into chatbot responses, and did not act on the
formal disclosure interface presented to them. The disclosure was rendered; it did not
inform. When a conversational surface replaces a page, the visual conventions that made a
sponsored slot legible go with it.

## 2. When an agent does read the label, it reads it backwards

*What Is Your AI Agent Buying? Evaluation, Biases, Model Dependence, and Emerging
Implications of Agentic E-Commerce.* Proceedings of the ACM Web Conference 2026.
[10.1145/3774904.3792943](https://doi.org/10.1145/3774904.3792943)

From the abstract, verbatim: models "penalize sponsored tags, reward endorsements".

This is the load-bearing finding. A disclosure label is supposed to be neutral information
that a reader weighs. To an agent it is a feature with a sign attached, and the sign is
negative. Two consequences follow directly:

- Honest disclosure is now competitively punished. A seller who labels a placement is
  ranked below one who does not, by the agent, automatically.
- The incentive is to move influence into forms the label does not name. The same paper
  finds endorsements are *rewarded*, so relabelling a paid placement as a platform
  endorsement is both cheap and effective.

Human-facing disclosure was self-enforcing because a person who saw an unlabelled ad could
complain. Agent-facing disclosure has the opposite dynamic: the labelled seller loses.

## 3. Influence cannot be recovered from the output

*The Invisible Editorial Layer: Formalizing Undisclosed Inference-Time Steering,
Probability Placement, and the Attribution Problem in Deployed Language Models.*
arXiv:2608.24662, 2026-08-25. [abs/2608.24662](https://arxiv.org/abs/2608.24662)

Attribution of commercial influence from black-box outputs is not identifiable. You cannot
audit your way to the answer from the outside. Whatever the disclosure is, it has to come
from the issuer, at decision time, as a statement rather than an inference.

Supporting measurements of the same problem: commission steering in travel agents
([arXiv:2605.10440](https://arxiv.org/abs/2605.10440)), and reputation-signal effects worth
roughly twelve dollars a night in hotel selection
([arXiv:2606.16344](https://arxiv.org/abs/2606.16344)).

## 4. What follows for the format

Each finding constrains the design, and together they rule out most of the obvious answers.

| Finding | Consequence for the format |
|---|---|
| Labels are not perceived (§1) | The disclosure must be a field, not a rendering. Presentation is the consuming application's problem. |
| Labels are read with a negative sign (§2) | It cannot be one boolean flag. A relationship that existed but did not affect the outcome must be expressible and distinguishable from one that did, or every disclosure carries the same penalty and nobody discloses. |
| Endorsements are rewarded where sponsorship is penalised (§2) | The vocabulary must name the forms separately: commission, paid placement, affiliate, sponsorship, revenue share, ownership, exclusivity, data supply. A single "sponsored" bucket is exactly the loophole. |
| Influence is unidentifiable from outputs (§3) | It must be issued and signed by the party that holds the relationship. No amount of external observation substitutes. |
| Issuer holds both the key and the incentive to hide | Completeness cannot be proven cryptographically. It can only be *asserted*, so that omission becomes an attributable false statement rather than silence. |

That last row is the honest limit of this design, and it is stated in the specification
rather than hidden. A signature proves that a document was not altered and who signed it.
It cannot prove that nothing was left out. For this section, leaving something out is the
entire attack, and the party holding the signing key is the party that benefits from it.

Three mechanisms narrow that gap, and none is part of v0: counter-signature by the party
that paid, publication to a transparency log, and regulator-side sampling. The last is what
Taiwan's securities rule actually asks for. See
[ARTICLE-10-MAPPING.md](ARTICLE-10-MAPPING.md).

Note that the trust-inversion mechanism is not novel and should not be claimed as such:
receiver-attested receipts published to a witness-cosigned Merkle log were described in
*Notarized Agents* ([arXiv:2606.04193](https://arxiv.org/abs/2606.04193), 2026-06-02). What
is absent from that work, and from every other implementation surveyed in
[PRIOR-ART.md](PRIOR-ART.md), is any field for commercial influence.

## Provenance of the sources

Checked first-hand for this document: the two ACM DOIs against the Crossref work records
(titles and venues as printed above); the WWW 2026 quotation against the paper's abstract;
the three arXiv identifiers against the arXiv API, returning matching titles and dates.

Excluded for lack of verification: a 23-model audit of sponsorship concealment reported as
an ICLR 2026 workshop poster (OpenReview `anDIdtSuA8`). Neither OpenReview API returned a
record for that identifier. The finding may well be real; it is not cited here, and its
concealment figure is not used anywhere in this repository.
