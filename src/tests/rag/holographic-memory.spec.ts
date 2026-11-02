import { describe, test, expect } from 'vitest';
import { HolographicMemoryField, EpistemicRetrievalKernel, ContinuousHRR } from '../../app/rag/holographic-memory';

describe('HolographicMemoryField', () => {
  const DIM = 64;
  const NUM_DOCS = 100;

  function randomVec(dim: number): Float32Array {
    const v = new Float32Array(dim);
    for (let i = 0; i < dim; i++) v[i] = Math.random() * 2 - 1;
    const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
    if (norm > 0) for (let i = 0; i < dim; i++) v[i] /= norm;
    return v;
  }

  test('encode updates first and second moments', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);
    
    hf.encode(0, v, 1.0);
    
    expect(hf.totalWeight).toBe(1);
    expect(hf.firstMoment.some(x => x !== 0)).toBe(true);
    expect(hf.secondMoment.some(x => x !== 0)).toBe(true);
  });

  test('encode with same weight is no-op', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);
    
    hf.encode(0, v, 1.0);
    const fmBefore = new Float32Array(hf.firstMoment);
    
    hf.encode(0, v, 1.0); // same weight
    
    expect(hf.firstMoment).toEqual(fmBefore);
    expect(hf.totalWeight).toBe(1);
  });

  test('encodeBatch is equivalent to sequential encode', () => {
    const hf1 = new HolographicMemoryField(DIM, NUM_DOCS);
    const hf2 = new HolographicMemoryField(DIM, NUM_DOCS);
    
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    for (let d = 0; d < NUM_DOCS; d++) {
      const v = randomVec(DIM);
      docs.set(v, d * DIM);
      weights[d] = Math.random();
      hf1.encode(d, v, weights[d]);
    }
    
    hf2.encodeBatch(docs, weights);
    
    expect(hf1.totalWeight).toBeCloseTo(hf2.totalWeight, 5);
    // Custom logic to check close array
    for (let i=0; i<hf1.firstMoment.length; i++) {
        expect(hf1.firstMoment[i]).toBeCloseTo(hf2.firstMoment[i]!, 5);
    }
  });

  test('reconstruct returns 0 for empty field', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const q = randomVec(DIM);
    const out = new Float32Array(DIM);
    
    const coh = hf.reconstruct(q, out);
    
    expect(coh).toBe(0);
    expect(out.every(x => x === 0)).toBe(true);
  });

  test('reconstruct coherence is 1 for exact stored vector', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);
    
    hf.encode(0, v, 1.0);
    
    const out = new Float32Array(DIM);
    const coh = hf.reconstruct(v, out);
    
    expect(coh).toBeCloseTo(1, 2);
  });

  test('reconstruct output is normalized', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v1 = randomVec(DIM);
    const v2 = randomVec(DIM);
    
    hf.encode(0, v1, 1.0);
    hf.encode(1, v2, 1.0);
    
    const q = randomVec(DIM);
    const out = new Float32Array(DIM);
    hf.reconstruct(q, out);
    
    const norm = Math.sqrt(out.reduce((a, b) => a + b * b, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  test('measureUncertainty confident for peaked distribution', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const scores = new Float32Array([0.9, 0.05, 0.03, 0.02]);
    
    const u = hf.measureUncertainty(scores, 4);
    
    expect(u.confident).toBe(true);
    expect(u.entropy).toBeLessThan(0.5);
    expect(u.gini).toBeGreaterThan(0.5);
  });

  test('measureUncertainty not confident for flat distribution', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const scores = new Float32Array([0.25, 0.25, 0.25, 0.25]);
    
    const u = hf.measureUncertainty(scores, 4);
    
    expect(u.confident).toBe(false);
    expect(u.entropy).toBeCloseTo(1, 1);
    expect(u.gini).toBeLessThan(0.3);
  });

  test('measureUncertainty handles single score', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const scores = new Float32Array([1.0]);
    
    const u = hf.measureUncertainty(scores, 1);
    
    expect(u.confident).toBe(false); // edge case: not enough data
    expect(u.entropy).toBe(1);
  });

  test('measureUncertainty does not mutate input scores', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const scores = new Float32Array([0.5, 0.3, 0.2]);
    const original = new Float32Array(scores);
    
    hf.measureUncertainty(scores, 3);
    
    expect(scores).toEqual(original);
  });

  test('expansionGradient direction points toward memory', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);
    hf.encode(0, v, 1.0);
    
    const q = randomVec(DIM); // random query, likely low coherence
    const grad = new Float32Array(DIM);
    const coh = hf.expansionGradient(q, grad);
    
    const norm = Math.sqrt(grad.reduce((a, b) => a + b * b, 0));
    expect(norm).toBeCloseTo(1, 5); // normalized
    
    // Gradient should increase coherence when followed
    const step = 0.1;
    const newQ = new Float32Array(DIM);
    for (let i = 0; i < DIM; i++) newQ[i] = q[i]! + grad[i]! * step;
    const newCoh = hf.reconstruct(newQ, new Float32Array(DIM));
    expect(newCoh).toBeGreaterThan(coh);
  });

  test('checkAnomaly detects critical for contradictory vector', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);
    hf.encode(0, v, 1.0);
    
    const opposite = new Float32Array(DIM);
    for (let i = 0; i < DIM; i++) opposite[i] = -v[i]!;
    
    const anomaly = hf.checkAnomaly(opposite);
    
    expect(anomaly.isAnomaly).toBe(true);
    expect(anomaly.severity).toBe('critical');
  });

  test('scheduleDecay reduces weights', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);
    
    hf.encode(0, v, 1.0);
    expect(hf.docWeights[0]).toBe(1.0);
    
    hf.scheduleDecay(0.9, 'lazy', 1); // force rebuild
    
    expect(hf.docWeights[0]).toBeLessThan(1.0);
    expect(hf.docWeights[0]).toBeGreaterThan(0);
  });

  test('scheduleDecay with rehearsed flag protects weight', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);
    
    hf.encode(0, v, 1.0);
    hf.markRehearsed(0);
    
    const wBefore = hf.docWeights[0]!;
    hf.scheduleDecay(0.9, 'lazy', 1);
    const wAfter = hf.docWeights[0]!;
    
    // Rehearsed decays slower (factor 1.05)
    expect(wAfter).toBeGreaterThan(wBefore * 0.9);
  });

  test('getRollingCoherence averages history correctly', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS, 4);
    
    // Simulate 3 queries with known coherence
    const scores1 = new Float32Array([0.9, 0.1]);
    const scores2 = new Float32Array([0.8, 0.2]);
    const scores3 = new Float32Array([0.7, 0.3]);
    
    const r1 = hf.measureUncertainty(scores1, 2);
    const r2 = hf.measureUncertainty(scores2, 2);
    const r3 = hf.measureUncertainty(scores3, 2);
    
    const rolling = hf.getRollingCoherence();
    expect(rolling).toBeCloseTo((r1.coherence + r2.coherence + r3.coherence) / 3, 5);
  });

  test('[REG-20261028-015] rehearsed Uint8Array ignores dirty upper byte-padding bits (0xFE) when LSB bit 0 is 0', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v0 = randomVec(DIM);
    const v1 = randomVec(DIM);
    const v2 = randomVec(DIM);

    hf.encode(0, v0, 1.0);
    hf.encode(1, v1, 1.0);
    hf.encode(2, v2, 1.0);

    // Slot 0: dirty upper padding bits (bits 1..7 set, e.g. 0x02, 0x80, 0xFE = 254), LSB bit 0 = 0 -> NOT rehearsed
    hf.rehearsed[0] = 0b1111_1110; // 254 (0xFE)
    // Slot 1: dirty upper padding bits + LSB bit 0 = 1 (0xFF = 255) -> rehearsed
    hf.rehearsed[1] = 0b1111_1111; // 255 (0xFF)
    // Slot 2: canonical 0 -> NOT rehearsed
    hf.rehearsed[2] = 0;
    // Slot 3 (inactive doc, weight 0): dirty byte 0xFF -> must NOT be counted as rehearsed
    hf.rehearsed[3] = 0xFF;

    const statsBefore = hf.getEpisodicStats();
    expect(statsBefore.activeDocs).toBe(3);
    expect(statsBefore.rehearsedLastTick).toBe(1);

    hf.scheduleDecay(0.9, 'lazy', 10);

    // Doc 0 (0xFE, LSB=0) must decay identically to Doc 2 (0x00), NOT receive the 1.05x rehearsal boost
    expect(hf.docWeights[0]).toBeCloseTo(0.9, 6);
    expect(hf.docWeights[2]).toBeCloseTo(0.9, 6);
    // Doc 1 (0xFF, LSB=1) receives the 1.05x rehearsal protection factor
    expect(hf.docWeights[1]).toBeCloseTo(0.9 * 1.05, 6);
    // All rehearsed bytes (including dirty padding bits) are zeroed after scheduleDecay
    expect(hf.rehearsed.every(b => b === 0)).toBe(true);
  });

  test('[REG-20261028-015] sanitizeRehearsedPaddingBits strips 0xFE padding noise and clears evicted/inactive slots', () => {
    const hf = new HolographicMemoryField(DIM, NUM_DOCS);
    const v = randomVec(DIM);

    hf.encode(0, v, 1.0);
    hf.encode(1, v, 1.0);
    hf.encode(2, v, 1.0);

    hf.rehearsed[0] = 0b1010_1010; // 170 (even -> LSB 0, dirty upper bits)
    hf.rehearsed[1] = 0b1010_1011; // 171 (odd -> LSB 1, dirty upper bits)
    hf.rehearsed[2] = 1;           // canonical 1
    hf.rehearsed[5] = 1;           // inactive slot (docWeights[5] === 0)

    const repaired = hf.sanitizeRehearsedPaddingBits();
    expect(repaired).toBe(3); // slots 0, 1, and 5 repaired
    expect(hf.rehearsed[0]).toBe(0);
    expect(hf.rehearsed[1]).toBe(1);
    expect(hf.rehearsed[2]).toBe(1);
    expect(hf.rehearsed[5]).toBe(0);

    // Evicting doc 2 (weight = 0) automatically clears its rehearsal byte
    hf.encode(2, v, 0);
    expect(hf.docWeights[2]).toBe(0);
    expect(hf.rehearsed[2]).toBe(0);
  });
});

