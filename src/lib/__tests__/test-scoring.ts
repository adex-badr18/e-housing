// =============================================================================
// OAU E-Housing — Scoring Engine Mock Test Script
// =============================================================================
// Run with:  npx tsx src/lib/__tests__/test-scoring.ts
//
// No test runner required. Results are printed to stdout as a table.
// A fixed reference date (2026-07-01) is used for deterministic seniority scores.
// =============================================================================

import { calculateScore, toPointsBreakdown, type ScoringInput } from '../scoring';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const REF_DATE = new Date('2026-07-01T00:00:00.000Z');

interface TestCase {
  label: string;
  input: ScoringInput;
  expectedTotal?: number; // Optional — script will flag mismatches
}

const TEST_CASES: TestCase[] = [
  {
    label: 'Senior Lecturer (CONUASS 5, 11 yrs, Married, 3 deps)',
    input: {
      rank: 'Senior Lecturer',
      salaryGradeLevel: 'CONUASS 5',
      employmentDate: '2015-08-01',  // ~10.9 yrs → 10 seniority pts
      numberOfDependents: 3,
      maritalStatus: 'MARRIED',
    },
    expectedTotal: 30 + 25 + 15 + 10 + 10, // = 90 (10.92 yrs → ≥10 → 15 seniority pts)
  },
  {
    label: 'Lecturer I (CONUASS 3, 7 yrs, Single, 0 deps)',
    input: {
      rank: 'Lecturer I',
      salaryGradeLevel: 'CONUASS 3',
      employmentDate: '2019-03-15',  // ~7.3 yrs → 10 seniority pts
      numberOfDependents: 0,
      maritalStatus: 'SINGLE',
    },
    expectedTotal: 25 + 20 + 10 + 0 + 0, // = 55
  },
  {
    label: 'Professor (CONUASS 7, 22 yrs, Married, 5 deps)',
    input: {
      rank: 'Professor',
      salaryGradeLevel: 'CONUASS 7',
      employmentDate: '2004-01-10',  // ~22.5 yrs → 25 pts
      numberOfDependents: 5,
      maritalStatus: 'MARRIED',
    },
    expectedTotal: 40 + 30 + 25 + 15 + 10, // = 120
  },
  {
    label: 'Associate Professor (CONUASS 6, 16 yrs, Widowed, 2 deps)',
    input: {
      rank: 'Associate Professor',
      salaryGradeLevel: 'CONUASS 6',
      employmentDate: '2010-05-20',  // ~16.1 yrs → 20 pts
      numberOfDependents: 2,
      maritalStatus: 'WIDOWED',
    },
    expectedTotal: 35 + 25 + 20 + 5 + 8, // = 93
  },
  {
    label: 'Lecturer II (CONUASS 2, 3 yrs, Divorced, 1 dep)',
    input: {
      rank: 'Lecturer II',
      salaryGradeLevel: 'CONUASS 2',
      employmentDate: '2023-02-01',  // ~3.4 yrs → 5 pts
      numberOfDependents: 1,
      maritalStatus: 'DIVORCED',
    },
    expectedTotal: 20 + 15 + 5 + 5 + 5, // = 50
  },
  {
    label: 'Junior Non-Academic (CONTISS 5, 1 yr, Single, 0 deps)',
    input: {
      rank: 'Administrative Officer',
      salaryGradeLevel: 'CONTISS 5',
      employmentDate: '2025-06-01',  // ~1.1 yrs → 0 pts
      numberOfDependents: 0,
      maritalStatus: 'SINGLE',
    },
    expectedTotal: 10 + 7 + 0 + 0 + 0, // = 17
  },
  {
    label: 'Principal Officer (CONTISS 10, 12 yrs, Married, 4 deps)',
    input: {
      rank: 'Principal Administrative Officer',
      salaryGradeLevel: 'CONTISS 10',
      employmentDate: '2014-03-01',  // ~12.3 yrs → 15 pts
      numberOfDependents: 4,
      maritalStatus: 'MARRIED',
    },
    expectedTotal: 20 + 15 + 15 + 10 + 10, // = 70
  },
  {
    label: 'Reader (CONUASS 6, 20 yrs, Married, 3 deps) — edge: rank=Reader',
    input: {
      rank: 'Reader',
      salaryGradeLevel: 'CONUASS 6',
      employmentDate: '2006-01-01',  // ~20.5 yrs → 25 pts
      numberOfDependents: 3,
      maritalStatus: 'MARRIED',
    },
    expectedTotal: 35 + 25 + 25 + 10 + 10, // = 105
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const COL_LABEL    = 42;
const COL_RANK     = 6;
const COL_GRADE    = 7;
const COL_SEN      = 6;
const COL_DEP      = 6;
const COL_MAR      = 6;
const COL_TOTAL    = 7;
const COL_EXP      = 8;
const COL_STATUS   = 8;

function pad(s: string | number, width: number): string {
  return String(s).padEnd(width, ' ');
}

function hr(char = '─'): string {
  const total = COL_LABEL + COL_RANK + COL_GRADE + COL_SEN + COL_DEP + COL_MAR + COL_TOTAL + COL_EXP + COL_STATUS + 16;
  return char.repeat(total);
}

console.log('\n');
console.log('╔' + '═'.repeat(hr().length) + '╗');
console.log('║  OAU E-Housing — Scoring Engine Test Suite'.padEnd(hr().length + 1) + '║');
console.log('╚' + '═'.repeat(hr().length) + '╝');
console.log(`Reference Date: ${REF_DATE.toDateString()}\n`);
console.log(hr());
console.log(
  '  ' +
  pad('Test Case', COL_LABEL) + '│ ' +
  pad('Rank', COL_RANK) + '│ ' +
  pad('Grade', COL_GRADE) + '│ ' +
  pad('Snrty', COL_SEN) + '│ ' +
  pad('Deps', COL_DEP) + '│ ' +
  pad('Mrl', COL_MAR) + '│ ' +
  pad('Total', COL_TOTAL) + '│ ' +
  pad('Expect', COL_EXP) + '│ ' +
  pad('Result', COL_STATUS)
);
console.log(hr('─'));

let passCount = 0;
let failCount = 0;

for (const tc of TEST_CASES) {
  const result = calculateScore(tc.input, REF_DATE);
  const b      = result.breakdown;
  const passed = tc.expectedTotal == null || b.totalPoints === tc.expectedTotal;

  if (passed) passCount++; else failCount++;

  console.log(
    '  ' +
    pad(tc.label.slice(0, COL_LABEL - 2), COL_LABEL) + '│ ' +
    pad(b.rankPoints, COL_RANK) + '│ ' +
    pad(b.gradePoints, COL_GRADE) + '│ ' +
    pad(b.seniorityPoints, COL_SEN) + '│ ' +
    pad(b.dependentsPoints, COL_DEP) + '│ ' +
    pad(b.maritalStatusPoints, COL_MAR) + '│ ' +
    pad(b.totalPoints, COL_TOTAL) + '│ ' +
    pad(tc.expectedTotal ?? 'N/A', COL_EXP) + '│ ' +
    (passed ? '✅ PASS' : `❌ FAIL (got ${b.totalPoints}, expected ${tc.expectedTotal})`)
  );
}

console.log(hr('─'));
console.log(`\n  Tests: ${TEST_CASES.length} | ✅ Passed: ${passCount} | ❌ Failed: ${failCount}\n`);

// ---------------------------------------------------------------------------
// Detailed breakdown for first test case
// ---------------------------------------------------------------------------

console.log('\n── Detailed Breakdown (Case 1) ──────────────────────────────────────');
const demo    = calculateScore(TEST_CASES[0].input, REF_DATE);
const dbShape = toPointsBreakdown(demo.breakdown);

console.log('ScoringBreakdown:', JSON.stringify(demo.breakdown, null, 2));
console.log('\nPointsBreakdown (DB shape for HousingApplication):');
console.log(JSON.stringify(dbShape, null, 2));
console.log('\nSummary string:');
console.log(' ', demo.summary);

// ---------------------------------------------------------------------------
// Exit with non-zero code if any test failed
// ---------------------------------------------------------------------------

if (failCount > 0) {
  process.exit(1);
}
