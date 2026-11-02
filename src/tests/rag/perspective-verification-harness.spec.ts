import { describe, test, expect } from 'vitest';
import type { BurnMathV9Runtime } from '../../app/rag/wasm-math-v9-scorer';
// @ts-ignore
import { loadWasm } from '../../../math compesor/helper/lib/engine.mjs';
import {
  runAgentVerificationSuite,
  createHolographicMemoryVerificationSuite,
  createMultiWorldVerificationSuite,
  createWasmMathV9BatchScorerVerificationSuite,
  type AgentVerificationSuiteSpec,
} from './perspective-verification-harness';

describe('Blueprint v2.0: Perspective-Aware Micro-Testing & Regression-Aware Verification Harness', () => {
  test('Dimension 1-6 Full Verification on HolographicMemoryField::RehearsalBytePaddingAndMoments', () => {
    const suite = createHolographicMemoryVerificationSuite();
    const report = runAgentVerificationSuite(suite);

    expect(report.module).toBe('HolographicMemoryField::RehearsalBytePaddingAndMoments');
    expect(report.domain).toBe('low-level');
    expect(report.primaryPassed).toBe(true);
    expect(report.perspectivesChecked).toEqual([
      'Primary-Target',
      'Boundary-And-Poison',
      'Differential-Equivalence',
      'Post-PASS-Regression',
    ]);
    expect(report.unverifiedPerspectives).toEqual([]);
    expect(report.metrics.gateCounts).toEqual({
      primary: 2,
      poison: 2,
      differential: 2,
      regression: 1,
    });
    expect(report.metrics.totalCasesExecuted).toBe(9); // 2 primary * 2 runs + 2 poison + 2 diff + 1 reg
    expect(report.failures).toEqual([]);
    expect(report.generatedRegressionCandidates).toEqual([]);
    expect(report.isCompleteAndVerified).toBe(true);
  });

  test('Dimension 1-6 Full Verification on MultiWorldHologram::ForkPruneRehearsalIsolation', () => {
    const suite = createMultiWorldVerificationSuite();
    const report = runAgentVerificationSuite(suite);

    expect(report.module).toBe('MultiWorldHologram::ForkPruneRehearsalIsolation');
    expect(report.domain).toBe('boundary');
    expect(report.primaryPassed).toBe(true);
    expect(report.perspectivesChecked).toEqual([
      'Primary-Target',
      'Boundary-And-Poison',
      'Post-PASS-Regression',
    ]);
    expect(report.unverifiedPerspectives).toEqual([]);
    expect(report.failures).toEqual([]);
    expect(report.generatedRegressionCandidates).toEqual([]);
    expect(report.isCompleteAndVerified).toBe(true);
  });

  test('Dimension 1-6 Full Verification on WasmMathProgramV9BatchScorer::BatchedTensorEquivalenceAndPoison', async () => {
    const rt = (await loadWasm()) as BurnMathV9Runtime;
    const suite = createWasmMathV9BatchScorerVerificationSuite(rt);
    const report = runAgentVerificationSuite(suite);

    expect(report.module).toBe(
      'WasmMathProgramV9BatchScorer::BatchedTensorEquivalenceAndPoison',
    );
    expect(report.domain).toBe('low-level');
    expect(report.primaryPassed).toBe(true);
    expect(report.perspectivesChecked).toEqual([
      'Primary-Target',
      'Boundary-And-Poison',
      'Differential-Equivalence',
      'Post-PASS-Regression',
    ]);
    expect(report.unverifiedPerspectives).toEqual([]);
    expect(report.failures).toEqual([]);
    expect(report.generatedRegressionCandidates).toEqual([]);
    expect(report.isCompleteAndVerified).toBe(true);
  });

  test('Auto-Regression Candidate Generator & Strict Failure Classification on Naive Byte-Padding Defect', () => {
    const buggyBytePaddingSuite: AgentVerificationSuiteSpec<number, boolean> = {
      name: 'NaiveTruthyRehearsalCheck (Simulated Defect)',
      domain: 'low-level',
      subject: (rawByte: number) => (rawByte & 0xff) !== 0, // Bug: treats 0xFE as true!
      comparator: (a, b) => a === b,
      primaryCases: [
        { name: 'Canonical 0 is false', input: 0, expected: false },
        { name: 'Canonical 1 is true', input: 1, expected: true },
      ],
      poisonInputs: [
        {
          name: 'Dirty upper padding bits 0xFE (254) where LSB bit 0 is 0',
          input: 0xfe,
          invariantCheck: (actual, input) => actual === ((input & 0x01) === 1),
          failureHint: 'Upper padding bits (0xFE) leaked into boolean rehearsal evaluation',
        },
      ],
      referenceOracle: (sample: number) => (sample & 0x01) === 1,
      generatedSamples: [0x00, 0x01, 0xfe, 0xff],
      regressionSuite: [
        {
          id: 'REG-20261028-015',
          input: 0b1010_1010,
          expected: false,
        },
      ],
    };

    const report = runAgentVerificationSuite(buggyBytePaddingSuite);

    expect(report.primaryPassed).toBe(true);
    expect(report.failures.length).toBe(3);
    expect(report.failures.map((f) => f.classification)).toEqual([
      'Unhandled-Edge-Case',
      'Behavioral-Drift',
      'Secondary-Regression',
    ]);
    // Auto-Regression Generator mengekstrak kegagalan non-Post-PASS menjadi kandidat regresi baru
    expect(report.generatedRegressionCandidates.length).toBe(2);
    expect(report.generatedRegressionCandidates[0]?.id).toBe(
      'AUTO-REG-BOUNDARY-AND-POISON-1',
    );
    expect(report.generatedRegressionCandidates[0]?.input).toBe(0xfe);
    expect(report.generatedRegressionCandidates[1]?.id).toBe(
      'AUTO-REG-DIFFERENTIAL-EQUIVALENCE-2',
    );
    expect(report.generatedRegressionCandidates[1]?.input).toBe(0xfe);
    expect(report.generatedRegressionCandidates[1]?.expected).toBe(false);
    expect(report.isCompleteAndVerified).toBe(false);
  });

  test('Dimension 5 (Determinism-And-Purity): Detects Input-Mutation-Side-Effect and Nondeterministic-Behavior', () => {
    let hiddenCounter = 0;
    const impureAndNondeterministicSuite: AgentVerificationSuiteSpec<
      { items: number[] },
      number
    > = {
      name: 'ImpureNondeterministicModule',
      domain: 'general-app',
      subject: (input) => {
        // Side-effect 1: Mutasi array input secara in-place!
        input.items.push(999);
        // Side-effect 2: State bocor antar pemanggilan!
        hiddenCounter += 1;
        return input.items.reduce((a, b) => a + b, 0) + (hiddenCounter > 1 ? 50 : 0);
      },
      options: {
        enforceImmutability: true,
        determinismRuns: 2,
      },
      primaryCases: [
        {
          name: 'Sum items cleanly and deterministically',
          input: { items: [10, 20] },
          expected: 1029,
        },
      ],
      poisonInputs: [
        {
          name: 'Empty array input',
          input: { items: [] },
          invariantCheck: (actual) => Number.isFinite(actual),
        },
      ],
      regressionSuite: [
        {
          id: 'REG-PURITY-001',
          input: { items: [5] },
          expected: 1054,
        },
      ],
    };

    const report = runAgentVerificationSuite(impureAndNondeterministicSuite);

    const classifications = report.failures.map((f) => f.classification);
    expect(classifications).toContain('Nondeterministic-Behavior');
    expect(classifications).toContain('Input-Mutation-Side-Effect');
    expect(report.isCompleteAndVerified).toBe(false);
  });

  test('Anti-Vacuous-Pass Guard: Rejects suite when required perspectives are empty (unverifiedPerspectives)', () => {
    const vacuousSuite: AgentVerificationSuiteSpec<number, number> = {
      name: 'VacuousLowLevelModule',
      domain: 'low-level',
      subject: (x) => x * 2,
      primaryCases: [{ name: '2 * 2 = 4', input: 2, expected: 4 }],
      // poisonInputs, referenceOracle/generatedSamples, dan regressionSuite sengaja dikosongkan!
    };

    const report = runAgentVerificationSuite(vacuousSuite);

    expect(report.primaryPassed).toBe(true);
    expect(report.failures).toEqual([]);
    expect(report.unverifiedPerspectives).toEqual([
      'Boundary-And-Poison',
      'Differential-Equivalence',
      'Post-PASS-Regression',
    ]);
    // Aturan Ketat v2.0: meskipun primaryPassed = true dan failures = [], vacuous pass DITOLAK!
    expect(report.isCompleteAndVerified).toBe(false);
  });
});
