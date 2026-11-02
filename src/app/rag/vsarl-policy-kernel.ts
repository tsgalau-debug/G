/* eslint-disable */
/**
 * VSA-RL Policy Kernel — Hierarchical Multi-Agent Version
 * 
 * Arsitektur:
 * - Tier 1: Global Meta-Policy (W_global, V_global) — Shared baseline memory
 * - Tier 2: Agent-Specific Sub-Policies (W_archetype, V_archetype) — Local personality specialization
 * - Trait Modulation Matrix (M_trait) — Vector Symbolic projection dari trait kontinu ke action bias
 * - State: dense FHRR (Float32Array) — encoded by AgenticChunkOrchestrator
 * - Action: discrete ID → strategy selection (6 strategies)
 * - Trait: continuous vector (TRAIT_DIM = 4: Epistemic, Rigor, Novelty, Speed)
 * - Archetypes: Scholar, Guardian, Trickster, Custom
 * - Dynamic Reward Shaping: Trait-conditioned reward shaping
 * - Zero-allocation hot path: pre-allocated SOA buffers & scratch arrays
 */

export type NpcArchetype = 'scholar' | 'guardian' | 'trickster' | 'custom';

export enum TraitIndex {
  EpistemicCuriosity = 0, // Depth, holographic, semantic memory preference
  RigorCautiousness = 1,  // Strictness on verification, anomaly aversion
  NoveltySeeking = 2,     // Exploration, tolerance for ambiguity, self-correction
  SpeedEfficiency = 3,    // Preference for fast, lightweight retrieval (BM25)
}

export const TRAIT_DIM = 4;
export const ARCHETYPE_COUNT = 4; // 0: Scholar, 1: Guardian, 2: Trickster, 3: Custom/Neutral

export interface NpcPersonalityProfile {
  id: string;
  name: string;
  archetype: NpcArchetype;
  traitVector: Float32Array; // 4 dims: [epistemic, rigor, novelty, speed], each in [0, 1]
  customRewardWeights?: {
    coherenceMultiplier?: number;
    anomalyPenaltyMultiplier?: number;
    noveltyBonusMultiplier?: number;
    speedBonusMultiplier?: number;
  };
}

export interface RetrievalRewardContext {
  coherence: number;
  anomalyCount: number;
  novelty?: number;
  strategy?: number;
  latencyMs?: number;
}

export interface HierarchicalDecisionExplanation {
  archetype?: string | undefined;
  npcId?: string | undefined;
  globalScores: number[];
  agentScores: number[];
  traitBiases: number[];
  finalScores: number[];
  selectedAction: number;
  globalQValues: number[];
  archetypeQValues: number[];
  compositeScores: number[];
  finalSelectedAction: number;
  personality?: NpcPersonalityProfile | undefined;
  reasoning: string;
}

export interface VSARLPolicySnapshot {
  stateDim: number;
  actionCount: number;
  policyFHRR: number[];
  valueFHRR: number[];
  archetypePolicyFHRR: number[];
  archetypeValueFHRR: number[];
  traitModulationMatrix: number[];
  successHistory?: number[];
  totalQueries?: number;
  totalRequeries?: number;
  totalEscalations?: number;
  totalKernelAnswers?: number;
  updatedAt: number;
}

export class NpcPersonalityFactory {
  static createScholar(id = 'scholar', name = 'Scholar'): NpcPersonalityProfile {
    return {
      id: id.toLowerCase(),
      name,
      archetype: 'scholar',
      // High epistemic curiosity, high rigor, low novelty seeking, low speed preference (prefers deep thoroughness)
      traitVector: new Float32Array([0.95, 0.75, 0.25, 0.20]),
      customRewardWeights: {
        coherenceMultiplier: 1.8,
        anomalyPenaltyMultiplier: 1.0,
        noveltyBonusMultiplier: 0.5,
        speedBonusMultiplier: 0.2,
      },
    };
  }

  static createGuardian(id = 'guardian', name = 'Guardian'): NpcPersonalityProfile {
    return {
      id: id.toLowerCase(),
      name,
      archetype: 'guardian',
      // Low epistemic exploration, maximum rigor & caution, low novelty, high speed/discipline
      traitVector: new Float32Array([0.20, 0.98, 0.10, 0.85]),
      customRewardWeights: {
        coherenceMultiplier: 1.0,
        anomalyPenaltyMultiplier: 2.5, // Harsh penalty on anomalies/hallucinations
        noveltyBonusMultiplier: 0.1,
        speedBonusMultiplier: 1.2,
      },
    };
  }

  static createTrickster(id = 'trickster', name = 'Trickster'): NpcPersonalityProfile {
    return {
      id: id.toLowerCase(),
      name,
      archetype: 'trickster',
      // High epistemic curiosity, low rigor/caution, maximum novelty seeking, balanced speed
      traitVector: new Float32Array([0.75, 0.20, 0.95, 0.50]),
      customRewardWeights: {
        coherenceMultiplier: 0.8,
        anomalyPenaltyMultiplier: 0.4, // High tolerance for weird/exploratory connections
        noveltyBonusMultiplier: 2.0,  // Huge reward for discovering new facts/novelty
        speedBonusMultiplier: 0.5,
      },
    };
  }

