# Wholesale Analytics Platform
## Risk Identification & Mitigation Register

---

## 1. Purpose

Dokumen ini mengidentifikasi **risiko utama** dalam pengembangan dan operasional **Wholesale Analytics Platform** berbasis AI. Risiko mencakup aspek **data, AI/ML, teknologi, operasional, keamanan, dan governance**.

Dokumen ini bertujuan untuk:
- Memberikan pandangan menyeluruh atas potensi risiko
- Menjadi acuan **IT Architecture Board, Risk Management, dan AI Governance**
- Menyediakan baseline mitigasi sejak fase desain

---

## 2. Risk Classification

Risiko dikelompokkan ke dalam kategori berikut:
1. Data Risk
2. AI / Model Risk
3. Technology & Architecture Risk
4. Operational Risk
5. Security & Privacy Risk
6. Governance & Compliance Risk
7. Adoption & Business Risk

---

## 3. Data Risks

### 3.1 Incomplete or Biased Data

**Description:**
Data hanya berasal dari Annual Report dan News yang bersifat naratif dan bisa bias.

**Impact:**
- Signal tidak mencerminkan kondisi aktual
- Rekomendasi produk kurang akurat

**Mitigation:**
- Kombinasi dua sumber (Annual Report + News)
- Confidence score per signal
- Transparansi sumber pada explanation layer

---

### 3.2 Outdated Information

**Description:**
Annual report bersifat tahunan; berita bisa sudah tidak relevan.

**Impact:**
- Keputusan berbasis informasi lama

**Mitigation:**
- News time-decay logic
- Timestamping semua signal
- Display data freshness ke RM

---

## 4. AI & Model Risks

### 4.1 LLM Hallucination

**Description:**
LLM menghasilkan insight yang tidak berbasis dokumen.

**Impact:**
- Misleading recommendation
- Risiko reputasi & compliance

**Mitigation:**
- Mandatory Retrieval Augmented Generation (RAG)
- Context-only prompt
- Source traceability

---

### 4.2 Model Bias & Misinterpretation

**Description:**
GBDT model bias terhadap industri atau ukuran perusahaan tertentu.

**Impact:**
- Skor produk tidak adil

**Mitigation:**
- Feature explainability (SHAP)
- Segment-based validation
- Rule-based guardrails

---

### 4.3 Over-Reliance on AI Output

**Description:**
RM atau bisnis menganggap AI sebagai pengambil keputusan tunggal.

**Impact:**
- Salah kaprah tanggung jawab keputusan

**Mitigation:**
- Human-in-the-loop
- Clear disclaimer & confidence score
- AI sebagai decision support, bukan decision maker

---

## 5. Technology & Architecture Risks

### 5.1 Integration Complexity

**Description:**
Banyak komponen: Node.js, Python ML, Vector DB, Graph DB.

**Impact:**
- Deployment kompleks
- Maintenance overhead

**Mitigation:**
- Microservice boundaries jelas
- API contract & versioning
- Observability & health check

---

### 5.2 Scalability Constraints

**Description:**
Lonjakan jumlah dokumen news atau request RAG.

**Impact:**
- Latency meningkat

**Mitigation:**
- Caching hasil RAG
- Asynchronous ingestion
- Horizontal scaling (Kubernetes)

---

## 6. Operational Risks

### 6.1 Pipeline Failure

**Description:**
Gagal ingest PDF atau crawling berita.

**Impact:**
- Data tidak lengkap untuk analisis

**Mitigation:**
- Retry & fallback mechanism
- Raw data retention
- Monitoring pipeline health

---

### 6.2 Data Drift

**Description:**
Bahasa & pola dalam Annual Report berubah.

**Impact:**
- Signal extraction menurun kualitasnya

**Mitigation:**
- Periodic evaluation
- Rule vs ML performance comparison
- Prompt & feature review

---

## 7. Security & Privacy Risks

### 7.1 Data Leakage to LLM Provider

**Description:**
Konten sensitif dikirim ke LLM eksternal.

**Impact:**
- Pelanggaran kebijakan data

**Mitigation:**
- PII filtering sebelum embedding & LLM call
- On-prem LLM (Ollama / Granite) option
- Token & access control

---

### 7.2 Unauthorized Access

**Description:**
Akses tidak sah ke hasil analisis perusahaan.

**Impact:**
- Data confidentiality breach

**Mitigation:**
- Role-based access control
- Company-level data isolation
- Audit logging

---

## 8. Governance & Compliance Risks

### 8.1 Lack of Explainability

**Description:**
Tidak bisa menjelaskan kenapa produk direkomendasikan.

**Impact:**
- Gagal audit
- Resistensi regulator

**Mitigation:**
- SHAP + rule trace
- Neo4j reasoning path
- Structured explanation record

---

### 8.2 Shadow Rule Changes

**Description:**
Perubahan rule tanpa persetujuan risk.

**Impact:**
- Inconsistent decision

**Mitigation:**
- Rule versioning
- Approval workflow
- Change log audit

---

## 9. Adoption & Business Risks

### 9.1 Low RM Adoption

**Description:**
RM tidak percaya atau enggan menggunakan sistem.

**Impact:**
- ROI rendah

**Mitigation:**
- Explainable output
- UX sederhana
- Training & onboarding

---

### 9.2 Misaligned Business Expectation

**Description:**
Bisnis menganggap sistem sebagai predictive guarantee.

**Impact:**
- Ekspektasi tidak realistis

**Mitigation:**
- Clear capability statement
- KPI berbasis decision quality, bukan hit rate

---

## 10. Risk Ownership

| Risk Category | Owner |
|-------------|-------|
| Data | Data Engineering |
| AI / Model | AI Engineering |
| Rules | Product & Risk |
| Platform | IT Architecture |
| Security | InfoSec |
| Adoption | Business Owner |

---

## 11. Conclusion

Risiko pada Wholesale Analytics Platform **dapat dikelola secara efektif** dengan desain yang tepat sejak awal. Pendekatan hybrid (Rule + ML + RAG) secara signifikan menurunkan risiko dibanding pure black-box AI.

Dokumen ini menjadi **baseline risk register** dan harus direview secara berkala selama siklus hidup sistem.

---
