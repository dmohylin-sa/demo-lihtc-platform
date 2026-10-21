// Harlow Commons deal package (fictional). Key documents carry rendered pages with passage anchors, so every
// citation in the demo opens a real page and highlights the passage it rests on.
import type { Doc, SheetData } from './types';

export const FOLDERS = [
  '01 Development Strategy',
  '02 Due Diligence',
  '03 Financing',
  '04 Design & Entitlements',
  '05 Construction',
  '06 Compliance & Regulatory',
];

const formA1: SheetData = {
  sheets: [
    {
      name: 'Sources',
      rows: [
        ['HCR Form A-1 · Sources of funds', '', '', '', ''],
        ['Harlow Commons · 84 units · 9% LIHTC (competitive)', '', '', '', ''],
        ['', '', '', '', ''],
        ['Source', 'Type', 'Amount', 'Rate / term', 'Price'],
        ['', '', '', '', ''],
        ['Permanent loan (Hudson Mutual Bank)', 'Senior debt', 7600000, '6.40% / 35 yr', ''],
        ['', '', '', '', ''],
        ['Annual 9% credit request', 'Credit', 2750000, '10 yr credit period', 0.93],
        ['LIHTC equity (net)', 'Equity', 25549425, '', ''],
        ['HCR Housing Trust Fund', 'Subordinate', 9000000, '0% / 30 yr', ''],
        ['City capital (Reso A)', 'Grant', 3200000, '', ''],
        ['NYSERDA clean energy', 'Grant', 600000, '', ''],
        ['Deferred developer fee', 'Sponsor', 1900000, '', ''],
        ['GP equity', 'Sponsor', 100000, '', ''],
        ['', '', '', '', ''],
        ['Total sources', '', 47949425, '', ''],
      ],
    },
    {
      name: 'Uses',
      rows: [
        ['HCR Form A-1 · Uses of funds', '', '', ''],
        ['Harlow Commons · 84 units', '', '', ''],
        ['', '', '', ''],
        ['Line', 'Basis', 'Amount', 'Per unit'],
        ['', '', '', ''],
        ['Acquisition - land', 'Excluded', 4000000, 47619],
        ['', '', '', ''],
        ['GC construction contract', 'Eligible', 30400000, 361905],
        ['Hard costs incl. contingency', 'Eligible', 31900000, 379762],
        ['', '', '', ''],
        ['Architecture & engineering', 'Eligible', 2150000, 25595],
        ['Legal, title, insurance', 'Partial', 1300000, 15476],
        ['Other soft costs', 'Partial', 1900000, 22619],
        ['Soft costs total', '', 5350000, 63690],
        ['', '', '', ''],
        ['Construction interest', 'Partial', 980000, 11667],
        ['Lender and agency fees', 'Partial', 270000, 3214],
        ['Financing costs total', '', 1250000, 14881],
        ['', '', '', ''],
        ['', '', '', ''],
        ['Developer fee', 'Eligible', 4900000, 58333],
        ['', '', '', ''],
        ['', '', '', ''],
        ['Operating reserve', 'Excluded', 800000, 9524],
        ['', '', '', ''],
        ['Total development cost', '', 48200000, 573810],
      ],
    },
    {
      name: 'Unit Mix',
      rows: [
        ['HCR Form A-1 · Unit mix and AMI bands', '', '', ''],
        ['', '', '', ''],
        ['AMI band', 'Units', 'Avg. bedrooms', 'Net rent / mo'],
        ['30% AMI', 9, 1.6, 780],
        ['50% AMI', 21, 1.7, 1320],
        ['60% AMI', 30, 1.8, 1600],
        ['70% AMI', 12, 1.8, 1880],
        ['80% AMI', 11, 1.9, 2160],
        ['Superintendent', 1, 2, 0],
        ['Total / average', 84, 1.77, '58.3% avg AMI'],
      ],
    },
  ],
};

