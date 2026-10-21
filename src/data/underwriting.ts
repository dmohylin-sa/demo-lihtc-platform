// Harlow Commons underwriting input set, read from the HCR application workbook (Form A-1) and the sponsor
// pro forma. v2 is the model in the package; v3 is the revised model used by walkthrough scenario 1.
import type { UwInputs } from './types';

const CELLS: Record<string, string> = {
  rents: 'Pro forma v2 · Rent Schedule!F13:F18',
  otherIncome: 'Pro forma v2 · Operating Budget!D9',
  vacancyPct: 'Pro forma v2 · Operating Budget!D11',
  opexPerUnit: 'Pro forma v2 · Operating Budget!C24',
  replacementReservePerUnit: 'Pro forma v2 · Operating Budget!C27',
  acquisition: 'Form A-1 · Uses!C6',
  hardCosts: 'Form A-1 · Uses!C9',
  softCosts: 'Form A-1 · Uses!C14',
  financingCosts: 'Form A-1 · Uses!C18',
  developerFee: 'Form A-1 · Uses!C21',
  reserves: 'Form A-1 · Uses!C24',
  permLoan: 'Form A-1 · Sources!C6',
  creditRequest: 'Form A-1 · Sources!C8',
  creditPrice: 'Form A-1 · Sources!E8',
  rate: 'Lender term sheet p.2 §3',
  regTermYears: 'Pro forma v2 · Assumptions!C31',
};

export const UW_V2: UwInputs = {
  version: 'v2',
  label: 'Sponsor pro forma v2 (in package)',
  units: 84,
  gprMonthlyByBand: [
    { band: '30% AMI', units: 9, rent: 780 },
    { band: '50% AMI', units: 21, rent: 1320 },
    { band: '60% AMI', units: 30, rent: 1600 },
    { band: '70% AMI', units: 12, rent: 1880 },
    { band: '80% AMI', units: 11, rent: 2160 },
    { band: 'Superintendent', units: 1, rent: 0 },
  ],
  otherIncome: 30_000,
  vacancyPct: 5,
  opexPerUnit: 9_885,
  replacementReservePerUnit: 400,
  acquisition: 4_000_000,
  hardCosts: 31_900_000,
  gcContract: 30_400_000,
  builderProfitPct: 6.0,
  builderOverheadPct: 2.0,
  generalConditionsPct: 6.4,
  softCosts: 5_350_000,
  financingCosts: 1_250_000,
  developerFee: 4_900_000,
  reserves: 800_000,
  permLoan: 7_600_000,
  rate: 6.4,
  amortYears: 35,
  lenderMinDscr: 1.2,
  creditRequest: 2_750_000,
  creditPrice: 0.93,
  applicablePct: 9,
  basisBoost: 1.3,
  applicableFraction: 83 / 84,
  otherSources: [
    { name: 'HCR Housing Trust Fund', amount: 9_000_000, cell: 'Form A-1 · Sources!C10' },
    { name: 'City capital (Reso A)', amount: 3_200_000, cell: 'Form A-1 · Sources!C11' },
    { name: 'NYSERDA clean energy', amount: 600_000, cell: 'Form A-1 · Sources!C12' },
    { name: 'Deferred developer fee', amount: 1_900_000, cell: 'Form A-1 · Sources!C13' },
    { name: 'GP equity', amount: 100_000, cell: 'Form A-1 · Sources!C14' },
  ],
  regTermYears: 30,
  cells: CELLS,
};

// v3: reflects the 485-x exemption selected at D1-08 (lower real-estate taxes) and $150k of added legal cost.
export const UW_V3: UwInputs = {
  ...UW_V2,
  version: 'v3',
  label: 'Sponsor pro forma v3 (revised)',
  opexPerUnit: 9_560,
  softCosts: 5_500_000,
  regTermYears: 50,
  cells: Object.fromEntries(Object.entries(CELLS).map(([k, v]) => [k, v.replace('Pro forma v2', 'Pro forma v3')])),
};

export const UW_INPUTS = { v2: UW_V2, v3: UW_V3 };

// Reference model used for the tolerance report (Everstead's known-answer set).
export const TOLERANCES = [
  { metric: 'Total development cost', tolerance: '± $1', key: 'tdc' },
  { metric: 'Net operating income (year 1)', tolerance: '± $1', key: 'noi' },
  { metric: 'Annual debt service', tolerance: '± $1', key: 'annualDebtService' },
  { metric: 'DSCR', tolerance: '± 0.01', key: 'dscr' },
  { metric: 'Eligible basis', tolerance: '± $1', key: 'eligibleBasis' },
  { metric: 'Gap-method credit (HCR-C-08)', tolerance: '± $1', key: 'gapCredit' },
  { metric: 'Developer fee base cap (HCR-C-02)', tolerance: '± $1', key: 'devFeeBaseCap' },
  { metric: 'Sources minus uses', tolerance: '± $1', key: 'balance' },
] as const;
