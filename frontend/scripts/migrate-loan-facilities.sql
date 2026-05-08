-- Migration: LoanFacilities table with insight column
-- Drop and recreate for clean state

DROP TABLE IF EXISTS LoanFacilities;

CREATE TABLE LoanFacilities (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL,
  bank VARCHAR(255) NOT NULL,
  bank_short_name VARCHAR(50) NOT NULL,
  facility_type VARCHAR(255) NOT NULL,
  max_limit_rp_m BIGINT NOT NULL,
  max_limit_note TEXT,
  borrower_tag VARCHAR(255) NOT NULL,
  borrower_type VARCHAR(20) NOT NULL CHECK (borrower_type IN ('Parent', 'Subsidiary')),
  expiry_date DATE NOT NULL,
  expiry_year SMALLINT NOT NULL,
  insight TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_LoanFacilities_account_id ON LoanFacilities(account_id);
CREATE INDEX idx_LoanFacilities_expiry_year ON LoanFacilities(expiry_year);

-- Insert all 17 loan facility records with pre-computed insight text
-- account_id: 'japfa-comfeed'
-- Insight computed based on: today = 2026-05-04

INSERT INTO LoanFacilities (account_id, bank, bank_short_name, facility_type, max_limit_rp_m, max_limit_note, borrower_tag, borrower_type, expiry_date, expiry_year, insight) VALUES
-- EXPIRING 2026
-- BCA (all expired — expiry 2026-04-20, days=-14)
('japfa-comfeed', 'PT Bank Central Asia Tbk', 'BCA', 'Time Loan Revolving Uncommitted (TLR)', 950000, NULL, 'PT JAPFA (Parent)', 'Parent', '2026-04-20', 2026, 'Lapsed 14 days ago — renewal discussion should already be underway.'),
('japfa-comfeed', 'PT Bank Central Asia Tbk', 'BCA', 'Kredit Modal Kerja / Working Capital Loan (KMK)', 150000, NULL, 'PT JAPFA (Parent)', 'Parent', '2026-04-20', 2026, 'Lapsed 14 days ago — renewal discussion should already be underway.'),
('japfa-comfeed', 'PT Bank Central Asia Tbk', 'BCA', 'Time Loan Committed', 1500000, NULL, 'PT JAPFA (Parent)', 'Parent', '2026-04-20', 2026, 'Lapsed 14 days ago — Rp 1.50T high-value exposure; immediate renewal negotiation required.'),
('japfa-comfeed', 'PT Bank Central Asia Tbk', 'BCA', 'Uncommitted Time Loan', 100000, NULL, 'PT Indojaya Agrinusa / IAG (Subsidiary)', 'Subsidiary', '2026-04-20', 2026, 'Lapsed 14 days ago — renewal discussion should already be underway.'),
('japfa-comfeed', 'PT Bank Central Asia Tbk', 'BCA', 'Time Loan Revolving (TLR)', 300000, NULL, 'PT Japfa Food Indonesia / JFI (Subsidiary)', 'Subsidiary', '2026-04-20', 2026, 'Lapsed 14 days ago — renewal discussion should already be underway.'),
-- UOB (expired — expiry 2026-04-27, days=-7)
('japfa-comfeed', 'PT Bank UOB Indonesia', 'UOB', 'Revolving Credit Facility (RCF) + sublimits (LC / SKBDN / Trust Receipt / Import Invoice Financing)', 250000, NULL, 'PT JAPFA (Parent)', 'Parent', '2026-04-27', 2026, 'Lapsed 7 days ago — renewal discussion should already be underway.'),
-- JPMorgan (1 day left — expiry 2026-05-05, days=1)
('japfa-comfeed', 'JPMorgan Chase Bank, N.A.', 'JPMorgan', 'Overdraft (OD) Facility', 300000, NULL, 'PT JAPFA (Parent)', 'Parent', '2026-05-05', 2026, 'Lapsing in 1 day — immediate banker contact required to initiate renewal.'),
-- Mandiri (expiry 2026-09-20, days=139)
('japfa-comfeed', 'PT Bank Mandiri (Persero) Tbk', 'Mandiri', 'Kredit Modal Kerja (KMK) + Non Cash Loan sublimit Trust Receipt (TR)', 1000000, 'KMK Rp1,000,000 + NCL sublimit TR US$40,000,000', 'PT JAPFA (Parent)', 'Parent', '2026-09-20', 2026, '139-day window to expiry — begin renewal negotiation now for this Rp 1.00T high-value facility; USD sublimit adds cross-currency complexity.'),
('japfa-comfeed', 'PT Bank Mandiri (Persero) Tbk', 'Mandiri', 'Term Loan Revolving Committed', 1000000, NULL, 'PT JAPFA (Parent)', 'Parent', '2026-09-26', 2026, 'Expiring in ~5 months — Rp 1.00T exposure; early lender engagement recommended.'),
('japfa-comfeed', 'PT Bank Mandiri (Persero) Tbk', 'Mandiri', 'Kredit Modal Kerja (KMK)', 330000, NULL, 'PT Indojaya Agrinusa / IAG (Subsidiary)', 'Subsidiary', '2026-09-20', 2026, '139-day window to expiry — begin renewal negotiation now.'),
-- Maybank (expiry 2026-10-24, days=173)
('japfa-comfeed', 'PT Bank Maybank Indonesia Tbk', 'Maybank', 'Revolving Promissory Loan (RPL) + sublimits (LC / SKBDN / TR / Invoice Financing / Guarantee)', 600000, 'US$40,000,000 or Rp600,000; also available to PT Ciomas Adisatwa, PT Santosa Agrinusa, PT Santosa Agrinusa Laut, PT Vaksindo Satwa Nusantara (Subsidiaries)', 'PT JAPFA (Parent) + CA / SA / SAL / VSN (Subsidiaries)', 'Parent', '2026-10-24', 2026, 'Expiring in ~6 months — proactively address USD sublimit structure at renewal.'),
-- BRI (expiry 2026-10-25, days=174)
('japfa-comfeed', 'PT Bank Rakyat Indonesia (Persero) Tbk', 'BRI', 'KMK + Kredit Jangka Pendek Uncommitted (KJP)', 1000000, 'KMK Rp400,000 + KJP Uncommitted Rp600,000', 'PT Indojaya Agrinusa / IAG (Subsidiary)', 'Subsidiary', '2026-10-25', 2026, 'Expiring in ~6 months — Rp 1.00T exposure; early lender engagement recommended.'),
('japfa-comfeed', 'PT Bank Rakyat Indonesia (Persero) Tbk', 'BRI', 'Kredit Jangka Pendek Uncommitted (KJP)', 1000000, 'MFJ can use up to Rp20,000 of this facility', 'PT JAPFA (Parent) + PT Multi Farmindo Jaya / MFJ (Subsidiary)', 'Parent', '2026-10-25', 2026, 'Expiring in ~6 months — Rp 1.00T exposure; early lender engagement recommended.'),
('japfa-comfeed', 'PT Bank Rakyat Indonesia (Persero) Tbk', 'BRI', 'Kredit Modal Kerja (KMK) — obtained January 22, 2026', 50000, NULL, 'PT Multi Farmindo Jaya / MFJ (Subsidiary)', 'Subsidiary', '2026-10-25', 2026, 'Expiring in ~6 months — proactive review recommended.'),
-- DBS (expiry 2026-12-14, days=254)
('japfa-comfeed', 'PT Bank DBS Indonesia', 'DBS', 'Omnibus Facility (Uncommitted)', 600000, NULL, 'PT JAPFA (Parent)', 'Parent', '2026-12-14', 2026, 'Queue for Q4 2026 renewal planning.'),
-- EXPIRING 2027
-- BOC (expiry 2027-04-04, days=365)
('japfa-comfeed', 'Bank of China (Hong Kong) Limited — Jakarta Branch', 'BOC', 'Revolving Credit Facility', 700000, NULL, 'PT JAPFA (Parent)', 'Parent', '2027-04-04', 2027, 'Queue for Q2 2027 renewal planning — Rp 0.70T high-value exposure; flag for early review.'),
-- BNI (expiry 2027-06-16, days=438)
('japfa-comfeed', 'PT Bank Negara Indonesia (Persero) Tbk', 'BNI', 'KMK Committed + KMK Uncommitted', 2150000, 'KMK-Committed Rp1,900,000 + KMK-Uncommitted Rp250,000', 'PT JAPFA (Parent)', 'Parent', '2027-06-16', 2027, 'Queue for Q3 2027 renewal planning — Rp 2.15T high-value exposure; flag for early review.');