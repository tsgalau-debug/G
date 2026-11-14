/* eslint-disable */
export type AgentArchetype =
  | 'scholar'
  | 'guardian'
  | 'trickster'
  | 'merchant'
  | 'mystic'
  | 'survivor';

export type NpcArchetype = AgentArchetype;

export interface AgentPersonalityProfile {
  id: string;
  name: string;
  archetype: AgentArchetype;
  curiosity: number;
  caution: number;
  empathy: number;
  greed: number;
  mysticism: number;
  urgency: number;
}

export type NpcPersonalityProfile = AgentPersonalityProfile;

export interface VSARLPolicySnapshot {
  strategyWeights: number[];
  strategyCounts: number[];
  actionScores: number[];
  actionCounts: number[];
  archetypeStrategyW: number[];
  archetypeActionScore: number[];
  archetypeCounts: number[];
  temperature: number;
  totalUpdates: number;
  lastReward: number;
  avgReward: number;
  npcs?: AgentPersonalityProfile[];
}

export class AgentPersonalityFactory {
  static createScholar(id: string, name: string): AgentPersonalityProfile {
    return {
      id,
      name,
      archetype: 'scholar',
      curiosity: 0.9,
      caution: 0.7,
      empathy: 0.5,
      greed: 0.2,
      mysticism: 0.6,
      urgency: 0.3,
    };
  }

  static createGuardian(id: string, name: string): AgentPersonalityProfile {
    return {
      id,
      name,
      archetype: 'guardian',
      curiosity: 0.3,
      caution: 0.9,
      empathy: 0.6,
      greed: 0.1,
      mysticism: 0.2,
      urgency: 0.85,
    };
  }

  static createTrickster(id: string, name: string): AgentPersonalityProfile {
    return {
      id,
      name,
      archetype: 'trickster',
      curiosity: 0.8,
      caution: 0.2,
      empathy: 0.3,
      greed: 0.75,
      mysticism: 0.5,
      urgency: 0.6,
    };
  }

  static createMerchant(id: string, name: string): AgentPersonalityProfile {
    return {
      id,
      name,
      archetype: 'merchant',
      curiosity: 0.5,
      caution: 0.6,
      empathy: 0.4,
      greed: 0.95,
      mysticism: 0.1,
      urgency: 0.5,
    };
  }

  static createMystic(id: string, name: string): AgentPersonalityProfile {
    return {
      id,
      name,
      archetype: 'mystic',
      curiosity: 0.85,
      caution: 0.4,
      empathy: 0.75,
      greed: 0.1,
      mysticism: 0.95,
      urgency: 0.25,
    };
  }

  static createSurvivor(id: string, name: string): AgentPersonalityProfile {
    return {
      id,
      name,
      archetype: 'survivor',
      curiosity: 0.4,
      caution: 0.85,
      empathy: 0.5,
      greed: 0.6,
      mysticism: 0.2,
      urgency: 0.9,
    };
  }

  static fromEntityState(entity: {
    id?: string;
    name?: string;
    nama?: string;
    role?: string;
    pekerjaan?: string;
    traits?: string[];
    sifat?: string[];
    trust?: number;
    mood?: string;
  }): AgentPersonalityProfile {
    const rawName = entity.name || entity.nama || entity.id || 'default_agent';
    const id = (entity.id || rawName).toLowerCase().trim();
    const roleText = `${entity.role || entity.pekerjaan || ''} ${(entity.traits || entity.sifat || []).join(' ')}`.toLowerCase();
    const trust = typeof entity.trust === 'number' ? entity.trust : 50;

    let archetype: AgentArchetype = 'survivor';
    if (/scholar|cendekia|akademisi|guru|peneliti|arsiparis|librarian|researcher|analyst/.test(roleText)) {
      archetype = 'scholar';
    } else if (/guardian|guard|pengawal|security|auditor|validator|verifier|warden/.test(roleText)) {
      archetype = 'guardian';
    } else if (/merchant|pedagang|saudagar|broker|bendahara|trader|economist/.test(roleText)) {
      archetype = 'merchant';
    } else if (/mystic|peramal|visionary|philosopher|synthesizer|oracle/.test(roleText)) {
      archetype = 'mystic';
    } else if (/trickster|pencuri|mata-mata|informan|explorer|hacker|scout/.test(roleText)) {
      archetype = 'trickster';
    }

    const base =
      archetype === 'scholar'
        ? this.createScholar(id, rawName)
        : archetype === 'guardian'
          ? this.createGuardian(id, rawName)
          : archetype === 'merchant'
            ? this.createMerchant(id, rawName)
            : archetype === 'mystic'
              ? this.createMystic(id, rawName)
              : archetype === 'trickster'
                ? this.createTrickster(id, rawName)
                : this.createSurvivor(id, rawName);

    const trustNorm = Math.max(0, Math.min(1, trust / 100));
    base.empathy = Math.max(0.1, Math.min(1, base.empathy * 0.6 + trustNorm * 0.4));
    base.caution = Math.max(0.1, Math.min(1, base.caution * 0.7 + (1 - trustNorm) * 0.3));

    return base;
  }

