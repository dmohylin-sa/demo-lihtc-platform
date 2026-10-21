// Personas follow the review pack's persona document (pp.60-79) and decision-owner matrix (p.85).
// Names are fictional. Release 1 users are sponsor-side practitioners and Everstead staff.
import type { Persona, PersonaId } from './types';

export const PERSONAS: Persona[] = [
  {
    id: 'dealLead',
    name: 'Maya Ortiz',
    initials: 'MO',
    title: 'Deal Lead (PM)',
    role: 'Deal Lead (PM)',
    access: 'Editor',
    tenantId: 'northbank',
    summaryMode: 'Practitioner',
    blurb: 'Coordinates the deal end to end. Uploads documents, runs the analyses and tracks the gaps.',
    quote: "I'm doing the work of three people and re-checking my own math at midnight.",
    home: '/deals',
  },
  {
    id: 'analyst',
    name: 'Sam Whitaker',
    initials: 'SW',
    title: 'Underwriting Analyst',
    role: 'Underwriting Analyst',
    access: 'Editor',
    tenantId: 'northbank',
    summaryMode: 'Analyst',
    blurb: 'Owns the model. Financial sizing, eligibility calculations and underwriting tests.',
    quote: 'My job is the model - every number has to survive an audit.',
    home: '/deals/harlow/underwriting',
  },
  {
    id: 'closing',
    name: 'Priya Nair',
    initials: 'PN',
    title: 'Closing Coordinator',
    role: 'Closing Coordinator',
    access: 'Editor',
    tenantId: 'northbank',
    summaryMode: 'Practitioner',
    blurb: 'Verifies gate conditions on a first pass and assembles the package for the Principal.',
    quote: "I'm the one making sure every signature, condition, and deadline lines up before we close.",
    home: '/deals/harlow/decisions',
  },
  {
    id: 'principal',
    name: 'Daniel Brooks',
    initials: 'DB',
    title: 'Principal',
    role: 'Principal',
    access: 'Owner',
    tenantId: 'northbank',
    summaryMode: 'Executive',
    blurb: 'Business strategy, financing route and material risk. The only role that authorizes a gate.',
    quote: 'I need to know if this deal is safe to say yes to.',
    home: '/deals',
  },
  {
    id: 'admin',
    name: 'Jordan Ellis',
    initials: 'JE',
    title: 'Everstead platform admin',
    role: 'Everstead staff',
    access: 'Everstead staff',
    tenantId: 'everstead',
    summaryMode: 'Practitioner',
    blurb: 'Publishes process-tree and rule-pack versions, manages tenants and watches processing.',
    quote: 'A new term sheet should be a configuration change, not a release.',
    home: '/admin/rules',
  },
];

export const personaById = (id: PersonaId) => PERSONAS.find((p) => p.id === id)!;

export interface Tenant {
  id: string;
  name: string;
  kind: 'Sponsor' | 'Platform operator';
  users: number;
  deals: number;
  region: string;
  isolation: string;
}

export const TENANTS: Tenant[] = [
  { id: 'northbank', name: 'Northbank Housing Partners', kind: 'Sponsor', users: 9, deals: 3, region: 'us-east-1', isolation: 'Logical, enforced on every query and storage path' },
  { id: 'harbor', name: 'Harbor & Hill Development', kind: 'Sponsor', users: 6, deals: 2, region: 'us-east-1', isolation: 'Logical, enforced on every query and storage path' },
  { id: 'everstead', name: 'Everstead Advisory', kind: 'Platform operator', users: 4, deals: 0, region: 'us-east-1', isolation: 'Operator - no deal data without a support grant' },
];

