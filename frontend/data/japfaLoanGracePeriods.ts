// Source: PT JAPFA Comfeed Indonesia Tbk Annual Report 2025
// Note 17 – Short-Term Bank Loans, pages 328–333
// Extracted via OCR + manual validation, April 2026
// Grace period filter: facilities expiring in 2026 or 2027

export type BorrowerType = 'Parent' | 'Subsidiary';

export interface LoanFacility {
  facilityType: string;
  maxLimitRpM: number;           // millions of Rupiah; -1 = USD-denominated (see note)
  maxLimitNote?: string;         // e.g. "US$40,000,000 or Rp600,000"
  borrowerTag: string;           // e.g. "PT JAPFA (Parent)" or "IAG (Subsidiary)"
  borrowerType: BorrowerType;
  expiryDate: string;            // ISO format YYYY-MM-DD
  expiryYear: 2026 | 2027;
}

export interface BankLoanGroup {
  bank: string;
  shortName: string;
  facilities: LoanFacility[];
}

export const japfaLoanGracePeriods: BankLoanGroup[] = [

  // ── EXPIRING 2026 ────────────────────────────────────────────────────────

  {
    bank: 'PT Bank Central Asia Tbk',
    shortName: 'BCA',
    facilities: [
      {
        facilityType: 'Time Loan Revolving Uncommitted (TLR)',
        maxLimitRpM: 950_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-04-20',
        expiryYear: 2026,
      },
      {
        facilityType: 'Kredit Modal Kerja / Working Capital Loan (KMK)',
        maxLimitRpM: 150_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-04-20',
        expiryYear: 2026,
      },
      {
        facilityType: 'Time Loan Committed',
        maxLimitRpM: 1_500_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-04-20',
        expiryYear: 2026,
      },
      {
        facilityType: 'Uncommitted Time Loan',
        maxLimitRpM: 100_000,
        borrowerTag: 'PT Indojaya Agrinusa / IAG (Subsidiary)',
        borrowerType: 'Subsidiary',
        expiryDate: '2026-04-20',
        expiryYear: 2026,
      },
      {
        facilityType: 'Time Loan Revolving (TLR)',
        maxLimitRpM: 300_000,
        borrowerTag: 'PT Japfa Food Indonesia / JFI (Subsidiary)',
        borrowerType: 'Subsidiary',
        expiryDate: '2026-04-20',
        expiryYear: 2026,
      },
    ],
  },

  {
    bank: 'PT Bank UOB Indonesia',
    shortName: 'UOB',
    facilities: [
      {
        facilityType: 'Revolving Credit Facility (RCF) + sublimits (LC / SKBDN / Trust Receipt / Import Invoice Financing)',
        maxLimitRpM: 250_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-04-27',
        expiryYear: 2026,
      },
    ],
  },

  {
    bank: 'JPMorgan Chase Bank, N.A.',
    shortName: 'JPMorgan',
    facilities: [
      {
        facilityType: 'Overdraft (OD) Facility',
        maxLimitRpM: 300_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-05-06',
        expiryYear: 2026,
      },
    ],
  },

  {
    bank: 'PT Bank Mandiri (Persero) Tbk',
    shortName: 'Mandiri',
    facilities: [
      {
        facilityType: 'Kredit Modal Kerja (KMK) + Non Cash Loan sublimit Trust Receipt (TR)',
        maxLimitRpM: 1_000_000,
        maxLimitNote: 'KMK Rp1,000,000 + NCL sublimit TR US$40,000,000',
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-09-20',
        expiryYear: 2026,
      },
      {
        facilityType: 'Term Loan Revolving Committed',
        maxLimitRpM: 1_000_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-09-26',
        expiryYear: 2026,
      },
      {
        facilityType: 'Kredit Modal Kerja (KMK)',
        maxLimitRpM: 330_000,
        borrowerTag: 'PT Indojaya Agrinusa / IAG (Subsidiary)',
        borrowerType: 'Subsidiary',
        expiryDate: '2026-09-20',
        expiryYear: 2026,
      },
    ],
  },

  {
    bank: 'PT Bank Maybank Indonesia Tbk',
    shortName: 'Maybank',
    facilities: [
      {
        facilityType: 'Revolving Promissory Loan (RPL) + sublimits (LC / SKBDN / TR / Invoice Financing / Guarantee)',
        maxLimitRpM: 600_000,
        maxLimitNote: 'US$40,000,000 or Rp600,000; also available to PT Ciomas Adisatwa, PT Santosa Agrinusa, PT Santosa Agrinusa Laut, PT Vaksindo Satwa Nusantara (Subsidiaries)',
        borrowerTag: 'PT JAPFA (Parent) + CA / SA / SAL / VSN (Subsidiaries)',
        borrowerType: 'Parent',
        expiryDate: '2026-10-24',
        expiryYear: 2026,
      },
    ],
  },

  {
    bank: 'PT Bank Rakyat Indonesia (Persero) Tbk',
    shortName: 'BRI',
    facilities: [
      {
        facilityType: 'KMK + Kredit Jangka Pendek Uncommitted (KJP)',
        maxLimitRpM: 1_000_000,
        maxLimitNote: 'KMK Rp400,000 + KJP Uncommitted Rp600,000',
        borrowerTag: 'PT Indojaya Agrinusa / IAG (Subsidiary)',
        borrowerType: 'Subsidiary',
        expiryDate: '2026-10-25',
        expiryYear: 2026,
      },
      {
        facilityType: 'Kredit Jangka Pendek Uncommitted (KJP)',
        maxLimitRpM: 1_000_000,
        maxLimitNote: 'MFJ can use up to Rp20,000 of this facility',
        borrowerTag: 'PT JAPFA (Parent) + PT Multi Farmindo Jaya / MFJ (Subsidiary)',
        borrowerType: 'Parent',
        expiryDate: '2026-10-25',
        expiryYear: 2026,
      },
      {
        facilityType: 'Kredit Modal Kerja (KMK) — obtained January 22, 2026',
        maxLimitRpM: 50_000,
        borrowerTag: 'PT Multi Farmindo Jaya / MFJ (Subsidiary)',
        borrowerType: 'Subsidiary',
        expiryDate: '2026-10-25',
        expiryYear: 2026,
      },
    ],
  },

  {
    bank: 'PT Bank DBS Indonesia',
    shortName: 'DBS',
    facilities: [
      {
        facilityType: 'Omnibus Facility (Uncommitted)',
        maxLimitRpM: 600_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2026-12-14',
        expiryYear: 2026,
      },
    ],
  },

  // ── EXPIRING 2027 ────────────────────────────────────────────────────────

  {
    bank: 'Bank of China (Hong Kong) Limited — Jakarta Branch',
    shortName: 'BOC',
    facilities: [
      {
        facilityType: 'Revolving Credit Facility',
        maxLimitRpM: 700_000,
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2027-04-04',
        expiryYear: 2027,
      },
    ],
  },

  {
    bank: 'PT Bank Negara Indonesia (Persero) Tbk',
    shortName: 'BNI',
    facilities: [
      {
        facilityType: 'KMK Committed + KMK Uncommitted',
        maxLimitRpM: 2_150_000,
        maxLimitNote: 'KMK-Committed Rp1,900,000 + KMK-Uncommitted Rp250,000',
        borrowerTag: 'PT JAPFA (Parent)',
        borrowerType: 'Parent',
        expiryDate: '2027-06-16',
        expiryYear: 2027,
      },
    ],
  },
];

// ── Convenience helpers ──────────────────────────────────────────────────────

export const loansByYear = {
  2026: japfaLoanGracePeriods
    .map((g) => ({ ...g, facilities: g.facilities.filter((f) => f.expiryYear === 2026) }))
    .filter((g) => g.facilities.length > 0),
  2027: japfaLoanGracePeriods
    .map((g) => ({ ...g, facilities: g.facilities.filter((f) => f.expiryYear === 2027) }))
    .filter((g) => g.facilities.length > 0),
};

export const totalFacilityCount = japfaLoanGracePeriods.reduce(
  (sum, g) => sum + g.facilities.length, 0
);

export const totalMaxLimitRpM = japfaLoanGracePeriods.reduce(
  (sum, g) => sum + g.facilities.reduce((s, f) => s + (f.maxLimitRpM > 0 ? f.maxLimitRpM : 0), 0), 0
);
