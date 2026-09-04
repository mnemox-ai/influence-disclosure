# site/DESIGN.md

從參考站 `https://tranquil-495tmg.peachworlds.com/`（站名 Vexel AI）實測抽出的數值。
所有數字都是 2026-09-05 在真 Chrome 用 `getComputedStyle` 與讀取 CSSOM 宣告規則量到的，
不是目測。**取皮不取肉**：視覺語言照抄，文案／圖片／3D／統計數字一律不抄。

量測環境註記：那台螢幕是 3440px 超寬，`resize_window` 對該視窗無效（`outerWidth` 回報 160），
所以桌機值是在 `innerWidth = 3440` 下量的。**因此斷點行為改讀 CSSOM 宣告值**（見型階），
不是靠改視窗推測。容器 `max-width: 1440px` 是硬上限，在任何 ≥1440 的視寬下都一樣。

---

## 色

參考站整頁**只有一個帶彩度的顏色**（掃過所有元素的 `color` / `background-color` /
`border-color`，彩度 > 28 的只命中一個值）。這證實了「一個強調色，不要第二個」。

| 角色 | 實測值 | 我們的 token |
|---|---|---|
| 底 | 畫面邊緣為純黑（背景是 `position: fixed; z-index: -1` 的 WebGL canvas，像素不可讀，故取截圖邊緣值） | `--bg: #000000` |
| 主文字 | `rgb(255, 255, 255)` | `--fg: #FFFFFF` |
| 次要文字／正文 | `rgb(236, 236, 236)` | `--fg-2: #ECECEC` |
| 更弱（eyebrow） | `rgba(255, 255, 255, 0.85)` | `--fg-3: rgba(255,255,255,.85)` |
| 髮絲線／卡片邊框 | `rgba(255, 255, 255, 0.1)` | `--line: rgba(255,255,255,.1)` |
| 卡片填色 | `rgba(0, 0, 0, 0.3)` | `--card: rgba(0,0,0,.3)` |
| **強調色（唯一）** | **`rgb(0, 131, 255)`** | `--accent: #0083FF` |

參考站的藍色光暈來自 WebGL 粒子穹頂。我們不做 3D，改用單層 CSS 徑向漸層在 hero 後方
模擬同一個「中心發亮、邊緣純黑」的分佈。這是「皮」，不是「肉」。

---

## 字

參考站全站**單一字族 DM Sans**（掃 h1/h2/h3/p/a/span/button 只回傳一個 family）。

我們用兩支，都自架、都開源、都不打 Google Fonts：

- **拉丁字：Geist**（SIL OFL）。不用 DM Sans 是因為那是參考站的識別；同樣是 grotesque，
  換一支等寬感更強的，符合「皮一樣、肉不一樣」。
- **中文：Noto Sans TC 思源黑體**（SIL OFL，2026-09-05 Sean 指定）。

字族順序 `'Geist Variable', 'Noto Sans TC', …`：拉丁字命中 Geist，中文往下落到思源黑體。

🔴 **思源黑體是 subset 過的，不是整包。** 通用的 unicode-range 版本每個 weight 切成約 105 個
分塊，三個 weight 進 build 後是 **18 MB 字型檔 + 395 KB 阻塞渲染的 CSS**，Lighthouse 手機
效能掉到 96。本站中文字集是固定的，所以改成用 `tools/subset_fonts.py` 掃 `site/src` 抽出實際
用到的 **348 個字**，切成三個 weight 共 **158 KB**，CSS 降到 18 KB 可以整份 inline。
**改動任何中文文案後要重跑那支腳本**（`pnpm --filter influence-disclosure-site fonts`）；
沒重跑的話缺字會回退到系統字型，不會壞掉但會不一致。

| 角色 | 實測（參考站） | 我們 |
|---|---|---|
| Hero | 64px ／ 992px 以下 48px ／ 480px 以下 32px；`line-height: 1em`；`letter-spacing: -0.06em`；`weight 500`；置中 | 同字級與字距與 weight，**行高改 1.12**（見偏離） |
| 區塊標題 | 48px；`line-height: 1em`；`letter-spacing: -0.06em`；`weight 400` | 48 / 36 / 28px，行高 1.15 |
| 正文／副標 | 20px；`weight 300`；`letter-spacing: -0.4px`（-0.02em）；`rgb(236,236,236)` | 同字級、weight、字距，**行高改 1.65**（見偏離） |
| Eyebrow | 14px；`weight 400`；`letter-spacing: -0.56px`（-0.04em）；`rgba(255,255,255,.85)` | 照抄 |
| 導覽連結 | 16px；`weight 400`；`letter-spacing: -0.32px`（-0.02em） | 照抄 |
| 按鈕標籤 | 16px；`weight 500`；`letter-spacing: -0.64px`（-0.04em） | 照抄 |

