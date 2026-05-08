# Data Architecture Documentation

## Database Schema

### Entity Relationship Diagram

```
Company
├── CrawlResult[]
├── Account (1:1)
│   ├── FinancialMetric[]
│   ├── CompanyTreeNode[]
│   ├── ValueChainNode[]
│   ├── RelatedContact[]
│   ├── ProductSignal[]
│   ├── InsightsRelated (1:1)
│   └── Opportunity[]
│       ├── OpportunityDetail (1:1, optional)
│       ├── XaiScoring (1:1, optional)
│       ├── TradeIntelligence (1:1, optional)
│       └── DataLineage[]

LoanBankGroup
└── LoanFacility[]

KPIMetrics (standalone, no relations)

SearchResult (standalone, no relations)
```

---

## Table Definitions & Data Flow

### 1. Company
**Purpose:** Root entity for all companies in the system

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| companyName | String | Full company name |
| industries | String | Industry classification |
| createdAt | DateTime | Auto-generated |
| updatedAt | DateTime | Auto-generated |

**Related Data:**
- `CrawlResult[]` - Web crawl/embedding data
- `Account[]` - Account details (typically 1:1)

**How to Modify:**
- Via API: `POST /api/companies`
- Via seed: Add in `prisma/seed.ts` Company creation block

---

### 2. Account
**Purpose:** Core account/company profile data for dashboard display

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| companyId | String | Foreign key to Company (unique) |
| name | String | Account/company name |
| layerId | String | Regulatory layer ID |
| industry | String | Industry classification |
| type | String | Public/Private |
| segment | String | Corporate/Commercial/SME/Micro |
| cfoCount | Int | Number of CFOs |
| accountNumber | String | Internal account number |
| description | String | Company description |
| headquarters | String | HQ address |
| latitude | String | GPS coordinate |
| longitude | String | GPS coordinate |
| alsoFoundAt | String[] | Other locations (JSON array) |
| keyHighlight | String | Key opportunity summary |

**Related Data:** All child relations of Account (see ERD above)

**Component Usage:**
- `components/accounts/AccountHeader.tsx` - Displays name, industry, type, segment
- `components/accounts/AccountInformation.tsx` - Displays description, headquarters, coordinates
- `components/accounts/KeyHighlight.tsx` - Displays keyHighlight

**How to Modify:**
- Seed location: `prisma/seed.ts` → Account creation block

---

### 3. FinancialMetric
**Purpose:** Financial ratios/metrics for account overview

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| accountId | String | Foreign key to Account |
| label | String | Metric name (e.g., "Net Sales Revenue") |
| value | String | Metric value (e.g., "4.42%") |
| direction | String | 'up' or 'down' |

**Component Usage:**
- `components/accounts/AccountHeader.tsx` - MetricChip displays

**How to Modify:**
- Seed location: `prisma/seed.ts` → Financial metrics loop

---

### 4. CompanyTreeNode
**Purpose:** Corporate structure/group hierarchy display

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| accountId | String | Foreign key to Account |
| name | String | Subsidiary/affiliate name |
| ownershipType | String | Public/Private |
| city | String | City location |
| stateProvince | String | State/Province |
| country | String | Country |
| ibrProduct | String | BRI product assigned |
| isAnchor | Boolean | Is anchor company (default false) |
| indent | Int | Hierarchy indentation level (default 0) |
| prefix | String? | Tree prefix '-' or '+' |

**Component Usage:**
- `components/accounts/CompanyTree.tsx` - Renders corporate hierarchy tree

**How to Modify:**
- Seed location: `prisma/seed.ts` → Company tree nodes loop

---

### 5. ValueChainNode
**Purpose:** Supply chain/ecosystem visualization

| Field | Type | Description |
|-------|------|-------------|
| id | String | Node ID (e.g., "anchor", "t1-1", "t2-3") |
| accountId | String | Foreign key to Account |
| name | String | Company/entity name |
| segment | String | 'Corporate'/'Commercial'/'SME'/'Micro' |
| clientType | String | 'Supplier'/'Local Distributor'/'Global Distributor' |
| tier | Int | 0 (anchor), 1 (tier 1), 2 (tier 2) |

**Component Usage:**
- `components/accounts/ValueChain.tsx` - Renders supply chain diagram

**How to Modify:**
- Seed location: `prisma/seed.ts` → Value chain nodes loop

---

