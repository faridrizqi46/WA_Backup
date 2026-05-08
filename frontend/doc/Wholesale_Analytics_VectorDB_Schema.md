# Wholesale Analytics Platform
## Vector Database (ChromaDB) Schema Design

---

## 1. Purpose

Dokumen ini mendefinisikan **Vector Database Schema** untuk Wholesale Analytics Platform. Vector DB berfungsi sebagai **semantic memory layer** yang mendukung:
- Retrieval Augmented Generation (RAG)
- Business understanding oleh LLM
- Explainable AI (link insight ke sumber data)

Vector DB **tidak menggantikan PostgreSQL**, melainkan melengkapi sebagai semantic layer.

---

## 2. Design Principles

1. **RAG-First Design**
   - Semua LLM reasoning WAJIB melalui retrieval

2. **Source Traceability**
   - Setiap embedding dapat ditelusuri ke dokumen asli

3. **Enterprise Governance**
   - Metadata lengkap (company, industry, date, source)

4. **Query-Centric**
   - Schema dioptimalkan untuk business & explanation query

---

## 3. Vector DB Technology

- **Vector Database**: ChromaDB
- **Embedding Model**: `text-embedding-3-small`
- **Embedding Dimension**: 1536
- **Similarity Metric**: Cosine Similarity

---

## 4. Collection Design Overview

Vector DB dibagi menjadi beberapa **collection logis** untuk menghindari context pollution.

```
chroma_db/
 ├── company_documents
 ├── industry_documents
 ├── news_documents
 └── regulation_documents
```

---

## 5. Core Vector Schema (Logical)

### 5.1 Common Vector Object Structure

Setiap record di ChromaDB mengikuti struktur logis berikut:

```
{
  "id": "<chunk_id>",
  "embedding": [float],
  "document": "<text_chunk>",
  "metadata": { ... }
}
```

---

## 6. Metadata Schema (WAJIB & STANDAR)

Metadata adalah kunci explainability.

### 6.1 Mandatory Metadata Fields

```
metadata {
  company_id: string,
  company_name: string,
  industry_id: string,
  industry_name: string,
  document_type: string,     -- annual_report | news | website | regulation
  source_name: string,
  source_url: string,
  document_date: date,
  chunk_index: integer,
  language: string,
  confidence_score: float,   -- source credibility
  ingestion_timestamp: datetime
}
```

---

## 7. Collection-Specific Schema

### 7.1 company_documents

**Purpose**
- Annual Report
- Financial disclosure
- Company strategy

**Additional Metadata**
```
financial_year: integer
report_section: string      -- business_overview, risk, outlook
```

---

### 7.2 industry_documents

**Purpose**
- Industry outlook
- Sector analysis

**Additional Metadata**
```
industry_trend: string      -- growth | stable | decline
macro_factor: string        -- rate, commodity, regulation
```

---

### 7.3 news_documents

**Purpose**
- Real-time event & sentiment
- Early warning signals

**Additional Metadata**
```
news_category: string       -- company | industry | macro
sentiment_score: float      -- -1 to +1
is_breaking_news: boolean
```

---

### 7.4 regulation_documents

**Purpose**
- Regulatory update
- Compliance & risk context

**Additional Metadata**
```
regulator: string
impacted_product: string
regulatory_risk_level: string
```

---

## 8. Chunking Strategy

### 8.1 Chunk Granularity
- Target size: **300–700 tokens**
- Chunk by **semantic section**, not fixed length

### 8.2 Chunk Identity

```
chunk_id = <document_id>_<section>_<index>
```

---

## 9. Query Patterns (RAG)

### 9.1 Business Understanding Query

```
Query: "Explain current business condition of Company X"

Filter:
- company_id = X
- document_type IN (annual_report, news)
```

### 9.2 Industry Context Query

```
Query: "Current trend and risk in Industry Y"

Filter:
- industry_id = Y
```

### 9.3 Explanation (XAI) Query

```
Query: "Why FX Hedging recommended?"

Filter:
- company_id = X
- document_type = news
```

---

## 10. Data Lifecycle Management

- **News decay**: relevance decreases after 90 days
- **Annual report**: valid per financial year
- **Re-ingestion** on document update
- Soft delete using metadata flag

---

## 11. Integration with Relational DB

| Component | PostgreSQL | ChromaDB |
|--------|------------|----------|
| Company Master | ✅ | ⛔ |
| Raw Text | ⛔ | ✅ |
| Embedding | ⛔ | ✅ |
| Metadata | ✅ | ✅ |
| Decision Output | ✅ | ⛔ |

Postgres menyimpan **reference (chunk_id)** untuk audit.

---

## 12. Governance & Security

- No PII in vector text
- Content filtering sebelum embedding
- Access scoped by company_id
- Full traceability for audit

---

## 13. Summary

Vector DB schema ini memastikan:
- LLM reasoning contextual & grounded
- Explainability sampai sumber dokumen
- Enterprise-scale retrieval performance

Dokumen ini menjadi **official reference** untuk Vector Database design.

---