### 🔴 兩處刻意偏離量測值

參考站的 `line-height` 在 hero 與正文都是 `1em`。**照抄會壞掉**，原因是它是英文站，我們是繁中主：

1. **正文 20px/20px（行高 1.0）在多行中文下不可讀**，字距為零、行與行黏在一起。改 **1.65**。
2. **繁中大字行高 1.0 會裁掉字身頂部**（注音符號、部首出頭處），這個坑有紀錄
   （memory: `mobile-cjk-display-clip`，結論是 CJK 行高需 ≥1.25×）。Hero 改 **1.12**，
   因為 hero 是兩行短句、字級大，1.12 已足夠不裁切又保留參考站的緊湊感。

其餘所有型階數值（字級、weight、字距、斷點）照抄。

---

## 節奏與容器

| 項目 | 實測 | 我們 |
|---|---|---|
| 容器最大寬 | `max-width: 1440px`（全站出現 11 次，最主流） | 1440px |
| 導覽列 | `position: fixed`；高 104px；內距 `20px 40px`；`justify-content: space-between` | 照抄（行動裝置內距降為 `16px 20px`） |
| Hero 上留白 | `padding-top: 200px` | 200px（行動 128px） |
| 一般區塊 | `padding: 100px 0` | 100px（行動 64px） |
| 強調帶（統計） | `padding: 300px 0` | 我們沒有統計帶，不套用 |
| 元件級間距 | gap `10 / 12 / 20 / 32px`（出現 44 / 15 / 13 / 7 次） | 12 / 20 / 32px |
| 區塊級間距 | gap `60 / 80 / 100px` | 80px |
| 斷點 | `(max-width: 992px)`、`(max-width: 480px)`，**非流體、階梯式** | 照抄這兩個斷點 |

---

## 元件

### 按鈕

| 屬性 | 實測 |
|---|---|
| 圓角 | `border-radius: 999px`（全 pill） |
| 高 | 48px |
| 內距 | `12px 12px 12px 20px`（右側較窄是因為參考站右邊塞了一顆圓形圖示） |
| 主要（hero） | 黑底白字 |
| 次要（hero）／導覽 CTA | 白底黑字 |

我們的對應：**主按鈕＝白底黑字**（在純黑底上對比最強，也是參考站導覽 CTA 的做法）、
**次按鈕＝描邊**（`1px solid var(--line)`，透明底，白字）。內距改成對稱 `12px 24px`，
因為我們的按鈕裡沒有圖示，照抄不對稱內距會看起來像沒對齊。

Hover：參考站無可讀的 hover 宣告（builder 產物）。依 `frontend-craft` #9 的規則，
單一顏色位移＝AI 預設感，所以我們疊兩層：背景明度位移 + 1px 上浮（`translateY(-1px)`），
`transition: 160ms ease`。**這是量不到而由我判斷補上的。**

### 卡片

| 屬性 | 實測 |
|---|---|
| 圓角 | `12px` |
| 邊框 | `1px solid rgba(255, 255, 255, 0.1)` |
| 內距 | `32px` |
| 填色 | 兩種變體：透明、或 `rgba(0, 0, 0, 0.3)` |

照抄。我們的三張卡片用「透明底 + 髮絲邊框」那個變體。

### 導覽

固定在頂、logo 左、連結右（參考站是三個連結 + 一顆 pill CTA）。
行動裝置：參考站在 992px 以下的行為我沒有量到（視窗無法縮），**漢堡選單是我依規格補的**，
用 `<details>` 原生開合，不寫 JS。

---

## 動效

參考站有 WebGL 粒子穹頂與滾動編排。**全部不做。** 只保留進場淡入：
`opacity 0 → 1` + `translateY(8px → 0)`，420ms，`cubic-bezier(.22,.61,.36,1)`，
用 `IntersectionObserver` 觸發一次，並用 `prefers-reduced-motion` 全部關掉。

不做：3D、loading 百分比、滾動視差、magnetic cursor、文字逐字動畫。

---

## 明確不抄的東西

- 任何文案、圖片、logo、圖示、3D 模型（Sean 的硬規則）
- 統計數字帶（`99.99%` / `1M+` / `24/7`）：Sean 明令站上不得出現這類數字
- 定價區塊、客戶見證、logo 牆：同上，明令不放
- WebGL canvas 與其 9,904px 的長頁節奏：我們是一頁六塊，不是 SaaS 長頁

## 與 frontend-craft 的一處張力（記錄，不是問題）

