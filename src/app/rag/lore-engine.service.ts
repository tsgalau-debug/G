/* eslint-disable */
import { Injectable, signal, computed, inject, effect } from "@angular/core";
import { GameStateService } from "../game-state.service";
import { SYSTEM_RULES } from "../system-rules";
import { TimelineDAGState, TimelineNode, WhatIfScenarioData } from "./timeline-dag";
import { MergeResult } from "./world-merge-resolver";

export interface ScoredChoice {
  id: string;
  text: string;
  weight: number;
  isValid: boolean;
  failureReasons: string[];
}

export interface RetrievedLore {
  entry: { key: string; content: string };
  relevanceScore: number;
  reason: string;
}

export interface OrchestratorDecision {
  strategy: number;
  action: 'return' | 'requery' | 'escalate_llm' | 'kernel_answer';
  confidence: number;
  reasoning: string;
  anomalyCount: number;
  decisionId?: number; // P1 FIX
  npcId?: string;
  npcArchetype?: string;
  degraded?: boolean;
}

@Injectable({ providedIn: "root" })
export class LoreEngineService {
  private readonly worker: Worker | null = null;
  private readonly messageMap = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private nextMsgId = 1;

  readonly isReady = signal(false);
  readonly lastRetrievalMs = signal(0);
  readonly lastRetrieval = signal<RetrievedLore[]>([]);
  readonly retrievalCount = computed(() => this.lastRetrieval().length);
  readonly topRelevance = computed(() => this.lastRetrieval()[0]?.relevanceScore ?? 0);

  readonly lastHash = signal("");
  readonly lastSnippet = signal("");
  readonly lastDecision = signal<OrchestratorDecision | null>(null);
  readonly activeNpcArchetype = computed(() => this.lastDecision()?.npcArchetype ?? null);

  private readonly gameState = inject(GameStateService);

  constructor() {
    this.gameState?.registerResetHook?.(() => {
      this._pendingClearStore = true;
    });
    this.gameState?.registerStorySwitchHook?.((storyId: string) => this.reinitialize(storyId));

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('lore-engine.worker', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }) => {
        const { id, result, error } = data;
        const cb = this.messageMap.get(id);
        if (cb) {
          this.messageMap.delete(id);
          if (error) cb.reject(new Error(error));
          else cb.resolve(result);
        }
      };
      this._initWorker();

