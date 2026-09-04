export type Locale = 'zh-TW' | 'en'

export const REPO = 'https://github.com/mnemox-ai/influence-disclosure'
export const SPEC_URL = `${REPO}/blob/main/spec/SPEC.md`
export const ARTICLE10_URL = `${REPO}/blob/main/docs/ARTICLE-10-MAPPING.md`
export const WHY_URL = `${REPO}/blob/main/docs/WHY-LABELS-FAIL.md`
export const PRIOR_ART_URL = `${REPO}/blob/main/docs/PRIOR-ART.md`
export const LICENSE_URL = `${REPO}/blob/main/LICENSE`

export interface Content {
  htmlLang: string
  metaTitle: string
  metaDescription: string
  nav: { records: string; verify: string; article10: string; install: string; cta: string }
  navAria: { menu: string; language: string }
  hero: {
    line1: string
    line2: string
    sub: string
    primary: string
    secondary: string
    note: string
  }
  records: { eyebrow: string; title: string; cards: { term: string; body: string }[] }
  verify: {
    eyebrow: string
    title: string
    lede: string
    offline: string
    label: string
    run: string
    samples: { clean: string; partial: string; broken: string }
    result: {
      valid: string
      invalid: string
      foundIn: string
      relationships: string
      affected: string
      completeness: string
      withheld: string
      none: string
      parseError: string
      hosts: Record<string, string>
    }
  }
  article10: {
    eyebrow: string
    title: string
    lede: string
    warningTitle: string
    warningBody: string
    quoteLabel: string
    quote: string
    source: string
    tableHead: [string, string, string]
    rows: [string, string, string][]
    carrier: { section: string; host: string }
    download: string
    full: string
  }
  install: {
    eyebrow: string
    title: string
    lede: string
    npx: string
    tabs: { id: string; label: string; note: string; code: string }[]
    copy: string
    copied: string
  }
  why: {
    eyebrow: string
    title: string
    lede: string
    items: { source: string; venue: string; claim: string; href: string }[]
    more: string
  }
  footer: { license: string; status: string }
}

export const CODE = {
  prefill: `{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "type": ["VerifiableCredential", "AgentReceipt"],
  "issuer": "did:web:issuer.example",
  "credentialSubject": {
    "id": "psu:AQEBAQEBAQEBAQEBAQEBAQ",
    "urn:influence-disclosure:v0": {
      "spec_version": "0.1.0",
      "completeness": "partial",
      "withheld_reason": "jurisdictional_restriction",
      "relationships": [
        {
          "id": "fund-distributor",
          "counterparty": { "ref": "distributor.example", "kind": "merchant" },
          "direction": "inbound",
          "form": "revenue_share",
          "compensation": { "type": "rate", "rate": 0.0075 },
          "effect": { "kind": "inclusion", "targets": ["opt:fund-c"] },
          "disclosed_to_principal": "in_band"
        }
      ]
    }
  }
}`,
  clean: `{
  "spec_version": "0.1.0",
  "completeness": "complete",
  "relationships": []
}`,
  // labelled "partial disclosure", so it must actually be one: completeness partial
  // with a stated reason, next to a relationship that did move the ranking
  partial: `{
  "spec_version": "0.1.0",
  "completeness": "partial",
  "withheld_reason": "commercially_confidential",
  "relationships": [
    {
      "id": "hotel-partner",
      "counterparty": { "ref": "partner-hotels.example", "kind": "merchant" },
      "direction": "inbound",
      "form": "commission",
      "compensation": { "type": "withheld", "reason": "commercially_confidential" },
      "effect": { "kind": "ranking", "targets": ["opt:hotel-2"] },
      "disclosed_to_principal": "in_band"
    },
    {
      "id": "airline-affiliate",
      "counterparty": { "ref": "air.example", "kind": "merchant" },
      "direction": "inbound",
      "form": "affiliate",
      "compensation": { "type": "fixed", "amount": "40.00", "currency": "TWD" },
      "effect": { "kind": "none" }
    }
  ]
}`,
  broken: `{
  "spec_version": "0.1.0",
  "completeness": "complete",
  "relationships": [
    {
      "id": "hotel-partner",
      "counterparty": { "ref": "Partner Hotels Limited, Taipei branch" },
      "direction": "inbound",
      "form": "commission",
      "compensation": { "type": "rate", "rate": 0.12 },
      "effect": { "kind": "ranking" }
    }
  ]
}`,
  vc: `import { toCredentialSubject } from 'influence-disclosure'

credential.credentialSubject = {
  ...credential.credentialSubject,
  ...toCredentialSubject(section),
}`,
  dsse: `import { toDsse, dssePreAuthEncoding } from 'influence-disclosure'

const envelope = toDsse(section)
// sign PAE("DSSEv1", payloadType, payload) with your own key
const bytes = dssePreAuthEncoding(envelope.payloadType, payload)`,
  a2a: `import { toA2AMetadata, a2aExtensionDeclaration } from 'influence-disclosure'

// Agent Card
card.capabilities.extensions.push(a2aExtensionDeclaration())
// Task
task.metadata = { ...task.metadata, ...toA2AMetadata(section) }`,
  mcp: `import { toMcpExtension } from 'influence-disclosure'

auditRecord.extensions = {
  ...auditRecord.extensions,
  ...toMcpExtension(section),
}`,
}