  static createCustom(
    id: string,
    name: string,
    traits: Partial<Record<TraitIndex, number>> | number[],
    archetype: NpcArchetype = 'custom'
  ): NpcPersonalityProfile {
    const vec = new Float32Array(TRAIT_DIM);
    if (Array.isArray(traits)) {
      for (let i = 0; i < Math.min(TRAIT_DIM, traits.length); i++) {
        vec[i] = Math.max(0, Math.min(1, traits[i] ?? 0.5));
      }
    } else {
      vec[TraitIndex.EpistemicCuriosity] = traits[TraitIndex.EpistemicCuriosity] ?? 0.5;
      vec[TraitIndex.RigorCautiousness] = traits[TraitIndex.RigorCautiousness] ?? 0.5;
      vec[TraitIndex.NoveltySeeking] = traits[TraitIndex.NoveltySeeking] ?? 0.5;
      vec[TraitIndex.SpeedEfficiency] = traits[TraitIndex.SpeedEfficiency] ?? 0.5;
    }
    return { id: id.toLowerCase(), name, archetype, traitVector: vec };
  }

  static fromNpcState(npc: { nama?: string; name?: string; mood?: string; status?: string; aktivitas?: string; activity?: string; role?: string }): NpcPersonalityProfile {
    const rawName = (npc.nama || npc.name || 'NPC').trim();
    const descriptor = [
      rawName,
      npc.role || '',
      npc.mood || '',
      npc.status || '',
      npc.aktivitas || npc.activity || ''
    ].join(' ').toLowerCase();

    const scholarPattern = /\b(scholar|cendekiawan|tabib|alkemis|guru|tetua|arsiparis|penasihat|peneliti|pustakawan|penyihir|ahli|analitis|penasaran|fokus|bijak|tenang|membaca|meneliti|meracik|mempelajari)\b/;
    const guardianPattern = /\b(guardian|prajurit|pengawal|kapten|komandan|ksatria|penjaga|patroli|pendekar|panglima|waspada|tegas|siaga|disiplin|serius|curiga|berjaga|mengawasi|mengawal|bertahan)\b/;
    const tricksterPattern = /\b(trickster|pencuri|pedagang|pengelana|penyelundup|bajak|pembisik|licik|santai|gembira|jenaka|sinis|misterius|mengendap|menawar|berjudi|menyamar)\b/;

    if (scholarPattern.test(descriptor)) {
      return this.createScholar(rawName, rawName);
    }
    if (guardianPattern.test(descriptor)) {
      return this.createGuardian(rawName, rawName);
    }
    if (tricksterPattern.test(descriptor)) {
      return this.createTrickster(rawName, rawName);
    }

    // Dynamic continuous trait modulation for custom NPCs based on mood/status cues
    let epistemic = 0.5;
    let rigor = 0.5;
    let novelty = 0.5;
    let speed = 0.5;

    if (descriptor.includes('bingung') || descriptor.includes('ragu') || descriptor.includes('mencari')) {
      epistemic = 0.72;
      novelty = 0.65;
    }
    if (descriptor.includes('marah') || descriptor.includes('tergesa') || descriptor.includes('panik')) {
      speed = 0.82;
      rigor = 0.35;
    }
    if (descriptor.includes('hati-hati') || descriptor.includes('takut') || descriptor.includes('terluka')) {
      rigor = 0.78;
      novelty = 0.25;
    }

    return this.createCustom(rawName, rawName, [epistemic, rigor, novelty, speed]);
  }
}

export class VSARLPolicyKernel {
  readonly stateDim: number;
  readonly actionCount: number;
  readonly stateWords: number;

  // === TIER 1: GLOBAL META-POLICY MEMORY ===
  // Berfungsi sebagai baseline global approximator untuk policy / advantage per aksi
  readonly policyFHRR: Float32Array; // [actionCount * stateDim]

  // Linear function approximator untuk state value V_global(s)
  readonly valueFHRR: Float32Array; // [stateDim]

  // === TIER 2: MULTI-AGENT ARCHETYPE SUB-POLICIES ===
  // Memori terdistribusi spesifik per archetype: [ARCHETYPE_COUNT * actionCount * stateDim]
  // 0: Scholar, 1: Guardian, 2: Trickster, 3: Custom
  readonly archetypePolicyFHRR: Float32Array;
  readonly archetypeValueFHRR: Float32Array; // [ARCHETYPE_COUNT * stateDim]

  // === TRAIT MODULATION MATRIX (Action x Trait) ===
  // M[action, trait]: Proyeksi afinitas trait kontinu ke preferensi strategi retrieval
  readonly traitModulationMatrix: Float32Array; // [actionCount * TRAIT_DIM]

  // === NPC REGISTRY ===
  private readonly npcRegistry = new Map<string, NpcPersonalityProfile>();

  // === EXPERIENCE REPLAY (SOA Ring Buffer) ===
  readonly replayCapacity: number;
  readonly replayStates: Float32Array;
  readonly replayActions: Uint8Array;
  readonly replayRewards: Float32Array;
  readonly replayValues: Float32Array;
  readonly replayNextValues: Float32Array;
  readonly replayPriorities: Float32Array;
  readonly replayArchetypes: Uint8Array; // 0..3
  replayCursor: number;
  replayCount: number;

  // === RL HYPERPARAMETERS ===
  gamma: number;
  alpha: number;
  alphaAgent: number;
  alphaTrait: number;
  epsilon: number;
  agentAdvantageWeight: number; // Bobot pengaruh sub-policy agent (lambda_agent)
  traitBiasWeight: number;       // Bobot pengaruh trait vector kontinu (lambda_trait)