  static fromNpcState(npc: any): AgentPersonalityProfile {
    return this.fromEntityState(npc);
  }
}

export const NpcPersonalityFactory = AgentPersonalityFactory;

/**
 * VSA-RL Policy Kernel (Vector Symbolic Architecture + Contextual Bandit)
 *
 * State representation:
 *   8 continuous epistemic features + 6 agent personality traits = 14 features -> projected to 32-D hypervector.
 *
 * Strategies (6):
 *   0: FAST_BM25
 *   1: DEEP_EXPAND
 *   2: HOLOGRAPHIC_RECON
 *   3: MULTI_WORLD_SUPER
 *   4: ANOMALY_HUNT
 *   5: CONSERVATIVE
 *
 * Actions (4):
 *   0: direct_answer
 *   1: augment_llm
 *   2: requery_expand
 *   3: escalate_full_llm
 */
export class VSARLPolicyKernel {
  readonly stateDim: number;
  readonly numStrategies: number;
  readonly numActions = 4;
  readonly numArchetypes = 6;
  readonly vdcDim: number;

  readonly strategyWeights: Float32Array;
  readonly strategyCounts: Int32Array;
  readonly actionScores: Float32Array;
  readonly actionCounts: Int32Array;

  readonly archetypeStrategyW: Float32Array;
  readonly archetypeActionScore: Float32Array;
  readonly archetypeCounts: Int32Array;

  readonly stateVec: Float32Array;
  readonly probsBuf: Float32Array;
  readonly actionProbsBuf: Float32Array;
  readonly featureProjection: Float32Array;

  private readonly npcs = new Map<string, AgentPersonalityProfile>();
  private readonly archetypeIndex: Record<AgentArchetype, number> = {
    scholar: 0,
    guardian: 1,
    trickster: 2,
    merchant: 3,
    mystic: 4,
    survivor: 5,
  };

  temperature = 0.25;
  learningRate = 0.08;
  totalUpdates = 0;
  lastReward = 0;
  avgReward = 0;

  constructor(stateDim = 32, numStrategies = 6, vdcDim = 256) {
    this.stateDim = stateDim;
    this.numStrategies = numStrategies;
    this.vdcDim = vdcDim;

    this.strategyWeights = new Float32Array(numStrategies * stateDim);
    this.strategyCounts = new Int32Array(numStrategies);
    this.actionScores = new Float32Array(numStrategies * this.numActions);
    this.actionCounts = new Int32Array(numStrategies * this.numActions);

    this.archetypeStrategyW = new Float32Array(this.numArchetypes * numStrategies * stateDim);
    this.archetypeActionScore = new Float32Array(
      this.numArchetypes * numStrategies * this.numActions
    );
    this.archetypeCounts = new Int32Array(this.numArchetypes * numStrategies);

    this.stateVec = new Float32Array(stateDim);
    this.probsBuf = new Float32Array(numStrategies);
    this.actionProbsBuf = new Float32Array(this.numActions);
    this.featureProjection = new Float32Array(14 * stateDim);

    this._initDeterministicProjection();
    this._initPriors();
  }

  private _initDeterministicProjection(): void {
    let seed = 0x9e3779b9;
    for (let i = 0; i < this.featureProjection.length; i++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      this.featureProjection[i] = ((seed >>> 0) / 0xffffffff) * 2 - 1;
    }
  }