const ARTICLE10_ROWS: [string, string, string][] = [
  ['第三方業者', '簽發者身分', 'host'],
  ['在人工智慧運算', '一次決策一份紀錄', 'host'],
  ['可能影響決策的重要資料', '`relationships[]`：存在哪些付費關係', 'section'],
  ['可能影響決策', '`effect.kind`：該關係對這次決策做了什麼', 'section'],
  ['留存軌跡紀錄', '`compensation`：金額或費率，或明示 withheld 而非留白', 'section'],
  ['俾利後續查驗', '可離線驗證簽章', 'host'],
  ['俾利後續查驗', 'schema 驗證：格式合規可機器判定，不需人工閱讀', 'section'],
  ['可被查驗', '`completeness`：簽發者具名宣告清單是否完整', 'section'],
]

const ARTICLE10_ROWS_EN: [string, string, string][] = [
  ['the third-party provider', 'Issuer identity', 'host'],
  ['in its AI computation', 'One record per decision', 'host'],
  ['data that may affect the decision', '`relationships[]`: which paid relationships existed', 'section'],
  ['may affect the decision', '`effect.kind`: what that relationship did to this decision', 'section'],
  ['retain a trail record', '`compensation`: rate or amount, or an explicit withheld, never a blank', 'section'],
  ['to enable later inspection', 'Offline signature verification', 'host'],
  ['to enable later inspection', 'Schema validation, decidable by machine without a human reader', 'section'],
  ['can be inspected', '`completeness`: the issuer states on the record whether the list is exhaustive', 'section'],
]