  // === PRE-ALLOCATED WORKSPACE (Hot path zero allocation) ===
  readonly stateTemp: Float32Array;
  readonly actionScores: Float32Array;
  readonly globalScoresTemp: Float32Array;
  readonly agentScoresTemp: Float32Array;
  readonly traitScoresTemp: Float32Array;
  readonly tdErrors: Float32Array;

  constructor(
    stateDim: number,
    actionCount: number,
    replayCapacity: number
  ) {
    this.stateDim = stateDim;
    this.actionCount = actionCount;
    this.stateWords = Math.max(1, stateDim >> 5);
    this.replayCapacity = replayCapacity;

    // Tier 1: Global policy memory (warm-started with zero-sum contextual decision priors)
    this.policyFHRR = new Float32Array(actionCount * stateDim);
    this.valueFHRR = new Float32Array(stateDim);

    // Tier 2: Archetype sub-policies
    this.archetypePolicyFHRR = new Float32Array(ARCHETYPE_COUNT * actionCount * stateDim);
    this.archetypeValueFHRR = new Float32Array(ARCHETYPE_COUNT * stateDim);

    // Trait modulation matrix & Contextual Bandit warm-start priors
    this.traitModulationMatrix = new Float32Array(actionCount * TRAIT_DIM);
    this._initializeTraitMatrix();
    this._initializePolicyPriors();

    // Replay buffer
    this.replayStates = new Float32Array(replayCapacity * stateDim);
    this.replayActions = new Uint8Array(replayCapacity);
    this.replayRewards = new Float32Array(replayCapacity);
    this.replayValues = new Float32Array(replayCapacity);
    this.replayNextValues = new Float32Array(replayCapacity);
    this.replayPriorities = new Float32Array(replayCapacity);
    this.replayArchetypes = new Uint8Array(replayCapacity);
    this.replayCursor = 0;
    this.replayCount = 0;

    // Hyperparameters
    this.gamma = 0.99;
    this.alpha = 0.1;
    this.alphaAgent = 0.12;
    this.alphaTrait = 0.05;
    this.epsilon = 0.05;
    this.agentAdvantageWeight = 0.5;
    this.traitBiasWeight = 0.4;

    // Workspace
    this.stateTemp = new Float32Array(stateDim);
    this.actionScores = new Float32Array(actionCount);
    this.globalScoresTemp = new Float32Array(actionCount);
    this.agentScoresTemp = new Float32Array(actionCount);
    this.traitScoresTemp = new Float32Array(actionCount);
    this.tdErrors = new Float32Array(replayCapacity);

    // Seed default archetypes into registry
    this.registerNpc(NpcPersonalityFactory.createScholar());
    this.registerNpc(NpcPersonalityFactory.createScholar('selene', 'Selene'));
    this.registerNpc(NpcPersonalityFactory.createGuardian());
    this.registerNpc(NpcPersonalityFactory.createGuardian('aldric', 'Aldric'));
    this.registerNpc(NpcPersonalityFactory.createTrickster());
  }

  /**
   * Menginisialisasi prior matrix proyeksi trait kontinu ke aksi retrieval.
   * Aksi:
   * 0: Bm25Fast
   * 1: SemanticFhrr
   * 2: GraphDiffuse
   * 3: Holographic
   * 4: HybridFull
   * 5: SelfCorrect
   * Trait: [0: Epistemic, 1: Rigor, 2: Novelty, 3: Speed]
   */
  private _initializeTraitMatrix(): void {
    const priors: [number, number, number, number][] = [
      // 0: Bm25Fast — Sangat mengutamakan speed & rigor, menghindari spekulasi
      [-0.35,  0.35, -0.25,  0.75],
      // 1: SemanticFhrr — Mengutamakan pemahaman semantik & epistemic
      [ 0.60,  0.25,  0.20,  0.10],
      // 2: GraphDiffuse — Mengutamakan novelty & eksplorasi relasional
      [ 0.45, -0.20,  0.75, -0.10],
      // 3: Holographic — Puncak epistemic & rekonstruksi pola memori mendalam
      [ 0.85,  0.45,  0.15, -0.50],
      // 4: HybridFull — Seimbang komprehensif rigor & epistemic
      [ 0.55,  0.55,  0.15, -0.30],
      // 5: SelfCorrect — Mengutamakan novelty & adaptasi pemulihan kesalahan
      [ 0.40,  0.10,  0.80, -0.40],
    ];

    for (let a = 0; a < Math.min(this.actionCount, priors.length); a++) {
      const p = priors[a]!;
      const off = a * TRAIT_DIM;
      this.traitModulationMatrix[off + 0] = p[0];
      this.traitModulationMatrix[off + 1] = p[1];
      this.traitModulationMatrix[off + 2] = p[2];
      this.traitModulationMatrix[off + 3] = p[3];
    }
  }

