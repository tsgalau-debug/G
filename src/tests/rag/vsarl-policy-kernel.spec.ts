import { describe, it, expect, beforeEach } from 'vitest';
import { VSARLPolicyKernel, NpcPersonalityFactory, NpcPersonalityProfile } from '../../app/rag/vsarl-policy-kernel';

describe('VSARLPolicyKernel', () => {
  let kernel: VSARLPolicyKernel;
  const stateDim = 32;
  const actionCount = 6;
  const replayCapacity = 100;

  beforeEach(() => {
    kernel = new VSARLPolicyKernel(stateDim, actionCount, replayCapacity);
  });

  it('should initialize correctly', () => {
    expect(kernel.stateDim).toBe(stateDim);
    expect(kernel.actionCount).toBe(actionCount);
    expect(kernel.replayCapacity).toBe(replayCapacity);
    expect(kernel.policyFHRR.length).toBe(actionCount * stateDim);
    expect(kernel.replayStates.length).toBe(replayCapacity * stateDim);
  });

  it('should encode state', () => {
    const rawState = new Float32Array(stateDim);
    for (let i = 0; i < stateDim; i++) {
        rawState[i] = Math.random() - 0.5;
    }
    const encoded = new Float32Array(stateDim);
    kernel.encodeState(rawState, encoded);

    // check normalization
    let norm = 0;
    for (let i = 0; i < stateDim; i++) {
        norm += encoded[i]! * encoded[i]!;
    }
    expect(norm).toBeCloseTo(1, 4);
  });

  it('should pack and unpack state', () => {
      const dense = new Float32Array(stateDim);
      for (let i=0; i<stateDim; i++) dense[i] = Math.random() > 0.5 ? 1 : -1;
      
      const binary = new Uint32Array(kernel.stateWords);
      kernel.packState(dense, binary, 0);

      const unpacked = new Float32Array(stateDim);
      kernel.unpackState(binary, 0, unpacked);

      for (let i=0; i<stateDim; i++) {
          if (dense[i]! > 0) {
              expect(unpacked[i]).toBe(1);
          } else {
              expect(unpacked[i]).toBe(-1);
          }
      }
  });

  it('should select an action within bounds', () => {
      const state = new Float32Array(stateDim);
      state.fill(0.1);
      
      const action = kernel.selectAction(state, 1);
      expect(action).toBeGreaterThanOrEqual(0);
      expect(action).toBeLessThan(actionCount);
  });

  it('should store and learn from experience', () => {
      const stateBinary = new Uint32Array(kernel.stateWords);
      const action = 2;
      const reward = 1.0;
      const value = 0.5;
      const nextValue = 0.8;

      kernel.storeExperience(stateBinary, action, reward, value, nextValue);
      expect(kernel.replayCount).toBe(1);

      const meanTdError = kernel.learn(1);
      expect(typeof meanTdError).toBe('number');
      const stats = kernel.getStats();
      expect(stats.replayUsed).toBe(1);
  });

  describe('Multi-Agent Policy Hierarchy & Trait Conditioning', () => {
    it('should register and resolve built-in and custom NPC personalities', () => {
      const scholar = kernel.resolvePersonality('Selene');
      expect(scholar).toBeDefined();
      expect(scholar?.archetype).toBe('scholar');
      expect(scholar?.traitVector[0]).toBeCloseTo(0.95);

      const guardian = kernel.resolvePersonality('Aldric');
      expect(guardian).toBeDefined();
      expect(guardian?.archetype).toBe('guardian');
      expect(guardian?.traitVector[1]).toBeCloseTo(0.98);

      const trickster = kernel.resolvePersonality('trickster');
      expect(trickster).toBeDefined();
      expect(trickster?.archetype).toBe('trickster');
      expect(trickster?.traitVector[2]).toBeCloseTo(0.95);

      // Custom registration
      const custom: NpcPersonalityProfile = {
        id: 'mystic_oracle',
        name: 'Mystic Oracle',
        archetype: 'custom',
        traitVector: new Float32Array([0.9, 0.8, 0.7, 0.1])
      };
      kernel.registerNpc(custom);
      expect(kernel.resolvePersonality('mystic_oracle')?.name).toBe('Mystic Oracle');
    });

    it('should shape rewards differently based on personality traits', () => {
      const scholar = NpcPersonalityFactory.createScholar();
      const guardian = NpcPersonalityFactory.createGuardian();
      const trickster = NpcPersonalityFactory.createTrickster();

      const outcomeWithAnomaly = {
        coherence: 0.8,
        anomalyCount: 3,
        strategy: 0,
        latencyMs: 50
      };

      const guardianReward = kernel.shapeReward(1.0, outcomeWithAnomaly, guardian);
      const tricksterReward = kernel.shapeReward(1.0, outcomeWithAnomaly, trickster);

      // Guardian has rigorCaution=0.98, so it penalizes anomalies much more severely than Trickster (rigorCaution=0.20)
      expect(guardianReward).toBeLessThan(tricksterReward);

      // High coherence outcome with zero anomalies
      const pureOutcome = {
        coherence: 0.95,
        anomalyCount: 0,
        strategy: 3, // Holographic
        latencyMs: 20
      };

      const scholarReward = kernel.shapeReward(1.0, pureOutcome, scholar);
      // Scholar values high epistemic coherence (+0.4) and holographic retrieval (+0.1)
      expect(scholarReward).toBeGreaterThan(1.0);
    });

    it('should provide hierarchical explanation of decision introspection', () => {
      const state = new Float32Array(stateDim);
      state.fill(0.2);

      const scholar = NpcPersonalityFactory.createScholar();
      const explanation = kernel.explainAction(state, scholar);

      expect(explanation.archetype).toBe('scholar');
      expect(explanation.globalQValues.length).toBe(actionCount);
      expect(explanation.archetypeQValues.length).toBe(actionCount);
      expect(explanation.compositeScores.length).toBe(actionCount);
      expect(explanation.traitBiases.length).toBe(actionCount);
      expect(explanation.finalSelectedAction).toBeGreaterThanOrEqual(0);
      expect(explanation.finalSelectedAction).toBeLessThan(actionCount);
      expect(explanation.reasoning).toContain('SCHOLAR');
    });

    it('should update archetype sub-policies during learning with archetype tagging', () => {
      const stateBinary = new Uint32Array(kernel.stateWords);
      const action = 3;
      const reward = 2.0;
      const value = 0.5;
      const nextValue = 0.8;
      const scholarArchetypeIdx = 0;

      kernel.storeExperience(stateBinary, action, reward, value, nextValue, scholarArchetypeIdx);
      const meanError = kernel.learn(1);

      expect(typeof meanError).toBe('number');
      const stats = kernel.getStats();
      expect(stats.replayUsed).toBe(1);
    });
  });
});