### 6. Opportunity
**Purpose:** Sales/action opportunities for account

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| accountId | String | Foreign key to Account |
| offeredProduct | String | Product name |
| insight | String | AI-generated insight |
| confidenceLevel | String | 'High'/'Mid'/'Low' |
| potentialValue | String | Value estimate (e.g., "220K USD / Month") |
| offerDate | String | Date offered |
| reason | String | Reasoning for opportunity |
| isLoanAdvisory | Boolean | Is loan advisory (default false) |
| urgency | String? | 'Urgent'/'This Month'/'This Quarter' |
| recommendedAction | String? | Recommended action text |
| deadline | String? | Deadline date |

**Related Data:**
- `OpportunityDetail?` (1:1, optional) - Detailed breakdown
- `TradeIntelligence?` (1:1, optional) - Trade/BoL intelligence
- `XaiScoring?` (1:1, optional) - AI scoring data
- `DataLineage[]` - Source/reliability info

**Component Usage:**
- `components/accounts/InsightsRelated.tsx` - Next Best Actions table

**Click Behavior:**
```javascript
const clickable = !!(opp.detail || opp.isLoanAdvisory);
// Bill Discounting → OpportunityDetail (has detail)
// Maturing Credit Facility Advisory → LoanGracePeriodDetail (isLoanAdvisory)
```

**How to Modify:**
- Seed location: `prisma/seed.ts` → `opportunityData` array
- To add detail/trade intelligence: Set `hasDetail: true` or `hasTradeIntel: true`

---

### 7. OpportunityDetail
**Purpose:** Detailed breakdown for opportunity with business benefits

| Field | Type | Description |
|-------|------|-------------|
| opportunityId | String | Foreign key to Opportunity (unique) |
| potentialValueDisplay | String | Display value (e.g., "$220K") |
| potentialValueUnit | String | Unit (e.g., "/Month") |
| businessBenefits | JSON | Array of {label, value, positive} |
| dataSources | JSON | Array of {title, description, sources[]} |

**JSON Structure Example:**
```json
{
  "businessBenefits": [
    {"label": "Working Capital", "value": "+10%", "positive": true},
    {"label": "Financial Cost", "value": "-18%", "positive": false}
  ],
  "dataSources": [
    {"title": "Market Trend", "description": "...", "sources": ["IBM Research"]}
  ]
}
```

**Component Usage:**
- `components/accounts/OpportunityDetail.tsx` - Renders detail view

**How to Modify:**
- Seed location: `prisma/seed.ts` → inside `if (opp.hasDetail)` block

---

### 8. TradeIntelligence
**Purpose:** Trade/BoL intelligence data (Swift & Co example)

| Field | Type | Description |
|-------|------|-------------|
| opportunityId | String | Foreign key to Opportunity (unique) |
| title | String | Report title |
| agentLabel | String | AI agent attribution |
| dataRange | String | Data coverage period |
| coverageNote | String | Coverage notes |
| primaryStats | JSON | Array of {label, value, unit} |
| secondaryStats | JSON | Array of {label, value, unit} |
| supplierShare | JSON | Array of {name, weightKgs, weightLabel, color} |
| bolRecords | JSON | Array of BolRecord objects |
| tableSummaryNote | String | Summary note |

**BolRecord JSON Structure:**
```json
{
  "bolNumber": "MEDUVC970781",
  "arrivalDate": "2026-04-20",
  "supplier": null,
  "supplierConfirmed": false,
  "productShort": "Beef Meat & Bone Meal",
  "grossWeightKgs": 413460,
  "containerCount": 20,
  "portOfDischarge": "Makassar",
  "vesselCarrier": "MSC"
}
```

**Component Usage:**
- `components/accounts/TradeIntelligenceBriefPanel.tsx`
- `components/accounts/ShipmentWindowForecast.tsx`

**How to Modify:**
- Seed location: `prisma/seed.ts` → inside `if (opp.hasTradeIntel)` block → `prisma.tradeIntelligence.create()`

---

### 9. XaiScoring
**Purpose:** Explainable AI scoring for opportunity

| Field | Type | Description |
|-------|------|-------------|
| opportunityId | String | Foreign key to Opportunity (unique) |
| overallScore | Int | Overall score (0-100) |
| scoreLabel | String | Label (e.g., "Approach Now") |
| dimensions | JSON | Array of XaiDimension objects |