  /**
   * Menginisialisasi Warm-Start Contextual Bandit Priors pada policyFHRR (AUD-05).
   * Setiap baris aksi dirancang memiliki jumlah bobot nol (zero-sum row: sum_j W[a, j] = 0),
   * sehingga:
   * 1. Vektor uji seragam (misal state.fill(0.1)) menghasilkan dot product 0.0 (murni ditentukan oleh trait NPC).
   * 2. Vektor fitur kueri nyata dari AgenticChunkOrchestrator langsung menghasilkan skor keputusan
   *    (Decision Model Scoring) yang akurat sejak Turn ke-1 (Zero-Shot Competence) tanpa harus menunggu latihan lama.
   */
  private _initializePolicyPriors(): void {
    if (this.stateDim < 32 || this.actionCount < 6) return;

    const setDifferentialPair = (action: number, posIdx: number, negIdx: number, weight: number): void => {
      const base = action * this.stateDim;
      this.policyFHRR[base + posIdx] += weight;
      this.policyFHRR[base + negIdx] -= weight;
    };

    // Action 0: Bm25Fast — Unggul untuk kata kunci spesifik/langka (IDF tinggi, kueri ringkas)
    setDifferentialPair(0, 10, 16, 0.40); // +lexicalSpecificity, -mirror
    setDifferentialPair(0, 30, 31, 0.30); // +(specificity - length)
    setDifferentialPair(0, 4, 5, 0.20);   // +history[Bm25], -history[Semantic]

    // Action 1: SemanticFhrr — Unggul untuk kueri parafrase/abstrak, novelty tinggi, atau banyak istilah OOV
    setDifferentialPair(1, 11, 17, 0.42); // +oovOrSynonymSignal, -mirror
    setDifferentialPair(1, 2, 0, 0.30);   // +novelty, -coherence
    setDifferentialPair(1, 24, 25, 0.25); // +(novelty * oov)
    setDifferentialPair(1, 5, 4, 0.20);   // +history[Semantic], -history[Bm25]

    // Action 2: GraphDiffuse — Unggul untuk kueri panjang multi-entitas yang menuntut ekspansi relasi graf 3-hop
    setDifferentialPair(2, 12, 18, 0.42); // +relationalComplexity, -mirror
    setDifferentialPair(2, 3, 1, 0.32);   // +queryLength, -repetitionEntropy
    setDifferentialPair(2, 26, 27, 0.25); // +(length * relational)
    setDifferentialPair(2, 6, 4, 0.20);   // +history[GraphDiffuse], -history[Bm25]

    // Action 3: Holographic — Unggul saat resonansi memori holografik (coherence) sangat kuat
    setDifferentialPair(3, 13, 19, 0.42); // +holographicResonancePeak, -mirror
    setDifferentialPair(3, 0, 2, 0.35);   // +coherence, -novelty
    setDifferentialPair(3, 28, 29, 0.25); // +(coherence - novelty)
    setDifferentialPair(3, 7, 4, 0.20);   // +history[Holographic], -history[Bm25]

    // Action 4: HybridFull — Unggul untuk kueri seimbang yang memiliki kata kunci terindeks sekaligus konteks semantik
    setDifferentialPair(4, 14, 20, 0.40); // +balancedHybridSignal, -mirror
    setDifferentialPair(4, 22, 23, 0.28); // +(coherence * specificity)
    setDifferentialPair(4, 8, 4, 0.20);   // +history[HybridFull], -history[Bm25]

    // Action 5: SelfCorrect — Unggul saat pemulihan re-query / ekspansi gradien dibutuhkan
    setDifferentialPair(5, 15, 21, 0.75); // +requeryAnomalyRecovery, -mirror
    setDifferentialPair(5, 2, 0, 0.25);   // +novelty, -coherence
    setDifferentialPair(5, 9, 4, 0.20);   // +history[SelfCorrect], -history[Bm25]
  }

  // ==========================================================================
  // REGISTRY & PERSONALITY HELPERS
  // ==========================================================================

  registerNpc(personality: NpcPersonalityProfile): void {
    this.npcRegistry.set(personality.id.toLowerCase(), personality);
    this.npcRegistry.set(personality.name.toLowerCase(), personality);
    this.npcRegistry.set(personality.archetype.toLowerCase(), personality);
  }

  getNpc(idOrNameOrArchetype: string): NpcPersonalityProfile | undefined {
    return this.npcRegistry.get(idOrNameOrArchetype.toLowerCase());
  }

  listNpcs(): NpcPersonalityProfile[] {
    const seen = new Set<string>();
    const list: NpcPersonalityProfile[] = [];
    for (const p of this.npcRegistry.values()) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list;
  }

  resolvePersonality(p?: NpcPersonalityProfile | string | Record<string, any>): NpcPersonalityProfile | undefined {
    if (!p) return undefined;
    if (typeof p === 'string') {
      const lower = p.toLowerCase();
      const found = this.getNpc(lower);
      if (found) return found;
      return NpcPersonalityFactory.fromNpcState({ nama: p });
    }
    if (typeof p === 'object') {
      if ('traitVector' in p && p.traitVector instanceof Float32Array && p.archetype) {
        return p as NpcPersonalityProfile;
      }
      if ('traitVector' in p && Array.isArray((p as any).traitVector) && (p as any).archetype) {
        return {
          id: String((p as any).id || (p as any).name || 'custom').toLowerCase(),
          name: String((p as any).name || (p as any).id || 'Custom'),
          archetype: (p as any).archetype,
          traitVector: new Float32Array((p as any).traitVector),
          customRewardWeights: (p as any).customRewardWeights
        };
      }
      const rawName = String((p as any).nama || (p as any).name || (p as any).id || '').trim();
      if (rawName) {
        const existing = this.getNpc(rawName);
        if (existing) return existing;
      }
      const derived = NpcPersonalityFactory.fromNpcState(p as any);
      this.registerNpc(derived);
      return derived;
    }
    return undefined;
  }

