// Deterministic underwriting calculations (RFP requirement 02: "deterministic math is code, not a model").
// Pure functions only - the same inputs always give the same outputs, and every screen reads from here.
import type { UwInputs } from '../data/types';

export const CALC_ENGINE_VERSION = 'calc-engine 1.4.2';

export interface Sensitivity {
  rentPct: number; // e.g. -5 = rents 5% lower
  opexPct: number;
  rateDelta: number; // percentage points added to the interest rate
  creditPriceDelta: number; // dollars per credit added to the price
}

export const NO_SENSITIVITY: Sensitivity = { rentPct: 0, opexPct: 0, rateDelta: 0, creditPriceDelta: 0 };

export interface UwResult {
  gpr: number;
  vacancy: number;
  egi: number;
  opex: number;
  reserve: number;
  noi: number;
  annualDebtService: number;
  dscr: number;
  dscrPass: boolean;
  uses: { name: string; amount: number }[];
  tdc: number;
  improvementCost: number;
  devFeeBaseCap: number;
  devFeeCeiling: number;
  devFeePctOfBase: number;
  builderFeesPct: number;
  eligibleBasis: number;
  qualifiedBasis: number;
  eligibleCredit: number;
  pricingFactor: number;
  gapCredit: number;
  capProject: number;
  capPerUnit: number;
  maxCredit: number;
  creditRequest: number;
  equity: number;
  sources: { name: string; amount: number; cell?: string }[];
  totalSources: number;
  balance: number; // sources - uses (negative = short)
  rate: number;
  creditPrice: number;
  cashFlow: { year: number; noi: number; debtService: number; dscr: number }[];
}

// Monthly-payment mortgage constant, annualised.
export function annualDebtService(principal: number, ratePct: number, amortYears: number): number {
  const r = ratePct / 100 / 12;
  const n = amortYears * 12;
  if (r === 0) return (principal / n) * 12;
  const monthly = (principal * r) / (1 - Math.pow(1 + r, -n));
  return monthly * 12;
}

const round = (v: number) => Math.round(v);

export function underwrite(i: UwInputs, s: Sensitivity = NO_SENSITIVITY): UwResult {
  const rentFactor = 1 + s.rentPct / 100;
  const gpr = round(i.gprMonthlyByBand.reduce((a, b) => a + b.units * b.rent, 0) * 12 * rentFactor);
  const vacancy = round(gpr * (i.vacancyPct / 100));
  const egi = gpr + i.otherIncome - vacancy;
  const opex = round(i.opexPerUnit * i.units * (1 + s.opexPct / 100));
  const reserve = i.replacementReservePerUnit * i.units;
  const noi = egi - opex - reserve;
  const rate = +(i.rate + s.rateDelta).toFixed(2);
  const annualDs = round(annualDebtService(i.permLoan, rate, i.amortYears));
  const dscr = +(noi / annualDs).toFixed(2);

  const uses = [
    { name: 'Acquisition (land)', amount: i.acquisition },
    { name: 'Hard costs (incl. contingency)', amount: i.hardCosts },
    { name: 'Soft costs', amount: i.softCosts },
    { name: 'Financing costs', amount: i.financingCosts },
    { name: 'Developer fee', amount: i.developerFee },
    { name: 'Reserves', amount: i.reserves },
  ];
  const tdc = uses.reduce((a, b) => a + b.amount, 0);

  // HCR-C-02 / C-03: developer fee base 10% of acquisition + improvement cost; 15% of improvement cost ceiling.
  const improvementCost = i.hardCosts + i.softCosts + i.financingCosts;
  const devFeeBaseCap = round((i.acquisition + improvementCost) * 0.1);
  const devFeeCeiling = round(improvementCost * 0.15);
  const devFeePctOfBase = +((i.developerFee / (i.acquisition + improvementCost)) * 100).toFixed(2);

  // HCR-C-01: builder's profit + overhead + general conditions, combined cap 14% of the construction contract.
  const builderFeesPct = +(i.builderProfitPct + i.builderOverheadPct + i.generalConditionsPct).toFixed(1);

  // HCR-C-08: credit = lesser of eligible allocation and gap amount.
  const eligibleBasis = round(i.hardCosts + i.softCosts * 0.85 + i.developerFee + i.financingCosts * 0.6);
  const qualifiedBasis = round(eligibleBasis * i.applicableFraction * i.basisBoost);
  const eligibleCredit = round(qualifiedBasis * (i.applicablePct / 100));
  const creditPrice = +(i.creditPrice + s.creditPriceDelta).toFixed(2);
  // HCR-C-07: net syndication proceeds assume 99.9% sold to investors; 10-year credit period.
  const pricingFactor = 10 * creditPrice * 0.999;
  const otherFinancing = i.otherSources.reduce((a, b) => a + b.amount, 0);
  const gapCredit = round((tdc - i.permLoan - otherFinancing) / pricingFactor);
  const capProject = 2_800_000; // HCR-T-08a, NYC metro
  const capPerUnit = 35_000 * i.units; // HCR-T-08e, NYC metro standard
  const maxCredit = Math.min(eligibleCredit, gapCredit, capProject, capPerUnit);

  const equity = round(i.creditRequest * pricingFactor);
  const sources = [
    { name: 'Permanent loan', amount: i.permLoan, cell: i.cells.permLoan },
    { name: 'LIHTC equity (9%)', amount: equity, cell: i.cells.creditRequest },
    ...i.otherSources,
  ];
  const totalSources = sources.reduce((a, b) => a + b.amount, 0);
  const balance = totalSources - tdc;

  const cashFlow = Array.from({ length: 15 }, (_, k) => {
    const year = k + 1;
    const inc = Math.pow(1.02, k);
    const exp = Math.pow(1.03, k);
    const yNoi = round(egi * inc - (opex + reserve) * exp);
    return { year, noi: yNoi, debtService: annualDs, dscr: +(yNoi / annualDs).toFixed(2) };
  });

  return {
    gpr, vacancy, egi, opex, reserve, noi, annualDebtService: annualDs, dscr, dscrPass: dscr >= i.lenderMinDscr,
    uses, tdc, improvementCost, devFeeBaseCap, devFeeCeiling, devFeePctOfBase, builderFeesPct,
    eligibleBasis, qualifiedBasis, eligibleCredit, pricingFactor, gapCredit, capProject, capPerUnit, maxCredit,
    creditRequest: i.creditRequest, equity, sources, totalSources, balance, rate, creditPrice, cashFlow,
  };
}

export const usd = (v: number, opts: { compact?: boolean } = {}) => {
  if (opts.compact) {
    const a = Math.abs(v);
    if (a >= 1_000_000) return `${v < 0 ? '-' : ''}$${(a / 1_000_000).toFixed(2)}M`;
    if (a >= 1_000) return `${v < 0 ? '-' : ''}$${(a / 1_000).toFixed(0)}k`;
  }
  return `${v < 0 ? '-' : ''}$${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
};
