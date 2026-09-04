# influence-disclosure

> 正式名稱 **influence-disclosure**（2026-09-05 Sean 拍板）。口語簡稱可寫 "Influence Disclosure (ID)"，
> 但 **ID 不得出現在任何識別碼裡**：套件名、URN、網址、schema `$id` 一律用全名。

## 這是什麼

**一段，不是一個收據格式。** 開放、可內嵌、由簽發者簽章的「付費影響力揭露段」：
誰付錢給誰、什麼形式、多少、以及那筆錢對這次決策做了什麼。塞進別人已經在維護的
收據格式裡（W3C VC / DSSE / A2A / MCP），不自己做信封、簽章、委派鏈。

一句話定位：**agent 推薦了什麼、誰付了錢讓它這樣推薦。**

## Current Status（2026-09-05）

- **v0.1.0 已推上 `github.com/mnemox-ai/influence-disclosure`（public、Apache-2.0）。**
- 116 tests / 8 files 全綠；core 的 statements、functions、lines 100%，branch 98.7%。
- `pnpm typecheck` / `pnpm test` / `pnpm build` 三個都過。CLI 端到端跑過全部 7 份範例。
- **⏸ 停工四週，等客戶發現結果。** Sean 去接觸券商的 AI 供應商與投顧公會自律規範起草人。
  四週內沒有一家願意用這段當第十條交付格式就結案；有一家才開 Phase 2。
  這四週唯一的工作是 `docs/ARTICLE-10-MAPPING.md`（已完成）。

### 翻案條件（隨時有效）

**任何人已經在做開放的付費影響揭露段就停。** 目前最接近的是 Stub（getstub.dev），
但它是封閉 SaaS、驗證必經 registry、無開放規格、無委派鏈。它若開源規格，這個專案就失去理由。

## 為什麼範圍這麼小（不要擅自擴充）

2026-09-05 跑了六路 prior art 掃描（`docs/PRIOR-ART.md`，每條標了第一手驗證 vs agent 回報）：

- 信封／簽章／離線驗證：**至少 6 個實作**（agentreceipts.ai v0.5 做得比原規劃還深，
  它的 verify 頁明文 "makes no network requests"）
- 委派鏈：**至少 5 個提案**（HDP 2604.04522、A2A #2028、AP2、Attestix、IEEE Access Lineage）
- 「排除了哪些選項」：Signatrust ADR v1.0，2026-09-03 發布，CC BY 4.0
- 信任邊界反轉／共簽：Notarized Agents 2606.04193，2026-06-02
- **付費影響力揭露：空的**（W3C VC registry、C2PA、OTel GenAI、ISO 27560、12 份 IETF draft、
  Crossref 掃 ACM+IEEE 全部 0 命中）

所以本專案只做最後那一格。**要動手加信封、簽章、委派鏈、options 列表之前先讀 PRIOR-ART.md。**

## 設計上兩個必須知道的點

1. **空陣列是一個主張。** `relationships: []` + `completeness: "complete"` 是「經簽章的無利益
   衝突聲明」；省略本段則什麼都沒主張。兩者不可互換。
2. **簽章證明不了完整性。** 它證明未竄改與誰簽的。本段的攻擊方式就是漏報，而持金鑰的正是
   有動機漏報的那方。`completeness` 是沒有可信第三方時能做到的最強保證：把漏報從沉默變成
   **具名的不實陳述**。這是法律槓桿不是密碼學保證，規格裡明寫，不要在對外文案裡講成密碼學保證。

## 台灣法源（賣點，但要引對）

**證券商公會「證券商運用人工智慧技術自律規範」第十條（落實可驗證）**，用「應」。
金管會 113/11/19 金管證券字第 1130361481 號函備查。

🔴 **不是金管會 AI 指引**。那份全文「軌跡」0 次、通篇「宜」。引錯會被法遵打臉。
逐字條文與欄位對照見 `docs/ARTICLE-10-MAPPING.md`。memory: `tw-securities-ai-audit-trail-rule`。

## 開發

```bash
pnpm install && pnpm test && pnpm build
node packages/cli/dist/index.js validate spec/examples/valid/02-commission-affected-ranking.json
```

- Node ≥ 20.11、pnpm 11（`npm i -g pnpm`；corepack enable 在這台會 EPERM，要寫 Program Files）
- schema 的單一真相是 `spec/schema/influence.v0.json`。**不要手改
  `packages/core/src/schema.generated.ts`**，跑 `node scripts/gen-schema.mjs`；
  有測試會比對，漂移就 CI 紅。
- 文件裡的 ```json 區塊有測試在驗，改文件時範例不能寫壞。

## 網站（`site/`）

Astro 靜態輸出，繁中預設在 `/`、英文在 `/en/`，兩語內容完整。視覺是逆向參考站
（Vexel AI）量測而來，**每個數值的出處與偏離理由都在 `site/DESIGN.md`**，動視覺前先讀那份。

- 驗證器是唯一的 island，`influence-disclosure` 在按下驗證時才動態載入（首屏 JS 2.86 kB）。
- 🔴 **改中文文案後要重跑字型 subset**：`pnpm --filter influence-disclosure-site fonts`
  （`tools/subset_fonts.py`）。思源黑體是照實際用字切的 158 KB，不是整包；沒重跑會缺字回退系統字型。
- 驗收腳本都在 `tools/`（截圖、對照圖、e2e、Lighthouse、PDF），`tools/README.md` 有對照表。
- Lighthouse：a11y / best-practices / SEO 四輪全 100，performance 繁中手機 97、其餘 100。
- **尚未部署**：Cloudflare 需要 `wrangler login`（互動式 OAuth，只有 Sean 能做），
  之後 `pnpm --filter influence-disclosure-site deploy`。

## Recent Changes

- **2026-09-05** v0.1.0 首次 commit（`ab18ecd`）。schema + 驗證器 + 四個 adapter
  （VC credentialSubject / DSSE / A2A metadata / MCP SEP-3004 extension）+ subject 假名化
  + 隱私啟發式 + CLI + SPEC.md + WHY-LABELS-FAIL.md + ARTICLE-10-MAPPING.md + PRIOR-ART.md。
- **2026-09-05** 一頁站完成（`site/`）+ 第十條對照表 PDF。中文字型思源黑體（自架、照用字 subset）。
- **2026-09-05** 定名 influence-disclosure。npm：`influence-disclosure`（core）／`influence-disclosure-cli`。
  PyPI 佔名套件在 `pypi-placeholder/`（**尚未發布**，需要 Sean 的 token）。URN 不變。
- 2026-09-05 範圍從「完整收據規格 + SDK + CLI + MCP + 網站」砍成「一段」。原因＝prior art。
  移除 packages/mcp 與 site。決策全文與翻案條件見 `DECISIONS.md`（信封決策格式，11 條）。