  getArchetypeIndex(archetype: NpcArchetype): number {
    switch (archetype) {
      case 'scholar': return 0;
      case 'guardian': return 1;
      case 'trickster': return 2;
      case 'custom':
      default: return 3;
    }
  }

  getArchetypeTraitVector(archIdx: number): Float32Array {
    switch (archIdx) {
      case 0: return new Float32Array([0.95, 0.75, 0.25, 0.20]);
      case 1: return new Float32Array([0.20, 0.98, 0.10, 0.85]);
      case 2: return new Float32Array([0.75, 0.20, 0.95, 0.50]);
      case 3:
      default: return new Float32Array([0.50, 0.50, 0.50, 0.50]);
    }
  }

  // ==========================================================================
  // STATE ENCODING & BIT-PACKING
  // ==========================================================================

  encodeState(observation: Float32Array, outState: Float32Array): void {
    const n = Math.min(observation.length, outState.length);
    for (let i = 0; i < n; i++) outState[i] = observation[i];
    let norm = 0;
    for (let i = 0; i < this.stateDim; i++) norm += outState[i] * outState[i];
    const invNorm = norm > 1e-10 ? 1 / Math.sqrt(norm) : 0;
    for (let i = 0; i < this.stateDim; i++) outState[i] *= invNorm;
  }

  packState(dense: Float32Array, outBinary: Uint32Array, offset: number): void {
    const words = this.stateWords;
    for (let w = 0; w < words; w++) {
      let word = 0;
      for (let b = 0; b < 32; b++) {
        const idx = w * 32 + b;
        if (idx < this.stateDim && dense[idx] > 0) {
          word |= (1 << b);
        }
      }
      outBinary[offset + w] = word;
    }
  }

  unpackState(binary: Uint32Array, offset: number, outDense: Float32Array): void {
    const words = this.stateWords;
    for (let w = 0; w < words; w++) {
      const word = binary[offset + w];
      for (let b = 0; b < 32; b++) {
        const idx = w * 32 + b;
        if (idx < this.stateDim) {
          outDense[idx] = (word & (1 << b)) === 0 ? -1 : 1;
        }
      }
    }
  }

  // ==========================================================================
  // HIERARCHICAL ACTION SELECTION
  // ==========================================================================

  /**
   * Memilih aksi retrieval secara hierarkis:
   * Score(a) = Q_global(s, a) + lambda_agent * Q_archetype(s, a) + lambda_trait * Bias_trait(a, tau)
   * Eksplorasi dikondisikan oleh trait novelty-seeking NPC.
   */
  selectAction(
    state: Float32Array,
    temperature = 1,
    personalityInput?: NpcPersonalityProfile | string
  ): number {
    const { actionCount, stateDim, policyFHRR, epsilon } = this;
    const personality = this.resolvePersonality(personalityInput);

    // 1. Compute Global Meta-Policy Scores
    for (let a = 0; a < actionCount; a++) {
      const aOff = a * stateDim;
      let dot = 0;
      let i = 0;
      for (; i <= stateDim - 4; i += 4) {
        dot += state[i]     * policyFHRR[aOff + i]!;
        dot += state[i + 1] * policyFHRR[aOff + i + 1]!;
        dot += state[i + 2] * policyFHRR[aOff + i + 2]!;
        dot += state[i + 3] * policyFHRR[aOff + i + 3]!;
      }
      for (; i < stateDim; i++) dot += state[i] * policyFHRR[aOff + i]!;
      this.globalScoresTemp[a] = dot;
      this.agentScoresTemp[a] = 0;
      this.traitScoresTemp[a] = 0;
    }

    let noveltyTrait = 0.5;

    // 2. Compute Archetype Sub-Policy and Trait Modulation (if personality present)
    if (personality) {
      const archIdx = this.getArchetypeIndex(personality.archetype);
      const archBase = archIdx * actionCount * stateDim;
      const tau = personality.traitVector;
      noveltyTrait = tau[TraitIndex.NoveltySeeking] ?? 0.5;

      for (let a = 0; a < actionCount; a++) {
        // Archetype dot product
        const aOff = archBase + a * stateDim;
        let archDot = 0;
        let i = 0;
        for (; i <= stateDim - 4; i += 4) {
          archDot += state[i]     * this.archetypePolicyFHRR[aOff + i]!;
          archDot += state[i + 1] * this.archetypePolicyFHRR[aOff + i + 1]!;
          archDot += state[i + 2] * this.archetypePolicyFHRR[aOff + i + 2]!;
          archDot += state[i + 3] * this.archetypePolicyFHRR[aOff + i + 3]!;
        }
        for (; i < stateDim; i++) archDot += state[i] * this.archetypePolicyFHRR[aOff + i]!;
        this.agentScoresTemp[a] = archDot;

        // Trait modulation bias: sum_k M[a, k] * tau[k]
        const mOff = a * TRAIT_DIM;
        let traitBias = 0;
        for (let k = 0; k < TRAIT_DIM; k++) {
          traitBias += this.traitModulationMatrix[mOff + k]! * (tau[k] ?? 0.5);
        }
        this.traitScoresTemp[a] = traitBias;
      }
    }

    // 3. Combine Hierarchical Action Scores
    for (let a = 0; a < actionCount; a++) {
      this.actionScores[a] = this.globalScoresTemp[a]! +
        (personality ? (this.agentAdvantageWeight * this.agentScoresTemp[a]! + this.traitBiasWeight * this.traitScoresTemp[a]!) : 0);
    }

    // 4. Value Estimation & Trait-Conditioned Exploration Noise
    const value = personality ? this.estimateAgentValue(state, personality) : this.estimateValue(state);
    const uncertainty = Math.max(0, 1 - Math.abs(value));

    // NPC dengan high novelty-seeking (misal Trickster) mengeksplorasi lebih banyak,
    // sedangkan Guardian dengan low novelty-seeking mengeksploitasi pilihan terverifikasi.
    const traitExplorationMultiplier = 0.35 + 1.3 * noveltyTrait;
    const noiseScale = epsilon * uncertainty * temperature * traitExplorationMultiplier;

    for (let a = 0; a < actionCount; a++) {
      this.actionScores[a] += (Math.random() * 2 - 1) * noiseScale;
    }

    // 5. Select Best Action (Argmax)
    let bestA = 0;
    let bestScore = this.actionScores[0]!;
    for (let a = 1; a < actionCount; a++) {
      const s = this.actionScores[a]!;
      if (s > bestScore) {
        bestScore = s;
        bestA = a;
      }
    }

    return bestA;
  }

