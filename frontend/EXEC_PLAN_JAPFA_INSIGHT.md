# JAPFA Insight System - Execution Plan

## Overview
Mengganti `mockGenerateInsights()` di `InsightsRelated.tsx` dengan pipeline RAG: **ChromaDB Retrieve → Signal Extraction → LLM Reasoning**

---

## Step 1: Add InsightHistory Model to Prisma Schema

**File:** `prisma/schema.prisma`

Tambahkan model baru setelah `InsightsRelated`:

```prisma
model InsightHistory {
  id               String   @id @default(uuid())
  accountId        String
  industryInsights Json
  clientInsights   Json
  query            String
  generatedAt      DateTime @default(now())

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
}
```

---

## Step 2: Create InsightService

**File:** `services/InsightService.ts`

Buat service dengan fungsi:
- `retrieveFromChromaDB(accountId: string, query: string)` — query ChromaDB
- `extractSignals(chunks: string[])` — GPT-4o-mini signal extraction
- `generateInsights(signals: Signal[], query: string)` — GPT-4o-mini reasoning
- `generateAccountInsights(accountId: string)` — main orchestrator

**Dependencies:** `chromadb`, `openai`

---

## Step 3: Add Environment Variables

**File:** `.env.local`

```env
OPENAI_API_KEY=sk-...
CHROMA_DB_PATH=./chroma_db
```

---

## Step 4: Create API Route

**File:** `app/api/insights/generate/route.ts`

POST endpoint:
- Body: `{ accountId: string }`
- Calls `InsightService.generateAccountInsights(accountId)`
- Returns `{ industryInsights: string[], clientInsights: string[], generatedAt: string }`
- Saves result to `InsightHistory` table

---

## Step 5: Update InsightsRelated.tsx

**File:** `components/accounts/InsightsRelated.tsx`

Ganti `mockGenerateInsights()`:

```typescript
async function generateInsights(accountId: string): Promise<InsightsSnapshot> {
  const res = await fetch('/api/insights/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  return res.json();
}
```

Update `handleGenerate()` untuk accept `account.id` dan call API.

---

## Step 6: Run Migration

```bash
npx prisma migrate dev --name add_insight_history
```

---

## Verification

Test dengan:
```bash
curl -X POST http://localhost:3000/api/insights/generate \
  -H "Content-Type: application/json" \
  -d '{"accountId": "<japfa-account-id>"}'
```

---

## Files to Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add InsightHistory model |
| `services/InsightService.ts` | Create new file |
| `.env.local` | Add env vars |
| `app/api/insights/generate/route.ts` | Create new file |
| `components/accounts/InsightsRelated.tsx` | Replace mock function |

---

## Signal Categories

| Category | Description |
|----------|-------------|
| Supply Chain | Raw material dependency, import reliance |
| Cost Structure | Feed ingredient prices, FX impact |
| Revenue Drivers | Poultry prices, protein consumption |
| Risk Factors | Disease outbreak, regulatory |
| Financial Health | Debt structure, profitability |