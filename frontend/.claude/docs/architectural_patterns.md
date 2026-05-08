# Architectural Patterns

Patterns observed across multiple files in this codebase.

## 1. Server Components as data shells, Client Components for interaction

Pages (`app/**/page.tsx`) are React Server Components. They import from `data/mockData.ts`, look up the right record, and pass it down as props. Client interactivity (`useState`, `onClick`, `Link` navigation) lives in leaf components marked `'use client'`.

- `app/page.tsx` — server, imports and distributes data
- `app/accounts/[id]/page.tsx` — server, resolves slug → account object, calls `notFound()` if missing
- `components/accounts/AccountDetailsPanel.tsx` — client, owns tab state
- `components/accounts/ValueChain.tsx` — client, owns tier-filter state

**Rule:** never pass a function (render prop, callback) from a Server Component to a Client Component — this causes a serialisation error. If shared state is needed, the entire subtree that shares it must be a Client Component.

## 2. Centralised types and data

All TypeScript interfaces live in `types/index.ts`. All mock data lives in `data/mockData.ts`. No component defines its own data shape or hardcodes values.

- `types/index.ts` — `KPIMetrics`, `IndustryData`, `Opportunity`, `AccountDetail`, `CompanyNode`, `ValueChainNode`, `FinancialMetric`
- `data/mockData.ts` — exports `kpiMetrics`, `industriesData`, `opportunities`, `accountDetails`

When adding a new page, add its data shape to `types/index.ts` first, then the mock record to `mockData.ts`.

## 3. Slug-based record lookup

Navigation to detail pages uses a human-readable slug stored on the source record. The slug is the key in the detail map in `mockData.ts`.

- `data/mockData.ts:34` — `companySlug: 'japfa-comfeed'` on the `Opportunity` record
- `data/mockData.ts` — `accountDetails['japfa-comfeed']` is the detail record
- `app/accounts/[id]/page.tsx` — `accountDetails[id]` lookup, `notFound()` guard

To add a new account detail page: add `companySlug` to the `Opportunity`, add a matching key to `accountDetails`.

## 4. Component props mirror the data types

Component prop interfaces are thin wrappers around the centralised types — they don't redefine shapes.

```
AccountHeader    → { account: AccountDetail }
CompanyTree      → { nodes: CompanyNode[] }
ValueChain       → { nodes: ValueChainNode[] }
KPIRow           → { data: KPIMetrics }
PlanVsRealization → { data: IndustryData[] }
TopOpportunities → { data: Opportunity[] }
```

Avoid prop-drilling intermediaries; pages pass the full typed object directly to the component that needs it.

## 5. TabNav accepts an optional `activeTab` prop

`TabNav` can be driven externally (detail pages) or manage its own state (home). When `activeTab` is provided it overrides local state.

- `components/layout/TabNav.tsx` — `activeTab?: string` prop
- `app/accounts/[id]/page.tsx` — passes `activeTab="Accounts"`
- `app/page.tsx` — no prop, TabNav defaults to "Home"

## 6. Custom SVG for network/graph diagrams, Recharts for standard charts

- `components/accounts/ValueChain.tsx` — pure SVG, positions computed in `buildLayout()`
- `components/dashboard/PlanVsRealization.tsx` — uses Recharts `BarChart`

Don't add Recharts for layouts that require free node placement; don't write raw SVG for standard bar/line charts.

## 7. Atomic UI components for repeated visual patterns

`components/ui/` holds stateless, single-purpose display components reused across dashboard and account pages.

- `ArrowBadge` — up/down indicator, used in `KPIRow` and `AccountHeader`
- `ConfidenceBadge` — High/Mid/Low colouring, used in `TopOpportunities`

Add to `ui/` when a visual pattern appears in two or more unrelated contexts.