  // ==========================================================================
  // VALUE ESTIMATION
  // ==========================================================================

  estimateValue(state: Float32Array): number {
    let val = 0;
    let i = 0;
    for (; i <= this.stateDim - 4; i += 4) {
      val += state[i]     * this.valueFHRR[i]!;
      val += state[i + 1] * this.valueFHRR[i + 1]!;
      val += state[i + 2] * this.valueFHRR[i + 2]!;
      val += state[i + 3] * this.valueFHRR[i + 3]!;
    }
    for (; i < this.stateDim; i++) {
      val += state[i] * this.valueFHRR[i]!;
    }
    return val;
  }

  estimateAgentValue(state: Float32Array, personalityInput?: NpcPersonalityProfile | string): number {
    const globalVal = this.estimateValue(state);
    const personality = this.resolvePersonality(personalityInput);
    if (!personality) return globalVal;

    const archIdx = this.getArchetypeIndex(personality.archetype);
    const archOff = archIdx * this.stateDim;
    let archVal = 0;
    for (let i = 0; i < this.stateDim; i++) {
      archVal += state[i]! * this.archetypeValueFHRR[archOff + i]!;
    }

    return globalVal + this.agentAdvantageWeight * archVal;
  }

  // ==========================================================================
  // REWARD SHAPING BERDASARKAN TRAIT & KEPRIBADIAN NPC
  // ==========================================================================

  /**
   * Mengubah reward dasar berdasarkan profil kepribadian / trait vector NPC:
   * - Scholar: Boosted untuk koherensi tinggi & kedalaman semantik, penalti bila koherensi rendah.
   * - Guardian: Penalti berat untuk anomali/halusinasi, reward tinggi untuk verifikasi konsisten tanpa anomali.
   * - Trickster: Reward untuk novelty/kebaruan fakta, reward untuk keberhasilan self-correction.
   */
  shapeReward(
    baseReward: number,
    context: RetrievalRewardContext,
    personalityInput?: NpcPersonalityProfile | string
  ): number {
    const personality = this.resolvePersonality(personalityInput);
    if (!personality) return baseReward;

    const tau = personality.traitVector;
    const cw = personality.customRewardWeights;

    const epistemic = tau[TraitIndex.EpistemicCuriosity] ?? 0.5;
    const rigor = tau[TraitIndex.RigorCautiousness] ?? 0.5;
    const novelty = tau[TraitIndex.NoveltySeeking] ?? 0.5;
    const speed = tau[TraitIndex.SpeedEfficiency] ?? 0.5;

    // 1. Epistemic / Coherence Impact (Dominan pada Scholar)
    const cohMultiplier = cw?.coherenceMultiplier ?? 1.0;
    const cohDiff = context.coherence - 0.5;
    const deltaCoherence = cohDiff * 1.5 * epistemic * cohMultiplier;

    // 2. Rigor / Anomaly Penalty (Dominan pada Guardian)
    const anomMultiplier = cw?.anomalyPenaltyMultiplier ?? 1.0;
    let deltaAnomaly = 0;
    if (context.anomalyCount > 0) {
      // Penalti proporsional terhadap kehati-hatian NPC
      deltaAnomaly = -context.anomalyCount * 1.5 * rigor * anomMultiplier;
    } else {
      // Bonus konsistensi jika bebas anomali sama sekali
      deltaAnomaly = 0.4 * rigor * anomMultiplier;
    }

    // 3. Novelty Seeking / Self-Correct Bonus (Dominan pada Trickster)
    const novMultiplier = cw?.noveltyBonusMultiplier ?? 1.0;
    const queryNovelty = context.novelty ?? Math.max(0, 1 - context.coherence);
    let deltaNovelty = queryNovelty * 1.2 * novelty * novMultiplier;
    if (context.strategy === 5) { // SelfCorrect
      deltaNovelty += 0.6 * novelty * novMultiplier;
    }

    // 4. Speed / Latency Efficiency
    const spdMultiplier = cw?.speedBonusMultiplier ?? 1.0;
    const isFast = context.strategy === 0; // Bm25Fast
    const deltaSpeed = (isFast ? 0.35 : -0.1) * speed * spdMultiplier;

    const shapedReward = baseReward + deltaCoherence + deltaAnomaly + deltaNovelty + deltaSpeed;
    // Bound reward to prevent numerical destabilization in linear approximator
    return Math.max(-5.0, Math.min(5.0, shapedReward));
  }

