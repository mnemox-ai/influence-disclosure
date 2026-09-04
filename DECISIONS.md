# DECISIONS

Every entry is a decision that has already been made, not a question. Each carries the
evidence that would reverse it and what reversing costs, so it can be flipped on sight
instead of discussed. Status `已決` means work is proceeding on it now.

Evidence base: [docs/PRIOR-ART.md](docs/PRIOR-ART.md).

---

### ENV-001 · 我們寫的是「一段」，不是「一個信封」

**決定** 不自建收據信封、簽章套件與委派鏈格式。改為只定義兩段別人沒有的內容，並讓它能
內嵌在既有信封裡：W3C VC 的 `credentialSubject`、DSSE 的 payload、A2A 的 `metadata`
extension、MCP SEP-3004 的 extension record。兩段是 `influence`（金錢影響揭露）與
`decision.excluded`（看過但排除的選項與理由）。

**理由** 信封那格已經有至少六個實作：agentreceipts.ai v0.5（W3C VC + Ed25519 + RFC 8785 +
委派鏈 + Go/TS/Python SDK + MCP proxy，Apache-2.0，2026-04 起、20 stars、上週還在推）、
A2A #2150 signed-receipts、A2A #2028 actorChain、MCP SEP-3004、AP2 v0.2 的 Checkout /
Payment Receipt、IETF draft-nelson。我們自建等於做一個晚五個月、更薄的複製品。
反過來，`influence` 在 W3C VC extension registry、C2PA assertion 清單、OTel GenAI semconv、
ISO 27560、以及上述六個實作裡**都查不到對應欄位**；A2A repo 搜 commission / sponsored 回 0 筆；
ACP 明文把 pay-to-win ranking 列為 non-goal。同時 FTC 2026 已要求揭露 AI 購物代理的金錢關係。
法規要求存在、機讀格式不存在。這是真空，不是我們想出來的。

**翻案條件（已於 2026-09-05 部分觸發，見下）** 找到任何既有規格已經定義機讀的
「誰付錢影響了這個推薦」欄位。

**觸發結果** Stub（getstub.dev，2026-07-20 上線）已經在做，欄位 `not_disclosed` 收
commission／paid placement／partner filtering／engagement weighting。但它**不是規格**：
無開放 spec、無 JSON Schema、無委派鏈，且驗證必須經 `api.getstub.dev` registry
（官方立場：「A receipt you verify on the seller's machine proves nothing.」）。
同時 Signatrust ADR v1.0（CC BY 4.0）已用 `scope_declaration.domains_evaluated` /
`domains_excluded` 佔走「排除了什麼」。
→ ENV-001 的「不自建信封」部分**維持**；「influence 是空的」這個理由**已失效**，
改以下修正版本。

**翻案成本** 高。這決定整個 repo 的形狀；越晚翻越貴。

**狀態** 已決

---

### ENV-002 · `issuer` 不預設 `did:key`

**決定** 撤回先前「did:key 當預設 issuer」的決定。`did:key` 只用於離線 demo 與短生命週期
agent；機構級簽發者用可輪替的識別（`did:web` 或 X.509），並在文件寫明取捨。

**理由** `did:key` 是 W3C CCG v0.9 draft，不是標準，且其規格自己警告：不支援 key rotation、
不支援 deactivation、跨情境可關聯。銀行當簽發者不可能接受一把永遠不能換的金鑰。
先前那個決定是我在沒查證支援度的情況下做的，理由（免傳公鑰即可離線驗證）仍然成立，
但只在短命情境成立。

**翻案條件** did:key 進入 W3C REC 且加入輪替機制。

**翻案成本** 低，尚未寫任何 issuer 解析程式碼。

**狀態** 已決（推翻 ENV 之前的口頭決定）

---

### ENV-003 · subject 假名化：HMAC + scope，salt 永不進收據

**決定** `subject` 是 `{ id, method, scope }`。`id` 固定為 `psu:` + 22 字元 base64url（128 bit），
schema 層用 pattern 鎖死，因此 email／電話／身分證放不進去（是 error 不是 warning）。
`method` 為 `hmac-sha256:v1`（同一 scope 內可關聯）或 `random:v1`（完全不可關聯）。
輪替靠換 `scope` 標籤（`issuer` → `issuer:2026H2`）。salt 至少 32 bytes、由簽發者保管、
永不出現在收據裡。兩種 method 產出的 id 形狀完全相同。

**理由** 監管要能把同一人的收據串起來，對手方不能跨簽發者拼出同一個人的輪廓。HMAC + 每個
(issuer, scope) 一把 salt 同時滿足這兩件事。**已知極限並寫進 SPEC**：salt 外洩即可對小空間
識別碼（全台身分證字號是可枚舉的）暴力還原，所以 salt 的保管等級等同私鑰。

**翻案條件** 需要「可向監管證明是同一人、但對簽發者也不可見」→ 那要 BBS 選擇性揭露，
但 W3C DI-BBS 仍是 CR Draft，現在跟太早。

**翻案成本** 低。已實作於 `packages/core/src/subject.ts`，19 個測試。

**狀態** 已決、已實作

---

### ENV-004 · 隱私兩層：schema 擋、啟發式只警告

**決定** schema 是硬牆（closed object、字串長度上限、hash 必須 `sha256:<64 hex>`），違反＝error。
啟發式偵測（長字串、prose、CJK 句子、email／電話／台灣身分證／Luhn 卡號、base64 blob）
一律只出 warning，附 RFC 6901 JSON Pointer。

**理由** 自然語言啟發式不可能 sound；false positive 若變成 error，就會讓一份合法收據無法驗證。

**翻案條件** 實測發現某類原文洩漏能穩定被 schema 擋掉 → 該條升級為 error。

**翻案成本** 低。已實作於 `packages/core/src/privacy.ts`，19 個測試。

**狀態** 已決、已實作

---

### ENV-005 · 委派鏈：加 hash，但沿用別人的詞彙

**決定** 保留「父收據要綁 hash 不能只綁 id」的結論，但欄位名對齊既有實作而非自創：
`chain.previous_receipt_hash`（agentreceipts.ai 已用）與 A2A #2028 `actorChain` 的形狀，
必要時再對照 MiFID II RTS 6 Annex II 的 decision-maker / executor / receiver / routing 四元組。

**理由** 只綁 id 的鏈可竄改（改父收據內容、id 不變、鏈仍合法）；這點成立。但既然 ENV-001
決定不自建信封，鏈的詞彙就該跟著宿主走，不該多發明一套。

**翻案條件** 宿主格式無法表達 hash 綁定。

**翻案成本** 低。

**狀態** 已決

---

### ENV-006 · crypto 用 @noble，不用 WebCrypto Ed25519

**決定** `@noble/curves` + `@noble/hashes`。

**理由** 瀏覽器對 WebCrypto Ed25519 支援度不齊；noble 純 JS、Node 與瀏覽器共用同一份程式碼，
core 得以維持純函式無 IO。

**翻案條件** 目標瀏覽器全數支援 WebCrypto Ed25519，且我們需要 FIPS 路徑。

**翻案成本** 低，介面已隔離。

**狀態** 已決、已安裝

---

### ENV-007 · 定名 influence-disclosure（已結案）

**決定** 正式名稱 `influence-disclosure`。npm 不用 scope：`influence-disclosure`（core）、
`influence-disclosure-cli`。PyPI 同名佔位。GitHub `mnemox-ai/influence-disclosure`。
URN 維持 `urn:influence-disclosure:v0`。**口語可簡稱 "Influence Disclosure (ID)"，
但 `ID` 不進任何識別碼**，因為它在工程圈已經是 identifier 的意思，撞得太兇。

**理由** 三個候選裡它最自我解釋，法遵文件與規格引用兩種場合都讀得通，中文直譯「影響力揭露」。
2026-09-05 實測 npm、PyPI、GitHub org 與 user 四項全空。放棄品牌感換取「看到名字就知道是什麼」。

**翻案條件** 無。已定名、已推 GitHub。

**狀態** 已決、已執行

---

### ENV-008 · 命名空間用 URN，不用 https URI

