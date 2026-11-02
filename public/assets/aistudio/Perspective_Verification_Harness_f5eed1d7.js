/**
 * Blueprint v2.0: Perspective-Aware Micro-Testing & Regression-Aware Verification Harness
 *
 * Menguji 6 Dimensi Verifikasi Secara Ketat:
 * 1. Primary-Target (Baseline & Reproduksi Deterministik)
 * 2. Boundary-And-Poison (Injeksi Input Ekstrem, Ekspektasi Error, & Invarian)
 * 3. Differential-Equivalence (Komparasi Oracle Referensi Tanpa Kontaminasi Referensi)
 * 4. Post-PASS-Regression (Validasi Zero-Regression pada Jalur Tetangga)
 * 5. Determinism-And-Purity (Deteksi Mutasi Input Ilegal & Flakiness/Nondeterminisme)
 * 6. Performance-Budget (Deteksi Regresi Latensi & Bottleneck Eksekusi)
 *
 * Dilengkapi dengan Auto-Regression Generator yang otomatis mengekstrak setiap kegagalan
 * menjadi kandidat test case regresi permanen.
 */

const DEFAULT_COMPARATOR = (actual, expected) => {
  if (Object.is(actual, expected)) return true;
  if (
    actual !== null &&
    expected !== null &&
    typeof actual === 'object' &&
    typeof expected === 'object'
  ) {
    try {
      return JSON.stringify(actual) === JSON.stringify(expected);
    } catch {
      return false;
    }
  }
  return false;
};

function safeClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Fallback jika objek memiliki properti non-cloneable (mis. function/symbol)
    }
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return Array.isArray(value) ? [...value] : { ...value };
  }
}

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function serializeError(err) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack
    };
  }
  return {
    name: 'NonErrorThrown',
    message: String(err),
    stack: null
  };
}

function matchesExpectedError(err, expectedThrowSpec) {
  if (!expectedThrowSpec || expectedThrowSpec === true) return true;
  const errMessage = err instanceof Error ? err.message : String(err);
  if (typeof expectedThrowSpec === 'string') {
    return errMessage.includes(expectedThrowSpec);
  }
  if (expectedThrowSpec instanceof RegExp) {
    return expectedThrowSpec.test(errMessage);
  }
  if (typeof expectedThrowSpec === 'function') {
    if (expectedThrowSpec.prototype instanceof Error || expectedThrowSpec === Error) {
      return err instanceof expectedThrowSpec;
    }
    return Boolean(expectedThrowSpec(err));
  }
  return true;
}

/**
 * Mengeksekusi subject secara terisolasi dengan tangkapan bukti lengkap:
 * - Mengkloning input agar mutasi in-place tidak merusak bukti atau pengujian berikutnya
 * - Mendeteksi mutasi input ilegal (jika enforceImmutability aktif)
 * - Mengukur durasi eksekusi (ms) untuk deteksi bottleneck performa
 */
function executeIsolated(subject, rawInput, options = {}) {
  const { comparator = DEFAULT_COMPARATOR, enforceImmutability = true } = options;
  const baselineSnapshot = safeClone(rawInput);
  const workingInput = safeClone(rawInput);

  const start = nowMs();
  try {
    const actual = subject(workingInput);
    const durationMs = Number((nowMs() - start).toFixed(4));
    const inputMutated = enforceImmutability && !comparator(workingInput, baselineSnapshot);

    return {
      ok: true,
      actual,
      durationMs,
      inputSnapshot: baselineSnapshot,
      postExecutionInput: workingInput,
      inputMutated,
      error: null
    };
  } catch (err) {
    const durationMs = Number((nowMs() - start).toFixed(4));
    return {
      ok: false,
      actual: undefined,
      durationMs,
      inputSnapshot: baselineSnapshot,
      postExecutionInput: workingInput,
      inputMutated: false,
      error: serializeError(err),
      rawError: err
    };
  }
}

