import { describe, test, expect } from 'vitest';
import { MultiWorldHologram } from '../../app/rag/multi-world';

describe('MultiWorldHologram', () => {
  const DIM = 32;
  const NUM_DOCS = 50;
  const MAX_WORLDS = 3;

  function randomVec(dim: number): Float32Array {
    const v = new Float32Array(dim);
    for (let i = 0; i < dim; i++) v[i] = Math.random() * 2 - 1;
    const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
    if (norm > 0) for (let i = 0; i < dim; i++) v[i]! /= norm;
    return v;
  }

  test('initTrunk sets world 0 active', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    
    expect(mw.active[0]).toBe(1);
    expect(mw.superposition[0]).toBe(1.0);
    expect(mw.worldNames[0]).toBe('trunk');
  });

  test('fork copies world state', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    weights[0] = 1.0;
    
    mw.initTrunk(docs, weights, 'trunk');
    const success = mw.fork(0, 1, 'branch');
    
    expect(success).toBe(true);
    expect(mw.active[1]).toBe(1);
    expect(mw.superposition[1]).toBeCloseTo(0.95, 5);
    expect(mw.worldNames[1]).toBe('branch');
    expect(mw.worlds[1]!.totalWeight).toBe(mw.worlds[0]!.totalWeight);
  });

  test('fork fails for inactive source', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    expect(mw.fork(0, 1, 'fail')).toBe(false);
  });

  test('fork fails for occupied target', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    mw.fork(0, 1, 'branch');
    
    expect(mw.fork(0, 1, 'fail')).toBe(false);
  });

  test('prune clears world state', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    mw.prune(0);
    
    expect(mw.active[0]).toBe(0);
    expect(mw.worlds[0]!.totalWeight).toBe(0);
    expect(Array.from(mw.worlds[0]!.firstMoment).every((x: number) => x === 0)).toBe(true);
  });

  test('collapse merges branch to trunk', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    weights[0] = 1.0;
    
    mw.initTrunk(docs, weights, 'trunk');
    mw.fork(0, 1, 'branch');
    
    const v = randomVec(DIM);
    mw.worlds[1]!.encode(1, v, 1.0);
    
    const trunkWeightBefore = mw.worlds[0]!.docWeights[1]!;
    mw.collapse(1, 0);
    
    expect(mw.active[1]).toBe(0); // branch pruned
    expect(mw.worlds[0]!.docWeights[1]).toBeGreaterThan(trunkWeightBefore);
  });

  test('reconstructSuperposed averages worlds', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    
    const v1 = randomVec(DIM);
    const v2 = randomVec(DIM);
    mw.worlds[0]!.encode(0, v1, 1.0);
    
    mw.fork(0, 1, 'branch');
    mw.worlds[1]!.encode(0, v2, 1.0);
    
    mw.setQueryMask([0, 1]);
    mw.superposition[0] = 0.5;
    mw.superposition[1] = 0.5;
    
    const q = randomVec(DIM);
    const out = new Float32Array(DIM);
    const coh = mw.reconstructSuperposed(q, out);
    
    expect(coh).toBeGreaterThanOrEqual(0);
    expect(coh).toBeLessThanOrEqual(1);
    
    const norm = Math.sqrt(out.reduce((a, b) => a + b * b, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  test('diff detects world contradictions', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    mw.fork(0, 1, 'branch');
    
    const v = randomVec(DIM);
    const opp = new Float32Array(DIM);
    for (let i = 0; i < DIM; i++) opp[i] = -v[i]!;
    
    mw.worlds[0]!.encode(0, v, 1.0);
    mw.worlds[1]!.encode(0, opp, 1.0);
    
    const out = new Float32Array(DIM);
    const diff = mw.diff(0, 1, v, out);
    
    expect(diff).toBeGreaterThan(1.0); // high difference
  });

  test('validateCrossWorld finds weakest link', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    mw.fork(0, 1, 'branch');
    
    const v = randomVec(DIM);
    mw.worlds[0]!.encode(0, v, 1.0);

    const orthV = randomVec(DIM);
    let dot = 0;
    for (let i = 0; i < DIM; i++) dot += orthV[i]! * v[i]!;
    for (let i = 0; i < DIM; i++) orthV[i]! -= dot * v[i]!;
    let norm = Math.sqrt(orthV.reduce((a, b) => a + b * b, 0));
    if (norm > 0) for (let i = 0; i < DIM; i++) orthV[i]! /= norm;
    mw.worlds[1]!.encode(0, orthV, 1.0);
    
    const result = mw.validateCrossWorld(v);
    
    expect(result.consistent).toBe(false);
    expect(result.weakestWorld).toBe(1);
    expect(result.action).toBe('retcon');
  });

  test('epistemicQuery detects fractured reality', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    mw.fork(0, 1, 'branch');
    
    const v = randomVec(DIM);
    const opp = new Float32Array(DIM);
    for (let i = 0; i < DIM; i++) opp[i] = -v[i]!;
    
    mw.worlds[0]!.encode(0, v, 1.0);
    mw.worlds[1]!.encode(0, opp, 1.0);
    
    mw.setQueryMask([0, 1]);
    mw.superposition[0] = 0.5;
    mw.superposition[1] = 0.5;
    
    const out = new Float32Array(DIM);
    const result = mw.epistemicQuery(v, out);
    
    expect(result.fractured).toBe(true);
    expect(result.worldBreakdown.length).toBe(2);
  });

  test('induceParadox equalizes superposition', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    
    mw.initTrunk(docs, weights, 'trunk');
    mw.fork(0, 1, 'branch');
    
    mw.induceParadox();
    
    expect(mw.superposition[0]).toBe(0.5);
    expect(mw.superposition[1]).toBe(0.5);
  });

  test('[REG-20261028-015] fork sanitizes rehearsed Uint8Array padding bits (0xFE) and prune resets rehearsed/salience', () => {
    const mw = new MultiWorldHologram(MAX_WORLDS, DIM, NUM_DOCS);
    const docs = new Float32Array(NUM_DOCS * DIM);
    const weights = new Float32Array(NUM_DOCS);
    weights[0] = 1.0;
    weights[1] = 1.0;

    mw.initTrunk(docs, weights, 'trunk');
    // Inject dirty byte-padding bits on trunk
    mw.worlds[0]!.rehearsed[0] = 0b1111_1110; // 0xFE (LSB = 0 -> not rehearsed)
    mw.worlds[0]!.rehearsed[1] = 0b1111_1111; // 0xFF (LSB = 1 -> rehearsed)
    mw.worlds[0]!.rehearsed[2] = 0xFF;        // inactive doc (weight = 0)
    mw.worlds[0]!.setSalience(1, 2.5);

    mw.fork(0, 1, 'branch_a');
    expect(mw.worlds[1]!.rehearsed[0]).toBe(0);
    expect(mw.worlds[1]!.rehearsed[1]).toBe(1);
    expect(mw.worlds[1]!.rehearsed[2]).toBe(0);
    expect(mw.worlds[1]!.salience[1]).toBeCloseTo(2.5, 5);

    // Mutate branch_a and prune it; verify recycled slot has clean rehearsed & salience buffers
    mw.worlds[1]!.rehearsed[0] = 0xFF;
    mw.worlds[1]!.setSalience(0, 4.0);
    mw.prune(1);

    expect(mw.worlds[1]!.rehearsed.every(b => b === 0)).toBe(true);
    expect(mw.worlds[1]!.salience.every(s => s === 1)).toBe(true);
  });
});