`frontend-craft` 的反模式 #2 是「每個元件都是 pill chrome ＝ SaaS 模板感」。參考站正是
全 pill（按鈕 999px、導覽 CTA、eyebrow 標籤）。Sean 明確指示圓角照抄，所以照抄。
緩解方式：pill 只用在按鈕，卡片維持 12px 直角感、表單與程式碼區塊維持 8px，
不讓 pill 蔓延到每個元件。反模式 #4（Inter + 灰 + 漸層按鈕）不觸發：我們用 Geist、
純黑底、單一強調色、實心／描邊兩種按鈕，沒有漸層。

---

## 施工期間的偏離與補充（2026-09-05 實作後回填）

量測表在上面，這一節記錄「照抄會壞掉」或「量不到」而由我判斷處理的部分。

| 項目 | 參考站量到 | 我們的做法 | 理由 |
|---|---|---|---|
| Hero 字級（繁中） | 64 / 48 / 32px | **52 / 40 / 28px**（`html[lang^="zh"]` 才套用；英文頁維持 64） | CJK 字身填滿 em box，同 px 下視覺量體遠大於拉丁字。照抄 64px 會讓兩行標題撐成四行 |
| Hero 寬度上限 | 文字區塊實測 515px | `max-width: 1220px` | 原本用 `26ch`，但 `ch` 是拉丁「0」的前進寬，對 CJK 是錯的量尺，會在句中斷行留下孤字 |
| 光暈尺寸 | WebGL canvas（像素不可讀） | 寬 `min(1400px, 140vw)`、高 760px 的橢圓，`blur(28px)` | 先做成正圓會超出 hero 被 `overflow: hidden` 裁掉，只剩最外圈幾乎看不見。改成整個落在 hero 內的橢圓 |
| Hero eyebrow | pill 徽章＋前導圓點 | 照抄（`8px 16px` 內距、`999px` 圓角、6px 強調色圓點、mono 字） | 第一版做成純文字，對照後補上 |
| 行動裝置 hero 按鈕 | 兩顆並排 | 照抄並排（第一版做成各自滿版） | 「取皮」的一部分；390px 下兩顆 pill 並排放得下 |
| 進場動畫的失效保護 | 無（builder 產物） | `.reveal` 的隱藏狀態限縮在 `.js` 之下，由 head 的 inline script 加上 | 內容預設 `opacity: 0` 只靠 JS 顯示的話，JS 一失敗整站就只剩 hero。這是我加的，參考站沒有 |
| 語言切換的可及名稱 | 無 | 可見文字 `EN` ＋ `.sr-only` 補述，**不用 `aria-label` 覆蓋** | 用 `aria-label="語言"` 蓋掉可見文字會讓 Lighthouse 的 `label-content-name-mismatch` 直接掛 0 |

## 驗收數據（2026-09-05）

- Lighthouse 四項 × 兩語系 × 手機/桌機共四輪：**accessibility / best-practices / SEO 全部 100**；
  performance 在繁中手機 **97**，其餘三輪 100。那 3 分是 158 KB 中文字型在節流手機網路下的
  FCP 成本，是繁中站的固有代價。報告在 `site/screenshots/lighthouse-*.html`。
- 380px 與 1440px 下 `document.scrollWidth == innerWidth`，無橫向捲動。
- 驗證器四種輸入（無利益衝突／部分揭露／壞掉的／內嵌在 VC 裡）在兩個語系都回傳正確結果，零 console 錯誤。
- 首屏 JS 2.86 kB；152 kB 的驗證庫只在按下「驗證」時才動態載入。

## PDF 的字型（`docs/ARTICLE-10-MAPPING.md` → `site/public/article-10-mapping.pdf`）

同樣用思源黑體，但**以 base64 內嵌**而非依賴渲染機器上裝了什麼字型。兩個踩到的點：

1. `setContent` 的 `networkidle0` **不涵蓋 data: URI 字型**，不等 `document.fonts.ready` 的話
   Chrome 會用系統字型排版並把它嵌進 PDF。
2. fontsource 的 `chinese-traditional` subset **沒有全形標點 `（）：，；！？－`**，它們散在編號
   subset 112 / 115 / 118 / 119。只嵌 traditional 的話那些標點會回退到 Microsoft JhengHei。

兩點都修掉後，PDF 內嵌字型只剩思源黑體（加上程式碼的 Consolas 與頁碼的 Arial），206 KB、3 頁。
順帶解掉一個舊問題：先前用 JhengHei 時，`第十條`、`用途`、`一頁` 這類字會被對映到康熙部首碼位
（U+2F00 區），複製出來是異體字；換成思源黑體後複製即為正字。