/**
 * Membangun kandidat regresi otomatis dari kegagalan yang terkonfirmasi
 * agar langsung dapat diintegrasikan ke dalam `regressionSuite` pada iterasi berikutnya.
 */
function buildRegressionCandidate(failure, index) {
  return {
    id: `AUTO-REG-${failure.perspective.toUpperCase()}-${index + 1}`,
    sourcePerspective: failure.perspective,
    classification: failure.classification,
    name: failure.caseName || `Sample-${failure.sampleIndex ?? index}`,
    input: safeClone(failure.input),
    expected: failure.expected !== undefined ? safeClone(failure.expected) : undefined,
    capturedError: failure.error || null
  };
}

/**
 * Menjalankan Perspective-Aware Micro-Testing Harness secara sinkron & deterministik.
 *
 * @param {Object} suiteSpec Spesifikasi pengujian agen/modul
 * @returns {Object} Laporan verifikasi komprehensif beserta kandidat regresi baru
 */
export function runAgentVerificationSuite(suiteSpec) {
  if (!suiteSpec || typeof suiteSpec.subject !== 'function') {
    throw new TypeError('suiteSpec.subject harus berupa fungsi yang valid.');
  }

  const comparator = suiteSpec.comparator || DEFAULT_COMPARATOR;
  const options = {
    enforceImmutability: suiteSpec.options?.enforceImmutability ?? true,
    requireAllPerspectives: suiteSpec.options?.requireAllPerspectives ?? true,
    determinismRuns: suiteSpec.options?.determinismRuns ?? 2,
    maxDurationMs: suiteSpec.options?.maxDurationMs ?? null,
    stopOnFirstOracleDrift: suiteSpec.options?.stopOnFirstOracleDrift ?? false,
    maxOracleFailures: suiteSpec.options?.maxOracleFailures ?? 10
  };

  const primaryCases = Array.isArray(suiteSpec.primaryCases) ? suiteSpec.primaryCases : [];
  const poisonInputs = Array.isArray(suiteSpec.poisonInputs) ? suiteSpec.poisonInputs : [];
  const generatedSamples = Array.isArray(suiteSpec.generatedSamples) ? suiteSpec.generatedSamples : [];
  const regressionSuite = Array.isArray(suiteSpec.regressionSuite) ? suiteSpec.regressionSuite : [];

  const report = {
    module: suiteSpec.name || 'Unnamed-Module',
    domain: suiteSpec.domain || 'general-app', // 'low-level' | 'general-app' | 'boundary'
    primaryPassed: false,
    perspectivesChecked: [],
    unverifiedPerspectives: [],
    metrics: {
      totalCasesExecuted: 0,
      totalDurationMs: 0,
      maxCaseDurationMs: 0,
      gateCounts: {
        primary: primaryCases.length,
        poison: poisonInputs.length,
        differential: suiteSpec.referenceOracle ? generatedSamples.length : 0,
        regression: regressionSuite.length
      }
    },
    failures: [],
    generatedRegressionCandidates: [],
    isCompleteAndVerified: false
  };

  const recordExecutionMetrics = (durationMs) => {
    report.metrics.totalCasesExecuted += 1;
    report.metrics.totalDurationMs = Number((report.metrics.totalDurationMs + durationMs).toFixed(4));
    if (durationMs > report.metrics.maxCaseDurationMs) {
      report.metrics.maxCaseDurationMs = durationMs;
    }
  };

  const checkCommonInvariants = (execResult, perspective, caseName, caseMaxDurationMs) => {
    // 1. Deteksi Mutasi Input Ilegal (Side-Effect Contamination)
    if (execResult.inputMutated) {
      report.failures.push({
        perspective,
        classification: 'Input-Mutation-Side-Effect',
        caseName,
        input: execResult.inputSnapshot,
        mutatedInput: execResult.postExecutionInput,
        detail: 'Subject memutasi objek/array input secara in-place.'
      });
    }

    // 2. Deteksi Regresi Latensi / Bottleneck Performa
    const budgetMs = caseMaxDurationMs ?? options.maxDurationMs;
    if (typeof budgetMs === 'number' && execResult.durationMs > budgetMs) {
      report.failures.push({
        perspective,
        classification: 'Performance-Bottleneck',
        caseName,
        input: execResult.inputSnapshot,
        durationMs: execResult.durationMs,
        budgetMs,
        detail: `Durasi eksekusi (${execResult.durationMs}ms) melampaui batas (${budgetMs}ms).`
      });
    }
  };

  // ============================================================================
  // 1. GERBANG PRIMER: Uji Kasus Reproduksi Deterministik / Spesifikasi Utama
  // ============================================================================
  if (primaryCases.length > 0) {
    let primaryGateFailures = 0;

    for (const test of primaryCases) {
      const execResult = executeIsolated(suiteSpec.subject, test.input, {
        comparator,
        enforceImmutability: test.enforceImmutability ?? options.enforceImmutability
      });
      recordExecutionMetrics(execResult.durationMs);

      if (!execResult.ok) {
        primaryGateFailures += 1;
        report.failures.push({
          perspective: 'Primary-Target',
          classification: 'Uncaught-Exception',
          caseName: test.name,
          input: execResult.inputSnapshot,
          expected: test.expected,
          error: execResult.error,
          durationMs: execResult.durationMs
        });
        continue;
      }

      if (!comparator(execResult.actual, test.expected)) {
        primaryGateFailures += 1;
        report.failures.push({
          perspective: 'Primary-Target',
          classification: 'Implementation-Defect',
          caseName: test.name,
          input: execResult.inputSnapshot,
          expected: test.expected,
          actual: execResult.actual,
          durationMs: execResult.durationMs
        });
      }

      // Uji Determinisme / Idempotensi (Memastikan tidak ada state bocor antar pemanggilan)
      for (let run = 1; run < options.determinismRuns; run++) {
        const repeatResult = executeIsolated(suiteSpec.subject, test.input, {
          comparator,
          enforceImmutability: false
        });
        recordExecutionMetrics(repeatResult.durationMs);

        if (!repeatResult.ok || !comparator(repeatResult.actual, execResult.actual)) {
          primaryGateFailures += 1;
          report.failures.push({
            perspective: 'Primary-Target',
            classification: 'Nondeterministic-Behavior',
            caseName: test.name,
            input: execResult.inputSnapshot,
            firstRunActual: execResult.actual,
            repeatRunActual: repeatResult.actual,
            repeatError: repeatResult.error,
            detail: `Hasil berubah pada eksekusi ulang ke-${run + 1}.`
          });
          break;
        }
      }

      checkCommonInvariants(execResult, 'Primary-Target', test.name, test.maxDurationMs);
    }

    report.perspectivesChecked.push('Primary-Target');
    report.primaryPassed = primaryGateFailures === 0;
  } else {
    report.unverifiedPerspectives.push('Primary-Target');
    report.primaryPassed = false;
  }

  // ============================================================================
  // 2. GERBANG PERSPEKTIF BATAS & RACUN (Poison & Boundary Injection)
  // ============================================================================
  if (poisonInputs.length > 0) {
    for (const poison of poisonInputs) {
      const execResult = executeIsolated(suiteSpec.subject, poison.input, {
        comparator,
        enforceImmutability: poison.enforceImmutability ?? options.enforceImmutability
      });
      recordExecutionMetrics(execResult.durationMs);

      if (!execResult.ok) {
        // Jika subject melempar exception, periksa apakah memang diharapkan melempar error
        if (!poison.expectThrow) {
          report.failures.push({
            perspective: 'Boundary-And-Poison',
            classification: 'Uncaught-Exception',
            caseName: poison.name,
            input: execResult.inputSnapshot,
            detail: poison.failureHint || 'Subject melempar exception yang tidak tertangani.',
            error: execResult.error,
            durationMs: execResult.durationMs
          });
        } else if (!matchesExpectedError(execResult.rawError, poison.expectedError || poison.expectThrow)) {
          report.failures.push({
            perspective: 'Boundary-And-Poison',
            classification: 'Wrong-Exception-Type',
            caseName: poison.name,
            input: execResult.inputSnapshot,
            detail: 'Subject melempar error, tetapi tipe/pesan error tidak sesuai spesifikasi.',
            error: execResult.error,
            durationMs: execResult.durationMs
          });
        }
        continue;
      }

      // Subject TIDAK melempar error, padahal expectThrow disetel true
      if (poison.expectThrow) {
        report.failures.push({
          perspective: 'Boundary-And-Poison',
          classification: 'Missing-Expected-Exception',
          caseName: poison.name,
          input: execResult.inputSnapshot,
          detail: poison.failureHint || 'Subject seharusnya menolak input racun dengan melempar error, namun berhasil lolos.',
          actual: execResult.actual,
          durationMs: execResult.durationMs
        });
        continue;
      }

      // Validasi invarian (dipisahkan dari try/catch subject agar bug pada invariantCheck tidak tertelan)
      if (typeof poison.invariantCheck === 'function') {
        try {
          const valid = Boolean(poison.invariantCheck(execResult.actual, safeClone(poison.input)));
          if (!valid) {
            report.failures.push({
              perspective: 'Boundary-And-Poison',
              classification: 'Unhandled-Edge-Case',
              caseName: poison.name,
              input: execResult.inputSnapshot,
              detail: poison.failureHint || 'Invarian batas dilanggar.',
              actual: execResult.actual,
              durationMs: execResult.durationMs
            });
          }
        } catch (verifierErr) {
          report.failures.push({
            perspective: 'Boundary-And-Poison',
            classification: 'Verifier-Defect',
            caseName: poison.name,
            input: execResult.inputSnapshot,
            detail: 'Fungsi invariantCheck melempar exception saat memeriksa output.',
            error: serializeError(verifierErr)
          });
        }
      }

      checkCommonInvariants(execResult, 'Boundary-And-Poison', poison.name, poison.maxDurationMs);
    }
    report.perspectivesChecked.push('Boundary-And-Poison');
  } else {
    report.unverifiedPerspectives.push('Boundary-And-Poison');
  }

  // ============================================================================
  // 3. GERBANG EKUIVALENSI ORACLE (Differential Oracle Verification)
  // ============================================================================
  if (typeof suiteSpec.referenceOracle === 'function' && generatedSamples.length > 0) {
    let oracleDriftCount = 0;

    for (let i = 0; i < generatedSamples.length; i++) {
      const sample = generatedSamples[i];
      // Isolasi input untuk referenceOracle dan subject agar tidak saling mengontaminasi
      const oracleResult = executeIsolated(suiteSpec.referenceOracle, sample, {
        comparator,
        enforceImmutability: false
      });
      const subjectResult = executeIsolated(suiteSpec.subject, sample, {
        comparator,
        enforceImmutability: options.enforceImmutability
      });
      recordExecutionMetrics(subjectResult.durationMs);

      if (oracleResult.ok !== subjectResult.ok) {
        oracleDriftCount += 1;
        report.failures.push({
          perspective: 'Differential-Equivalence',
          classification: 'Behavioral-Drift-Exception-Mismatch',
          sampleIndex: i,
          input: subjectResult.inputSnapshot,
          expected: oracleResult.ok ? oracleResult.actual : oracleResult.error,
          actual: subjectResult.ok ? subjectResult.actual : subjectResult.error,
          durationMs: subjectResult.durationMs
        });
      } else if (oracleResult.ok && !comparator(subjectResult.actual, oracleResult.actual)) {
        oracleDriftCount += 1;
        report.failures.push({
          perspective: 'Differential-Equivalence',
          classification: 'Behavioral-Drift',
          sampleIndex: i,
          input: subjectResult.inputSnapshot,
          expected: oracleResult.actual,
          actual: subjectResult.actual,
          durationMs: subjectResult.durationMs
        });
      }

      checkCommonInvariants(
        subjectResult,
        'Differential-Equivalence',
        `Oracle-Sample-${i}`,
        options.maxDurationMs
      );

      if (
        oracleDriftCount > 0 &&
        (options.stopOnFirstOracleDrift || oracleDriftCount >= options.maxOracleFailures)
      ) {
        break;
      }
    }
    report.perspectivesChecked.push('Differential-Equivalence');
  } else if (suiteSpec.domain === 'low-level' || suiteSpec.referenceOracle) {
    report.unverifiedPerspectives.push('Differential-Equivalence');
  }

  // ============================================================================
  // 4. GERBANG POST-PASS & REGRESI SEKUNDER (Zero Regression pada Jalur Tetangga)
  // ============================================================================
  if (regressionSuite.length > 0) {
    for (const regCase of regressionSuite) {
      const execResult = executeIsolated(suiteSpec.subject, regCase.input, {
        comparator,
        enforceImmutability: regCase.enforceImmutability ?? options.enforceImmutability
      });
      recordExecutionMetrics(execResult.durationMs);

      if (!execResult.ok) {
        report.failures.push({
          perspective: 'Post-PASS-Regression',
          classification: 'Secondary-Regression-Exception',
          regressionId: regCase.id,
          caseName: regCase.name || regCase.id,
          input: execResult.inputSnapshot,
          expected: regCase.expected,
          error: execResult.error,
          durationMs: execResult.durationMs
        });
        continue;
      }

      if (!comparator(execResult.actual, regCase.expected)) {
        report.failures.push({
          perspective: 'Post-PASS-Regression',
          classification: 'Secondary-Regression',
          regressionId: regCase.id,
          caseName: regCase.name || regCase.id,
          input: execResult.inputSnapshot,
          expected: regCase.expected,
          actual: execResult.actual,
          durationMs: execResult.durationMs
        });
      }

      checkCommonInvariants(
        execResult,
        'Post-PASS-Regression',
        regCase.name || regCase.id,
        regCase.maxDurationMs
      );
    }
    report.perspectivesChecked.push('Post-PASS-Regression');
  } else {
    report.unverifiedPerspectives.push('Post-PASS-Regression');
  }

  // ============================================================================
  // 5. AUTO-GENERATION KANDIDAT REGRESI & EVALUASI PENYELESAIAN KETAT
  // ============================================================================
  report.generatedRegressionCandidates = report.failures
    .filter((f) => f.perspective !== 'Post-PASS-Regression' && f.input !== undefined)
    .map((f, idx) => buildRegressionCandidate(f, idx));

  const requiredGates = ['Primary-Target', 'Boundary-And-Poison', 'Post-PASS-Regression'];
  if (suiteSpec.domain === 'low-level' || typeof suiteSpec.referenceOracle === 'function') {
    requiredGates.push('Differential-Equivalence');
  }

  const allRequiredGatesChecked = options.requireAllPerspectives
    ? requiredGates.every((gate) => report.perspectivesChecked.includes(gate))
    : report.perspectivesChecked.includes('Primary-Target');

  // Aturan Ketat: "Hijau" pada Primary Test TIDAK dianggap selesai jika:
  // - Ada kegagalan di perspektif mana pun, ATAU
  // - Ada gerbang wajib yang kosong / dilewati secara vakum (vacuous pass).
  report.isCompleteAndVerified =
    report.primaryPassed &&
    report.failures.length === 0 &&
    allRequiredGatesChecked;

  return report;
}