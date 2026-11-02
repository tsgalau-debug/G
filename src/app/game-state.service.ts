/* eslint-disable */
import { Injectable, inject, ApplicationRef, signal, computed } from '@angular/core';

import { TopologicalSyncSystem } from './topology/topological-sync';
import { HomologyAnalysisResult, SimplicialComplexTracker } from './topology/simplicial-complex';

import {
  generateDynamicNpcSchedule,
  generateNpcSchedulesMap
} from './world-genesis';

export * from './game-state.types';
export { GameDatabase, VALID_AI_MODELS } from './game-state/game-database';
import { GameDatabase } from './game-state/game-database';
import {
  cloneDeep,
  buildForkedBranchSnapshot,
  reconcileThreeWayBranchMerge
} from './game-state/timeline-branch-reconciler';
import {
  computeMcStateProgression,
  consumeInventoryItem,
  computeFactionReputationTier,
  applyKnowledgeGraphUpdatesWithWeights,
  equipMcItem,
  unequipMcItem,
  dropMcItem
} from './game-state/mc-progression-reducer';
import {
  buildNewStoryMetaAndSession,
  buildResetStoryGenesisState
} from './game-state/story-session-factory';
import {
  type CustomNpcUpsertPayload,
  applyCustomNpcUpsert,
  resolveIncomingNpcArray,
  sanitizeAllNpcSchedulesMap,
  reconcileNpcTurnAndSchedules,
  mergeFactionUpdates,
  resolveNpcTrustScore,
  filterFactionNpcs,
  applyFactionReputationAdjustment,
  applyNpcTrustAdjustment
} from './game-state/npc-faction-reducer';
import {
  extractNumericTrustMap,
  buildBranchSnapshotFromState,
  hydrateSessionStatePayload,
  hydrateBranchSnapshotPayload,
  loadInitialStoriesAndSessionFromDb,
  persistSessionStateToDb,
  cloneDuplicatedStoryInDb,
  deleteStoryRecordInDb
} from './game-state/session-storage-coordinator';