export const zh: Content = {
  htmlLang: 'zh-Hant-TW',
  metaTitle: 'influence-disclosure｜AI 推薦背後誰付了錢，一段可簽章的揭露',
  metaDescription:
    '開放、可內嵌、由簽發者簽章的付費影響力揭露段。誰付錢給誰、什麼形式、對這次推薦做了什麼。可掛在 W3C VC、DSSE、A2A、MCP 上，瀏覽器端離線驗證。Apache-2.0。',
  nav: { records: '記錄什麼', verify: '線上驗證', article10: '第十條對照', install: '安裝', cta: 'GitHub' },
  navAria: { menu: '選單', language: '語言' },
  hero: {
    line1: 'AI 推薦了誰、誰付了錢、有沒有影響',
    line2: '一段機器可讀、可簽章、可離線驗證的揭露。',
    sub: 'Influence Disclosure — a signed, machine-readable section for paid influence in AI recommendations.',
    primary: '驗證一份揭露',
    secondary: '讀規格',
    note: 'Apache-2.0 · 可內嵌 W3C VC / DSSE / A2A / MCP · 證券商公會第十條對照表附',
  },
  records: {
    eyebrow: '三個欄位',
    title: '它記錄什麼',
    cards: [
      {
        term: '關係',
        body: '跟誰有金錢關係，什麼形式：佣金、分潤、付費排序、聯盟、持股、獨家、資料供應。',
      },
      {
        term: '影響',
        body: '這關係對這次推薦做了什麼：納入、排除、排序、過濾、呈現，或沒有。',
      },
      {
        term: '完整性',
        body: '簽發者具名宣告清單是否完整。空清單是經簽章的無利益衝突聲明，漏報則是可歸責的不實陳述。',
      },
    ],
  },
  verify: {
    eyebrow: '離線',
    title: '線上驗證',
    lede: '貼上一份揭露段，或一份內嵌了它的宿主文件。驗證器會告訴你它在哪個格式裡找到、有幾筆關係、幾筆影響了結果。',
    offline: '驗證在你的瀏覽器完成，不送出任何資料。',
    label: '揭露段或宿主文件（JSON）',
    run: '驗證',
    samples: { clean: '載入：無利益衝突', partial: '載入：部分揭露', broken: '載入：壞掉的' },
    result: {
      valid: '通過',
      invalid: '不合格',
      foundIn: '找到於',
      relationships: '筆關係',
      affected: '筆影響了結果',
      completeness: '完整性',
      withheld: '未完整揭露的理由',
      none: '宣告本次推薦沒有任何付費關係介入',
      parseError: '這不是合法的 JSON。',
      hosts: {
        'bare section': '揭露段本身',
        'verifiable credential': 'W3C Verifiable Credential',
        'DSSE envelope': 'DSSE 信封',
        'A2A metadata': 'A2A metadata',
        'MCP audit record': 'MCP 稽核紀錄',
      },
    },
  },
  article10: {
    eyebrow: '台灣法遵',
    title: '第十條對照',
    lede: '證券商向 AI 供應商要求「留存軌跡紀錄」時，這張表說明本揭露段能交付條文的哪一部分。',
    warningTitle: '常見誤引',
    warningBody:
      '金管會 113 年 6 月 20 日「金融業運用人工智慧（AI）指引」沒有這項要求。該指引全文「軌跡」出現 0 次，通篇為「宜」等建議性表述。強制性的「應」在公會自律規範，不在指引。',
    quoteLabel: '第十條（落實可驗證）第二項',
    quote:
      '證券商使用第三方人工智慧技術時應執行調查、評估及監督作業，以確保第三方業者在人工智慧運算有留存軌跡紀錄，俾利後續查驗。',
    source:
      '中華民國證券商業同業公會「證券商運用人工智慧技術自律規範」。金管會 113 年 11 月 19 日金管證券字第 1130361481 號函准予備查；公會 113 年 11 月 21 日中證商業一字第 1130006063 號公告實施。',
    tableHead: ['條文文字', '對應到什麼', '由誰承載'],
    rows: ARTICLE10_ROWS,
    carrier: { section: '本段', host: '宿主格式' },
    download: '下載對照表 PDF',
    full: '讀完整對照表',
  },
  install: {
    eyebrow: '四個宿主格式',
    title: '安裝',
    lede: '本段沒有自己的簽章與身分，它掛在你已經在用的收據格式裡，繼承那份文件的簽章。',
    npx: 'npx influence-disclosure-cli validate ./disclosure.json',
    tabs: [
      { id: 'vc', label: 'W3C VC', note: '放進 credentialSubject', code: CODE.vc },
      { id: 'dsse', label: 'DSSE', note: '當作 payload', code: CODE.dsse },
      { id: 'a2a', label: 'A2A', note: '放進 Task.metadata，在 Agent Card 宣告', code: CODE.a2a },
      { id: 'mcp', label: 'MCP', note: '放進稽核紀錄的 extensions', code: CODE.mcp },
    ],
    copy: '複製',
    copied: '已複製',
  },
  why: {
    eyebrow: '為什麼需要機器可讀',
    title: '為什麼標籤失效',
    lede: '給人看的揭露標籤，在 agent 讀者下不只是沒用，而是反向的。',
    items: [
      {
        source: 'Ads that Talk Back',
        venue: 'ACM IMWUT 2025',
        claim: '使用者沒有注意到被植入的廣告，也沒有依正式的揭露介面採取行動。標籤有被渲染，但沒有告知任何人。',
        href: 'https://doi.org/10.1145/3770640',
      },
      {
        source: 'What Is Your AI Agent Buying?',
        venue: 'ACM Web Conference 2026',
        claim:
          '模型「懲罰 sponsored 標籤、獎勵背書」。誠實標示的賣家因此被排到後面，動機是把影響力搬到標籤不點名的形式裡。',
        href: 'https://doi.org/10.1145/3774904.3792943',
      },
      {
        source: 'The Invisible Editorial Layer',
        venue: 'arXiv:2608.24662',
        claim: '從黑箱輸出歸因商業影響是不可識別的。揭露只能由簽發者在決策當下簽出來，不能靠事後推測。',
        href: 'https://arxiv.org/abs/2608.24662',
      },
    ],
    more: '讀完整論述',
  },
  footer: { license: 'Apache-2.0', status: 'v0：0.x 期間隨時破壞相容' },
}

