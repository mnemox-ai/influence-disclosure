# tools

Local-only rendering helpers. Not a workspace package, never published, and not needed to
use or build anything in this repository. They exist so that claims about the site can be
checked rather than asserted.

```bash
cd tools && npm install
```

| Script | What it does |
|---|---|
| `serve.mjs` | Static file server over `site/dist`, used by the others |
| `shots.mjs` | Screenshots of the site and of the design reference, desktop and mobile |
| `compare.mjs` | Builds the side-by-side board from those screenshots |
| `e2e.mjs` | Drives the browser validator through four inputs in both locales, and fails on horizontal overflow |
| `lh.mjs` | Lighthouse over both locales, mobile and desktop; exits non-zero below 95 |
| `pdf.mjs` | Renders `docs/ARTICLE-10-MAPPING.md` to `site/public/article-10-mapping.pdf` |
| `probe.mjs` | Reports section geometry and entrance-animation state |

Output lands in `site/screenshots/`, which is gitignored: the reference-site captures are
not ours to redistribute, and the Lighthouse reports regenerate on demand.

Chrome is expected at `C:/Program Files/Google/Chrome/Application/chrome.exe`.
