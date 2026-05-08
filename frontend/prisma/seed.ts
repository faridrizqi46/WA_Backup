import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ============================================
  // COMPANIES
  // ============================================
  const company = await prisma.company.create({
    data: {
      companyName: 'PT JAPFA COMFEED INDONESIA TBK',
      industries: 'Crop and Animal Production',
    },
  });
  console.log('Created company:', company.id);

  // ============================================
  // ACCOUNT
  // ============================================
  const account = await prisma.account.create({
    data: {
      companyId: company.id,
      name: 'PT JAPFA COMFEED INDONESIA TBK',
      layerId: 'AHU-0001402.AH.01.02.TH.2025',
      industry: 'Crop and Animal Production',
      type: 'Public',
      segment: 'Corporate',
      cfoCount: 32,
      accountNumber: 'ACC-001',
      description:
        'PT Japfa Comfeed Indonesia Tbk (IDX: JPFA) is Indonesia\'s second-largest integrated poultry and animal feed producer with revenues exceeding IDR 40 trillion. Japfa operates a full protein chain — from animal feed manufacturing and contract farming (inti-plasma) to poultry processing and branded consumer products (So Good, So Kool).',
      headquarters: 'Wisma Millenia 7th Floor Jl. M.T. Haryono Kav. 16',
      latitude: '-6.2425135',
      longitude: '106.848901',
      alsoFoundAt: ['Jakarta', 'Sidoarjo', 'Banten'],
      keyHighlight:
        'There is expansion potential within five JAPFA entities that are currently non-borrowers at BRI. To increase wallet share, BRI can offer **KMK (Working Capital)** financing schemes as well as **Trade Finance** solutions (Bank Guarantee and Letter of Credit) to support the group\'s operations.',
    },
  });
  console.log('Created account:', account.id);

  // ============================================
  // FINANCIAL METRICS
  // ============================================
  const financialMetrics = [
    { label: 'Net Sales Revenue', value: '4.42%', direction: 'up' },
    { label: 'Debt/Equity', value: '10.42%', direction: 'down' },
    { label: 'Net P&L for the Period', value: '17.29%', direction: 'up' },
    { label: 'Total Equity', value: '10.83%', direction: 'up' },
    { label: 'Quick Ratio', value: '0.12%', direction: 'down' },
    { label: 'Fixed Asset', value: '14.49 Trillion', direction: 'up' },
  ];

  for (const metric of financialMetrics) {
    await prisma.financialMetric.create({
      data: { accountId: account.id, ...metric },
    });
  }
  console.log('Created financial metrics');

  // ============================================
  // COMPANY TREE
  // ============================================
  const companyTree = [
    { name: 'PT JAPFA PTE. LTD.', ownershipType: 'Public', city: 'Singapore', stateProvince: '', country: 'Singapore', ibrProduct: 'KMK', prefix: '-' },
    { name: 'PT JAPFA COMFEED INDONESIA TBK', ownershipType: 'Public', city: 'Kota Administrasi Jakarta Selatan', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'KJP', isAnchor: true, prefix: '-' },
    { name: 'PT MULTIBREEDER ADIRAMA INDONESIA TBK', ownershipType: 'Public', city: 'Kota Administrasi Jakarta Barat', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'Non-Bri', indent: 1, prefix: '+' },
    { name: 'PT SURI TANI PEMUKA', ownershipType: 'Private', city: 'Kota Administrasi Jakarta Selatan', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'Non-Bri', indent: 1, prefix: '+' },
    { name: 'PT JAPFA FOOD INDONESIA', ownershipType: 'Private', city: 'Kota Administrasi Jakarta Barat', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'KMK', indent: 1, prefix: '+' },
    { name: 'PT JAPFA COMFEED INDONESIA TBK', ownershipType: 'Private', city: 'Kabupaten Sidoarjo', stateProvince: 'Jawa Timur', country: 'Indonesia', ibrProduct: 'KMK' },
    { name: 'PT MULTIPHALA AGRINUSA', ownershipType: 'Private', city: 'Kota Administrasi Jakarta Barat', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'KJP' },
    { name: 'PT JAPFA COMFEED INDONESIA TBK', ownershipType: 'Private', city: 'Kota Cirebon', stateProvince: 'Jawa Barat', country: 'Indonesia', ibrProduct: 'KJP' },
    { name: 'PT BINTANG TERANG GEMILANG', ownershipType: 'Private', city: 'Kota Administrasi Jakarta Selatan', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'Non-Bri', indent: 1, prefix: '+' },
    { name: 'PT JAPFA COMFEED INDONESIA TBK', ownershipType: 'Private', city: 'Kota Tangerang', stateProvince: 'Banten', country: 'Indonesia', ibrProduct: 'KMK' },
    { name: 'PT BINTANG LAUT TIMUR', ownershipType: 'Private', city: 'Kota Surabaya', stateProvince: 'Jawa Timur', country: 'Indonesia', ibrProduct: 'KJP' },
    { name: 'PT SANTOSA UTAMA LESTARI', ownershipType: 'Private', city: 'Kota Administrasi Jakarta Barat', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'KMK', indent: 1, prefix: '+' },
    { name: 'PT CIOMAS ADISATWA', ownershipType: 'Private', city: 'Kabupaten Sidoarjo', stateProvince: 'Jawa Timur', country: 'Indonesia', ibrProduct: 'Non-Bri', indent: 1, prefix: '+' },
    { name: 'PT CIOMAS ADISATWA', ownershipType: 'Private', city: 'Kota Administrasi Jakarta Barat', stateProvince: 'DKI Jakarta', country: 'Indonesia', ibrProduct: 'Non-Bri', indent: 1, prefix: '+' },
    { name: 'JAPFA SOUTH-ASIA INVESTMENTS PTE. LTD.', ownershipType: 'Private', city: 'Singapore', stateProvince: '', country: 'Singapore', ibrProduct: 'KJP', indent: 1, prefix: '+' },
    { name: 'ANNONA PTE. LTD.', ownershipType: 'Private', city: 'Singapore', stateProvince: '', country: 'Singapore', ibrProduct: 'KJP', indent: 1, prefix: '+' },
    { name: 'JAPFA MYANMAR JV PTE. LTD.', ownershipType: 'Private', city: 'Singapore', stateProvince: '', country: 'Singapore', ibrProduct: 'KJP' },
    { name: 'AUSTASIA GROUP LTD.', ownershipType: 'Private', city: 'Singapore', stateProvince: '', country: 'Singapore', ibrProduct: 'KJP', indent: 1, prefix: '+' },
    { name: 'BIONOVUS PTE. LTD.', ownershipType: 'Private', city: 'Singapore', stateProvince: '', country: 'Singapore', ibrProduct: 'KJP' },
    { name: 'JAPFA VIETNAM INVESTMENTS PTE. LTD.', ownershipType: 'Private', city: 'Singapore', stateProvince: '', country: 'Singapore', ibrProduct: 'KJP', indent: 1, prefix: '+' },
  ];

  for (const node of companyTree) {
    await prisma.companyTreeNode.create({
      data: { accountId: account.id, ...node },
    });
  }
  console.log('Created company tree nodes');

  // ============================================
  // VALUE CHAIN NODES
  // ============================================
  const valueChainNodes = [
    { id: 'anchor', company: 'PT JAPFA\nCOMFEED TBK', segment: 'Corporate', clientType: 'Supplier', tier: 0 },
    { id: 't1-1', company: 'PT BRI', segment: 'Corporate', clientType: 'Supplier', tier: 1 },
    { id: 't1-2', company: 'Bank Agro', segment: 'Corporate', clientType: 'Supplier', tier: 1 },
    { id: 't1-3', company: 'BNI Food Inc', segment: 'Commercial', clientType: 'Local Distributor', tier: 1 },
    { id: 't1-4', company: 'PT BRI Syariah', segment: 'Commercial', clientType: 'Local Distributor', tier: 1 },
    { id: 't1-5', company: 'Galih Pangan', segment: 'SME', clientType: 'Local Distributor', tier: 1 },
    { id: 't1-6', company: 'Indo Company Ind.', segment: 'SME', clientType: 'Supplier', tier: 1 },
    { id: 't1-7', company: 'PT Indiagram\nOpmark Corp', segment: 'SME', clientType: 'Local Distributor', tier: 1 },
    { id: 't1-8', company: 'Sutaripto Foods\nCorporation', segment: 'SME', clientType: 'Supplier', tier: 1 },
    { id: 't2-1', company: 'D&B Meat', segment: 'SME', clientType: 'Local Distributor', tier: 2 },
    { id: 't2-2', company: 'Food Corp', segment: 'SME', clientType: 'Local Distributor', tier: 2 },
    { id: 't2-3', company: 'PT Sugiono\nCorp', segment: 'SME', clientType: 'Global Distributor', tier: 2 },
    { id: 't2-4', company: 'RS BNI Food\nJkt Timur', segment: 'Commercial', clientType: 'Supplier', tier: 2 },
    { id: 't2-5', company: 'Sutaripto\nPangan Corp', segment: 'SME', clientType: 'Local Distributor', tier: 2 },
    { id: 't2-6', company: 'Ethiokomodie', segment: 'Micro', clientType: 'Local Distributor', tier: 2 },
    { id: 't2-7', company: 'Scalar Piraoda\nCorporation', segment: 'Micro', clientType: 'Global Distributor', tier: 2 },
  ];

  for (const node of valueChainNodes) {
    await prisma.valueChainNode.create({
      data: { accountId: account.id, ...node },
    });
  }
  console.log('Created value chain nodes');

  // ============================================
  // OPPORTUNITIES WITH DETAIL & TRADE INTELLIGENCE
  // ============================================
  const opportunityData = [
    {
      offeredProduct: 'Bill Discounting – SCF',
      insight: 'Swift – Co frequent monthly shipment for Meat and Bone Meal estimated. 6x/month; ~100 Ton',
      confidenceLevel: 'High',
      potentialValue: '220K USD / Month',
      offerDate: '13 Feb 2026',
      reason: 'Multiple bill of lading for importing for the upstream chain.',
      urgency: 'This Month',
      recommendedAction: 'Initiate bill discounting proposal for Meat & Bone Meal import flows',
      deadline: '28 Feb 2026',
      hasDetail: true,
      hasTradeIntel: true,
    },
    {
      offeredProduct: 'Inventory Finance – SCF',
      insight: "POET Nutrition Inc. providing Distiller's Dried Grains (DDGs) for poultry feeds",
      confidenceLevel: 'High',
      potentialValue: '180K USD / Month',
      offerDate: '10 Feb 2026',
      reason: 'Bill of lading for feeds using heavy vessel.',
      urgency: 'This Quarter',
      recommendedAction: 'Propose inventory financing facility for DDG feed imports from POET Nutrition',
      deadline: 'End Q1 2026',
      hasDetail: false,
      hasTradeIntel: false,
    },
    {
      offeredProduct: 'SCF',
      insight: 'Ya Nur Trading Co Sdn. constant buying for poultry feed (~1000 Ton) and hatching eggs (300K+ units) monthly',
      confidenceLevel: 'High',
      potentialValue: '720K USD / Month',
      offerDate: '13 Feb 2026',
      reason: "JAPFA's largest single export destination by bill of lading (weekly / bi-weekly).",
      urgency: 'This Month',
      recommendedAction: "Activate SCF corridor for Ya Nur Trading — JAPFA's largest Malaysia export lane",
      deadline: '28 Feb 2026',
      hasDetail: false,
      hasTradeIntel: false,
    },
    {
      offeredProduct: 'Cash Management System (CMS) & Payroll',
      insight: 'Five major subsidiaries (e.g., PT Vaksindo, PT Ciomas etc.) currently have fragmented cash operations not yet consolidated under BRI.',
      confidenceLevel: 'High',
      potentialValue: '2.52M USD / Month',
      offerDate: '13 Feb 2026',
      reason: 'Group-wide liquidity management efficiency. One-stop solution for integrated vendor payments and payroll for thousands of subsidiary employees.',
      urgency: 'This Quarter',
      recommendedAction: 'Present group-wide CMS consolidation proposal to JAPFA CFO',
      deadline: 'End Q1 2026',
      hasDetail: false,
      hasTradeIntel: false,
    },
    {
      offeredProduct: 'FX Hedging (Forward/Swap)',
      insight: 'Based on the Annual Report, Japfa has high import exposure for raw materials (SBM/Corn), with short-term USD-denominated liabilities reaching over $150M.',
      confidenceLevel: 'High',
      potentialValue: '2.41M USD (Potential FX Volume per Month)',
      offerDate: '13 Feb 2026',
      reason: 'Mitigating USD/IDR exchange rate fluctuation risks that could erode net profit margins due to rising global commodity prices.',
      urgency: 'Urgent',
      recommendedAction: 'Submit FX hedging term sheet — USD 150M+ import exposure currently unhedged',
      deadline: '28 Feb 2026',
      hasDetail: false,
      hasTradeIntel: false,
    },
    {
      offeredProduct: 'Distributor Financing (Digital Value Chain)',
      insight: "Thousands of JAPFA's egg and poultry agents still rely on cash payments or manual bank transfers. This forces JAPFA to carry high accounts receivable risks and operational overhead.",
      confidenceLevel: 'High',
      potentialValue: '3.45M USD',
      offerDate: '14 Feb 2026',
      reason: 'The bank provides dedicated credit lines to JAPFA distributors and agents. JAPFA receives immediate cash payments (improving DSO), while default risk is transferred to the bank.',
      urgency: 'This Quarter',
      recommendedAction: 'Pitch digital value chain financing programme to JAPFA Operations Director',
      deadline: 'End Q2 2026',
      hasDetail: false,
      hasTradeIntel: false,
    },
    {
      offeredProduct: 'Maturing Credit Facility Advisory',
      insight: 'Source: PT JAPFA Comfeed Indonesia Tbk Annual Report 2025 — 15 short-term bank facilities totaling Rp 11.98 Trillion with grace periods expiring in 2026–2027 across 9 banking partners.',
      confidenceLevel: 'High',
      potentialValue: 'Rp 11.98 T (Max Facility)',
      offerDate: 'Various',
      reason: 'Based on PT JAPFA Comfeed Indonesia Tbk Annual Report 2025, Note 17 — Short-Term Bank Loans (pages 328–333). Multiple facilities expiring in 2026–2027 present a critical renewal window.',
      isLoanAdvisory: true,
      urgency: 'Urgent',
      recommendedAction: 'Prepare facility renewal proposals — Q2/Q3 2026 expiry window opening now',
      deadline: '30 Apr 2026',
      hasDetail: false,
      hasTradeIntel: false,
    },
  ];

  for (const opp of opportunityData) {
    const { hasDetail, hasTradeIntel, ...opportunityFields } = opp;
    const created = await prisma.opportunity.create({
      data: { accountId: account.id, ...opportunityFields },
    });

    if (opp.hasDetail) {
      await prisma.opportunityDetail.create({
        data: {
          opportunityId: created.id,
          potentialValueDisplay: '$220K',
          potentialValueUnit: '/Month',
          businessBenefits: [
            { label: 'Working Capital', value: '+10%', positive: true },
            { label: 'Return Of Investment', value: '+3%', positive: true },
            { label: 'Supplier Performance', value: '+8%', positive: true },
            { label: 'Predictable Cash Flow', value: '+15%', positive: true },
            { label: 'Financial Cost', value: '-18%', positive: false },
            { label: 'Days Sales Outstanding', value: '-20%', positive: false },
          ],
          dataSources: [
            { title: 'Market Trend Relevance', description: 'External market studies indicate a growing adoption of SCF across multiple industries as companies seek faster cash conversion and more resilient working-capital structures.', sources: ['IBM Research – Industry Research', 'External Public Data – global SCF trend reports'] },
            { title: 'Sector Liquidity Conditions', description: 'Publicly available data on payment cycles within your sector shows a trend toward longer settlement periods.', sources: ['IBM Research – Industry Research', 'External Public Data – global SCF trend reports'] },
            { title: 'Industry Benchmarking', description: 'Benchmark analysis from external reports highlights that peer companies in similar industries have widely adopted Bill Discounting.', sources: ['IBM Research – Industry Research', 'External Public Data – global SCF trend reports'] },
            { title: 'Macroeconomic Indicators', description: 'Macroeconomic signals, such as stable supply-chain credit risk and rising demand for short-term financing.', sources: ['IBM Research – Industry Research', 'External Public Data – global SCF trend reports'] },
          ],
        },
      });
    }

    if (opp.hasTradeIntel) {
      const tradeIntel = await prisma.tradeIntelligence.create({
        data: {
          opportunityId: created.id,
          title: 'Japfa ↔ Swift & Co — 2026 Bill of Lading Intelligence Brief',
          agentLabel: 'Analysed by InsightBank™ Supply Chain Intelligence AI Agent · BoL Analytics Engine · US Customs Manifest Records',
          dataRange: 'Jan 2006 – Apr 2026',
          coverageNote: 'Visible records represent a conservative floor estimate. Full dataset reflects 681 all-time customs filings across 14 active trading partners.',
          primaryStats: [
            { label: 'Est. Annual Trade Value', value: '~$3.45M', unit: 'USD / Year' },
            { label: 'Projected Full-Year Volume', value: '~5,750 MT', unit: '2026 Annualised' },
            { label: 'Avg. Shipment Frequency', value: '~9 Days', unit: 'Recurring LC Cadence' },
            { label: '2026 Visible Containers', value: '90', unit: 'Jan – Apr 2026' },
          ],
          secondaryStats: [
            { label: 'Confirmed Swift Tonnage YTD', value: '308.5 MT', unit: '2026 Jan – Apr' },
            { label: 'All-Time Customs Shipments', value: '681', unit: 'JAPFA · 2006–2026' },
            { label: 'All-Time Swift Containers', value: '733', unit: 'Swift → Japfa' },
            { label: 'All-Time Swift Volume', value: '~15.8K MT', unit: 'Gross Weight' },
          ],
          supplierShare: [
            { name: 'International Feed Com', weightKgs: 52573890, weightLabel: '52.6M KGs', color: '#16a34a' },
            { name: 'Unattributed (N/A)', weightKgs: 16500000, weightLabel: '16.5M KGs', color: '#9ca3af' },
            { name: 'Swift Trade Group', weightKgs: 15839446, weightLabel: '15.8M KGs', color: '#2563eb' },
            { name: 'Darling Ingredients', weightKgs: 3157889, weightLabel: '3.2M KGs', color: '#f59e0b' },
            { name: 'Cargill Meat Solutions', weightKgs: 291571, weightLabel: '~291K KGs', color: '#ef4444' },
          ],
          tableSummaryNote: 'Visible 2026 records — partial view only (top 10 BoLs shown publicly). Actual volume is materially higher.',
        },
      });

      await prisma.bOLRecord.createMany({
        data: [
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'MEDUVC970781', arrivalDate: new Date('2026-04-20'), supplier: '', supplierConfirmed: false, productShort: 'Beef Meat & Bone Meal', grossWeightKgs: 413460, containerCount: 20, portOfDischarge: 'Makassar', vesselCarrier: 'MSC' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'ONEYRICGE7908600', arrivalDate: new Date('2026-04-16'), supplier: 'Swift & Trade Group', supplierConfirmed: true, productShort: 'Meat Flour / Bone Meal', grossWeightKgs: 143799, containerCount: 7, portOfDischarge: 'Indonesia', vesselCarrier: 'ONE' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'ONEYRICG95110700', arrivalDate: new Date('2026-04-16'), supplier: 'Swift & Trade Group', supplierConfirmed: true, productShort: 'Meat Flour / Bone Meal', grossWeightKgs: 164744, containerCount: 8, portOfDischarge: 'Indonesia', vesselCarrier: 'ONE' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'CMDUNAM8352902', arrivalDate: new Date('2026-04-05'), supplier: '', supplierConfirmed: false, productShort: 'Bulk ZV (MBM probable)', grossWeightKgs: 225750, containerCount: 10, portOfDischarge: '', vesselCarrier: 'CMA CGM' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'ONEYRICG85700400', arrivalDate: new Date('2026-04-02'), supplier: '', supplierConfirmed: false, productShort: 'Beef Meat & Bone Meal', grossWeightKgs: 204262, containerCount: 10, portOfDischarge: '', vesselCarrier: 'ONE' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'MAEU266688338', arrivalDate: new Date('2026-03-30'), supplier: 'Cargill Meat Solutions', supplierConfirmed: true, productShort: 'Beef Meat & Bone Meal', grossWeightKgs: 208426, containerCount: 10, portOfDischarge: 'Panjang, Lampung', vesselCarrier: 'Maersk' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'MEDUVC959073', arrivalDate: new Date('2026-03-27'), supplier: '', supplierConfirmed: false, productShort: 'Beef Meat & Bone Meal', grossWeightKgs: 20838, containerCount: 1, portOfDischarge: 'Tanjung Perak, Surabaya', vesselCarrier: 'MSC' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'MEDUVC958471', arrivalDate: new Date('2026-03-27'), supplier: '', supplierConfirmed: false, productShort: 'Beef Meat & Bone Meal', grossWeightKgs: 207546, containerCount: 10, portOfDischarge: 'Tanjung Perak, Surabaya', vesselCarrier: 'MSC' },
          { tradeIntelligenceId: tradeIntel.id, bolNumber: 'MEDUVC958117', arrivalDate: new Date('2026-03-27'), supplier: '', supplierConfirmed: false, productShort: 'Beef Meat & Bone Meal', grossWeightKgs: 204933, containerCount: 10, portOfDischarge: 'Tanjung Perak, Surabaya', vesselCarrier: 'MSC' },
        ],
      });

      await prisma.xaiScoring.create({
        data: {
          opportunityId: created.id,
          overallScore: 91,
          scoreLabel: 'Approach Now',
          dimensions: [
            { dimension: 'Anchor Certainty', score: 98, confidenceFlag: 'verified', evidence: ['IDX-listed public company (JPFA) — audited financials publicly available', 'Revenue IDR 40+ Triliun FY2023 per IDX filing', 'Investment-grade credit profile — covered by DBS Vickers, Mandiri Sekuritas', 'No payment default history on record'], rmChallenge: { challenge: 'Bagaimana kita tahu Japfa pasti bayar supplier-nya?', response: 'Japfa adalah perusahaan tbk dengan laporan keuangan publik. DPO mereka terukur dan reputasi supply chain harus dijaga karena bergantung pada ribuan plasma farmer.' } },
            { dimension: 'Trade Relationship Verified', score: 95, confidenceFlag: 'verified', evidence: ['BoL ONEYRICGE7908600 — Apr 16 2026 — Swift to Japfa confirmed', 'BoL ONEYRICG95110700 — Apr 16 2026 — Swift to Japfa confirmed', '733 containers shipped Swift → Japfa since 2006 — 20-year relationship', '15,839,446 KGs total gross weight all-time from Swift alone', 'Cargill confirmed 2026: BoL MAEU266688338 and MAEU267543572'], rmChallenge: { challenge: 'Data ini dari mana? Bisa dipercaya?', response: 'US Customs manifest — dokumen pemerintah Amerika yang wajib diisi tiap shipment. Sama yang digunakan Bloomberg dan bank-bank global untuk trade intelligence.' } },
            { dimension: 'Banking Product Fit', score: 92, confidenceFlag: 'verified', evidence: ['Import LC need confirmed — USD-denominated MBM from US/Canada suppliers', 'FX exposure confirmed — Japfa pays in IDR, suppliers invoice in USD', 'Shipment frequency ~weekly = recurring LC issuance opportunity', 'Dual supplier (Swift + Cargill) = two separate LC relationships', '3 ports of discharge (Surabaya, Lampung, Makassar) = multi-branch opportunity'], rmChallenge: { challenge: 'Japfa pasti sudah punya bank untuk LC ini. Kenapa harus pindah ke kita?', response: 'Kita tidak minta mereka pindah semua. Kita masuk dari angle supply chain finance untuk supplier mereka — reverse factoring.' } },
            { dimension: 'FX Hedging Opportunity', score: 85, confidenceFlag: 'inferred', evidence: ['Swift + Cargill combined: ~USD 5–6M annual FX conversion estimated', 'DBS analyst flagged weakening IDR as Japfa margin downside risk', 'Feed cost ~70% of COGS — significant USD-denominated portion', 'Import frequency ~weekly = natural hedge schedule anchor'], rmChallenge: { challenge: 'Apakah Japfa sudah hedge FX mereka?', response: 'Kemungkinan besar belum optimal — perusahaan agri Indonesia umumnya under-hedged.' } },
            { dimension: 'Annual LC Value Estimate', score: 72, confidenceFlag: 'estimated', evidence: ['~5,750 MT annualized × $600/MT MBM price = ~USD 3.45M (Swift only)', 'MBM price source: USDA feed ingredient report Apr 2026 ($580–620/MT range)', 'Weight from BoL: verified. Price: market approximation — labeled as estimated.', 'Upside: International Feed Com (#1 supplier all-time) may add 3–4× more volume'], rmChallenge: { challenge: 'Angka USD-nya dari mana? Bisa salah?', response: 'Berat shipment verified dari BoL. Harga adalah estimasi dari USDA market report — ini kami label estimated, bukan verified.' } },
          ],
        },
      });

      await prisma.dataLineage.createMany({
        data: [
          { opportunityId: created.id, title: 'US Customs Manifest — Multiple Public Sources', description: 'All BoL records, supplier names, container counts, gross weights, and ports of discharge. Sourced from US government customs filings.', reliability: 'highest' },
          { opportunityId: created.id, title: 'IDX — JPFA Filings', description: 'Revenue IDR 40T+, ticker, business description, HQ address. Regulatory filing — highest reliability.', reliability: 'highest' },
          { opportunityId: created.id, title: 'USDA Agricultural Marketing Service', description: 'MBM price estimate $580–620/MT. Used to calculate annualized trade value. Labeled as estimated in all scoring.', reliability: 'high' },
          { opportunityId: created.id, title: 'JBS USA Corporate Disclosure', description: "Swift & Company acquisition 2007, Greeley Colorado address, JBS as world's largest beef processor.", reliability: 'high' },
        ],
      });
    }
  }
  console.log('Created opportunities with detail & trade intelligence');

  // ============================================
  // INSIGHTS RELATED
  // ============================================
  await prisma.insightsRelated.create({
    data: {
      accountId: account.id,
      defaultInsights: {
        industryInsights: [
          'The industry is in a "Harvest Season" phase. Market tailwinds are driven by the cyclical demand of Ramadan/Idul Fitri and the nationwide implementation of the Free Nutritious Meal (MBG) program, which provides a high demand floor for the sector.',
          "The government's Free Nutritious Meal program is expected to absorb approximately 328,000 tonnes of broiler meat in 2026 (a significant leap from 121,000 tonnes in 2025).",
          'Global Soybean Meal (SBM) prices are forecasted to rise by 4–7% in Q1 due to geopolitical trade shifts. Furthermore, the Indonesian government is centralizing SBM import rights through State-Owned Enterprises (BUMN) starting in 2026 to ensure supply stability.',
          'In 2026, the use of Digital Twins—virtual replicas of a flock\'s biological growth—is becoming the industry standard for large-scale integrators.',
        ],
        clientInsights: [
          'JAPFA operates as a premier vertically integrated poultry giant in Southeast Asia. Their supply chain excellence is rooted in a "farm-to-fork" model, controlling everything from upstream (Feed & Breeding) to downstream (Consumer Branded Products).',
          "Companies with robust cold storage and last-mile distribution networks will dominate. JAPFA's ability to move volume into rural regions gives them a logistical edge over localized competitors.",
          'Investment on Feed Conversion Ratio (FCR) optimization. Implementing AI-driven precision feeding at the farm level is no longer optional; a 1% improvement in FCR will be the primary driver of net profit margins this year due to SBM volatility.',
          'AI predicts a surge in IoT adoption among "Plasma" (contracted) farmers. JAPFA is transitioning from being a mere supplier of chicks and feed to a provider of "Biological Intelligence" (using sensors for real-time sound/temperature analysis to detect disease before it spreads).',
          'JAPFA is often considered a "High-Beta" play. Its margins are more sensitive to fluctuations in broiler prices. However, recent 2026 data shows JAPFA has become surprisingly resilient in the Commercial Farm (Broiler) segment, managing to maintain positive operating margins even when market prices dip, whereas peers like CPIN and Malindo (MAIN) have occasionally seen this segment slip into operational losses during price troughs.',
        ],
      },
      productPortion: [
        { name: 'Working Capital Financing', value: 2, color: '#3b82f6' },
        { name: 'Cash Management', value: 3, color: '#f97316' },
        { name: 'Trade Finance', value: 3, color: '#14b8a6' },
        { name: 'Business Account', value: 1, color: '#f59e0b' },
        { name: 'Treasury & Forex', value: 1, color: '#93c5fd' },
      ],
      walletShare: [
        { name: 'BCA', value: 5, color: '#bfdbfe' },
        { name: 'BRI', value: 38, color: '#1d4ed8' },
        { name: 'PT Bank Danamon Indonesia Tbk', value: 8, color: '#f97316' },
        { name: 'PT Bank Mandiri (Persero) Tbk', value: 12, color: '#16a34a' },
        { name: 'PT Bank Negara Indonesia (Persero) Tbk', value: 10, color: '#dc2626' },
        { name: 'PT Bank Pan Indonesia Tbk', value: 6, color: '#9333ea' },
        { name: 'PT Bank Syariah Indonesia Tbk', value: 7, color: '#0891b2' },
        { name: 'PT Bank CIMB Niaga Tbk', value: 5, color: '#f59e0b' },
        { name: 'PT Bank MayBank Indonesia Tbk', value: 6, color: '#ec4899' },
        { name: 'Others', value: 3, color: '#d1d5db' },
      ],
      opportunityCount: 7,
      totalOpportunityAmount: '$9.5 M',
    },
  });
  console.log('Created insights related');

  // ============================================
  // RELATED CONTACTS
  // ============================================
  const contacts = [
    { name: 'H. Syamsir Siregar', title: 'Chairman of Commissioner', email: '', phone: '', photo: '/images/contacts/syamsir-siregar.jpg' },
    { name: 'Bambang Budi Hendarto', title: 'Vice Chairman / Ind. Commissioner', email: '', phone: '', photo: '/images/contacts/bambang-budi-hendarto.jpg' },
    { name: 'Hendrick Kolonas', title: 'Commissioner', email: '', phone: '', photo: '/images/contacts/hendrick-kolonas.jpg' },
    { name: 'Ito Sumardi Djuni Sanyoto', title: 'Independent Commissioner', email: '', phone: '', photo: '/images/contacts/ito-sumardi.jpg' },
    { name: 'Antonius Harwanto SS', title: 'Commissioner', email: '', phone: '', photo: '/images/contacts/antonius-harwanto.jpg' },
    { name: 'Renaldo Santosa', title: 'Chief Executive Officer', email: '', phone: '', photo: '/images/contacts/renaldo-santosa.jpg' },
    { name: 'Tan Yong Nang', title: 'Deputy CEO', email: '', phone: '', photo: '/images/contacts/tan-yong-nang.jpg' },
    { name: 'Leo Handoko Laksono', title: 'Director', email: '', phone: '', photo: '/images/contacts/leo-handoko-laksono.jpg' },
    { name: 'Rachmat Indrajaya', title: 'Director', email: '', phone: '', photo: '/images/contacts/rachmat-indrajaya.jpg' },
    { name: 'Gabriella Santosa', title: 'Director', email: '', phone: '', photo: '/images/contacts/gabriella-santosa.jpg' },
  ];

  for (const contact of contacts) {
    await prisma.relatedContact.create({
      data: { accountId: account.id, ...contact },
    });
  }
  console.log('Created related contacts');

  // ============================================
  // LOAN BANK GROUPS & FACILITIES
  // ============================================
  const loanBankGroups = [
    {
      bank: 'PT Bank Central Asia Tbk',
      shortName: 'BCA',
      facilities: [
        { facilityType: 'Time Loan Revolving Uncommitted (TLR)', maxLimitRpM: 950_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-04-20', expiryYear: 2026 },
        { facilityType: 'Kredit Modal Kerja / Working Capital Loan (KMK)', maxLimitRpM: 150_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-04-20', expiryYear: 2026 },
        { facilityType: 'Time Loan Committed', maxLimitRpM: 1_500_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-04-20', expiryYear: 2026 },
        { facilityType: 'Uncommitted Time Loan', maxLimitRpM: 100_000, borrowerTag: 'PT Indojaya Agrinusa / IAG (Subsidiary)', borrowerType: 'Subsidiary', expiryDate: '2026-04-20', expiryYear: 2026 },
        { facilityType: 'Time Loan Revolving (TLR)', maxLimitRpM: 300_000, borrowerTag: 'PT Japfa Food Indonesia / JFI (Subsidiary)', borrowerType: 'Subsidiary', expiryDate: '2026-04-20', expiryYear: 2026 },
      ],
    },
    {
      bank: 'PT Bank UOB Indonesia',
      shortName: 'UOB',
      facilities: [
        { facilityType: 'Revolving Credit Facility (RCF) + sublimits (LC / SKBDN / Trust Receipt / Import Invoice Financing)', maxLimitRpM: 250_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-04-27', expiryYear: 2026 },
      ],
    },
    {
      bank: 'JPMorgan Chase Bank, N.A.',
      shortName: 'JPMorgan',
      facilities: [
        { facilityType: 'Overdraft (OD) Facility', maxLimitRpM: 300_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-05-06', expiryYear: 2026 },
      ],
    },
    {
      bank: 'PT Bank Mandiri (Persero) Tbk',
      shortName: 'Mandiri',
      facilities: [
        { facilityType: 'Kredit Modal Kerja (KMK) + Non Cash Loan sublimit Trust Receipt (TR)', maxLimitRpM: 1_000_000, maxLimitNote: 'KMK Rp1,000,000 + NCL sublimit TR US$40,000,000', borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-09-20', expiryYear: 2026 },
        { facilityType: 'Term Loan Revolving Committed', maxLimitRpM: 1_000_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-09-26', expiryYear: 2026 },
        { facilityType: 'Kredit Modal Kerja (KMK)', maxLimitRpM: 330_000, borrowerTag: 'PT Indojaya Agrinusa / IAG (Subsidiary)', borrowerType: 'Subsidiary', expiryDate: '2026-09-20', expiryYear: 2026 },
      ],
    },
    {
      bank: 'PT Bank Maybank Indonesia Tbk',
      shortName: 'Maybank',
      facilities: [
        { facilityType: 'Revolving Promissory Loan (RPL) + sublimits (LC / SKBDN / TR / Invoice Financing / Guarantee)', maxLimitRpM: 600_000, maxLimitNote: 'US$40,000,000 or Rp600,000; also available to PT Ciomas Adisatwa, PT Santosa Agrinusa, PT Santosa Agrinusa Laut, PT Vaksindo Satwa Nusantara (Subsidiaries)', borrowerTag: 'PT JAPFA (Parent) + CA / SA / SAL / VSN (Subsidiaries)', borrowerType: 'Parent', expiryDate: '2026-10-24', expiryYear: 2026 },
      ],
    },
    {
      bank: 'PT Bank Rakyat Indonesia (Persero) Tbk',
      shortName: 'BRI',
      facilities: [
        { facilityType: 'KMK + Kredit Jangka Pendek Uncommitted (KJP)', maxLimitRpM: 1_000_000, maxLimitNote: 'KMK Rp400,000 + KJP Uncommitted Rp600,000', borrowerTag: 'PT Indojaya Agrinusa / IAG (Subsidiary)', borrowerType: 'Subsidiary', expiryDate: '2026-10-25', expiryYear: 2026 },
        { facilityType: 'Kredit Jangka Pendek Uncommitted (KJP)', maxLimitRpM: 1_000_000, maxLimitNote: 'MFJ can use up to Rp20,000 of this facility', borrowerTag: 'PT JAPFA (Parent) + PT Multi Farmindo Jaya / MFJ (Subsidiary)', borrowerType: 'Parent', expiryDate: '2026-10-25', expiryYear: 2026 },
        { facilityType: 'Kredit Modal Kerja (KMK) — obtained January 22, 2026', maxLimitRpM: 50_000, borrowerTag: 'PT Multi Farmindo Jaya / MFJ (Subsidiary)', borrowerType: 'Subsidiary', expiryDate: '2026-10-25', expiryYear: 2026 },
      ],
    },
    {
      bank: 'PT Bank DBS Indonesia',
      shortName: 'DBS',
      facilities: [
        { facilityType: 'Omnibus Facility (Uncommitted)', maxLimitRpM: 600_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2026-12-14', expiryYear: 2026 },
      ],
    },
    {
      bank: 'Bank of China (Hong Kong) Limited — Jakarta Branch',
      shortName: 'BOC',
      facilities: [
        { facilityType: 'Revolving Credit Facility', maxLimitRpM: 700_000, borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2027-04-04', expiryYear: 2027 },
      ],
    },
    {
      bank: 'PT Bank Negara Indonesia (Persero) Tbk',
      shortName: 'BNI',
      facilities: [
        { facilityType: 'KMK Committed + KMK Uncommitted', maxLimitRpM: 2_150_000, maxLimitNote: 'KMK-Committed Rp1,900,000 + KMK-Uncommitted Rp250,000', borrowerTag: 'PT JAPFA (Parent)', borrowerType: 'Parent', expiryDate: '2027-06-16', expiryYear: 2027 },
      ],
    },
  ];

  for (const group of loanBankGroups) {
    const bankGroup = await prisma.loanBankGroup.create({
      data: { bank: group.bank, shortName: group.shortName },
    });
    for (const facility of group.facilities) {
      await prisma.loanFacility.create({
        data: { bankGroupId: bankGroup.id, ...facility },
      });
    }
  }
  console.log('Created loan bank groups and facilities');

  // ============================================
  // KPI METRICS
  // ============================================
  await prisma.kPIMetrics.create({
    data: {
      revenueRealization: 85,
      revenuePlan: 50,
      accountRealization: 20,
      accountPlan: 15,
      currentQuarter: 85,
      currentQuarterLabel: 'Q1 2026',
      previousQuarter: 90,
      previousQuarterLabel: 'Q4 2025',
      generatedLeads: 30,
      topIndustries: ['Energy', 'Agriculture', 'Fashion & Apparel', 'Finance Service', 'Automotive'],
    },
  });
  console.log('Created KPI metrics');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });