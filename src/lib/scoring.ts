// =============================================================================
// OAU E-Housing — Allocation Priority Scoring Engine
// =============================================================================
// Pure utility. No side effects, no DB calls. Import and call `calculateScore`.
//
// Scoring dimensions (max 120 pts):
//   Rank              → 10–40
//   Salary Grade      → 5–30
//   Years of Service  → 0–25
//   Dependents        → 0–15
//   Marital Status    → 0–10
// =============================================================================

import type { MaritalStatus } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Input / Output Types
// ---------------------------------------------------------------------------

export interface ScoringInput {
  rank: string;
  salaryGradeLevel: string;
  /** ISO date string, e.g. "2015-08-01" */
  employmentDate: string;
  numberOfDependents: number;
  maritalStatus: MaritalStatus;
}

export interface ScoringBreakdown {
  /** Points awarded for academic/administrative rank */
  rankPoints: number;
  /** Human-readable label of the matched rank tier */
  rankLabel: string;

  /** Points awarded for salary grade level */
  gradePoints: number;
  /** Human-readable label of the matched grade tier */
  gradeLabel: string;

  /** Points awarded for years of service */
  seniorityPoints: number;
  /** Computed years of service */
  yearsOfService: number;

  /** Points awarded for number of dependents */
  dependentsPoints: number;

  /** Points awarded for marital status */
  maritalStatusPoints: number;

  /** Sum of all dimension scores */
  totalPoints: number;
}

export interface ScoringResult {
  breakdown: ScoringBreakdown;
  /** Top-level justification string for the Housing Secretary */
  summary: string;
}

// ---------------------------------------------------------------------------
// Dimension 1 — Rank
// ---------------------------------------------------------------------------

interface RankTier {
  pattern: RegExp;
  label: string;
  points: number;
}

/**
 * Rank tiers ordered from highest to lowest seniority.
 * Matching is case-insensitive and uses substring/pattern matching.
 */
const RANK_TIERS: RankTier[] = [
  // More-specific patterns MUST come before the bare "professor" fallback
  { pattern: /associate\s*professor/i,             label: 'Associate Professor',   points: 35 },
  { pattern: /reader/i,                            label: 'Reader',                points: 35 },
  { pattern: /professor/i,                         label: 'Professor',             points: 40 },
  { pattern: /senior\s*lecturer/i,                 label: 'Senior Lecturer',       points: 30 },
  { pattern: /lecturer\s*i\b/i,                    label: 'Lecturer I',            points: 25 },
  { pattern: /lecturer\s*ii\b/i,                   label: 'Lecturer II',           points: 20 },
  { pattern: /assistant\s*lecturer/i,              label: 'Assistant Lecturer',    points: 15 },
  // Administrative / Technical senior grades
  { pattern: /senior\s*(admin|technical|staff)/i, label: 'Senior Admin/Technical', points: 15 },
  { pattern: /principal/i,                         label: 'Principal Officer',     points: 20 },
  { pattern: /chief/i,                             label: 'Chief Officer',         points: 25 },
  { pattern: /director/i,                          label: 'Director',              points: 30 },
  { pattern: /registrar/i,                         label: 'Registrar',             points: 35 },
  { pattern: /bursar/i,                            label: 'Bursar',                points: 35 },
  { pattern: /librarian/i,                         label: 'Librarian',             points: 20 },
];

const RANK_FALLBACK = { label: 'Junior Staff', points: 10 };

function scoreRank(rank: string): { label: string; points: number } {
  for (const tier of RANK_TIERS) {
    if (tier.pattern.test(rank)) {
      return { label: tier.label, points: tier.points };
    }
  }
  return RANK_FALLBACK;
}

// ---------------------------------------------------------------------------
// Dimension 2 — Salary Grade Level
// ---------------------------------------------------------------------------

interface GradeTier {
  pattern: RegExp;
  label: string;
  points: number;
}

const GRADE_TIERS: GradeTier[] = [
  // CONUASS (Academic)
  { pattern: /conuass\s*7/i,   label: 'CONUASS 7',   points: 30 },
  { pattern: /conuass\s*6/i,   label: 'CONUASS 6',   points: 25 },
  { pattern: /conuass\s*5/i,   label: 'CONUASS 5',   points: 25 },
  { pattern: /conuass\s*4/i,   label: 'CONUASS 4',   points: 20 },
  { pattern: /conuass\s*3/i,   label: 'CONUASS 3',   points: 20 },
  { pattern: /conuass\s*2/i,   label: 'CONUASS 2',   points: 15 },
  { pattern: /conuass\s*1/i,   label: 'CONUASS 1',   points: 15 },
  { pattern: /conuass/i,       label: 'CONUASS',      points: 15 },
  // CONTISS (Non-Academic)
  { pattern: /contiss\s*1[0-9]/i, label: 'CONTISS 10+', points: 15 },
  { pattern: /contiss\s*[7-9]/i,  label: 'CONTISS 7-9', points: 10 },
  { pattern: /contiss\s*[4-6]/i,  label: 'CONTISS 4-6', points: 7  },
  { pattern: /contiss\s*[1-3]/i,  label: 'CONTISS 1-3', points: 5  },
  { pattern: /contiss/i,           label: 'CONTISS',     points: 5  },
  // Generic GL notation
  { pattern: /gl\s*1[5-9]/i,   label: 'GL 15-19',    points: 25 },
  { pattern: /gl\s*1[2-4]/i,   label: 'GL 12-14',    points: 20 },
  { pattern: /gl\s*1[0-1]/i,   label: 'GL 10-11',    points: 15 },
  { pattern: /gl\s*[7-9]/i,    label: 'GL 7-9',       points: 10 },
  { pattern: /gl\s*[1-6]/i,    label: 'GL 1-6',       points: 5  },
];

const GRADE_FALLBACK = { label: 'Other Grade', points: 5 };

function scoreGrade(grade: string): { label: string; points: number } {
  for (const tier of GRADE_TIERS) {
    if (tier.pattern.test(grade)) {
      return { label: tier.label, points: tier.points };
    }
  }
  return GRADE_FALLBACK;
}

// ---------------------------------------------------------------------------
// Dimension 3 — Years of Service
// ---------------------------------------------------------------------------

export function computeYearsOfService(employmentDate: string, referenceDate?: Date): number {
  const start = new Date(employmentDate);
  const ref   = referenceDate ?? new Date();
  const diffMs = ref.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
}

function scoreSeniority(years: number): number {
  if (years >= 20) return 25;
  if (years >= 15) return 20;
  if (years >= 10) return 15;
  if (years >= 5)  return 10;
  if (years >= 2)  return 5;
  return 0;
}

// ---------------------------------------------------------------------------
// Dimension 4 — Number of Dependents
// ---------------------------------------------------------------------------

function scoreDependents(count: number): number {
  if (count >= 5) return 15;
  if (count >= 3) return 10;
  if (count >= 1) return 5;
  return 0;
}

// ---------------------------------------------------------------------------
// Dimension 5 — Marital Status
// ---------------------------------------------------------------------------

const MARITAL_POINTS: Record<MaritalStatus, number> = {
  MARRIED:  10,
  WIDOWED:   8,
  DIVORCED:  5,
  SINGLE:    0,
};

// ---------------------------------------------------------------------------
// Main Export — calculateScore
// ---------------------------------------------------------------------------

/**
 * Calculates a staff member's allocation priority score.
 *
 * @param input   - Staff profile fields used for scoring
 * @param refDate - Optional reference date (defaults to today); useful for deterministic tests
 * @returns       - Full breakdown and summary string
 */
export function calculateScore(input: ScoringInput, refDate?: Date): ScoringResult {
  const { rank, salaryGradeLevel, employmentDate, numberOfDependents, maritalStatus } = input;

  const rankResult      = scoreRank(rank);
  const gradeResult     = scoreGrade(salaryGradeLevel);
  const years           = computeYearsOfService(employmentDate, refDate);
  const seniorityPts    = scoreSeniority(years);
  const dependentsPts   = scoreDependents(numberOfDependents);
  const maritalPts      = MARITAL_POINTS[maritalStatus] ?? 0;

  const totalPoints =
    rankResult.points +
    gradeResult.points +
    seniorityPts +
    dependentsPts +
    maritalPts;

  const breakdown: ScoringBreakdown = {
    rankPoints:          rankResult.points,
    rankLabel:           rankResult.label,
    gradePoints:         gradeResult.points,
    gradeLabel:          gradeResult.label,
    seniorityPoints:     seniorityPts,
    yearsOfService:      years,
    dependentsPoints:    dependentsPts,
    maritalStatusPoints: maritalPts,
    totalPoints,
  };

  const summary = buildSummary(breakdown);

  return { breakdown, summary };
}

// ---------------------------------------------------------------------------
// Summary builder
// ---------------------------------------------------------------------------

function buildSummary(b: ScoringBreakdown): string {
  const parts: string[] = [
    `Rank (${b.rankLabel}): ${b.rankPoints} pts`,
    `Grade (${b.gradeLabel}): ${b.gradePoints} pts`,
    `Seniority (${b.yearsOfService} yrs): ${b.seniorityPoints} pts`,
    `Dependents: ${b.dependentsPoints} pts`,
    `Marital Status: ${b.maritalStatusPoints} pts`,
  ];
  return `Total: ${b.totalPoints} pts — ${parts.join(' | ')}`;
}

// ---------------------------------------------------------------------------
// Convenience — map ScoringBreakdown → PointsBreakdown (db.ts shape)
// ---------------------------------------------------------------------------

import type { PointsBreakdown } from '@/lib/mock-api/db';

/**
 * Converts a `ScoringBreakdown` into the `PointsBreakdown` shape
 * stored on `HousingApplication`. Housing Secretary can further edit
 * individual fields before submitting the review.
 */
export function toPointsBreakdown(b: ScoringBreakdown): PointsBreakdown {
  return {
    baseTypePoints:     b.rankPoints + b.gradePoints,
    seniorityBonus:     b.seniorityPoints,
    dependentsBonus:    b.dependentsPoints,
    maritalStatusBonus: b.maritalStatusPoints,
    totalPoints:        b.totalPoints,
  };
}
