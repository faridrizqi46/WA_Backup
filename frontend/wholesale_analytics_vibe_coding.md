# 🧠 Wholesale Analytics Platform
## Vibe Coding Master Document (Final)

---

# 1. 🎯 Product Overview

## Objective
Build an analytics platform for:
- Company analysis (financial, news, risk)
- Wholesale banking product recommendations
- AI-powered automated insights (RAG + ML)

## Core Value
- Fast insights for Relationship Managers (RM)
- Reduce manual analysis
- Faster & data-driven decision making

---

# 2. 🏗️ System Architecture

## Tech Stack

### Backend
- Node.js

### Frontend
- Framework: React.js
- Styling: Tailwind CSS
- Charts: Chart.js
- Graph Visualization: D3.js
- State Management: Zustand

### Database
- PostgreSQL

### Vector DB
- chromadb

### Graph DB
- Neo4j

### AI Stack
- Embedding: OpenAI / Ollama / IBM Granite
- OpenAI / Ollama / IBM Granite

### ML
- LightGBM & XGBoost
- KNN & GNN

---

# 3. 🔄 End-to-End Data Flow

Data Source (News / PDF)
        ↓
Scraping (SearchAPI / Firecrawl)
        ↓
Cleaning & Parsing
        ↓
Chunking (200–500 tokens + overlap)
        ↓
Embedding
        ↓
Vector DB (chromadb)
        ↓
Retrieval (RAG)
        ↓
LLM Insight
        ↓
ML Scoring + Rule Engine
        ↓
Frontend Dashboard

---

# 4. 🚀 Development Plan

## 🔵 Phase 0 — Sprint Planning

### Goal
Define architecture, schema, and flow before coding begins

### Tasks
- Define system architecture
- Finalize tech stack
- Design PostgreSQL schema
- Design vector DB schema
- Define data pipeline (news & PDF)
- Define chunking strategy
- Define RAG architecture
- Identify risks

### Acceptance Criteria
- Architecture is clearly documented
- All schemas are ready for implementation
- End-to-end flow is clear with no ambiguity

---

## 🔵 Phase 1 — MVP (Weeks 1–4)

### 🟢 Sprint 1 — Data Ingestion Foundation

### Goal
Build the data ingestion pipeline

### Tasks
- Setup Node.js project & structure
- Setup API server & routing
- Integrate SearchAPI
- Integrate Firecrawl
- Build crawler service
- Implement PDF parser
- Implement DOCX parser
- Clean & normalize text
- Implement chunking (500–1000 tokens)
- Implement embedding service
- Store to chromadb
- Setup logging & retry
- Create API `/ingest/company`

### Acceptance Criteria
- Data is successfully retrieved from sources
- Data is stored in DB & vector DB
- API is accessible via Postman
- No critical errors

---

### 🟢 Sprint 2 — Summarization + Dashboard UI

### Goal
Display initial insights to users and build the main dashboard view

### Tasks

**Backend & AI**
- Setup LLM
- Create prompts:
  - Financial summary
  - News summary
  - Sentiment
- Build summarization service
- Create API `/summary/company`
- Extract financial highlights
- Implement sentiment scoring

**Frontend — Summary**
- Build input form
- Build summary page
- Connect frontend to backend
- Basic styling

**Frontend — Dashboard**
- Build KPI cards (Total Leads, Plan vs Realization, Current Quarter Performance)
- Build bar chart Plan vs Realization by Industry (Recharts / Chart.js)
- Build top opportunities table (Product, Company, Potential Value, Date, Confidence Level)
- Add filter (industry / region)
- Sorting (by value, confidence)
- API integration `/dashboard`
- Navigation to account page (click → redirect)

### Acceptance Criteria
- User can input a company and summary displays completely
- Response time < 5 seconds
- Dashboard displays KPI cards, chart, and table
- Industry/region filter works correctly
- Clicking a table row redirects to the Account page
- UI is usable with no major bugs

---

### 🟢 Sprint 3 — Opportunities Page UI

### Goal
Display all opportunities across all companies with comprehensive filtering