**XaiDimension JSON Structure:**
```json
{
  "dimension": "Anchor Certainty",
  "score": 98,
  "confidenceFlag": "verified",
  "evidence": ["evidence1", "evidence2"],
  "rmChallenge": {"challenge": "...", "response": "..."}
}
```

**Component Usage:**
- `components/accounts/XaiScoringPanel.tsx`

**How to Modify:**
- Seed location: `prisma/seed.ts` → inside `if (opp.hasTradeIntel)` block → `prisma.xaiScoring.create()`

---

### 10. DataLineage
**Purpose:** Data source attribution and reliability

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| opportunityId | String | Foreign key to Opportunity |
| title | String | Source title |
| description | String | Source description |
| reliability | String | 'highest'/'high'/'medium'/'low' |

**Component Usage:**
- `components/accounts/XaiScoringPanel.tsx` - Data lineage tab

**How to Modify:**
- Seed location: `prisma/seed.ts` → `prisma.dataLineage.createMany()`

---

### 11. InsightsRelated
**Purpose:** Account-level insights, charts, and summary

| Field | Type | Description |
|-------|------|-------------|
| accountId | String | Foreign key to Account (unique) |
| defaultInsights | JSON | {industryInsights[], clientInsights[]} |
| productPortion | JSON | PieSlice[] for product portion chart |
| walletShare | JSON | PieSlice[] for wallet share chart |
| opportunityCount | Int | Total opportunity count |
| totalOpportunityAmount | String | Total value (e.g., "$9.5 M") |

**Component Usage:**
- `components/accounts/InsightsRelated.tsx` - Main insights tab
- Recharts PieChart for productPortion and walletShare

**How to Modify:**
- Seed location: `prisma/seed.ts` → `prisma.insightsRelated.create()`

---

### 12. RelatedContact
**Purpose:** Account contact persons

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| accountId | String | Foreign key to Account |
| name | String | Contact full name |
| title | String | Job title |
| email | String | Email address |
| phone | String | Phone number |
| photo | String? | Photo URL path |

**Component Usage:**
- `components/accounts/InsightsRelated.tsx` - Contacts slider

**How to Modify:**
- Seed location: `prisma/seed.ts` → contacts array loop

---

### 13. ProductSignal
**Purpose:** Corporate product parameter signals (LC, SCF, BG, FX)

| Field | Type | Description |
|-------|------|-------------|
| accountId | String | Foreign key to Account |
| productId | String | '1'/'2'/'3'/'4' (LC/SCF/BG/FX) |
| productName | String | Product name |
| signals | String[] | Extracted signal strings |
| summary | String | LLM-generated summary |
| confidence | String | 'high'/'medium'/'low' |
| rawEvidenceCount | Int | Count of evidence chunks |
| timestamp | DateTime | When generated |

**Unique Constraint:** `[accountId, productId]`

**Component Usage:**
- Not yet rendered in current UI (future feature)

**How to Modify:**
- Generated via `retrieveAndExtractSignals()` in CorporateProductParametersService

---

### 14. LoanBankGroup & LoanFacility
**Purpose:** Bank loan/credit facility data for loan advisory

| Field | Type | Description |
|-------|------|-------------|
| LoanBankGroup.bank | String | Full bank name |
| LoanBankGroup.shortName | String | Short code (e.g., "BCA") |
| LoanFacility.bankGroupId | String | Foreign key to LoanBankGroup |
| LoanFacility.borrowerType | String | 'Parent'/'Subsidiary' |
| LoanFacility.borrowerTag | String | Borrower tag |
| LoanFacility.facilityType | String | Facility type name |
| LoanFacility.expiryDate | String | ISO date |
| LoanFacility.expiryYear | Int | 2026/2027 |
| LoanFacility.maxLimitRpM | Float | Max limit in millions |
| LoanFacility.maxLimitNote | String? | Additional notes |

**Component Usage:**
- `components/accounts/LoanGracePeriodDetail.tsx` - Loan advisory detail
- Calculates days until expiry, urgency colors, progress bars

**How to Modify:**
- Seed location: `prisma/seed.ts` → Loan bank groups array
- API: `GET /api/loan-bank-groups`

---

### 15. KPIMetrics
**Purpose:** Dashboard KPI summary (no relations)