export const en: Content = {
  htmlLang: 'en',
  metaTitle: 'influence-disclosure — a signed section for paid influence in AI recommendations',
  metaDescription:
    'An open, embeddable, issuer-signed disclosure of paid influence: who paid whom, in what form, and what it did to the recommendation. Embeds in W3C VC, DSSE, A2A and MCP. Verifies offline in the browser. Apache-2.0.',
  nav: { records: 'What it records', verify: 'Verify', article10: 'Article 10', install: 'Install', cta: 'GitHub' },
  navAria: { menu: 'Menu', language: 'Language' },
  hero: {
    line1: 'Who the AI recommended, who paid for it,',
    line2: 'and whether that changed the answer.',
    sub: 'Influence Disclosure — a signed, machine-readable section for paid influence in AI recommendations.',
    primary: 'Verify a disclosure',
    secondary: 'Read the spec',
    note: 'Apache-2.0 · Embeds in W3C VC / DSSE / A2A / MCP · Taiwan Article 10 mapping included',
  },
  records: {
    eyebrow: 'Three fields',
    title: 'What it records',
    cards: [
      {
        term: 'Relationship',
        body: 'Who the money runs to, and in what form: commission, revenue share, paid placement, affiliate, ownership, exclusivity, data supply.',
      },
      {
        term: 'Effect',
        body: 'What that relationship did to this recommendation: inclusion, exclusion, ranking, filtering, presentation, or nothing at all.',
      },
      {
        term: 'Completeness',
        body: 'The issuer states on the record whether the list is exhaustive. An empty list is a signed claim of no conflict; an omission is an attributable false statement.',
      },
    ],
  },
  verify: {
    eyebrow: 'Offline',
    title: 'Verify',
    lede: 'Paste a disclosure section, or a host document with one embedded. The validator tells you which format it found it in, how many relationships there are, and how many changed the outcome.',
    offline: 'Verification runs in your browser. Nothing is sent anywhere.',
    label: 'Disclosure section or host document (JSON)',
    run: 'Verify',
    samples: { clean: 'Load: no conflict', partial: 'Load: partial disclosure', broken: 'Load: broken' },
    result: {
      valid: 'Valid',
      invalid: 'Invalid',
      foundIn: 'found in',
      relationships: 'relationship(s)',
      affected: 'affected the outcome',
      completeness: 'completeness',
      withheld: 'reason withheld',
      none: 'declares that no paid relationship bore on this decision',
      parseError: 'That is not valid JSON.',
      hosts: {
        'bare section': 'a bare section',
        'verifiable credential': 'a W3C Verifiable Credential',
        'DSSE envelope': 'a DSSE envelope',
        'A2A metadata': 'A2A metadata',
        'MCP audit record': 'an MCP audit record',
      },
    },
  },
  article10: {
    eyebrow: 'Taiwan compliance',
    title: 'Article 10 mapping',
    lede: 'When a securities firm asks its AI vendor to retain a computation trail, this table says which part of the rule this section delivers.',
    warningTitle: 'Commonly miscited',
    warningBody:
      "The FSC's June 2024 guideline on financial-sector AI does not contain this requirement. The word 軌跡 (trail) appears zero times in it, and its expectations are advisory throughout. The mandatory wording lives in the securities association's self-regulatory rule, not in the guideline.",
    quoteLabel: 'Article 10 (verifiability), second paragraph',
    quote:
      'When a securities firm uses third-party AI, it shall conduct due diligence, assessment and supervision so as to ensure that the third-party provider retains a trail record of its AI computation, to enable later inspection.',
    source:
      'Taiwan Securities Association, Self-Regulatory Rules on the Use of AI by Securities Firms. Filed with the FSC on 19 Nov 2024 (Ref. 1130361481) and published on 21 Nov 2024. Translation is unofficial; the Chinese text governs.',
    tableHead: ['Wording in the rule', 'What it maps to', 'Carried by'],
    rows: ARTICLE10_ROWS_EN,
    carrier: { section: 'this section', host: 'the host format' },
    download: 'Download the mapping as PDF',
    full: 'Read the full mapping',
  },
  install: {
    eyebrow: 'Four host formats',
    title: 'Install',
    lede: 'The section carries no signature or identity of its own. It sits inside a receipt format you already use and inherits that document’s signature.',
    npx: 'npx influence-disclosure-cli validate ./disclosure.json',
    tabs: [
      { id: 'vc', label: 'W3C VC', note: 'a property of credentialSubject', code: CODE.vc },
      { id: 'dsse', label: 'DSSE', note: 'as the payload', code: CODE.dsse },
      { id: 'a2a', label: 'A2A', note: 'in Task.metadata, declared in the Agent Card', code: CODE.a2a },
      { id: 'mcp', label: 'MCP', note: 'in the audit record extensions map', code: CODE.mcp },
    ],
    copy: 'Copy',
    copied: 'Copied',
  },
  why: {
    eyebrow: 'Why machine-readable',
    title: 'Why labels fail',
    lede: 'Disclosure written for a human reader does not merely stop working under agent readers. It inverts.',
    items: [
      {
        source: 'Ads that Talk Back',
        venue: 'ACM IMWUT 2025',
        claim: 'Users failed to notice advertising injected into chatbot responses, and did not act on the formal disclosure interface. The label was rendered; it did not inform.',
        href: 'https://doi.org/10.1145/3770640',
      },
      {
        source: 'What Is Your AI Agent Buying?',
        venue: 'ACM Web Conference 2026',
        claim: 'Models "penalize sponsored tags, reward endorsements". The seller who discloses honestly is ranked below the one who does not, so the incentive is to move influence into forms the label does not name.',
        href: 'https://doi.org/10.1145/3774904.3792943',
      },
      {
        source: 'The Invisible Editorial Layer',
        venue: 'arXiv:2608.24662',
        claim: 'Attribution of commercial influence from black-box outputs is not identifiable. Disclosure has to be signed by the issuer at decision time rather than inferred afterwards.',
        href: 'https://arxiv.org/abs/2608.24662',
      },
    ],
    more: 'Read the full argument',
  },
  footer: { license: 'Apache-2.0', status: 'v0 — breaking changes expected throughout 0.x' },
}

export const dict: Record<Locale, Content> = { 'zh-TW': zh, en }