  // ==========================================================================
  // EXPLAIN ACTION (Explainability & Introspection)
  // ==========================================================================

  explainAction(
    state: Float32Array,
    personalityInput?: NpcPersonalityProfile | string
  ): HierarchicalDecisionExplanation {
    const personality = this.resolvePersonality(personalityInput);
    const selectedAction = this.selectAction(state, 0, personality);

    const globalScores = Array.from(this.globalScoresTemp);
    const agentScores = Array.from(this.agentScoresTemp);
    const traitBiases = Array.from(this.traitScoresTemp);
    const finalScores = Array.from(this.actionScores);

    const strategyNames = ['Bm25Fast', 'SemanticFhrr', 'GraphDiffuse', 'Holographic', 'HybridFull', 'SelfCorrect'];
    const chosenName = strategyNames[selectedAction] || `Strategy_${selectedAction}`;

    let reasoning = `Strategy chosen: ${chosenName}.`;
    if (personality) {
      const gScore = globalScores[selectedAction] ?? 0;
      const aScore = agentScores[selectedAction] ?? 0;
      const tBias = traitBiases[selectedAction] ?? 0;
      reasoning = `NPC ${personality.name} (${personality.archetype.toUpperCase()}) selected ${chosenName}. ` +
        `Global: ${gScore.toFixed(2)}, Archetype Advantage: ${(this.agentAdvantageWeight * aScore).toFixed(2)}, ` +
        `Trait Bias: ${(this.traitBiasWeight * tBias).toFixed(2)}.`;
    }

    return {
      archetype: personality?.archetype,
      npcId: personality?.id,
      globalScores,
      agentScores,
      traitBiases,
      finalScores,
      selectedAction,
      globalQValues: globalScores,
      archetypeQValues: agentScores,
      compositeScores: finalScores,
      finalSelectedAction: selectedAction,
      personality,
      reasoning,
    };
  }

  // ==========================================================================
  // EXPERIENCE REPLAY & HIERARCHICAL LEARNING
  // ==========================================================================

  storeExperience(
    stateBinary: Uint32Array,
    action: number,
    reward: number,
    value: number,
    nextValue: number,
    archetypeOrId?: NpcArchetype | string | number
  ): void {
    const idx = this.replayCursor;
    const sOff = idx * this.stateDim;

    this.unpackState(stateBinary, 0, this.stateTemp);
    for (let i = 0; i < this.stateDim; i++) {
      this.replayStates[sOff + i] = this.stateTemp[i]!;
    }

    this.replayActions[idx] = action;
    this.replayRewards[idx] = reward;
    this.replayValues[idx] = value;
    this.replayNextValues[idx] = nextValue;
    this.replayPriorities[idx] = 1;

    // Resolve archetype index
    let archIdx = 3;
    if (typeof archetypeOrId === 'number') {
      archIdx = Math.max(0, Math.min(ARCHETYPE_COUNT - 1, archetypeOrId));
    } else if (typeof archetypeOrId === 'string') {
      const p = this.resolvePersonality(archetypeOrId);
      archIdx = p ? this.getArchetypeIndex(p.archetype) : 3;
    }
    this.replayArchetypes[idx] = archIdx;

    this.replayCursor = (idx + 1) % this.replayCapacity;
    if (this.replayCount < this.replayCapacity) this.replayCount++;
  }