import type {
  McState,
  GraphUpdate,
  QuestState,
  CombatState,
  ChronicleEntry,
  FactionState,
  NpcState,
  NpcDailySchedule,
  StoryMetadata,
  CreateStoryPayload,
  StorySessionData,
  TimelineBranchSnapshot
} from './game-state.types';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private resetHooks: Array<() => Promise<void> | void> = [];
  private storySwitchHooks: Array<(storyId: string) => Promise<void> | void> = [];

  registerResetHook(fn: () => Promise<void> | void): void {
    this.resetHooks.push(fn);
  }

  registerStorySwitchHook(fn: (storyId: string) => Promise<void> | void): void {
    this.storySwitchHooks.push(fn);
  }

  chronicle: ChronicleEntry[] = [];
  activeTab = signal<string>('story');
  stateVersion = signal<number>(0);
  pendingStoryAction?: string | undefined;

  activeStoryId = signal<string>('story_default_sandbox');
  availableStories = signal<StoryMetadata[]>([]);
  activeStory = computed(() => this.availableStories().find(s => s.id === this.activeStoryId()) ?? null);
  showStoryManagerModal = signal<boolean>(false);

  activeTimelineId = signal<string>('trunk');
  timelineSnapshots: Record<string, TimelineBranchSnapshot> = {};
  timelineDagState: unknown = null;
  rlPolicySnapshot: unknown = null;

  mcState: Partial<McState> = {
    name: 'Protagonis',
    title: 'Pengembara',
    level: 1,
    exp: 0,
    maxExp: 100,
    inventory: ['Perlengkapan Dasar', 'Tas Pengembara', 'Ransum Makanan', '100 Koin'],
    equipped: {
      weapon: 'Perlengkapan Dasar',
      bag: 'Tas Pengembara'
    },
    status: 'Healthy',
    location: 'LOC_ORIGIN',
    locationName: 'Titik Awal',
    trust: {},
    time: '08:00',
    day: 1,
    stats: {
      hp: 100,
      maxHp: 100,
      sp: 50,
      maxSp: 50,
      strength: 75,
      charisma: 75,
      stamina: 80,
      agility: 75
    }
  };
  factions: Record<string, FactionState> = {};
  npcStates: Record<string, NpcState> = {};
  npcSchedules: Record<string, NpcDailySchedule> = {};
  logs: string[] = [];

  topologicalAnomalies: string[] = [];
  rollingNpcKeys: string[] = [];
  homologyState = signal<HomologyAnalysisResult | null>(null);

  knowledgeGraph: Record<string, string[]> = {};
  knowledgeWeights: Record<string, number> = {};
  activeLoreKeys: string[] = [];
  storySummary = 'Dunia terbuka siap dijelajahi. Pilih skenario cerita atau bangun karakter dan dunia sesuai imajinasi Anda.';

  quests: Record<string, QuestState> = {};
  combat: CombatState = { inCombat: false, enemies: [], advantage: 'neutral' };

  aiModel = 'gemini-3.5-flash-lite';
  db = new GameDatabase();
  appRef: ApplicationRef | null = (() => {
    try {
      return inject(ApplicationRef, { optional: true });
    } catch {
      return null;
    }
  })();
  isLoaded = signal(false);

  get turnCount(): number {
    return this.chronicle?.length ?? 1;
  }

  private getNumericTrust(): Record<string, number> {
    return extractNumericTrustMap(this.mcState?.trust);
  }

  constructor() {
    if (globalThis.window !== undefined) {
      this.loadState();
    }
  }

  async loadState() {
    try {
      const { allStories, targetId, savedSessionState } =
        await loadInitialStoriesAndSessionFromDb(this.db, this.mcState);
      this.availableStories.set(allStories);
      this.activeStoryId.set(targetId);
      if (savedSessionState) {
        this.applySessionData(savedSessionState);
      }
      this.appRef?.tick();
    } catch (error) {
      console.error('Failed to load state from Dexie', error);
    } finally {
      this.isLoaded.set(true);
    }
  }

  private applySessionData(parsed: Partial<StorySessionData>) {
    const h = hydrateSessionStatePayload(parsed, this.mcState, this.factions, this.storySummary);
    this.chronicle = h.chronicle;
    this.mcState = h.mcState;
    this.npcStates = h.npcStates;
    this.npcSchedules = h.npcSchedules;
    this.rollingNpcKeys = h.rollingNpcKeys;
    this.homologyState.set(h.homology);
    this.factions = h.factions;
    this.logs = h.logs;
    this.knowledgeGraph = h.knowledgeGraph;
    this.knowledgeWeights = h.knowledgeWeights;
    this.activeLoreKeys = h.activeLoreKeys;
    this.storySummary = h.storySummary;
    this.quests = h.quests;
    this.combat = h.combat;
    this.aiModel = h.aiModel;
    this.activeTimelineId.set(h.activeTimelineId);
    this.timelineSnapshots = h.timelineSnapshots;
    this.timelineDagState = h.timelineDagState;
    this.rlPolicySnapshot = h.rlPolicySnapshot;
    this.stateVersion.update(v => v + 1);
  }

  captureCurrentBranchSnapshot(): TimelineBranchSnapshot {
    const currentBranchId = this.activeTimelineId();
    return buildBranchSnapshotFromState({
      chronicle: this.chronicle,
      mcState: this.mcState,
      npcStates: this.npcStates,
      npcSchedules: this.npcSchedules,
      factions: this.factions,
      logs: this.logs,
      knowledgeGraph: this.knowledgeGraph,
      knowledgeWeights: this.knowledgeWeights,
      activeLoreKeys: this.activeLoreKeys,
      storySummary: this.storySummary,
      quests: this.quests,
      combat: this.combat,
      existingSnapshot: this.timelineSnapshots[currentBranchId]
    });
  }

  private applyBranchSnapshot(snap: TimelineBranchSnapshot): void {
    const h = hydrateBranchSnapshotPayload(snap, this.mcState, this.storySummary);
    this.chronicle = h.chronicle;
    this.mcState = h.mcState;
    this.npcStates = h.npcStates;
    this.npcSchedules = h.npcSchedules;
    this.rollingNpcKeys = h.rollingNpcKeys;
    this.homologyState.set(h.homology);
    this.factions = h.factions;
    this.logs = h.logs;
    this.knowledgeGraph = h.knowledgeGraph;
    this.knowledgeWeights = h.knowledgeWeights;
    this.activeLoreKeys = h.activeLoreKeys;
    this.storySummary = h.storySummary;
    this.quests = h.quests;
    this.combat = h.combat;
    this.stateVersion.update(v => v + 1);
    this.appRef?.tick();
  }

  async forkTimelineBranch(
    branchId: string,
    parentId: string,
    forkTurn: number,
    branchName: string,
    dagState?: unknown
  ): Promise<void> {
    const activeId = this.activeTimelineId();
    this.timelineSnapshots[activeId] = this.captureCurrentBranchSnapshot();

    const sourceSnap = this.timelineSnapshots[parentId]
      ? cloneDeep(this.timelineSnapshots[parentId]!)
      : this.captureCurrentBranchSnapshot();

    this.timelineSnapshots[branchId] = buildForkedBranchSnapshot(
      sourceSnap,
      branchId,
      parentId,
      forkTurn,
      branchName
    );
    if (dagState !== undefined) {
      this.timelineDagState = cloneDeep(dagState);
    }
    await this.saveState();
  }

  async switchTimelineBranch(targetTimelineId: string, dagState?: unknown): Promise<boolean> {
    const currentId = this.activeTimelineId();
    this.timelineSnapshots[currentId] = this.captureCurrentBranchSnapshot();

    let targetSnap = this.timelineSnapshots[targetTimelineId];
    if (!targetSnap) {
      const fallbackSource = this.timelineSnapshots['trunk'] ?? this.timelineSnapshots[currentId];
      if (!fallbackSource) return false;
      targetSnap = cloneDeep(fallbackSource);
      this.timelineSnapshots[targetTimelineId] = targetSnap;
    }

    this.activeTimelineId.set(targetTimelineId);
    if (dagState !== undefined) {
      this.timelineDagState = cloneDeep(dagState);
    }

    this.applyBranchSnapshot(targetSnap);
    await this.saveState();
    return true;
  }

  async mergeTimelineBranch(
    branchId: string,
    targetId = 'trunk',
    trunkPriority = true,
    mergeResult?: { autoResolved?: number; flaggedForLLM?: number; finalCoherence?: number },
    dagState?: unknown
  ): Promise<void> {
    const currentId = this.activeTimelineId();
    this.timelineSnapshots[currentId] = this.captureCurrentBranchSnapshot();

    const branchSnap = this.timelineSnapshots[branchId];
    const baseTargetSnap = this.timelineSnapshots[targetId]
      ? cloneDeep(this.timelineSnapshots[targetId]!)
      : this.captureCurrentBranchSnapshot();

    const targetSnap = reconcileThreeWayBranchMerge(
      branchSnap,
      baseTargetSnap,
      branchId,
      targetId,
      trunkPriority,
      mergeResult
    );

    this.timelineSnapshots[targetId] = targetSnap;
    this.activeTimelineId.set(targetId);
    if (dagState !== undefined) {
      this.timelineDagState = cloneDeep(dagState);
    }

    this.applyBranchSnapshot(targetSnap);
    await this.saveState();
  }

  async pruneTimelineBranch(timelineId: string, dagState?: unknown): Promise<void> {
    if (timelineId === 'trunk') return;
    const currentId = this.activeTimelineId();
    this.timelineSnapshots[currentId] = this.captureCurrentBranchSnapshot();

    delete this.timelineSnapshots[timelineId];
    if (dagState !== undefined) {
      this.timelineDagState = cloneDeep(dagState);
    }

    if (currentId === timelineId) {
      this.activeTimelineId.set('trunk');
      const trunkSnap = this.timelineSnapshots['trunk'];
      if (trunkSnap) {
        this.applyBranchSnapshot(trunkSnap);
      }
    }
    await this.saveState();
  }

  setAiModel(model: string) {
    this.aiModel = model;
    this.saveState();
  }

  async saveState() {
    const activeBranch = this.activeTimelineId() || 'trunk';
    this.timelineSnapshots[activeBranch] = this.captureCurrentBranchSnapshot();

    if (globalThis.window !== undefined) {
      try {
        const currentId = this.activeStoryId();
        const sessionPayload: StorySessionData = {
          chronicle: this.chronicle,
          mcState: this.mcState,
          npcStates: this.npcStates,
          npcSchedules: this.npcSchedules,
          factions: this.factions,
          logs: this.logs,
          knowledgeGraph: this.knowledgeGraph,
          knowledgeWeights: this.knowledgeWeights,
          activeLoreKeys: this.activeLoreKeys,
          storySummary: this.storySummary,
          quests: this.quests,
          combat: this.combat,
          aiModel: this.aiModel,
          activeTimelineId: activeBranch,
          timelineSnapshots: this.timelineSnapshots,
          timelineDagState: this.timelineDagState,
          rlPolicySnapshot: this.rlPolicySnapshot
        };
        const updatedList = await persistSessionStateToDb(this.db, currentId, sessionPayload);
        this.availableStories.set(updatedList);
      } catch (error) {
        console.error('Failed to save state to Dexie', error);
      }
    }
  }

  async switchStory(storyId: string): Promise<boolean> {
    if (!storyId || storyId === this.activeStoryId()) {
      return true;
    }

    try {
      await this.saveState();

      const targetSession = await this.db.sessions.get(storyId);
      const targetMeta = await this.db.stories.get(storyId);
      if (!targetMeta) {
        console.warn(`Target story ${storyId} not found`);
        return false;
      }

      this.activeStoryId.set(storyId);
      globalThis.localStorage?.setItem('guardian_active_story_id', storyId);

      targetMeta.lastPlayedAt = Date.now();
      await this.db.stories.put(targetMeta);

      if (targetSession?.state) {
        this.applySessionData(targetSession.state);
      }

      for (const hook of this.storySwitchHooks) {
        try {
          await hook(storyId);
        } catch (err) {
          console.warn('Error executing story switch hook:', err);
        }
      }

      const updatedList = await this.db.stories.orderBy('lastPlayedAt').reverse().toArray();
      this.availableStories.set(updatedList);

      this.activeTab.set('story');
      this.appRef?.tick();
      return true;
    } catch (error) {
      console.error('Failed to switch story:', error);
      return false;
    }
  }

  async createNewStory(payload: CreateStoryPayload): Promise<string> {
    const { storyId, newMeta, newSession } = buildNewStoryMetaAndSession(payload, this.aiModel);
    await this.db.stories.put(newMeta);
    await this.db.sessions.put({ id: storyId, state: newSession });
    await this.switchStory(storyId);
    return storyId;
  }

  async duplicateStory(sourceStoryId: string): Promise<string> {
    const newId = await cloneDuplicatedStoryInDb(this.db, sourceStoryId);
    await this.switchStory(newId);
    return newId;
  }

  async deleteStory(storyId: string): Promise<boolean> {
    const res = await deleteStoryRecordInDb(this.db, storyId);
    if (!res.deleted) return false;
    if (this.activeStoryId() === storyId && res.nextStoryId) {
      await this.switchStory(res.nextStoryId);
    } else if (res.updatedStories) {
      this.availableStories.set(res.updatedStories);
    }
    return true;
  }

  async resetCurrentStory(): Promise<void> {
    const currentMeta = this.activeStory();
    if (!currentMeta) return;
    const { genesis, mcState } = buildResetStoryGenesisState(currentMeta, this.mcState.equipped?.weapon);
    this.chronicle = [];
    this.logs = [`[Sistem] Kisah "${currentMeta.title}" di-reset ke kondisi awal.`, ...genesis.initialLogs];
    this.quests = genesis.quests;
    this.combat = { inCombat: false, enemies: [], advantage: 'neutral' };
    this.factions = genesis.factions;
    this.knowledgeGraph = genesis.knowledgeGraph;
    this.knowledgeWeights = {};
    this.activeLoreKeys = genesis.activeLoreKeys;
    this.storySummary = currentMeta.summary;
    this.mcState = mcState;

    const { resolvedState, homology } = TopologicalSyncSystem.resolveState(
      genesis.npcStates,
      [],
      this.getNumericTrust(),
      this.factions
    );
    this.npcStates = resolvedState;
    this.npcSchedules = genesis.npcSchedules
      ? cloneDeep(genesis.npcSchedules)
      : generateNpcSchedulesMap(resolvedState, currentMeta.locationName);
    this.rollingNpcKeys = Object.keys(resolvedState);
    this.homologyState.set(homology);
    this.activeTimelineId.set('trunk');
    this.timelineSnapshots = {};
    this.timelineDagState = null;
    this.rlPolicySnapshot = null;
    await this.saveState();
    for (const hook of this.resetHooks) {
      try { await hook(); } catch {}
    }
    for (const hook of this.storySwitchHooks) {
      try { await hook(currentMeta.id); } catch {}
    }
    this.stateVersion.update(v => v + 1);
    this.appRef?.tick();
  }

  getInitialStoryPrompt(): string {
    const active = this.activeStory();
    if (active?.summary && active.summary.trim().length > 0) {
      return active.summary.trim();
    }
    const name = this.mcState.name || 'Protagonis';
    const title = this.mcState.title || 'Pengembara';
    const loc = this.mcState.locationName || 'Wilayah Petualangan';
    const weapon = this.mcState.equipped?.weapon || 'perlengkapan';
    return `Tiba di ${loc}. Aku (${name}, seorang ${title}) membawa ${weapon}, melangkah maju memperhatikan suasana sekitar dan siap memulai petualangan.`;
  }

  addLog(log: string) {
    this.logs.push(log);
    this.saveState();
  }

  addChronicleEntry(entry: ChronicleEntry) {
    this.chronicle.push(entry);
    this.saveState();
  }

  updateMcState(newState: Partial<McState>, narrativeText?: string) {
    if (!newState) return;
    const { nextMcState, generatedLogs } = computeMcStateProgression(
      this.mcState,
      newState,
      narrativeText
    );
    for (const log of generatedLogs) {
      this.addLog(log);
    }
    this.mcState = nextMcState;
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  equipItem(item: string, slot?: 'weapon' | 'armor' | 'accessory' | 'bag') {
    const { nextMcState, logMessage } = equipMcItem(this.mcState, item, slot);
    this.mcState = nextMcState;
    this.addLog(logMessage);
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  unequipItem(slot: 'weapon' | 'armor' | 'accessory' | 'bag') {
    const { nextMcState, logMessage } = unequipMcItem(this.mcState, slot);
    if (nextMcState && logMessage) {
      this.mcState = nextMcState;
      this.addLog(logMessage);
      this.stateVersion.update(v => v + 1);
      this.saveState();
    }
  }

  useItem(item: string): { success: boolean; message: string; hpRestored?: number | undefined; spRestored?: number | undefined } {
    const result = consumeInventoryItem(this.mcState, item);
    if (!result.success || !result.nextMcState) {
      return { success: false, message: result.message };
    }
    this.mcState = result.nextMcState;
    this.addLog(`[Konsumsi] ${result.message}`);
    this.stateVersion.update(v => v + 1);
    this.saveState();
    return {
      success: true,
      message: result.message,
      hpRestored: result.hpRestored,
      spRestored: result.spRestored
    };
  }

  dropItem(item: string) {
    const { nextMcState, logMessage } = dropMcItem(this.mcState, item);
    if (nextMcState && logMessage) {
      this.mcState = nextMcState;
      this.addLog(logMessage);
      this.stateVersion.update(v => v + 1);
      this.saveState();
    }
  }

  addItem(item: string) {
    const trimmed = item.trim();
    if (!trimmed) return;
    const currentInv = this.mcState.inventory ? [...this.mcState.inventory] : [];
    currentInv.push(trimmed);
    this.mcState = { ...this.mcState, inventory: currentInv };
    this.addLog(`[Inventory] Memperoleh barang: "${trimmed}".`);
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  updateProfile(
    name: string,
    title?: string,
    details?: { personality?: string | undefined; background?: string | undefined; goal?: string | undefined }
  ) {
    const resolvedName = name.trim() || this.mcState.name || 'Protagonis';
    const resolvedTitle = title?.trim() || this.mcState.title || 'Pengembara';
    this.mcState = {
      ...this.mcState,
      name: resolvedName,
      title: resolvedTitle,
      personality: details?.personality?.trim() || this.mcState.personality,
      background: details?.background?.trim() || this.mcState.background,
      goal: details?.goal?.trim() || this.mcState.goal
    };
    this.addLog(`[Profil] Memperbarui identitas karakter: ${resolvedName} (${resolvedTitle}).`);
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  queueStoryAction(actionText: string) {
    this.pendingStoryAction = actionText;
    this.activeTab.set('story');
  }

  restoreHp(amount: number) {
    if (!this.mcState.stats) this.mcState.stats = { hp: 85, maxHp: 100, sp: 42, maxSp: 50 };
    const currentHp = Number(this.mcState.stats['hp']) || 85;
    const maxHp = Number(this.mcState.stats['maxHp']) || 100;
    this.mcState.stats['hp'] = Math.min(maxHp, currentHp + amount);
    this.mcState = { ...this.mcState };
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  restoreSp(amount: number) {
    if (!this.mcState.stats) this.mcState.stats = { hp: 85, maxHp: 100, sp: 42, maxSp: 50 };
    const currentSp = Number(this.mcState.stats['sp']) || 42;
    const maxSp = Number(this.mcState.stats['maxSp']) || 50;
    this.mcState.stats['sp'] = Math.min(maxSp, currentSp + amount);
    this.mcState = { ...this.mcState };
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  ensureAllNpcSchedules(defaultBaseLocation?: string): void {
    const baseLoc = defaultBaseLocation || this.mcState.locationName || this.mcState.location || 'Pusat Wilayah';
    this.npcSchedules = sanitizeAllNpcSchedulesMap(this.npcStates, this.npcSchedules, baseLoc);
  }

  ensureNpcSchedule(key: string, npc: NpcState, forceRefreshAnchor = false): NpcDailySchedule {
    const baseLoc = this.mcState.locationName || this.mcState.location || 'Pusat Wilayah';
    if (!this.npcSchedules) this.npcSchedules = {};
    const existing = this.npcSchedules[key];
    if (!existing || forceRefreshAnchor) {
      const schedule = generateDynamicNpcSchedule(key, npc, baseLoc);
      this.npcSchedules[key] = schedule;
      return schedule;
    }
    return existing;
  }

  updateNpcStates(newNpcs: NpcState[] | Record<string, NpcState>) {
    const npcArray = resolveIncomingNpcArray(newNpcs);
    if (npcArray.length === 0) {
      this.npcStates = {};
      this.npcSchedules = {};
      this.rollingNpcKeys = [];
      this.homologyState.set(null);
      this.stateVersion.update(v => v + 1);
      this.saveState();
      return;
    }

    const currentTrust = { ...(this.mcState.trust ?? {}) };
    let trustUpdated = false;
    for (const npc of npcArray) {
      if (npc.nama && currentTrust[npc.nama] === undefined) {
        currentTrust[npc.nama] = 50;
        trustUpdated = true;
      }
    }
    if (trustUpdated) this.mcState.trust = currentTrust;

    const baseLoc = this.mcState.locationName || this.mcState.location || 'Pusat Wilayah';
    const reconciled = reconcileNpcTurnAndSchedules(
      this.npcStates,
      this.npcSchedules,
      npcArray,
      this.getNumericTrust(),
      this.factions,
      baseLoc
    );

    this.topologicalAnomalies = [];
    for (const msg of reconciled.anomalyMessages) {
      this.addLog(msg);
      this.topologicalAnomalies.push(msg);
    }
    for (const log of reconciled.scheduleLogs) this.logs.push(log);

    this.npcStates = reconciled.resolvedState;
    this.npcSchedules = reconciled.nextSchedules;
    this.rollingNpcKeys = reconciled.rollingNpcKeys;
    this.homologyState.set(reconciled.homology);
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  enforceTopologicalSync() {
    const { resolvedState, anomalies, homology } = TopologicalSyncSystem.resolveState(
      this.npcStates,
      [],
      this.getNumericTrust(),
      this.factions
    );
    this.topologicalAnomalies = [];
    for (const anomaly of anomalies) {
      const msg = `[Topological Warning] Desync detected: ${anomaly.reason} Auto-correcting ${anomaly.npcA}.`;
      this.addLog(msg);
      this.topologicalAnomalies.push(msg);
    }
    this.npcStates = resolvedState;
    this.ensureAllNpcSchedules();
    this.homologyState.set(homology);
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  recomputeHomology(filtrationEpsilon = 0.55) {
    if (Object.keys(this.npcStates).length === 0) {
      this.homologyState.set(null);
      return;
    }
    this.homologyState.set(
      SimplicialComplexTracker.analyzeHomology(this.npcStates, this.getNumericTrust(), this.factions, filtrationEpsilon)
    );
  }

  updateFactions(newFactions: FactionState[]) {
    if (!newFactions || !Array.isArray(newFactions)) return;
    const { nextFactions, factionChanges, generatedLogs } = mergeFactionUpdates(this.factions, newFactions);
    for (const log of generatedLogs) this.addLog(log);
    this.factions = nextFactions;
    if (Object.keys(factionChanges).length > 0 && this.mcState.lastStoryImpact) {
      this.mcState.lastStoryImpact.factionChanges = {
        ...(this.mcState.lastStoryImpact.factionChanges ?? {}),
        ...factionChanges
      };
    }
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  adjustFactionReputation(factionName: string, delta: number, reason?: string) {
    const res = applyFactionReputationAdjustment(this.factions, factionName, delta, reason);
    if (!res) return;
    this.factions = res.nextFactions;
    this.addLog(res.logMessage);
    if (this.mcState.lastStoryImpact) {
      this.mcState.lastStoryImpact.factionChanges = {
        ...(this.mcState.lastStoryImpact.factionChanges ?? {}),
        [factionName]: delta
      };
    }
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  adjustNpcTrust(npcNameOrKey: string, delta: number, reason?: string) {
    const res = applyNpcTrustAdjustment(this.mcState, this.npcStates, npcNameOrKey, delta, reason);
    if (!res) return;
    this.mcState = res.nextMcState;
    this.addLog(res.logMessage);
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  getNpcTrust(npcNameOrKey: string): number {
    return resolveNpcTrustScore(this.mcState?.trust, this.npcStates, npcNameOrKey);
  }

  upsertCustomNpc(payload: CustomNpcUpsertPayload) {
    const baseLoc = this.mcState.locationName || this.mcState.location || 'Pusat Wilayah';
    const res = applyCustomNpcUpsert(this.npcStates, this.npcSchedules, this.knowledgeGraph, payload, baseLoc);
    this.npcStates = res.nextNpcStates;
    this.npcSchedules = res.nextNpcSchedules;
    this.knowledgeGraph = res.nextKnowledgeGraph;
    if (typeof payload.trust === 'number' && !Number.isNaN(payload.trust)) {
      const clamped = Math.max(0, Math.min(100, Math.round(payload.trust)));
      this.mcState = { ...this.mcState, trust: { ...(this.mcState.trust ?? {}), [res.canonicalName]: clamped } };
    } else if (this.mcState.trust?.[res.canonicalName] === undefined) {
      this.mcState = { ...this.mcState, trust: { ...(this.mcState.trust ?? {}), [res.canonicalName]: 55 } };
    }
    if (!this.rollingNpcKeys.includes(res.npcKey)) {
      this.rollingNpcKeys = [res.npcKey, ...this.rollingNpcKeys];
    }
    this.recomputeHomology();
    this.addLog(res.logMessage);
    this.stateVersion.update(v => v + 1);
    void this.saveState();
  }

  getFactionNpcs(factionName: string): { key: string; state: NpcState }[] {
    return filterFactionNpcs(this.npcStates, factionName);
  }

  static getFactionReputationTier(reputation: number): { label: string; badgeClass: string; barColor: string; textColor: string } {
    return computeFactionReputationTier(reputation);
  }

  updateKnowledgeGraph(updates: GraphUpdate[]) {
    if (!updates || !Array.isArray(updates)) return;
    const res = applyKnowledgeGraphUpdatesWithWeights(this.knowledgeGraph, this.knowledgeWeights, updates);
    this.knowledgeGraph = res.nextGraph;
    this.knowledgeWeights = res.nextWeights;
    for (const log of res.generatedLogs) this.addLog(log);
    this.stateVersion.update(v => v + 1);
    void this.saveState();
  }

  updateActiveLoreKeys(keys: string[]) {
    this.activeLoreKeys = Array.isArray(keys) ? keys : [];
    this.saveState();
  }

  updateQuests(updates?: Record<string, QuestState>) {
    if (!updates) return;
    for (const questId of Object.keys(updates)) {
      this.quests[questId] = { ...(this.quests[questId] || {} as any), ...updates[questId] };
    }
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  updateCombat(update?: CombatState) {
    if (!update) return;
    this.combat = { ...this.combat, ...update };
    this.stateVersion.update(v => v + 1);
    this.saveState();
  }

  updateStorySummary(summary: string) {
    if (summary) {
      this.storySummary = summary;
      this.stateVersion.update(v => v + 1);
      this.saveState();
    }
  }

  async resetState() {
    if (globalThis.window !== undefined) {
      try {
        for (const hook of this.resetHooks) {
          try { await hook(); } catch (err) { console.warn('Error executing reset hook', err); }
        }
        await this.db.engineState.delete('guardian_engine_state');
        await new Promise<void>((resolve, reject) => {
          const req = globalThis.indexedDB.deleteDatabase('Guardian_Engine_v2');
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
          req.onblocked = () => setTimeout(() => resolve(), 500);
        });
      } catch {}
      globalThis.location.reload();
    }
  }
}
