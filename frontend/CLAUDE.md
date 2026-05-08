@AGENTS.md

# wholesaleanalytics (InsightBank POC)

Wholesale banking analytics dashboard for IBM — visualises sales pipeline, revenue forecasting, industry performance, and corporate account detail (company tree, value chain). All data is mock; no backend yet.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 — App Router (see AGENTS.md warning) |
| UI | React 19.2.4, Tailwind CSS 4 |
| Charts | Recharts 3.8.1 (standard charts), custom SVG (network diagrams) |
| Language | TypeScript 5 |
| Linting | ESLint via `eslint-config-next` |

## Key Directories

```
app/                    Next.js App Router pages (Server Components by default)
  page.tsx              Home dashboard
  accounts/[id]/        Account detail — dynamic route, slug from mockData
  layout.tsx            Root layout (Geist fonts, metadata)

components/
  layout/               TopBar, TabNav — shared across all pages
  dashboard/            KPIRow, PlanVsRealization, TopOpportunities
  accounts/             AccountHeader, AccountDetailsPanel + sub-components
  ui/                   ArrowBadge, ConfidenceBadge — atomic reusables

data/mockData.ts        Single source of truth for all mock data
types/index.ts          All TypeScript interfaces (centralised)
```

## Build & Run

```bash
npm run dev       # dev server → http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
npx tsc --noEmit  # type-check without emitting
```

## Current Routes

| Path | Status |
|---|---|
| `/` | Home dashboard |
| `/accounts/japfa-comfeed` | PT Japfa Comfeed detail page |
| `/opportunities`, `/contacts`, `/gis` | Tabs wired, pages not yet built |

## Additional Documentation

Check these when relevant:

| File | When to read |
|---|---|
| [.claude/docs/architectural_patterns.md](.claude/docs/architectural_patterns.md) | Before adding components, pages, or data shapes |
| `node_modules/next/dist/docs/01-app/` | Before using any Next.js API — version has breaking changes |