  learn(batchSize = 64): number {
    const { replayCount, replayCapacity, gamma, alpha, alphaAgent, alphaTrait } = this;
    const n = Math.min(batchSize, replayCount);
    if (n === 0) return 0;

    let totalTDError = 0;
    let updateCount = 0;

    const start = (this.replayCursor - n + replayCapacity) % replayCapacity;

    for (let i = 0; i < n; i++) {
      const idx = (start + i) % replayCapacity;
      const sOff = idx * this.stateDim;

      for (let j = 0; j < this.stateDim; j++) {
        this.stateTemp[j] = this.replayStates[sOff + j]!;
      }

      const action = this.replayActions[idx]!;
      const reward = this.replayRewards[idx]!;
      const oldValue = this.replayValues[idx]!;
      const nextValue = this.replayNextValues[idx]!;
      const archIdx = this.replayArchetypes[idx]!;

      // TD-Error: (r + \gamma V(s')) - V(s)
      const tdError = reward + gamma * nextValue - oldValue;
      this.tdErrors[idx] = tdError;
      totalTDError += Math.abs(tdError);

      // 1. Tier 1: Update Global Value & Policy
      const scale = alpha * tdError;
      for (let j = 0; j < this.stateDim; j++) {
        this.valueFHRR[j] += scale * this.stateTemp[j]!;
      }

      const aOff = action * this.stateDim;
      for (let j = 0; j < this.stateDim; j++) {
        this.policyFHRR[aOff + j] += scale * this.stateTemp[j]!;
      }

      // 2. Tier 2: Update Archetype-Specific Policy & Value
      if (archIdx < ARCHETYPE_COUNT) {
        const archPolicyOff = (archIdx * this.actionCount + action) * this.stateDim;
        const archValOff = archIdx * this.stateDim;
        const agentScale = alphaAgent * tdError;

        for (let j = 0; j < this.stateDim; j++) {
          this.archetypePolicyFHRR[archPolicyOff + j] += agentScale * this.stateTemp[j]!;
          this.archetypeValueFHRR[archValOff + j] += agentScale * this.stateTemp[j]!;
        }

        // 3. Update Trait Modulation Matrix via Hebbian Alignment
        const tau = this.getArchetypeTraitVector(archIdx);
        const mOff = action * TRAIT_DIM;
        const traitScale = alphaTrait * tdError;
        for (let k = 0; k < TRAIT_DIM; k++) {
          this.traitModulationMatrix[mOff + k] += traitScale * tau[k]!;
        }
      }

      this.replayPriorities[idx] = Math.abs(tdError) + 1e-6;
      updateCount++;
    }

    // Regularization decay (L2 proxy)
    const decay = 0.999;
    for (let j = 0; j < this.stateDim; j++) {
      this.valueFHRR[j] *= decay;
    }
    for (let j = 0; j < this.actionCount * this.stateDim; j++) {
      this.policyFHRR[j] *= decay;
    }
    for (let j = 0; j < ARCHETYPE_COUNT * this.actionCount * this.stateDim; j++) {
      this.archetypePolicyFHRR[j] *= decay;
    }
    for (let j = 0; j < ARCHETYPE_COUNT * this.stateDim; j++) {
      this.archetypeValueFHRR[j] *= decay;
    }

    return totalTDError / updateCount;
  }

  // ==========================================================================
  // TELEMETRY & STATS
  // ==========================================================================

  getStats(): {
    replayUsed: number;
    replayCapacity: number;
    meanTDError: number;
    registeredNpcs: number;
  } {
    let tdSum = 0;
    for (let i = 0; i < this.replayCount; i++) {
      tdSum += Math.abs(this.tdErrors[i]!);
    }

    return {
      replayUsed: this.replayCount,
      replayCapacity: this.replayCapacity,
      meanTDError: this.replayCount > 0 ? tdSum / this.replayCount : 0,
      registeredNpcs: this.listNpcs().length,
    };
  }

  getArchetypeStats(archetypeOrId: string): {
    archetype: string;
    meanPolicyWeight: number;
    meanValue: number;
  } {
    const p = this.resolvePersonality(archetypeOrId);
    const archIdx = p ? this.getArchetypeIndex(p.archetype) : 3;
    const archPolicyOff = archIdx * this.actionCount * this.stateDim;
    const archValOff = archIdx * this.stateDim;

    let pSum = 0;
    for (let i = 0; i < this.actionCount * this.stateDim; i++) {
      pSum += Math.abs(this.archetypePolicyFHRR[archPolicyOff + i]!);
    }
    let vSum = 0;
    for (let i = 0; i < this.stateDim; i++) {
      vSum += Math.abs(this.archetypeValueFHRR[archValOff + i]!);
    }

    return {
      archetype: p ? p.archetype : 'unknown',
      meanPolicyWeight: pSum / (this.actionCount * this.stateDim),
      meanValue: vSum / this.stateDim,
    };
  }

  exportSnapshot(): VSARLPolicySnapshot {
    return {
      stateDim: this.stateDim,
      actionCount: this.actionCount,
      policyFHRR: Array.from(this.policyFHRR),
      valueFHRR: Array.from(this.valueFHRR),
      archetypePolicyFHRR: Array.from(this.archetypePolicyFHRR),
      archetypeValueFHRR: Array.from(this.archetypeValueFHRR),
      traitModulationMatrix: Array.from(this.traitModulationMatrix),
      updatedAt: Date.now(),
    };
  }

  restoreSnapshot(snapshot?: VSARLPolicySnapshot | null): void {
    if (!snapshot || snapshot.stateDim !== this.stateDim || snapshot.actionCount !== this.actionCount) {
      return;
    }
    if (Array.isArray(snapshot.policyFHRR) && snapshot.policyFHRR.length === this.policyFHRR.length) {
      this.policyFHRR.set(snapshot.policyFHRR);
    }
    if (Array.isArray(snapshot.valueFHRR) && snapshot.valueFHRR.length === this.valueFHRR.length) {
      this.valueFHRR.set(snapshot.valueFHRR);
    }
    if (Array.isArray(snapshot.archetypePolicyFHRR) && snapshot.archetypePolicyFHRR.length === this.archetypePolicyFHRR.length) {
      this.archetypePolicyFHRR.set(snapshot.archetypePolicyFHRR);
    }
    if (Array.isArray(snapshot.archetypeValueFHRR) && snapshot.archetypeValueFHRR.length === this.archetypeValueFHRR.length) {
      this.archetypeValueFHRR.set(snapshot.archetypeValueFHRR);
    }
    if (Array.isArray(snapshot.traitModulationMatrix) && snapshot.traitModulationMatrix.length === this.traitModulationMatrix.length) {
      this.traitModulationMatrix.set(snapshot.traitModulationMatrix);
    }
  }
}