describe('ContinuousHRR', () => {
  const DIM = 128;

  test('generateUnitVector creates normalized vectors', () => {
    const v1 = ContinuousHRR.generateUnitVector(DIM);
    const v2 = ContinuousHRR.generateUnitVector(DIM, 'seed_elden_ring');
    const v3 = ContinuousHRR.generateUnitVector(DIM, 'seed_elden_ring');

    expect(v1.length).toBe(DIM);
    expect(ContinuousHRR.similarity(v1, v1)).toBeCloseTo(1, 4);
    expect(ContinuousHRR.similarity(v2, v3)).toBeCloseTo(1, 5); // deterministic seed match
  });

  test('binding produces quasi-orthogonal vector', () => {
    const role = ContinuousHRR.generateUnitVector(DIM, 'role_subject');
    const filler = ContinuousHRR.generateUnitVector(DIM, 'npc_malenia');

    const bound = ContinuousHRR.bind(role, filler);

    // Quasi-orthogonality
    expect(Math.abs(ContinuousHRR.similarity(bound, role))).toBeLessThan(0.3);
    expect(Math.abs(ContinuousHRR.similarity(bound, filler))).toBeLessThan(0.3);
    expect(ContinuousHRR.similarity(bound, bound)).toBeCloseTo(1, 4);
  });

  test('unbinding recovers original filler vector with high similarity', () => {
    const role = ContinuousHRR.generateUnitVector(DIM, 'role_weapon');
    const filler = ContinuousHRR.generateUnitVector(DIM, 'item_moonlight_sword');

    const bound = ContinuousHRR.bind(role, filler);
    const recovered = ContinuousHRR.unbind(role, bound);

    const sim = ContinuousHRR.similarity(recovered, filler);
    expect(sim).toBeGreaterThan(0.55);
  });

  test('superposition bundles multiple bound pairs and recovers fillers via clean-up', () => {
    const roleSubject = ContinuousHRR.generateUnitVector(DIM, 'role_subj');
    const roleVerb = ContinuousHRR.generateUnitVector(DIM, 'role_verb');
    const roleObject = ContinuousHRR.generateUnitVector(DIM, 'role_obj');

    const npcRadahn = ContinuousHRR.generateUnitVector(DIM, 'npc_radahn');
    const actionDefend = ContinuousHRR.generateUnitVector(DIM, 'action_defend');
    const locCaelid = ContinuousHRR.generateUnitVector(DIM, 'loc_caelid');

    // Bundle: Subject=Radahn + Verb=Defend + Object=Caelid
    const relation = ContinuousHRR.encodeRelation([
      { role: roleSubject, filler: npcRadahn },
      { role: roleVerb, filler: actionDefend },
      { role: roleObject, filler: locCaelid },
    ]);

    const codebook = new Map<string, Float32Array>([
      ['Radahn', npcRadahn],
      ['Malenia', ContinuousHRR.generateUnitVector(DIM, 'npc_malenia')],
      ['Defend', actionDefend],
      ['Attack', ContinuousHRR.generateUnitVector(DIM, 'action_attack')],
      ['Caelid', locCaelid],
      ['Leyndell', ContinuousHRR.generateUnitVector(DIM, 'loc_leyndell')],
    ]);

    // Extract Subject
    const resSubject = ContinuousHRR.extractFiller(relation, roleSubject, codebook);
    expect(resSubject.cleanMatch?.bestMatch).toBe('Radahn');
    expect(resSubject.cleanMatch?.margin).toBeGreaterThan(0.1);

    // Extract Verb
    const resVerb = ContinuousHRR.extractFiller(relation, roleVerb, codebook);
    expect(resVerb.cleanMatch?.bestMatch).toBe('Defend');

    // Extract Object
    const resObj = ContinuousHRR.extractFiller(relation, roleObject, codebook);
    expect(resObj.cleanMatch?.bestMatch).toBe('Caelid');
  });

  test('fractional power interpolates continuous scalar/time field', () => {
    const timeBase = ContinuousHRR.generateUnitVector(DIM, 'time_base');

    const t0 = ContinuousHRR.fractionalPower(timeBase, 0);
    const t0_2 = ContinuousHRR.fractionalPower(timeBase, 0.2);
    const t1 = ContinuousHRR.fractionalPower(timeBase, 1.0);
    const t2 = ContinuousHRR.fractionalPower(timeBase, 2.0);

    // Continuous decay of similarity with increasing temporal distance
    expect(ContinuousHRR.similarity(t0, t0_2)).toBeGreaterThan(0.8);
    expect(ContinuousHRR.similarity(t0, t0_2)).toBeGreaterThan(ContinuousHRR.similarity(t0, t1));
    expect(ContinuousHRR.similarity(t0, t1)).toBeGreaterThan(ContinuousHRR.similarity(t0, t2));
  });

  test('HolographicMemoryField integration with continuous HRR', () => {
    const hf = new HolographicMemoryField(DIM, 10);

    const roleQuest = ContinuousHRR.generateUnitVector(DIM, 'role_quest');
    const fillerEldenRing = ContinuousHRR.generateUnitVector(DIM, 'quest_restore_order');

    hf.bindAndSuperpose(roleQuest, fillerEldenRing, 1.0);

    const codebook = new Map<string, Float32Array>([
      ['RestoreOrder', fillerEldenRing],
      ['ChaosFlame', ContinuousHRR.generateUnitVector(DIM, 'quest_chaos')],
    ]);

    const result = hf.hrrRelationalLookup(roleQuest, codebook);
    expect(result.bestMatch).toBe('RestoreOrder');
    expect(result.similarity).toBeGreaterThan(0.6);
  });
});