const proForma = (v: 'v2' | 'v3'): SheetData => ({
  sheets: [
    {
      name: 'Operating Budget',
      rows: [
        [`Sponsor pro forma ${v} · Operating budget (year 1)`, '', '', ''],
        ['', '', '', ''],
        ['Line', 'Basis', 'Per unit', 'Amount'],
        ['', '', '', ''],
        ['Gross potential rent', 'Rent schedule', '', 1548720],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['Other income', 'Laundry, fees', '', 30000],
        ['', '', '', ''],
        ['Vacancy and collection loss', '% of GPR', '', '5%'],
        ['', '', '', ''],
        ['Payroll', '', v === 'v2' ? 2140 : 2140, ''],
        ['Utilities', '', 1610, ''],
        ['Repairs and maintenance', '', 1290, ''],
        ['Insurance', '', 1150, ''],
        ['Management fee', '', 870, ''],
        ['Real estate taxes', v === 'v2' ? 'Full assessment' : '485-x exemption (D1-08)', v === 'v2' ? 1675 : 1350, ''],
        ['Administrative and other', '', 1150, ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['Operating expenses per unit', '', v === 'v2' ? 9885 : 9560, ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['Replacement reserve per unit', 'X0780: $400/unit/yr', 400, ''],
      ],
    },
    {
      name: 'Rent Schedule',
      rows: [
        [`Sponsor pro forma ${v} · Rent schedule`, '', '', '', '', ''],
        ...Array.from({ length: 10 }, () => ['', '', '', '', '', '']),
        ['AMI band', 'Units', 'Gross rent', 'Utility allow.', 'Monthly', 'Net rent'],
        ['30% AMI', 9, 862, 82, 7020, 780],
        ['50% AMI', 21, 1402, 82, 27720, 1320],
        ['60% AMI', 30, 1682, 82, 48000, 1600],
        ['70% AMI', 12, 1962, 82, 22560, 1880],
        ['80% AMI', 11, 2242, 82, 23760, 2160],
        ['Superintendent', 1, 0, 0, 0, 0],
      ],
    },
    {
      name: 'Assumptions',
      rows: [
        [`Sponsor pro forma ${v} · Assumptions`, '', ''],
        ...Array.from({ length: 29 }, (_, k) => (k === 3 ? ['Trending - income', '2.0% / yr', ''] : k === 4 ? ['Trending - expenses', '3.0% / yr', ''] : ['', '', ''])),
        ['Regulatory agreement term', 'Years', v === 'v2' ? 30 : 50],
      ],
    },
  ],
});

export const KEY_DOCS: Doc[] = [
  {
    id: 'd-psa', dealId: 'harlow', name: 'Purchase and Sale Agreement - executed.pdf', folder: '01 Development Strategy',
    docType: 'Site-control agreement (PSA)', format: 'pdf', pages: 38, scannedPct: 0, sizeMb: 4.2, version: 1, confidence: 0.99,
    uploadedAt: '2026-10-14', executed: true, key: true, header: 'Purchase and Sale Agreement · Harlow Avenue Realty LLC to Harlow Commons Housing LLC',
    content: [
      { n: 1, blocks: [
        { type: 'h', text: 'Purchase and Sale Agreement' },
        { type: 'p', text: 'THIS PURCHASE AND SALE AGREEMENT (this "Agreement") is made as of July 28, 2026 (the "Effective Date") by and between HARLOW AVENUE REALTY LLC, a New York limited liability company ("Seller"), and HARLOW COMMONS HOUSING LLC, a New York limited liability company ("Purchaser").', passageId: 'psa-parties' },
        { type: 'p', text: 'Seller is the owner of the land known as Block 2871, Lot 14 on the Tax Map of the Borough of the Bronx, together with all improvements thereon (the "Property").' },
      ] },
      { n: 4, blocks: [
        { type: 'h', text: 'Article 2 - Purchase Price' },
        { type: 'p', text: '2.1 Purchase Price. The purchase price for the Property shall be FOUR MILLION AND 00/100 DOLLARS ($4,000,000.00) (the "Purchase Price"), payable at Closing by wire transfer of immediately available funds.', passageId: 'psa-price' },
        { type: 'p', text: '2.2 Deposit. Within three (3) Business Days after the Effective Date, Purchaser shall deliver to Escrow Agent the sum of TWO HUNDRED THOUSAND AND 00/100 DOLLARS ($200,000.00) (the "Deposit").', passageId: 'psa-deposit' },
      ] },
      { n: 7, blocks: [
        { type: 'h', text: 'Article 5 - Due Diligence' },
        { type: 'p', text: '5.1 Due Diligence Period. Purchaser shall have a period of sixty (60) days following the Effective Date (the "Due Diligence Period") to conduct such inspections, surveys and environmental assessments of the Property as Purchaser deems necessary.', passageId: 'psa-dd' },
        { type: 'p', text: '5.4 If Purchaser does not deliver a Termination Notice prior to the expiration of the Due Diligence Period, the Deposit shall become non-refundable except as otherwise provided herein.' },
      ] },
      { n: 12, blocks: [
        { type: 'h', text: 'Article 9 - Closing' },
        { type: 'p', text: '9.1 Closing Date. The closing of the transaction contemplated hereby (the "Closing") shall occur on or before December 15, 2026 (the "Outside Closing Date"), time being of the essence.', passageId: 'psa-closing' },
        { type: 'p', text: '9.3 Assignment. Purchaser may assign this Agreement to a single-purpose entity controlled by Purchaser or its principals without Seller\'s consent.', passageId: 'psa-assign' },
      ] },
    ],
  },
  {
    id: 'd-title', dealId: 'harlow', name: 'Title Commitment - First American NY-26-48817.pdf', folder: '02 Due Diligence',
    docType: 'Title commitment', format: 'pdf', pages: 22, scannedPct: 0, sizeMb: 2.1, version: 1, confidence: 0.98,
    uploadedAt: '2026-10-14', key: true, header: 'Commitment for Title Insurance · File NY-26-48817',
    content: [
      { n: 2, blocks: [
        { type: 'h', text: 'Schedule A' },
        { type: 'kv', rows: [['Commitment date', 'September 30, 2026'], ['Proposed insured (owner)', 'Harlow Commons Housing LLC'], ['Proposed policy amount', '$4,000,000.00']] },
        { type: 'p', text: '3. The estate or interest in the Land is Fee Simple and title is vested in: HARLOW AVENUE REALTY LLC, by deed recorded as CRFN 2009000214577.', passageId: 'title-vesting' },
        { type: 'p', text: '4. The Land is described as Block 2871, Lot 14, Borough of the Bronx, City and State of New York, as more particularly set forth in Schedule C.', passageId: 'title-legal' },
      ] },
      { n: 4, blocks: [
        { type: 'h', text: 'Schedule B, Part I - Requirements' },
        { type: 'p', text: '5. Deed from the vested owner to the proposed insured, with transfer tax returns (RPT and TP-584).' },
        { type: 'p', text: '6. Good standing certificates and authorizing resolutions of the proposed insured.' },
        { type: 'p', text: '7. Satisfaction of mortgage made by Harlow Avenue Realty LLC to Bronx Community Savings in the amount of $650,000.00, recorded as CRFN 1998000123456. NOTE: no satisfaction of record.', passageId: 'title-bi7' },
      ] },
      { n: 6, blocks: [
        { type: 'h', text: 'Schedule B, Part II - Exceptions' },
        { type: 'p', text: '1. Survey exceptions: any state of facts an accurate survey would disclose.' },
        { type: 'p', text: '2. Declaration of Restrictions recorded in Reel 1187 Page 402 (1987), regarding curb cuts and street trees.', passageId: 'title-bii' },
      ] },
    ],
  },
  {
    id: 'd-survey', dealId: 'harlow', name: 'ALTA-NSPS Land Title Survey - Harlow Avenue.pdf', folder: '02 Due Diligence',
    docType: 'ALTA / NSPS survey', format: 'pdf', pages: 4, scannedPct: 0, sizeMb: 8.7, version: 1, confidence: 0.97,
    uploadedAt: '2026-10-14', key: true, header: 'ALTA / NSPS Land Title Survey · Block 2871 Lot 14',
    content: [
      { n: 1, blocks: [
        { type: 'h', text: 'ALTA / NSPS Land Title Survey (2021 standards)' },
        { type: 'p', text: 'Lot area: 21,450 square feet (0.492 acres). Frontage on Harlow Avenue: 150.00 feet.', passageId: 'survey-area' },
        { type: 'p', text: 'Table A Item 3: The subject property lies within Zone X (area of minimal flood hazard) per FEMA FIRM panel 3604970088G.', passageId: 'survey-flood' },
        { type: 'p', text: 'Surveyor certification is made to Harlow Commons Housing LLC, First American Title Insurance Company and Hudson Mutual Bank.', passageId: 'survey-cert' },
      ] },
    ],
  },
  {
    id: 'd-esa', dealId: 'harlow', name: 'Phase I ESA - Harlow Avenue (scanned).pdf', folder: '02 Due Diligence',
    docType: 'Phase I ESA', format: 'pdf', pages: 46, scannedPct: 100, sizeMb: 31.5, version: 1, confidence: 0.94,
    uploadedAt: '2026-10-14', key: true, scan: true, header: 'Phase I Environmental Site Assessment · Harlow Avenue, Bronx',
    content: [
      { n: 1, blocks: [
        { type: 'h', text: 'Phase I Environmental Site Assessment' },
        { type: 'p', text: 'Prepared for: Harlow Commons Housing LLC. Prepared in accordance with ASTM E1527-21 and 40 CFR Part 312.', passageId: 'esa-astm' },
        { type: 'p', text: 'Report date: April 14, 2026. Site reconnaissance: March 30, 2026.', passageId: 'esa-date' },
      ] },
      { n: 14, blocks: [
        { type: 'h', text: '8.2 Findings - Recognized Environmental Conditions' },
        { type: 'p', text: 'The adjoining parcel to the north (Block 2871, Lot 9) operated as a gasoline filling station from approximately 1962 to 1994. Two 4,000-gallon underground storage tanks were registered; closure documentation was not located. Given the up-gradient position, this is considered a REC for the subject property.', passageId: 'esa-rec' },
      ] },
      { n: 15, blocks: [
        { type: 'h', text: '9.0 Opinion and Recommendations' },
        { type: 'p', text: 'It is our opinion that a limited Phase II subsurface investigation (soil vapor and groundwater sampling along the northern lot line) is warranted prior to acquisition.', passageId: 'esa-recommend' },
      ] },
    ],
  },
  {
    id: 'd-appraisal', dealId: 'harlow', name: 'Appraisal - MAI - as-is and as-stabilized.pdf', folder: '02 Due Diligence',
    docType: 'Appraisal (MAI)', format: 'pdf', pages: 112, scannedPct: 0, sizeMb: 14.8, version: 1, confidence: 0.97,
    uploadedAt: '2026-10-14', key: true, header: 'Appraisal Report · Harlow Commons · File 26-3381',
    content: [
      { n: 3, blocks: [
        { type: 'h', text: 'Summary of Value Conclusions' },
        { type: 'table', rows: [['Premise', 'Effective date', 'Value'], ['As-is market value (land)', 'August 20, 2026', '$4,150,000'], ['As-stabilized (restricted)', 'June 1, 2029', '$9,300,000']] },
        { type: 'p', text: 'The as-is market value of the fee simple interest in the land, as of August 20, 2026, is FOUR MILLION ONE HUNDRED FIFTY THOUSAND DOLLARS ($4,150,000).', passageId: 'appr-asis' },
      ] },
      { n: 64, blocks: [
        { type: 'h', text: 'Absorption Analysis' },
        { type: 'p', text: 'Based on comparable lottery lease-ups in the South Bronx, we project absorption of approximately seven (7) units per month, implying stabilization 12 months after the temporary certificate of occupancy.', passageId: 'appr-absorb' },
      ] },
    ],
  },
  {
    id: 'd-market', dealId: 'harlow', name: 'Market Study - Harlow Commons.pdf', folder: '02 Due Diligence',
    docType: 'Market study', format: 'pdf', pages: 88, scannedPct: 0, sizeMb: 9.6, version: 1, confidence: 0.96,
    uploadedAt: '2026-10-14', key: true, header: 'Market Study · Harlow Commons · prepared for NYS HCR submission',
    content: [
      { n: 36, blocks: [
        { type: 'h', text: '6.3 Public Housing Waiting Lists' },
        { type: 'p', text: 'The NYCHA Section 8 and public housing waiting lists for the Bronx were reviewed (approximately 41,900 households as of June 2026). Demand from waiting-list households alone exceeds the subject\'s 83 restricted units by a wide margin.', passageId: 'mkt-waitlist' },
      ] },
      { n: 41, blocks: [
        { type: 'h', text: '7.1 Capture Rate and Absorption' },
        { type: 'p', text: 'The overall capture rate is 2.1% of income-qualified renter households in the primary market area. We project absorption of ten (10) units per month, reaching 95% occupancy within nine months.', passageId: 'mkt-absorb' },
      ] },
    ],
  },
  {
    id: 'd-zoning', dealId: 'harlow', name: 'Zoning Report (PZR) - Harlow Avenue.pdf', folder: '04 Design & Entitlements',
    docType: 'Zoning report', format: 'pdf', pages: 18, scannedPct: 0, sizeMb: 3.3, version: 1, confidence: 0.98,
    uploadedAt: '2026-10-14', key: true, header: 'Zoning Report · Block 2871 Lot 14',
    content: [
      { n: 2, blocks: [
        { type: 'h', text: 'Zoning Analysis' },
        { type: 'p', text: 'The zoning lot lies within an R7A district with a Mandatory Inclusionary Housing (MIH) designated area overlay.', passageId: 'zon-district' },
        { type: 'p', text: 'Permitted residential FAR with MIH: 4.60. Maximum residential floor area: 98,670 sq ft.', passageId: 'zon-far' },
        { type: 'p', text: 'Based on the dwelling unit factor of 680, the zoning lot permits a maximum of 145 dwelling units; the proposed 84-unit program complies as of right.', passageId: 'zon-units' },
      ] },
    ],
  },
  {
    id: 'd-lender-ts', dealId: 'harlow', name: 'Lender Term Sheet - Hudson Mutual - executed.pdf', folder: '03 Financing',
    docType: 'Lender term sheet', format: 'pdf', pages: 9, scannedPct: 0, sizeMb: 0.9, version: 1, confidence: 0.99,
    uploadedAt: '2026-10-14', executed: true, key: true, header: 'Hudson Mutual Bank · Summary of Terms · Harlow Commons',
    content: [
      { n: 2, blocks: [
        { type: 'h', text: '3. Loan Terms' },
        { type: 'kv', rows: [['Permanent loan amount', '$7,600,000'], ['Interest rate', '6.40% fixed'], ['Amortization', '35 years'], ['Term', '18 years']] },
        { type: 'p', text: '3.1 Loan amount: not to exceed $7,600,000, at a fixed rate of 6.40% per annum with a 35-year amortization.', passageId: 'lts-loan' },
        { type: 'h', text: '4. Underwriting Requirements' },
        { type: 'p', text: '4.2 Minimum debt service coverage ratio of 1.20x on underwritten net operating income, tested at conversion and annually thereafter.', passageId: 'lts-dscr' },
      ] },
      { n: 5, blocks: [
        { type: 'h', text: '9. Conditions Precedent to Closing' },
        { type: 'p', text: '9(c) A Phase I Environmental Site Assessment conforming to ASTM E1527-21, dated not more than six (6) months prior to the Closing Date, with a reliance letter in favor of Lender.', passageId: 'lts-esa' },
      ] },
      { n: 6, blocks: [
        { type: 'h', text: '11. Guaranties' },
        { type: 'p', text: '11.1 Guaranty of lien-free completion and an environmental indemnity from Northbank Housing Partners LLC.', passageId: 'lts-guaranty' },
        { type: 'sig', text: 'Accepted and agreed: Harlow Commons Housing LLC, by Daniel Brooks, Authorized Signatory - October 2, 2026' },
      ] },
    ],
  },
  {
    id: 'd-guaranty', dealId: 'harlow', name: 'Guaranty of Completion - executed.pdf', folder: '03 Financing',
    docType: 'Guaranty', format: 'pdf', pages: 14, scannedPct: 0, sizeMb: 1.2, version: 1, confidence: 0.98,
    uploadedAt: '2026-10-14', executed: true, key: true, header: 'Guaranty of Completion · Northbank Housing Partners LLC',
    content: [
      { n: 1, blocks: [
        { type: 'h', text: 'Guaranty of Completion' },
        { type: 'p', text: 'NORTHBANK HOUSING PARTNERS LLC ("Guarantor") hereby unconditionally guarantees to Hudson Mutual Bank the lien-free completion of the improvements in accordance with the Plans and Specifications.', passageId: 'guar-scope' },
      ] },
      { n: 4, blocks: [
        { type: 'h', text: 'Section 3 - Scope of Guaranty' },
        { type: 'p', text: 'This Guaranty is limited to completion of the Improvements and payment of Project Costs through the Completion Date. Nothing herein shall be construed as a guaranty of operating expenses or debt service after the Completion Date.', passageId: 'guar-limit' },
        { type: 'sig', text: 'Executed October 2, 2026 · Northbank Housing Partners LLC, by Daniel Brooks, Managing Member' },
      ] },
    ],
  },
  {
    id: 'd-cost', dealId: 'harlow', name: 'Construction Cost Estimate (CSI) - GC proposal.pdf', folder: '05 Construction',
    docType: 'Construction cost estimate', format: 'pdf', pages: 26, scannedPct: 0, sizeMb: 2.4, version: 1, confidence: 0.97,
    uploadedAt: '2026-10-14', key: true, header: 'Construction Cost Estimate · CSI format · Harlow Commons',
    content: [
      { n: 3, blocks: [
        { type: 'h', text: 'Contract Summary' },
        { type: 'table', rows: [['Item', 'Amount', '% of contract'], ['Direct trade costs', '$26,121,600', '85.9%'], ["Builder's profit", '$1,824,000', '6.0%'], ["Builder's overhead", '$608,000', '2.0%'], ['General conditions', '$1,945,600', '6.4%'], ['GC contract total', '$30,400,000', '100%']] },
        { type: 'p', text: "Builder's profit 6.0%, builder's overhead 2.0% and general conditions 6.4% of the construction contract; contract sum $30,400,000.", passageId: 'cost-fees' },
      ] },
    ],
  },
  {
    id: 'd-form-a1', dealId: 'harlow', name: 'HCR Application Workbook (Form A-1).xlsx', folder: '06 Compliance & Regulatory',
    docType: 'HCR application workbook (Form A-1)', format: 'xlsx', pages: 40, scannedPct: 0, sizeMb: 1.8, version: 1, confidence: 1,
    uploadedAt: '2026-10-14', key: true, sheet: formA1,
  },
  {
    id: 'd-proforma-v2', dealId: 'harlow', name: 'Sponsor Pro Forma v2.xlsx', folder: '03 Financing',
    docType: 'Sponsor pro forma', format: 'xlsx', pages: 12, scannedPct: 0, sizeMb: 0.6, version: 2, confidence: 1,
    uploadedAt: '2026-10-14', key: true, sheet: proForma('v2'),
  },
];

// Documents that arrive during walkthrough scenarios.
export const SCENARIO_DOCS: Record<string, Doc> = {
  'd-proforma-v3': {
    id: 'd-proforma-v3', dealId: 'harlow', name: 'Sponsor Pro Forma v3.xlsx', folder: '03 Financing',
    docType: 'Sponsor pro forma', format: 'xlsx', pages: 12, scannedPct: 0, sizeMb: 0.6, version: 3, supersedes: 'd-proforma-v2', confidence: 1,
    uploadedAt: '2026-10-21', key: true, sheet: proForma('v3'),
  },
  'd-email': {
    id: 'd-email', dealId: 'harlow', name: 'RE Harlow Commons - Phase I timing.eml', folder: '03 Financing',
    docType: 'Correspondence (lender email)', format: 'eml', pages: 1, scannedPct: 0, sizeMb: 0.1, version: 1, confidence: 0.95,
    uploadedAt: '2026-10-21', key: true, header: 'Email · From: R. Castillo, Hudson Mutual Bank · To: Maya Ortiz · Oct 20, 2026',
    content: [
      { n: 1, blocks: [
        { type: 'h', text: 'RE: Harlow Commons - Phase I timing' },
        { type: 'p', text: 'Maya - spoke with credit this morning. For this one we can accept the April Phase I as long as it is dated within 12 months of closing, so no need to order an update.', passageId: 'email-esa' },
        { type: 'p', text: 'Best, Rafael Castillo, Vice President, Community Lending, Hudson Mutual Bank' },
      ] },
    ],
  },
  'd-odg': {
    id: 'd-odg', dealId: 'harlow', name: 'Operating Deficit Guaranty - draft.docx', folder: '03 Financing',
    docType: 'Guaranty', format: 'docx', pages: 9, scannedPct: 0, sizeMb: 0.2, version: 1, confidence: 0.97,
    uploadedAt: '2026-10-21', key: true, header: 'Operating Deficit Guaranty · DRAFT · not executed',
    content: [
      { n: 2, blocks: [
        { type: 'h', text: 'Section 2 - Operating Deficit Guaranty' },
        { type: 'p', text: 'Guarantor shall fund operating deficits for thirty-six (36) months following conversion, up to an aggregate of $980,000.', passageId: 'odg-amount' },
      ] },
    ],
  },
};

// Linden Court: the executed HAP contract behind X0139 "In-place HAP contract review", the only
// project-document extraction slot in Phase 1. Used by walkthrough scenario 4.
export const HAP_DOC: Doc = {
  id: 'd-hap', dealId: 'linden', name: 'HAP Contract (1998) - executed - scanned.pdf', folder: '02 Due Diligence',
  docType: 'HAP contract', format: 'pdf', pages: 31, scannedPct: 100, sizeMb: 22.4, version: 1, confidence: 0.93,
  uploadedAt: '2026-10-21', executed: true, key: true, scan: true, header: 'Housing Assistance Payments Contract · Section 8 · Linden Court',
  content: [
    { n: 1, blocks: [
      { type: 'h', text: 'Housing Assistance Payments Contract' },
      { type: 'p', text: 'Contract No. NY36-L000-118. Owner: Linden Court Associates L.P. Contract units: 120 of 120.', passageId: 'hap-units' },
      { type: 'p', text: 'Term: twenty (20) years commencing March 1, 1998; renewed under MAHRA for a further term expiring February 28, 2028.', passageId: 'hap-term' },
    ] },
    { n: 9, blocks: [
      { type: 'h', text: 'Part II, Section 2.7 - Contract Rents' },
      { type: 'p', text: 'Initial contract rents are set out in Exhibit A. Contract rents shall be adjusted as provided in this Contract.', passageId: 'hap-rents' },
      { type: 'note', text: 'Exhibit A and the adjustment rider referenced in Section 2.7 are not attached to the executed copy.' },
    ] },
  ],
};

// Bulk of the package: generated metadata rows, so the intake numbers look like a real deal package.
const FILLER_TYPES: { folder: string; type: string; fmt: 'pdf' | 'jpg' | 'xlsx' | 'docx' | 'eml' | 'dwg'; names: string[]; count: number; scanned: number }[] = [
  { folder: '01 Development Strategy', type: 'Correspondence', fmt: 'eml', names: ['Seller correspondence', 'Broker update', 'Board memo'], count: 34, scanned: 0 },
  { folder: '01 Development Strategy', type: 'Site photo', fmt: 'jpg', names: ['Site photo'], count: 96, scanned: 0 },
  { folder: '02 Due Diligence', type: 'Municipal search', fmt: 'pdf', names: ['DOB violations search', 'ECB search', 'HPD registration search', 'Taxes and vault search', 'Landmarks search', 'FDNY search'], count: 18, scanned: 60 },
  { folder: '02 Due Diligence', type: 'ESA appendix', fmt: 'pdf', names: ['ESA appendix - Sanborn map', 'ESA appendix - EDR radius report', 'ESA appendix - site photographs'], count: 22, scanned: 100 },
  { folder: '03 Financing', type: 'Financing correspondence', fmt: 'pdf', names: ['LOI', 'Commitment draft', 'Equity proposal', 'Investor questionnaire'], count: 21, scanned: 10 },
  { folder: '04 Design & Entitlements', type: 'Drawing', fmt: 'dwg', names: ['Schematic design sheet', 'Massing study', 'Site plan'], count: 104, scanned: 0 },
  { folder: '04 Design & Entitlements', type: 'Design narrative', fmt: 'docx', names: ['Design narrative', 'EGC Step 1 checklist', 'Accessibility narrative'], count: 14, scanned: 0 },
  { folder: '05 Construction', type: 'Cost backup', fmt: 'xlsx', names: ['Trade breakdown', 'Allowance schedule', 'Alternates'], count: 28, scanned: 0 },
  { folder: '06 Compliance & Regulatory', type: 'Exhibit', fmt: 'pdf', names: ['Exhibit - sponsor experience', 'Exhibit - org chart', 'Exhibit - CEO notification letter', 'Exhibit - background consent'], count: 63, scanned: 35 },
];

function seeded(n: number) {
  let x = n * 9301 + 49297;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

export function fillerDocs(dealId: string): Doc[] {
  const rnd = seeded(dealId.length * 17 + 3);
  const out: Doc[] = [];
  let k = 0;
  for (const t of FILLER_TYPES) {
    for (let i = 0; i < t.count; i++) {
      const base = t.names[i % t.names.length];
      const pages = t.fmt === 'jpg' ? 1 : t.fmt === 'dwg' ? 1 : Math.max(1, Math.round(rnd() * 24));
      const size = t.fmt === 'jpg' ? 4 + rnd() * 6 : t.fmt === 'dwg' ? 6 + rnd() * 14 : 0.2 + rnd() * 5;
      out.push({
        id: `f-${dealId}-${k++}`,
        dealId,
        name: `${base} ${String(i + 1).padStart(3, '0')}.${t.fmt}`,
        folder: t.folder,
        docType: t.type,
        format: t.fmt,
        pages,
        scannedPct: t.scanned && rnd() * 100 < t.scanned ? 100 : 0,
        sizeMb: +size.toFixed(1),
        version: 1,
        confidence: +(0.86 + rnd() * 0.13).toFixed(2),
        uploadedAt: '2026-10-14',
      });
    }
  }
  return out;
}

// Package numbers used by the intake simulation.
export const PACKAGE = { files: 412, sizeGb: 2.8, pages: 6184, scannedPages: 1132 };