      effect(() => {
        if (this.isReady() && this.gameState.isLoaded()) {
          void this._syncFromLoadedGameState();
        }
      });
    }
  }

  private _restoredStoryId = "";
  private _isReinitializing = false;
  private _pendingClearStore = false;

  private async _syncFromLoadedGameState(): Promise<void> {
    if (this._isReinitializing) return;
    const storyId = this.gameState?.activeStoryId ? this.gameState.activeStoryId() : 'default';
    const persistedDag = this.gameState?.timelineDagState as TimelineDAGState | null;
    const persistedRl = this.gameState?.rlPolicySnapshot;
    if (
      ((persistedDag && Array.isArray(persistedDag.nodes) && persistedDag.nodes.length > 0) || persistedRl) &&
      this._restoredStoryId !== storyId
    ) {
      this._restoredStoryId = storyId;
      await this.reinitialize(storyId);
      return;
    }
    this._restoredStoryId = storyId;
    await this.refreshDynamicContext();
  }

  private async dispatch(action: string, payload?: any): Promise<any> {
    if (!this.worker) throw new Error("Worker not supported");
    const id = this.nextMsgId++;
    return new Promise((resolve, reject) => {
      this.messageMap.set(id, { resolve, reject });
      this.worker!.postMessage({ id, action, payload });
    });
  }

  private async _initWorker(): Promise<void> {
    try {
      const currentStoryId = this.gameState?.activeStoryId ? this.gameState.activeStoryId() : 'default';
      const timelineDagState = this.gameState?.timelineDagState ?? null;
      const timelineSnapshots = this.gameState?.timelineSnapshots ?? {};
      const rlPolicySnapshot = this.gameState?.rlPolicySnapshot ?? null;
      if (timelineDagState || rlPolicySnapshot) {
        this._restoredStoryId = currentStoryId;
      }
      const res = await this.dispatch('init', {
        storyId: currentStoryId,
        timelineDagState,
        timelineSnapshots,
        rlPolicySnapshot
      });
      if (res?.dag) {
        this.timelineState.set(res.dag);
      }
      this.isReady.set(true);
    } catch (error) {
      console.warn("LoreEngineService worker init failed", error);
    }
  }

  async reinitialize(storyId: string, clearStore = false): Promise<void> {
    if (!this.worker) return;
    this._isReinitializing = true;
    const shouldClearStore = clearStore || this._pendingClearStore;
    this._pendingClearStore = false;
    try {
      this.isReady.set(false);
      this.lastHash.set("");
      this.lastSnippet.set("");
      this.lastDecision.set(null);
      this._restoredStoryId = storyId;
      const timelineDagState = this.gameState?.timelineDagState ?? null;
      const timelineSnapshots = this.gameState?.timelineSnapshots ?? {};
      const rlPolicySnapshot = this.gameState?.rlPolicySnapshot ?? null;
      const res = await this.dispatch('init', {
        storyId,
        timelineDagState,
        timelineSnapshots,
        rlPolicySnapshot,
        clearStore: shouldClearStore
      });
      if (res?.dag) {
        this.timelineState.set(res.dag);
      } else {
        this.timelineState.set(null);
      }
      this.isReady.set(true);
      await this.refreshDynamicContext();
    } catch (error) {
      console.warn("LoreEngineService worker reinitialize failed", error);
      this.isReady.set(true);
    } finally {
      this._isReinitializing = false;
    }
  }

  async getContextSnippet(
    location: string, 
    entities: string[], 
    tags: string[], 
    playerChoice = "",
    npcContext?: any
  ): Promise<string> {
    if (!this.isReady()) return this._fallbackStatic();

    const kg = this.gameState.knowledgeGraph || {};
    const weights = this.gameState.knowledgeWeights || {};
    const kgCacheKey = Object.keys(kg)
      .map((k) => `${k}:${(kg as Record<string,any[]>)[k]?.length || 0}`)
      .join(";");
    const weightCacheKey = Object.entries(weights)
      .map(([wk, wv]) => `${wk}=${wv}`)
      .join(",");
    const npcKey = npcContext ? (npcContext.nama || npcContext.id || npcContext.archetype || "") : "";
    const activeTimeline = typeof this.gameState.activeTimelineId === 'function'
      ? this.gameState.activeTimelineId()
      : 'trunk';
    const hash = `${activeTimeline}:${location}:${entities.sort().join(",")}:${tags.sort().join(",")}:${playerChoice}:${kgCacheKey}:${weightCacheKey}:${npcKey}`;

    if (hash === this.lastHash() && this.lastSnippet()) {
      return this.lastSnippet();
    }

    try {
      const { snippet, retrieved, elapsed, decision } = await this.dispatch(
        'getContextSnippet', 
        { location, entities, tags, playerChoice, npc: npcContext }
      );

      this.lastRetrievalMs.set(elapsed);
      this.lastRetrieval.set(retrieved);
      this.lastSnippet.set(snippet || "");
      this.lastHash.set(hash);
      this.lastDecision.set(decision || null);

      return this.lastSnippet();
    } catch {
      return this._fallbackStatic();
    }
  }

  /**
   * Report outcome of a retrieval decision for RL learning.
   * Call this after LLM responds or player acts on the result.
   */
  async reportOutcome(
    userSatisfied: boolean,
    llmAccepted: boolean,
    latencyMs?: number
  ): Promise<void> {
    if (!this.isReady() || !this.lastDecision()) return;

    const res = await this.dispatch('reportOutcome', {
      decision: this.lastDecision(),
      userSatisfied,
      llmAccepted,
      latencyMs: latencyMs ?? this.lastRetrievalMs(),
    });
    if (res?.rlSnapshot && this.gameState) {
      this.gameState.rlPolicySnapshot = res.rlSnapshot;
      await this.gameState.saveState();
    }
  }

  /**
   * Get orchestrator statistics for debugging/monitoring.
   */
  async getStats(): Promise<{
    orchestrator: any;
    rlPolicy: any;
    hologram: any;
  } | null> {
    if (!this.isReady()) return null;
    return this.dispatch('getStats');
  }

  async explainDecision(
    location: string, 
    entities: string[], 
    tags: string[], 
    playerChoice = "",
    npcContext?: any
  ): Promise<any> {
    if (!this.isReady()) return null;
    return this.dispatch('explainDecision', { location, entities, tags, playerChoice, npc: npcContext });
  }

  async registerNpcPersonality(personality: any): Promise<void> {
    if (!this.isReady()) return;
    await this.dispatch('registerNpcPersonality', { personality });
  }

  async getArchetypeStats(archetype: string): Promise<any> {
    if (!this.isReady()) return null;
    return this.dispatch('getArchetypeStats', { archetype });
  }

  async getNpcPersonalities(): Promise<any[]> {
    if (!this.isReady()) return [];
    return this.dispatch('getNpcPersonalities');
  }

  scoreChoices(
    rawChoices: {
      id: string;
      text: string;
      weight?: number;
      targetEntity?: string;
      targetFaction?: string;
      requirements?: { inventory?: string[]; trust?: Record<string, number> };
    }[],
  ): ScoredChoice[] {
    const state = this.gameState.mcState;
    const factions = this.gameState.factions || {};
    const trust = state.trust || {};
    const inventory = state.inventory || [];
    const equippedValues = Object.values(state.equipped || {}).filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0
    );

    const normalizeItem = (s: string) =>
      s.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    const ownedRawLower = [...inventory, ...equippedValues].map(i => String(i).trim().toLowerCase());
    const ownedBaseLower = [...inventory, ...equippedValues].map(i => normalizeItem(String(i)));

    const hasRequiredItem = (reqItem: string): boolean => {
      const reqLower = String(reqItem || '').trim().toLowerCase();
      if (!reqLower) return true;
      const reqBase = normalizeItem(reqLower);
      return (
        ownedRawLower.some(owned => owned === reqLower || owned.includes(reqLower) || reqLower.includes(owned)) ||
        (reqBase.length >= 3 && ownedBaseLower.some(base => base === reqBase || base.includes(reqBase) || reqBase.includes(base)))
      );
    };

    const resolveTrustOrReputation = (entityKey: string): { found: boolean; value: number } => {
      if (trust[entityKey] !== undefined) {
        return { found: true, value: Number(trust[entityKey]) || 0 };
      }
      const keyLower = String(entityKey || '').trim().toLowerCase();
      for (const [tk, tv] of Object.entries(trust)) {
        if (tk.trim().toLowerCase() === keyLower) {
          return { found: true, value: Number(tv) || 0 };
        }
      }
      for (const [fk, fv] of Object.entries(factions)) {
        if (fk.trim().toLowerCase() === keyLower) {
          return { found: true, value: Number(fv?.reputation) || 0 };
        }
      }
      return { found: false, value: 0 };
    };

    const out: ScoredChoice[] = Array.from({length: Math.min(rawChoices.length, 16)});
    let count = 0;

    for (const c of rawChoices) {
      if (count >= 16) break;

      let score = Math.max(0, Math.min(1, c.weight ?? 0.5));
      const failures: string[] = [];
      let valid = true;

      if ((c.requirements?.inventory?.length ?? 0) > 0) {
        const miss = c.requirements!.inventory!.filter((i: string) => !hasRequiredItem(i));
        if (miss.length > 0) {
          valid = false;
          failures.push(`Missing: ${miss.join(", ")}`);
        }
      }

      if (c.requirements?.trust && typeof c.requirements.trust === "object") {
        for (const [entityId, reqVal] of Object.entries(c.requirements.trust)) {
          const resolved = resolveTrustOrReputation(entityId);
          const currentTrust = resolved.value;
          if (currentTrust < Number(reqVal)) {
            valid = false;
            failures.push(`Trust too low: ${entityId} (Req: ${reqVal}, Cur: ${currentTrust})`);
          }
        }
      }

      if (c.targetEntity) {
        const resolved = resolveTrustOrReputation(c.targetEntity);
        if (resolved.found) {
          const t = resolved.value || 50;
          const norm = (t - 50) / 50;
          score *= 1 + norm * 0.25;
        }
      }

      if (c.targetFaction) {
        const facLower = c.targetFaction.trim().toLowerCase();
        const matchedFaction =
          factions[c.targetFaction] ??
          Object.entries(factions).find(([fk]) => fk.trim().toLowerCase() === facLower)?.[1];
        if (matchedFaction) {
          const rep = matchedFaction.reputation || 0;
          score *= 1 + (rep / 100) * 0.3;
        }
      }

      score = Math.max(0, Math.min(1, score));

      out[count++] = {
        id: c.id,
        text: c.text,
        weight: score,
        isValid: valid,
        failureReasons: failures,
      };
    }

    out.length = count;
    out.sort((a, b) => b.weight - a.weight);
    return out;
  }

  async syncKnowledgeGraph(): Promise<void> {
    /* No-op here, handled via refreshDynamicContext */
  }

  async syncEpisodicMemory(): Promise<void> {
    /* No-op here, handled via refreshDynamicContext */
  }

  async refreshDynamicContext(): Promise<void> {
    if (!this.isReady()) return;
    const kg = this.gameState.knowledgeGraph;
    const stateExt = this.gameState as unknown as { knowledgeWeights?: Record<string, number> };
    const weights = stateExt.knowledgeWeights ?? {};
    const episodes = this.gameState.chronicle;
    const logs = this.gameState.logs;

    await this.dispatch('sync', { kg, weights, episodes, logs });
  }

  async destroyWorker(): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.dispatch('destroy');
    } catch(e) {
      console.warn("Error destroying worker", e);
    }
  }

  async resolvePlayerChoice(branchWorld: number): Promise<string> {
    if (!this.isReady()) return "";
    return this.dispatch('resolvePlayerChoice', { branchWorld });
  }

  readonly timelineState = signal<TimelineDAGState | null>(null);

  async fetchTimelineState(): Promise<TimelineDAGState | null> {
    if (!this.isReady()) return null;
    try {
      const state = await this.dispatch('getTimelineState');
      this.timelineState.set(state);
      if (state && this.gameState) {
        this.gameState.timelineDagState = state;
      }
      return state;
    } catch (e) {
      console.warn('Gagal memuat timeline state:', e);
      return null;
    }
  }

  async forkTimeline(
    parentId: string,
    name: string,
    forkTurn: number,
    notes?: string,
    switchImmediately = true
  ): Promise<{ success: boolean; node: TimelineNode; dag: TimelineDAGState }> {
    if (!this.isReady()) throw new Error('Lore Engine belum siap');
    const res = await this.dispatch('forkTimeline', { parentId, name, forkTurn, notes, switchImmediately });
    if (res?.dag) {
      this.timelineState.set(res.dag);
      if (res.node && typeof this.gameState.forkTimelineBranch === 'function') {
        await this.gameState.forkTimelineBranch(res.node.id, parentId, forkTurn, res.node.name, res.dag);
        if (switchImmediately && typeof this.gameState.switchTimelineBranch === 'function') {
          await this.gameState.switchTimelineBranch(res.node.id, res.dag);
          this.lastHash.set("");
          await this.refreshDynamicContext();
        }
      }
    }
    return res;
  }

  async simulateWhatIf(
    prompt: string,
    parentId?: string,
    currentTurn?: number,
    createBranch = false
  ): Promise<{ scenario: WhatIfScenarioData; simNode: TimelineNode | null; dag: TimelineDAGState }> {
    if (!this.isReady()) throw new Error('Lore Engine belum siap');
    const res = await this.dispatch('simulateWhatIf', { prompt, parentId, currentTurn, createBranch });
    if (res?.dag) {
      this.timelineState.set(res.dag);
      if (res.simNode && typeof this.gameState.forkTimelineBranch === 'function') {
        await this.gameState.forkTimelineBranch(
          res.simNode.id,
          parentId || 'trunk',
          currentTurn || 1,
          res.simNode.name,
          res.dag
        );
      } else if (this.gameState) {
        this.gameState.timelineDagState = res.dag;
      }
    }
    return res;
  }

  async mergeTimeline(
    branchId: string,
    targetId = 'trunk',
    autoThreshold = 0.15,
    trunkPriority = true
  ): Promise<{ success: boolean; mergeResult: MergeResult; dag: TimelineDAGState }> {
    if (!this.isReady()) throw new Error('Lore Engine belum siap');
    const res = await this.dispatch('mergeTimeline', { branchId, targetId, autoThreshold, trunkPriority });
    if (res?.dag) {
      this.timelineState.set(res.dag);
      if (typeof this.gameState.mergeTimelineBranch === 'function') {
        await this.gameState.mergeTimelineBranch(branchId, targetId, trunkPriority, res.mergeResult, res.dag);
        this.lastHash.set("");
        await this.refreshDynamicContext();
      }
    }
    return res;
  }

  async pruneTimeline(timelineId: string): Promise<{ success: boolean; dag: TimelineDAGState }> {
    if (!this.isReady()) throw new Error('Lore Engine belum siap');
    const res = await this.dispatch('pruneTimeline', { timelineId });
    if (res?.dag) {
      this.timelineState.set(res.dag);
      if (typeof this.gameState.pruneTimelineBranch === 'function') {
        await this.gameState.pruneTimelineBranch(timelineId, res.dag);
        this.lastHash.set("");
      }
    }
    return res;
  }

  async switchActiveTimeline(timelineId: string): Promise<{ success: boolean; dag: TimelineDAGState }> {
    if (!this.isReady()) throw new Error('Lore Engine belum siap');
    const res = await this.dispatch('switchActiveTimeline', { timelineId });
    if (res?.dag) {
      this.timelineState.set(res.dag);
      if (typeof this.gameState.switchTimelineBranch === 'function') {
        await this.gameState.switchTimelineBranch(timelineId, res.dag);
        this.lastHash.set("");
        await this.refreshDynamicContext();
      }
    }
    return res;
  }

  private _fallbackStatic(): string {
    const keys = this.gameState.activeLoreKeys || [];
    const book = (SYSTEM_RULES as any)?.lorebook_database || {};
    const s = keys
      .filter((k: string) => book[k])
      .map((k: string) => `[${k}]: ${book[k]}`);
    return s.length > 0 ? `\n=== STATIC LORE ===\n${s.join("\n")}` : "";
  }
}