| Field | Type | Description |
|-------|------|-------------|
| revenueRealization | Float | Realization % |
| revenuePlan | Float | Plan % |
| accountRealization | Float | Account realization % |
| accountPlan | Float | Account plan % |
| currentQuarter | Int | Current quarter value |
| currentQuarterLabel | String | "Q1 2026" |
| previousQuarter | Int | Previous quarter value |
| previousQuarterLabel | String | "Q4 2025" |
| generatedLeads | Int | Number of leads |
| topIndustries | String[] | Top 5 industry names |

**Component Usage:**
- `app/page.tsx` → `KPIRow` component
- `components/dashboard/KPIRow.tsx`

**How to Modify:**
- Seed location: `prisma/seed.ts` → `prisma.kPIMetrics.create()`

---

### 16. CrawlResult
**Purpose:** Web crawl/embedding data for semantic search

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| companyId | String | Foreign key to Company |
| url | String | Source URL |
| title | String | Page title |
| content | String? | Extracted content |
| embedding | String? | Vector embedding |
| metadata | JSON? | Additional metadata |
| jobId | String? | Crawl job ID |
| status | String? | Crawl status |
| createdAt | DateTime | Created timestamp |

**Component Usage:**
- Not directly rendered in current UI
- Used for semantic search/retrieval

---

## Component Mapping Summary

| Component | Data Source | Related Tables |
|-----------|-------------|----------------|
| `TopBar` | Static | - |
| `TabNav` | Static | - |
| `KPIRow` | `getKPIMetrics()` | `KPIMetrics` |
| `PlanVsRealization` | `mockData.industriesData` | - |
| `TopOpportunities` | `getAllAccounts()` → opportunities | `Opportunity` |
| `AccountHeader` | `getAllAccounts()` → account | `Account`, `FinancialMetric` |
| `AccountInformation` | `getAllAccounts()` → account | `Account` |
| `AccountDetailsPanel` | `getAllAccounts()` → account | Tabs: CompanyTree, KeyHighlight, ValueChain, InsightsRelated |
| `CompanyTree` | `getAllAccounts()` → companyTree | `CompanyTreeNode` |
| `KeyHighlight` | `getAllAccounts()` → keyHighlight | `Account` |
| `ValueChain` | `getAllAccounts()` → valueChainNodes | `ValueChainNode` |
| `InsightsRelated` | `getAllAccounts()` → insightsRelated + opportunities | `InsightsRelated`, `Opportunity`, `RelatedContact` |
| `OpportunityDetail` | Opportunity.detail | `OpportunityDetail` |
| `TradeIntelligenceBriefPanel` | Opportunity.tradeIntelligence | `TradeIntelligence` |
| `ShipmentWindowForecast` | TradeIntelligence.bolRecords | `TradeIntelligence` |
| `XaiScoringPanel` | Opportunity.xaiScoring + dataLineage | `XaiScoring`, `DataLineage` |
| `LoanGracePeriodDetail` | `getLoanBankGroups()` | `LoanBankGroup`, `LoanFacility` |
| `ConfidenceBadge` | Static utility | - |
| `ArrowBadge` | Static utility | - |

---

## How to Modify Data

### 1. Via Database (Direct)

Connect to PostgreSQL and update directly:
```sql
-- Update opportunity insight
UPDATE "Opportunity" SET insight = 'New insight text' WHERE id = 'uuid-here';

-- Update account key highlight
UPDATE "Account" SET keyHighlight = 'New highlight' WHERE companyId = 'japfa-id';
```

### 2. Via Seed File (`prisma/seed.ts`)

1. Edit the relevant data array/object in seed.ts
2. Run: `npx prisma db push --force-reset && npx ts-node --esm prisma/seed.ts`

### 3. Via API (for CrawlResult, SearchResult)

- `GET /api/loan-bank-groups` - Fetch loan data

### 4. Via LLM Service (ProductSignal)

Call `retrieveAndExtractSignals(companyIdOrCode, locale, topK)` from CorporateProductParametersService

---

## Data Transformation Flow

```
PostgreSQL (Prisma)
    ↓ getAllAccounts()
DatabaseService (maps to DTOs)
    ↓
AccountDetailDTO
    ↓
AccountDetail (types/index.ts)
    ↓
Components (AccountDetailsPanel → sub-components)
```

Key files:
- `services/DatabaseService.ts` - DB → DTO mapping
- `types/index.ts` - TypeScript interfaces
- `components/accounts/` - UI components