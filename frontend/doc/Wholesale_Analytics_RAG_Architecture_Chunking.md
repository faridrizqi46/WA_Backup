# Wholesale Analytics Platform
## RAG Architecture & Chunking Strategy

---

## 1. Purpose

Dokumen ini mendefinisikan **Retrieval Augmented Generation (RAG) Architecture** dan **Chunking Strategy** untuk Wholesale Analytics Platform.

RAG digunakan untuk memastikan bahwa seluruh output LLM:
- Berbasis **fakta dari Annual Report & News**
- Bebas hallucination
- Explainable & auditable

Dokumen ini menjadi **acuan resmi** desain GenAI layer.

---

## 2. RAG Design Principles

1. **Data-Grounded Reasoning**
   - LLM TIDAK boleh menjawab tanpa retrieval

2. **Source Separation**
   - Annual Report ≠ News (disimpan & diambil terpisah)

3. **Explainability First**
   - Jawaban harus bisa dirujuk ke dokumen

4. **Enterprise Safe**
   - No fine-tuning on raw documents
   - No PII stored in vectors

---

## 3. High-Level RAG Architecture

```
User / System Request
        │
        ▼
Backend API (Node.js)
        │
        ▼
RAG Orchestrator
        │
        ├── Query Rewriter
        ├── Retriever (ChromaDB)
        ├── Context Builder
        ▼
LLM (OpenAI / Ollama / IBM Granite)
        │
        ▼
Structured Output (Summary / Explanation)
```

---

## 4. RAG Components

### 4.1 Query Rewriter

**Purpose**
- Mengubah query bisnis menjadi retrieval query

**Example**
```
Input: "Analyze company business and industry condition"
Output:
- company overview
- recent industry trend
- risk exposure
```

---

### 4.2 Retriever Layer

**Vector Database**: ChromaDB

**Retrieval Filters**
- company_id
- document_type
- date window

**Top-K Strategy**
- Annual Report: k = 5–8
- News: k = 5–10

---

### 4.3 Context Builder

**Responsibilities**
- Merge retrieved chunks
- Remove redundant information
- Maintain source attribution

**Context Structure**
```
[Annual Report Context]
...

[News Context]
...
```

---

### 4.4 LLM Reasoning Layer

**LLM Constraints**
- Answer ONLY based on provided context
- Cite source section (implicit)

**Typical Tasks**
- Business understanding
- Industry insight
- Explanation (XAI narrative)

---

## 5. RAG Usage Patterns

### 5.1 Business Understanding RAG

**Context Sources**
- Annual Report
- Company-related news

**Output**
- Company summary
- Strategic direction
- Key risks & opportunities

---

### 5.2 Industry & Market RAG

**Context Sources**
- Industry news

**Output**
- Industry trend
- External pressure & volatility

---

### 5.3 Explanation (XAI) RAG

**Context Sources**
- Signal-related chunks

**Output**
- Why product recommended
- Supporting evidence

---

## 6. Chunking Strategy (CRITICAL)

Chunking directly menentukan kualitas RAG.

---

## 7. Chunking for Annual Report (PDF)

### 7.1 Chunk Objective
- Preserve business meaning
- Keep section context

### 7.2 Chunk Rules

| Rule | Value |
|----|------|
| Chunk Type | Semantic (section-based) |
| Target Size | 300–700 tokens |
| Overlap | 10–15% |

---

### 7.3 Annual Report Chunk Types

| Section | Example Chunk |
|------|---------------|
| Business Overview | Business model, revenue driver |
| Risk Factors | FX risk, liquidity risk |
| Strategy | Expansion, capex plan |
| Outlook | Future expectation |

---

## 8. Chunking for News

### 8.1 Chunk Objective
- Capture event context
- Preserve time relevance

### 8.2 Chunk Rules

| Rule | Value |
|----|------|
| Chunk Unit | Paragraph / topic |
| Target Size | 200–500 tokens |
| Overlap | Minimal |

---

### 8.3 News Chunk Metadata

```
sentiment_score
publish_date
time_decay_weight
```

---

## 9. Chunk ID & Metadata Standard

**Chunk ID Format**
```
<document_id>_<section>_<index>
```

**Mandatory Metadata**
- company_id
- document_type
- source
- date
- confidence_score

---

## 10. Chunk Quality Control

- Remove boilerplate text
- Drop low-information chunks
- Language consistency check

---

## 11. RAG Failure Prevention

| Risk | Mitigation |
|----|-----------|
| Hallucination | Mandatory retrieval |
| Outdated info | News time filter |
| Context noise | Source separation |
| Overload | Top-k + relevance filtering |

---

## 12. Relationship to ML & Rule Engine

- RAG does NOT make decision
- RAG supports:
  - Signal extraction
  - Explanation

Authoritative decisions:
- Rule Engine
- GBDT Model

---

## 13. Summary

RAG Architecture ini memastikan:
- LLM selalu grounded pada dua sumber resmi
- Output explainable & auditable
- Scalability & enterprise safety

Dokumen ini adalah **single source of truth** untuk RAG & chunking design.

---
