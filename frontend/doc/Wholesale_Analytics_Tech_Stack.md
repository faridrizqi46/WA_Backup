# Wholesale Analytics Platform
## Full Technical Stack & Architecture Reference

---

## 1. Overview

Wholesale Analytics Platform adalah aplikasi enterprise yang digunakan oleh **Relationship Manager (RM)** untuk:
- Menganalisis kondisi **perusahaan dan industri**
- Mengidentifikasi **peluang produk wholesale** yang paling relevan
- Memberikan **rekomendasi berbasis AI** yang explainable dan auditable

Prinsip desain:
- Hybrid AI (Rule-based + ML + LLM)
- Explainability (XAI) by design
- Modular & scalable
- Enterprise governance ready

---

## 2. High-Level Architecture

Frontend (Next.js)
→ Backend API (Node.js – Orchestration)
→ AI & Analytics Layer
→ Data Layer
→ Ingestion Layer

---

## 3. Frontend Stack

- Framework: Next.js
- Styling: Tailwind CSS
- Charts: Chart.js
- Graph Visualization: D3.js
- State Management: Zustand

---

## 4. Backend Stack

- Node.js (Express / NestJS)
- API orchestration
- Auth & authorization
- AI workflow controller

Logical services:
/company
/ingestion
/business-understanding
/opportunity-engine
/explanation
/report

---

## 5. AI & ML Stack

### ML Microservices
- Python 3.10+
- FastAPI
- LightGBM
- XGBoost
- Scikit-learn
- SHAP

### Decision Pattern
- Rule Engine (policy & risk gating)
- GBDT scoring
- LLM reasoning & explanation

### LLM Providers
- OpenAI
- Ollama (on-prem)
- IBM Granite

---

## 6. Embedding & RAG

- Embedding Model: text-embedding-3-small
- Vector DB: ChromaDB
- Content:
  - Annual report chunks
  - News articles
  - Industry outlook

---

## 7. Data Layer

### PostgreSQL
- Company
- Industry
- Product
- Analysis result
- Product score
- RM feedback

### Neo4j
- Company ↔ Industry
- Company ↔ Signal
- Product ↔ Signal

---

## 8. Ingestion Stack

- Annual Report (PDF parsing)
- Firecrawl
- SearchAPI

Raw + processed data stored for audit & governance

---

## 9. Explanation & XAI

- SHAP feature attribution
- Rule trace
- LLM-generated business explanation

---

## 10. Infrastructure & Deployment

- Docker
- Kubernetes
- Hybrid deployment (cloud + on-prem)
- API Gateway
- Token-based security

---

## 11. Monitoring & Feedback

- ML drift monitoring
- Data freshness checks
- RM feedback loop for retraining

---

## 12. Conclusion

Dokumen ini menjadi **acuan resmi tech stack** untuk pengembangan Wholesale Analytics Platform yang enterprise-grade, explainable, dan scalable.