**決定** 四個宿主格式一律把本段掛在 `urn:influence-disclosure:v0`；DSSE 的 payloadType 用
`application/vnd.influence-disclosure+json`。

**理由** URN 不需要網域。品牌與網域未定，用 https URI 會逼我們現在挑一個，之後改名時所有已簽章
的文件都會指向失效的識別碼（而且簽了就改不動）。

**翻案條件** 定名並取得網域後，若要進 A2A 官方 namespace 或 W3C 生態，可在 v0.2 換成 https URI。

**翻案成本** 中。換識別碼會讓已簽發的文件無法被新版辨識，所以要趁還沒有真實簽發量時換。

**狀態** 已決、已實作

---

### ENV-009 · 驗證器直接編譯已發布的 schema

**決定** 用 Ajv 編譯 `spec/schema/influence.v0.json` 本身，不手寫驗證邏輯。schema 以
`scripts/gen-schema.mjs` 產生成 TS 模組，並有測試重新產生後比對，漂移即 CI 失敗。

**理由** 這是規格專案。第三方會用標準 JSON Schema 驗證器，我們的行為必須與 schema 完全一致；
手寫驗證器遲早會與規格分岔，而且分岔時沒人會發現。

**翻案條件** 瀏覽器 bundle 大小成為問題（Ajv 不小）。屆時改用預編譯的 standalone 驗證函式，
仍由 schema 產生，不改成手寫。

**翻案成本** 低，介面已隔離在 `validateInfluence`。

**狀態** 已決、已實作

---

### ENV-010 · 用 tsc build，不用 tsup

**決定** 移除 tsup，兩個 package 都用 `tsc -p` 輸出。

**理由** tsup 帶進 esbuild，esbuild 需要 postinstall 放平台 binary，在 pnpm 的 build-script
封鎖下多一道設定。純 TS library 用 tsc 就夠，少一個 dep、少一道 CI 摩擦。

**翻案條件** 需要 bundle 成單檔或做 tree-shaking 時。

**翻案成本** 低。

**狀態** 已決、已實作

---

### ENV-011 · 這輪不做的東西

**決定** 不做 MCP server package、不做網站、不做簽章、不做委派鏈、不做 options 列表。
交付就是 schema + 驗證器 + 四個 adapter + 論述文件 + 第十條對照表。

**理由** ENV-001。信封層已飽和，做了就是重寫別人 ship 過的東西。Sean 2026-09-05 明確指示不膨脹。

**翻案條件** 四週客戶發現後有一家願意採用，才開 Phase 2。

**翻案成本** 無，尚未開始。

**狀態** 已決

---

## 待決（需要你，不是我）

### 品牌命名：三個候選（2026-09-05 實測可用性）

`ADR` 縮寫不可用（Signatrust 已發布 "AI Decision Receipt (ADR)" v1.0，且工程圈本來就是
Architecture Decision Record）。`receipt` 一詞不宜當重心（agentreceipts.ai 與 Signatrust
各用掉一次）。以下三個 npm、PyPI、GitHub org 與 user 四項**全部實測為空**：

| 候選 | 語感 | 適合的場合 | 弱點 |
|---|---|---|---|
| **`influence-disclosure`**（推薦） | 白描，說完就懂 | 法遵文件、規格被引用、中文直譯「影響力揭露」 | 長，不好記，沒有品牌感 |
| `declaredinfluence` | 把設計核心（具名宣告完整性）放進名字 | 兼顧規格與開發者 | 稍長，語感偏抽象 |
| `openpaid` | 短、開源感、直指「錢」 | 開發者採用、網域好取 | 不自我解釋，需要一句 tagline |

實測方法：npm registry 與 PyPI JSON API 回 404；GitHub org 與 user 以認證過的 `gh api` 回 404。
**未能確認的**：npm scope（`@influence-disclosure/*` 之類）的持有者，npmjs.com 的 org 端點回 403。
只確認了該 scope 下的 `core` 套件不存在。網域未查（你說自己想）。

定名後改名成本：三個 package.json 的 name、README 指令、以及 ENV-008 的 URN。十分鐘內。