  private _initPriors(): void {
    for (let s = 0; s < this.numStrategies; s++) {
      this.actionScores[s * 4 + 0] = 0.35;
      this.actionScores[s * 4 + 1] = 0.65;
      this.actionScores[s * 4 + 2] = 0.3;
      this.actionScores[s * 4 + 3] = 0.2;
    }

    const setBias = (arch: AgentArchetype, strat: number, fIdx: number, val: number) => {
      const aIdx = this.archetypeIndex[arch];
      const off = (aIdx * this.numStrategies + strat) * this.stateDim;
      this.archetypeStrategyW[off + (fIdx % this.stateDim)] = val;
    };

    setBias('scholar', 1, 0, 0.55);
    setBias('scholar', 2, 1, 0.45);
    setBias('guardian', 0, 2, 0.5);
    setBias('guardian', 5, 3, 0.55);
    setBias('trickster', 4, 4, 0.6);
    setBias('trickster', 3, 5, 0.45);
    setBias('merchant', 0, 6, 0.55);
    setBias('merchant', 1, 7, 0.4);
    setBias('mystic', 2, 8, 0.65);
    setBias('mystic', 3, 9, 0.55);
    setBias('survivor', 0, 10, 0.5);
    setBias('survivor', 5, 11, 0.5);
  }

  registerAgent(profile: AgentPersonalityProfile): void {
    if (!profile || !profile.id) return;
    this.npcs.set(profile.id.toLowerCase().trim(), profile);
  }

  registerNpc(profile: AgentPersonalityProfile): void {
    this.registerAgent(profile);
  }

  getNpc(idOrName?: string): AgentPersonalityProfile | undefined {
    if (!idOrName) return undefined;
    const key = idOrName.toLowerCase().trim();
    if (this.npcs.has(key)) return this.npcs.get(key);
    for (const p of this.npcs.values()) {
      if (p.name.toLowerCase() === key) return p;
    }
    return undefined;
  }

  listNpcs(): AgentPersonalityProfile[] {
    return Array.from(this.npcs.values());
  }

  resolvePersonality(
    npcOrId?: string | Partial<AgentPersonalityProfile> | any
  ): AgentPersonalityProfile | undefined {
    if (!npcOrId) return undefined;
    if (typeof npcOrId === 'string') {
      const found = this.getNpc(npcOrId);
      if (found) return found;
      return AgentPersonalityFactory.fromEntityState({ id: npcOrId, name: npcOrId });
    }
    if (typeof npcOrId === 'object') {
      if (npcOrId.archetype && typeof npcOrId.curiosity === 'number') {
        const prof = npcOrId as AgentPersonalityProfile;
        this.registerAgent(prof);
        return prof;
      }
      const synthesized = AgentPersonalityFactory.fromEntityState(npcOrId);
      this.registerAgent(synthesized);
      return synthesized;
    }
    return undefined;
  }

  encodeState(
    coherence: number,
    entropy: number,
    gini: number,
    queryLenNorm: number,
    worldCountNorm: number,
    anomalyRate: number,
    recentSuccessRate: number,
    avgScore: number,
    npc?: AgentPersonalityProfile
  ): Float32Array {
    const raw = new Float32Array(14);
    raw[0] = coherence;
    raw[1] = entropy;
    raw[2] = gini;
    raw[3] = queryLenNorm;
    raw[4] = worldCountNorm;
    raw[5] = anomalyRate;
    raw[6] = recentSuccessRate;
    raw[7] = avgScore;

    if (npc) {
      raw[8] = npc.curiosity;
      raw[9] = npc.caution;
      raw[10] = npc.empathy;
      raw[11] = npc.greed;
      raw[12] = npc.mysticism;
      raw[13] = npc.urgency;
    } else {
      raw[8] = 0.5;
      raw[9] = 0.5;
      raw[10] = 0.5;
      raw[11] = 0.5;
      raw[12] = 0.5;
      raw[13] = 0.5;
    }

    this.stateVec.fill(0);
    for (let d = 0; d < this.stateDim; d++) {
      let sum = 0;
      for (let f = 0; f < 14; f++) {
        sum += raw[f]! * this.featureProjection[f * this.stateDim + d]!;
      }
      this.stateVec[d] = Math.tanh(sum);
    }

    let norm = 0;
    for (let d = 0; d < this.stateDim; d++) norm += this.stateVec[d]! * this.stateVec[d]!;
    const inv = norm > 1e-10 ? 1 / Math.sqrt(norm) : 1;
    for (let d = 0; d < this.stateDim; d++) this.stateVec[d]! *= inv;

    return this.stateVec;
  }