export const TENANT_USERS = [
  { name: 'Maya Ortiz', email: 'maya.ortiz@northbank.example', tenant: 'Northbank Housing Partners', role: 'Deal Lead (PM)', access: 'Editor', mfa: true, lastSeen: 'Today 09:12' },
  { name: 'Sam Whitaker', email: 'sam.whitaker@northbank.example', tenant: 'Northbank Housing Partners', role: 'Underwriting Analyst', access: 'Editor', mfa: true, lastSeen: 'Today 08:47' },
  { name: 'Priya Nair', email: 'priya.nair@northbank.example', tenant: 'Northbank Housing Partners', role: 'Closing Coordinator', access: 'Editor', mfa: true, lastSeen: 'Yesterday' },
  { name: 'Daniel Brooks', email: 'daniel.brooks@northbank.example', tenant: 'Northbank Housing Partners', role: 'Principal', access: 'Owner', mfa: true, lastSeen: 'Today 07:58' },
  { name: 'Leo Grant', email: 'leo.grant@northbank.example', tenant: 'Northbank Housing Partners', role: 'Deal Lead (PM)', access: 'Editor', mfa: true, lastSeen: '2 days ago' },
  { name: 'Ana Ruiz', email: 'ana.ruiz@harborhill.example', tenant: 'Harbor & Hill Development', role: 'Deal Lead (PM)', access: 'Editor', mfa: true, lastSeen: 'Today 10:03' },
  { name: 'Tom Okafor', email: 'tom.okafor@harborhill.example', tenant: 'Harbor & Hill Development', role: 'Principal', access: 'Owner', mfa: true, lastSeen: 'Yesterday' },
  { name: 'Jordan Ellis', email: 'jordan.ellis@everstead.example', tenant: 'Everstead Advisory', role: 'Platform admin', access: 'Everstead staff', mfa: true, lastSeen: 'Today 09:30' },
];

// Permission matrix shown in the admin console and enforced by `can()` in the store.
export type Capability =
  | 'upload'
  | 'reviewExtraction'
  | 'editUnderwriting'
  | 'recordDecision'
  | 'verifyGate'
  | 'authorizeGate'
  | 'signReport'
  | 'viewSensitiveFields'
  | 'admin'
  | 'viewAudit'
  | 'exportData'
  | 'runScenarios';

export const CAPABILITY_LABELS: Record<Capability, { label: string; level: 'Deal' | 'Document' | 'Field' | 'Platform' }> = {
  upload: { label: 'Upload and supersede documents', level: 'Document' },
  reviewExtraction: { label: 'Accept or correct extracted fields', level: 'Field' },
  editUnderwriting: { label: 'Edit underwriting inputs', level: 'Deal' },
  recordDecision: { label: 'Record a decision (owner role only)', level: 'Deal' },
  verifyGate: { label: 'Verify gate conditions (first pass)', level: 'Deal' },
  authorizeGate: { label: 'Authorize a gate, waiver or economic cure', level: 'Deal' },
  signReport: { label: 'Sign off the readiness report', level: 'Deal' },
  viewSensitiveFields: { label: 'See developer fee, equity pricing, sponsor cash', level: 'Field' },
  admin: { label: 'Publish tree and rule-pack versions, manage tenants', level: 'Platform' },
  viewAudit: { label: 'View the audit trail', level: 'Deal' },
  exportData: { label: 'Export deal data', level: 'Deal' },
  runScenarios: { label: 'Run walkthrough scenarios', level: 'Deal' },
};

export const PERMISSIONS: Record<PersonaId, Capability[]> = {
  dealLead: ['upload', 'reviewExtraction', 'recordDecision', 'viewSensitiveFields', 'viewAudit', 'exportData', 'runScenarios', 'signReport'],
  analyst: ['upload', 'reviewExtraction', 'editUnderwriting', 'recordDecision', 'viewSensitiveFields', 'viewAudit', 'runScenarios', 'signReport'],
  closing: ['upload', 'reviewExtraction', 'verifyGate', 'viewAudit', 'runScenarios'],
  principal: ['recordDecision', 'authorizeGate', 'viewSensitiveFields', 'viewAudit', 'exportData', 'runScenarios', 'signReport'],
  admin: ['admin', 'viewAudit', 'exportData', 'runScenarios'],
};
