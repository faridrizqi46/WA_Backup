# Wholesale Analytics Platform
## System Architecture Definition

---

## 1. Purpose

Dokumen ini mendefinisikan **System Architecture** untuk Wholesale Analytics Platform, sebuah aplikasi enterprise berbasis AI yang digunakan oleh Relationship Manager (RM) untuk menganalisis perusahaan, industri, dan menentukan rekomendasi produk wholesale secara explainable dan auditable.

Dokumen ini menjadi **acuan resmi arsitektur sistem** untuk:
- Tim Engineering
- IT Architecture Board
- Risk & Compliance
- Data & AI Governance

---

## 2. Architecture Principles

Prinsip utama desain sistem:

1. **Hybrid Intelligence**
   - Rule-based decision
   - Machine Learning (GBDT)
   - LLM-based reasoning & explanation

2. **Explainability by Design**
   - Setiap rekomendasi dapat ditelusuri
   - Mendukung audit & model validation

3. **Modular & Decoupled**
   - Frontend, Backend, AI, Data terpisah
   - Mendukung scaling & future evolution

4. **Enterprise & Regulated Ready**
   - No black-box decision
   - Policy & risk driven

---

## 3. High-Level System Architecture

```
[RM Web App - Next.js]
        │
        ▼
[Backend API - Node.js]
        │
        ├── Business Understanding Service
        ├── Opportunity Engine Service
        ├── Explanation Service
        │
        ▼
[AI & Decision Layer]
        │
        ├── Rule Engine (Python)
        ├── ML Scoring (GBDT - Python)
        ├── LLM Reasoning (RAG)
        │
        ▼
[Data Layer]
        ├── PostgreSQL (System of Record)
        ├── ChromaDB (Vector / RAG)
        └── Neo4j (Knowledge Graph)
        │
        ▼
[Ingestion Layer]
        ├── Annual Report Parser
        ├── Firecrawl
        └── SearchAPI
```

---

## 4. Component Architecture

### 4.1 Frontend Layer

**Technology**
- Next.js
- Tailwind CSS
- Chart.js
- D3.js
- Zustand

**Responsibilities**
- RM dashboard & interaction
- Visualization of scores & insights
- Relationship & explanation graph
- Report generation

---

### 4.2 Backend API Layer

**Technology**
- Node.js (Express / NestJS)

**Responsibilities**
- API orchestration
- Authentication & authorization
- Workflow coordination:
  - Ingestion
  - Analysis
  - Scoring
  - Explanation
- Audit log generation

Backend bertindak sebagai **conductor**, bukan decision maker.

---

### 4.3 AI & Decision Layer

#### a. Rule Engine Service
- Python (FastAPI)
- Mengevaluasi eligibility, risk gate, override
- Rule didefinisikan sebagai data (PostgreSQL)

#### b. ML Scoring Service
- Python (FastAPI)
- LightGBM / XGBoost
- Menghasilkan product suitability score
- SHAP untuk explainability

#### c. LLM Reasoning Service
- OpenAI / Ollama / IBM Granite
- Menghasilkan:
  - Business understanding summary
  - Explanation berbasis XAI
- Menggunakan RAG, tidak hallucination

---

## 5. Data Architecture

### 5.1 PostgreSQL (Relational Data)

Berfungsi sebagai **system of record**:
- Company, Industry, Product
- Business Signal
- Rule & Rule Condition
- Scoring & Explanation output

### 5.2 ChromaDB (Vector Store)

- Menyimpan embedding dokumen
- Annual Report, News, Industry Insight
- Mendukung semantic retrieval (RAG)

### 5.3 Neo4j (Knowledge Graph)

- Company ↔ Industry
- Company ↔ Signal
- Product ↔ Rule
- Product ↔ Signal

Digunakan untuk:
- Reasoning path
- Explainable recommendation
- Future advanced analytics

---

## 6. Ingestion Architecture

**Data Sources**
- Annual Report (PDF)
- Company Website
- News & Regulatory Update

**Tools**
- Firecrawl
- SearchAPI

**Pipeline**
1. Fetch raw data
2. Parse & clean text
3. Chunk & embed
4. Store:
   - Metadata → PostgreSQL
   - Embedding → ChromaDB

---

## 7. Decision Flow Architecture

```
Ingestion
   ↓
Business Signal Extraction
   ↓
Rule Evaluation (Hard Gate)
   ↓
ML Scoring (GBDT)
   ↓
Decision Label (Recommend / Consider / Reject)
   ↓
XAI (SHAP + Rule Trace)
   ↓
LLM Explanation
```

---

## 8. Security & Governance

- API Gateway
- Token-based authentication
- PII masking sebelum LLM call
- Audit log untuk:
  - Rule evaluation
  - Model version
  - Decision output

---

## 9. Deployment Architecture

- Docker (containerization)
- Kubernetes (orchestration)
- Hybrid deployment:
  - LLM: cloud / on‑prem
  - Data: private cloud
  - ML services: internal network

---

## 10. Architecture Benefits

✅ Explainable AI (XAI-first)
✅ Regulated industry compliant
✅ Modular & scalable
✅ Clear separation of concern
✅ Future-proof (advanced ML, personalization)

---

## 11. Conclusion

System Architecture ini memastikan bahwa Wholesale Analytics Platform:
- Tidak bergantung pada satu pendekatan AI
- Memberikan keputusan yang transparan
- Siap diadopsi di lingkungan enterprise perbankan

Dokumen ini adalah **single source of truth** untuk arsitektur sistem.

---
