-- WHOLESALE ANALYTICS PLATFORM
-- FULL DATA SCHEMA (PostgreSQL)

-- 1. MASTER DATA
CREATE TABLE industry (
  industry_id UUID PRIMARY KEY,
  industry_code TEXT UNIQUE,
  industry_name TEXT,
  sector TEXT,
  risk_level TEXT,
  created_at TIMESTAMP
);

CREATE TABLE company (
  company_id UUID PRIMARY KEY,
  company_name TEXT,
  industry_id UUID REFERENCES industry(industry_id),
  country TEXT,
  revenue NUMERIC,
  employee_count INT,
  company_status TEXT,
  created_at TIMESTAMP
);

CREATE TABLE product (
  product_id UUID PRIMARY KEY,
  product_code TEXT UNIQUE,
  product_name TEXT,
  product_category TEXT,
  risk_profile TEXT,
  active_flag BOOLEAN,
  created_at TIMESTAMP
);

-- 2. INGESTION & KNOWLEDGE DATA
CREATE TABLE document_source (
  source_id UUID PRIMARY KEY,
  source_type TEXT,
  source_name TEXT,
  credibility_score FLOAT,
  created_at TIMESTAMP
);

CREATE TABLE company_document (
  document_id UUID PRIMARY KEY,
  company_id UUID REFERENCES company(company_id),
  source_id UUID REFERENCES document_source(source_id),
  document_title TEXT,
  document_date DATE,
  created_at TIMESTAMP
);

CREATE TABLE document_chunk (
  chunk_id UUID PRIMARY KEY,
  document_id UUID REFERENCES company_document(document_id),
  embedding_id TEXT,
  created_at TIMESTAMP
);

-- 3. BUSINESS SIGNALS
CREATE TABLE business_signal (
  signal_id UUID PRIMARY KEY,
  company_id UUID REFERENCES company(company_id),
  signal_code TEXT,
  signal_value FLOAT,
  confidence_score FLOAT,
  source TEXT,
  created_at TIMESTAMP
);

-- 4. RULE ENGINE
CREATE TABLE rule (
  rule_id UUID PRIMARY KEY,
  rule_code TEXT UNIQUE,
  rule_name TEXT,
  rule_type TEXT,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE rule_condition (
  condition_id UUID PRIMARY KEY,
  rule_id UUID REFERENCES rule(rule_id),
  signal_code TEXT,
  operator TEXT,
  threshold_value FLOAT,
  created_at TIMESTAMP
);

CREATE TABLE product_rule_mapping (
  mapping_id UUID PRIMARY KEY,
  product_id UUID REFERENCES product(product_id),
  rule_id UUID REFERENCES rule(rule_id),
  is_mandatory BOOLEAN,
  created_at TIMESTAMP
);

-- 5. SCORING & EXPLANATION
CREATE TABLE product_score (
  score_id UUID PRIMARY KEY,
  company_id UUID,
  product_id UUID,
  model_version TEXT,
  score FLOAT,
  decision_label TEXT,
  created_at TIMESTAMP
);

CREATE TABLE product_score_feature (
  score_feature_id UUID PRIMARY KEY,
  score_id UUID REFERENCES product_score(score_id),
  feature_name TEXT,
  contribution_value FLOAT,
  created_at TIMESTAMP
);

CREATE TABLE product_explanation (
  explanation_id UUID PRIMARY KEY,
  score_id UUID REFERENCES product_score(score_id),
  explanation_text TEXT,
  llm_provider TEXT,
  created_at TIMESTAMP
);