  selectAction(
    state: Float32Array,
    explore = false,
    npc?: AgentPersonalityProfile
  ): { strategy: number; action: number; confidence: number } {
    const aIdx = npc ? (this.archetypeIndex[npc.archetype] ?? -1) : -1;
    let maxLogit = -Infinity;

    for (let s = 0; s < this.numStrategies; s++) {
      const wOff = s * this.stateDim;
      let dot = 0;
      for (let d = 0; d < this.stateDim; d++) {
        dot += this.strategyWeights[wOff + d]! * state[d]!;
      }

      if (aIdx >= 0) {
        const awOff = (aIdx * this.numStrategies + s) * this.stateDim;
        let aDot = 0;
        for (let d = 0; d < this.stateDim; d++) {
          aDot += this.archetypeStrategyW[awOff + d]! * state[d]!;
        }
        dot = dot * 0.6 + aDot * 0.4;
      }

      if (npc) {
        if (s === 0) dot += npc.urgency * 0.25;
        if (s === 1) dot += npc.curiosity * 0.25;
        if (s === 2) dot += npc.mysticism * 0.25;
        if (s === 3) dot += (npc.mysticism + npc.curiosity) * 0.15;
        if (s === 4) dot += (1 - npc.caution) * 0.2;
        if (s === 5) dot += npc.caution * 0.25;
      }

      const ucb = explore
        ? 0.15 / Math.sqrt(1 + (this.strategyCounts[s] ?? 0))
        : 0;
      const logit = (dot + ucb) / Math.max(0.05, this.temperature);
      this.probsBuf[s] = logit;
      if (logit > maxLogit) maxLogit = logit;
    }

    let sumExp = 0;
    for (let s = 0; s < this.numStrategies; s++) {
      const e = Math.exp(this.probsBuf[s]! - maxLogit);
      this.probsBuf[s] = e;
      sumExp += e;
    }
    for (let s = 0; s < this.numStrategies; s++) {
      this.probsBuf[s]! /= sumExp || 1;
    }

    let bestStrategy = 0;
    let bestProb = -1;
    for (let s = 0; s < this.numStrategies; s++) {
      if (this.probsBuf[s]! > bestProb) {
        bestProb = this.probsBuf[s]!;
        bestStrategy = s;
      }
    }

    let bestAction = 1;
    let bestActScore = -Infinity;
    for (let a = 0; a < this.numActions; a++) {
      let sc = this.actionScores[bestStrategy * this.numActions + a]!;
      if (aIdx >= 0) {
        const aSc =
          this.archetypeActionScore[
            (aIdx * this.numStrategies + bestStrategy) * this.numActions + a
          ]!;
        sc = sc * 0.65 + aSc * 0.35;
      }
      this.actionProbsBuf[a] = sc;
      if (sc > bestActScore) {
        bestActScore = sc;
        bestAction = a;
      }
    }

    const confidence = Math.max(0.1, Math.min(0.99, bestProb));
    return { strategy: bestStrategy, action: bestAction, confidence };
  }

  update(
    state: Float32Array,
    strategy: number,
    action: number,
    reward: number,
    npc?: AgentPersonalityProfile
  ): void {
    if (strategy < 0 || strategy >= this.numStrategies) return;
    if (action < 0 || action >= this.numActions) return;

    this.totalUpdates++;
    this.lastReward = reward;
    this.avgReward = this.avgReward * 0.95 + reward * 0.05;

    this.strategyCounts[strategy]!++;
    const actIdx = strategy * this.numActions + action;
    this.actionCounts[actIdx]!++;

    const wOff = strategy * this.stateDim;
    let pred = 0;
    for (let d = 0; d < this.stateDim; d++) {
      pred += this.strategyWeights[wOff + d]! * state[d]!;
    }
    const err = reward - pred;
    for (let d = 0; d < this.stateDim; d++) {
      this.strategyWeights[wOff + d]! += this.learningRate * err * state[d]!;
    }

    const oldAct = this.actionScores[actIdx]!;
    this.actionScores[actIdx] = oldAct + this.learningRate * (reward - oldAct);

    if (npc) {
      const aIdx = this.archetypeIndex[npc.archetype] ?? -1;
      if (aIdx >= 0) {
        this.archetypeCounts[aIdx * this.numStrategies + strategy]!++;
        const awOff = (aIdx * this.numStrategies + strategy) * this.stateDim;
        let aPred = 0;
        for (let d = 0; d < this.stateDim; d++) {
          aPred += this.archetypeStrategyW[awOff + d]! * state[d]!;
        }
        const aErr = reward - aPred;
        for (let d = 0; d < this.stateDim; d++) {
          this.archetypeStrategyW[awOff + d]! +=
            this.learningRate * 1.2 * aErr * state[d]!;
        }

        const aActIdx =
          (aIdx * this.numStrategies + strategy) * this.numActions + action;
        const oldAAct = this.archetypeActionScore[aActIdx]!;
        this.archetypeActionScore[aActIdx] =
          oldAAct + this.learningRate * 1.2 * (reward - oldAAct);
      }
    }

    this.temperature = Math.max(0.08, this.temperature * 0.997);
  }