### Components
- Opportunities Table
- Filter Panel:
  - Industry
  - Product Type
  - Confidence Level
  - Value Range

### Tasks
- Build opportunities list page
- Implement multi-filter system (industry, product type, confidence, value range)
- Add company search functionality
- Sorting logic (by value / confidence / date)
- Pagination
- API integration `/opportunities`
- Connect to backend

### Acceptance Criteria
- All opportunities display with pagination
- Multi-filter works simultaneously
- Company search is responsive
- Sorting works on all relevant columns

---

## 🔵 Phase 2 — Intelligence Layer (Weeks 5–8)

### 🟢 Sprint 4 — Business Understanding

### Goal
Understand the business context of each company

### Tasks
- Build entity extraction (supplier/customer/partner)
- Normalize entity names
- Industry classification
- Risk detection
- Setup Neo4j
- Design graph schema
- Store relationships
- Create API `/business-understanding`

### Acceptance Criteria
- Entity extraction ≥ 80% relevance
- Graph is formed in Neo4j
- Industry & risk data is available
- API returns structured data

---

### 🟢 Sprint 5 — Graph + ML Intelligence

### Goal
Add graph-based intelligence

### Tasks
- Generate feature vector
- Implement KNN similarity
- Store similarity results
- Build GNN prototype
- Create graph query API
- Integrate graph visualization (D3.js)
- Enable node interaction

### Acceptance Criteria
- Similar companies can be displayed
- Graph visualization is running
- Query < 1 second
- Interaction (click/hover) is active

---

## 🔵 Phase 3 — Scoring & Explainability (Weeks 9–12)

### 🟢 Sprint 6 — Opportunity Engine

### Goal
Determine product opportunities

### Tasks
- Define features:
  - Financial
  - Industry
  - Graph
- Build feature pipeline
- Prepare dataset
- Train ML model (LightGBM/XGBoost)
- Evaluate model
- Build rule engine (JSON)
- Combine ML + rule
- Create API `/opportunities`
- Store results

### Acceptance Criteria
- Model AUC ≥ 0.7
- Score is available per company
- Output is consistent
- API is stable

---

### 🟢 Sprint 7 — Explainability + Account Page + Graph UI

### Goal
Explain recommendation results and build a complete Account page with graph visualization

### Tasks

**Backend — Explainability**
- Integrate SHAP
- Integrate LIME
- Build explanation generator (LLM)
- Map explanations to data sources
- Create API `/explanation`

**Frontend — Explanation & Recommendation**
- Build recommendation panel
- Build explanation panel (key factors + confidence score)
- Link insights to source data

**Frontend — Account Page**
- Build account overview UI (company info, location map, basic profile)
- Implement company structure table (parent / subsidiary / ownership / country)
- Create tabs navigation (Details / Insights / Opportunities)
- Build insights section (industry insights, client insights, business analysis)
- Build opportunities section per company with detailed reasoning
- API integration `/account/:id`
- API integration `/account/:id/opportunities`
- API integration `/account/:id/insights`

**Frontend — Graph Visualization**
- Integrate Neo4j graph visualization into Account Page (Value Chain / Supply Chain, tier-based)
- Build graph interaction (zoom / click / hover / drill-down entity)
- End-to-end testing of the full pipeline

### Acceptance Criteria
- User can view recommendation reasoning with key factors and confidence score
- Account page displays completely with all sections and tab navigation
- Graph is displayed and interactive (hover/click/drill-down active)
- Insights appear with links to source data
- Full pipeline with no critical bugs

---

# 🗺️ Sprint Overview (Full Roadmap)

| Sprint | Focus | Phase |
|---|---|---|
| Sprint 1 | Data Ingestion Foundation | MVP |
| Sprint 2 | Summarization + Dashboard UI | MVP |
| Sprint 3 | Opportunities Page UI | MVP |
| Sprint 4 | Business Understanding (Entity, Graph) | Intelligence |
| Sprint 5 | Graph + ML Intelligence | Intelligence |
| Sprint 6 | Opportunity Engine (ML + Rule) | Scoring |
| Sprint 7 | Explainability + Account Page + Graph UI | Scoring |