  getArchetypeStats(archetype: AgentArchetype) {
    const aIdx = this.archetypeIndex[archetype] ?? 0;
    const strategyCounts: number[] = [];
    for (let s = 0; s < this.numStrategies; s++) {
      strategyCounts.push(this.archetypeCounts[aIdx * this.numStrategies + s]!);
    }
    return {
      archetype,
      strategyCounts,
    };
  }

  getStats() {
    return {
      totalUpdates: this.totalUpdates,
      lastReward: this.lastReward,
      avgReward: this.avgReward,
      temperature: this.temperature,
      strategyCounts: Array.from(this.strategyCounts),
      registeredNpcs: this.npcs.size,
    };
  }

  exportSnapshot(): VSARLPolicySnapshot {
    return {
      strategyWeights: Array.from(this.strategyWeights),
      strategyCounts: Array.from(this.strategyCounts),
      actionScores: Array.from(this.actionScores),
      actionCounts: Array.from(this.actionCounts),
      archetypeStrategyW: Array.from(this.archetypeStrategyW),
      archetypeActionScore: Array.from(this.archetypeActionScore),
      archetypeCounts: Array.from(this.archetypeCounts),
      temperature: this.temperature,
      totalUpdates: this.totalUpdates,
      lastReward: this.lastReward,
      avgReward: this.avgReward,
      npcs: this.listNpcs(),
    };
  }

  restoreSnapshot(snap?: Partial<VSARLPolicySnapshot> | null): void {
    if (!snap || typeof snap !== 'object') return;
    if (
      Array.isArray(snap.strategyWeights) &&
      snap.strategyWeights.length === this.strategyWeights.length
    ) {
      this.strategyWeights.set(snap.strategyWeights);
    }
    if (
      Array.isArray(snap.strategyCounts) &&
      snap.strategyCounts.length === this.strategyCounts.length
    ) {
      this.strategyCounts.set(snap.strategyCounts);
    }
    if (
      Array.isArray(snap.actionScores) &&
      snap.actionScores.length === this.actionScores.length
    ) {
      this.actionScores.set(snap.actionScores);
    }
    if (
      Array.isArray(snap.actionCounts) &&
      snap.actionCounts.length === this.actionCounts.length
    ) {
      this.actionCounts.set(snap.actionCounts);
    }
    if (
      Array.isArray(snap.archetypeStrategyW) &&
      snap.archetypeStrategyW.length === this.archetypeStrategyW.length
    ) {
      this.archetypeStrategyW.set(snap.archetypeStrategyW);
    }
    if (
      Array.isArray(snap.archetypeActionScore) &&
      snap.archetypeActionScore.length === this.archetypeActionScore.length
    ) {
      this.archetypeActionScore.set(snap.archetypeActionScore);
    }
    if (
      Array.isArray(snap.archetypeCounts) &&
      snap.archetypeCounts.length === this.archetypeCounts.length
    ) {
      this.archetypeCounts.set(snap.archetypeCounts);
    }
    if (typeof snap.temperature === 'number' && Number.isFinite(snap.temperature)) {
      this.temperature = Math.max(0.05, Math.min(2.0, snap.temperature));
    }
    if (typeof snap.totalUpdates === 'number' && Number.isFinite(snap.totalUpdates)) {
      this.totalUpdates = snap.totalUpdates;
    }
    if (typeof snap.lastReward === 'number' && Number.isFinite(snap.lastReward)) {
      this.lastReward = snap.lastReward;
    }
    if (typeof snap.avgReward === 'number' && Number.isFinite(snap.avgReward)) {
      this.avgReward = snap.avgReward;
    }
    if (Array.isArray(snap.npcs)) {
      for (const p of snap.npcs) {
        if (p && p.id) this.registerAgent(p);
      }
    }
  }
}
