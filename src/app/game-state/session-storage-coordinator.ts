import { VALID_AI_MODELS, type GameDatabase } from './game-database';
import { cloneDeep } from './timeline-branch-reconciler';
import {
  buildLegacyMigratedStoryMeta,
  buildDefaultSandboxStoryAndSession,
  normalizeHydratedMcState
} from './story-session-factory';
import {
  resolveHydratedNpcTopology,
  sanitizeAllNpcSchedulesMap
} from './npc-faction-reducer';
import type { HomologyAnalysisResult } from '../topology/simplicial-complex';
import type {
  McState,
  QuestState,
  CombatState,
  ChronicleEntry,
  FactionState,
  NpcState,
  NpcDailySchedule,
  StoryMetadata,
  StorySessionData,
  TimelineBranchSnapshot
} from '../game-state.types';

export function extractNumericTrustMap(rawTrust?: Record<string, string | number>): Record<string, number> {
  const raw = rawTrust || {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = typeof v === 'number' ? v : (parseFloat(String(v)) || 0);
  }
  return out;
}

export interface BranchSnapshotSource {
  chronicle: ChronicleEntry[];
  mcState: Partial<McState>;
  npcStates: Record<string, NpcState>;
  npcSchedules: Record<string, NpcDailySchedule>;
  factions: Record<string, FactionState>;
  logs: string[];
  knowledgeGraph: Record<string, string[]>;
  knowledgeWeights: Record<string, number>;
  activeLoreKeys: string[];
  storySummary: string;
  quests: Record<string, QuestState>;
  combat: CombatState;
  existingSnapshot?: TimelineBranchSnapshot | undefined;
}

export function buildBranchSnapshotFromState(src: BranchSnapshotSource): TimelineBranchSnapshot {
  return {
    chronicle: cloneDeep(src.chronicle),
    mcState: cloneDeep(src.mcState),
    npcStates: cloneDeep(src.npcStates),
    npcSchedules: cloneDeep(src.npcSchedules),
    factions: cloneDeep(src.factions),
    logs: cloneDeep(src.logs),
    knowledgeGraph: cloneDeep(src.knowledgeGraph),
    knowledgeWeights: cloneDeep(src.knowledgeWeights),
    activeLoreKeys: cloneDeep(src.activeLoreKeys),
    storySummary: src.storySummary,
    quests: cloneDeep(src.quests),
    combat: cloneDeep(src.combat),
    forkTurn: src.existingSnapshot?.forkTurn,
    parentTimelineId: src.existingSnapshot?.parentTimelineId,
    ancestorSnapshot: src.existingSnapshot?.ancestorSnapshot
      ? cloneDeep(src.existingSnapshot.ancestorSnapshot)
      : undefined
  };
}

export interface HydratedSessionResult {
  chronicle: ChronicleEntry[];
  mcState: Partial<McState>;
  npcStates: Record<string, NpcState>;
  npcSchedules: Record<string, NpcDailySchedule>;
  rollingNpcKeys: string[];
  homology: HomologyAnalysisResult | null;
  factions: Record<string, FactionState>;
  logs: string[];
  knowledgeGraph: Record<string, string[]>;
  knowledgeWeights: Record<string, number>;
  activeLoreKeys: string[];
  storySummary: string;
  quests: Record<string, QuestState>;
  combat: CombatState;
  aiModel: string;
  activeTimelineId: string;
  timelineSnapshots: Record<string, TimelineBranchSnapshot>;
  timelineDagState: unknown;
  rlPolicySnapshot: unknown;
}

export function hydrateSessionStatePayload(
  parsed: Partial<StorySessionData>,
  fallbackMcState: Partial<McState>,
  fallbackFactions: Record<string, FactionState>,
  fallbackSummary: string
): HydratedSessionResult {
  const chronicle = parsed.chronicle || [];
  const mcState = normalizeHydratedMcState(parsed.mcState, fallbackMcState);
  const factions = parsed.factions || {};
  const numericTrust = extractNumericTrustMap(mcState.trust);

  const topo = resolveHydratedNpcTopology(
    chronicle,
    parsed.npcStates,
    numericTrust,
    parsed.factions || fallbackFactions
  );

  const fallbackLoc = mcState.locationName || mcState.location || 'Pusat Wilayah';
  const rawSchedules = parsed.npcSchedules ? cloneDeep(parsed.npcSchedules) : {};
  const npcSchedules = sanitizeAllNpcSchedulesMap(topo.npcStates, rawSchedules, fallbackLoc);

  const knowledgeGraph = parsed.knowledgeGraph || {};
  const knowledgeWeights = parsed.knowledgeWeights ? { ...parsed.knowledgeWeights } : {};
  const activeLoreKeys = parsed.activeLoreKeys || [];
  const storySummary = parsed.storySummary || fallbackSummary;
  const quests = parsed.quests || {};
  const combat = parsed.combat || { inCombat: false, enemies: [], advantage: 'neutral' };
  const logs = parsed.logs || [];

  const aiModel =
    parsed.aiModel && VALID_AI_MODELS.has(parsed.aiModel) ? parsed.aiModel : 'gemini-3.5-flash-lite';
  const activeTimelineId = parsed.activeTimelineId || 'trunk';
  const timelineSnapshots = parsed.timelineSnapshots ? cloneDeep(parsed.timelineSnapshots) : {};
  const timelineDagState = parsed.timelineDagState ? cloneDeep(parsed.timelineDagState) : null;
  const rlPolicySnapshot = parsed.rlPolicySnapshot ? cloneDeep(parsed.rlPolicySnapshot) : null;

  if (!timelineSnapshots[activeTimelineId]) {
    timelineSnapshots[activeTimelineId] = buildBranchSnapshotFromState({
      chronicle,
      mcState,
      npcStates: topo.npcStates,
      npcSchedules,
      factions,
      logs,
      knowledgeGraph,
      knowledgeWeights,
      activeLoreKeys,
      storySummary,
      quests,
      combat,
      existingSnapshot: undefined
    });
  }

  return {
    chronicle,
    mcState,
    npcStates: topo.npcStates,
    npcSchedules,
    rollingNpcKeys: topo.rollingNpcKeys,
    homology: topo.homology,
    factions,
    logs,
    knowledgeGraph,
    knowledgeWeights,
    activeLoreKeys,
    storySummary,
    quests,
    combat,
    aiModel,
    activeTimelineId,
    timelineSnapshots,
    timelineDagState,
    rlPolicySnapshot
  };
}

export interface HydratedBranchSnapshotResult {
  chronicle: ChronicleEntry[];
  mcState: Partial<McState>;
  npcStates: Record<string, NpcState>;
  npcSchedules: Record<string, NpcDailySchedule>;
  rollingNpcKeys: string[];
  homology: HomologyAnalysisResult | null;
  factions: Record<string, FactionState>;
  logs: string[];
  knowledgeGraph: Record<string, string[]>;
  knowledgeWeights: Record<string, number>;
  activeLoreKeys: string[];
  storySummary: string;
  quests: Record<string, QuestState>;
  combat: CombatState;
}

export function hydrateBranchSnapshotPayload(
  snap: TimelineBranchSnapshot,
  fallbackMcState: Partial<McState>,
  fallbackSummary: string
): HydratedBranchSnapshotResult {
  const chronicle = cloneDeep(snap.chronicle || []);
  const mcState = cloneDeep(snap.mcState || fallbackMcState);
  const factions = cloneDeep(snap.factions || {});
  const logs = cloneDeep(snap.logs || []);
  const knowledgeGraph = cloneDeep(snap.knowledgeGraph || {});
  const knowledgeWeights = cloneDeep(snap.knowledgeWeights || {});
  const activeLoreKeys = cloneDeep(snap.activeLoreKeys || []);
  const storySummary = snap.storySummary || fallbackSummary;
  const quests = cloneDeep(snap.quests || {});
  const combat = cloneDeep(snap.combat || { inCombat: false, enemies: [], advantage: 'neutral' });

  const topo = resolveHydratedNpcTopology(
    chronicle,
    cloneDeep(snap.npcStates || {}),
    extractNumericTrustMap(mcState.trust),
    factions
  );

  const fallbackLoc = mcState.locationName || mcState.location || 'Pusat Wilayah';
  const rawSchedules = snap.npcSchedules ? cloneDeep(snap.npcSchedules) : {};
  const npcSchedules = sanitizeAllNpcSchedulesMap(topo.npcStates, rawSchedules, fallbackLoc);

  return {
    chronicle,
    mcState,
    npcStates: topo.npcStates,
    npcSchedules,
    rollingNpcKeys: topo.rollingNpcKeys,
    homology: topo.homology,
    factions,
    logs,
    knowledgeGraph,
    knowledgeWeights,
    activeLoreKeys,
    storySummary,
    quests,
    combat
  };
}

export async function loadInitialStoriesAndSessionFromDb(
  db: GameDatabase,
  defaultMcState: Partial<McState>
): Promise<{
  allStories: StoryMetadata[];
  targetId: string;
  savedSessionState?: Partial<StorySessionData> | undefined;
}> {
  let storiesCount = 0;
  try {
    storiesCount = await db.stories.count();
  } catch {
    storiesCount = 0;
  }

  if (storiesCount === 0) {
    let legacyRecord: { id: string; state: unknown } | undefined;
    try {
      legacyRecord = await db.engineState.get('guardian_engine_state');
    } catch {}

    const defaultId = 'story_default_sandbox';
    if (legacyRecord?.state && typeof legacyRecord.state === 'object') {
      const parsed = legacyRecord.state as Partial<StorySessionData>;
      const initialMeta = buildLegacyMigratedStoryMeta(defaultId, parsed);
      await db.stories.put(initialMeta);
      await db.sessions.put({ id: defaultId, state: parsed as StorySessionData });
    } else {
      const { initialMeta, initialSession } = buildDefaultSandboxStoryAndSession(defaultId, defaultMcState);
      await db.stories.put(initialMeta);
      await db.sessions.put({ id: defaultId, state: initialSession });
    }
  }

  const allStories = await db.stories.orderBy('lastPlayedAt').reverse().toArray();
  let targetId = globalThis.localStorage?.getItem('guardian_active_story_id') || '';
  if (!targetId || !allStories.some(s => s.id === targetId)) {
    targetId = allStories[0]?.id || 'story_default_sandbox';
  }

  const savedSession = await db.sessions.get(targetId);
  return {
    allStories,
    targetId,
    savedSessionState: savedSession?.state
  };
}

export async function persistSessionStateToDb(
  db: GameDatabase,
  currentId: string,
  sessionPayload: StorySessionData
): Promise<StoryMetadata[]> {
  await db.sessions.put({ id: currentId, state: sessionPayload });

  const existingMeta = await db.stories.get(currentId);
  const now = Date.now();
  if (existingMeta) {
    existingMeta.updatedAt = now;
    existingMeta.lastPlayedAt = now;
    existingMeta.turnCount = sessionPayload.chronicle.length;
    existingMeta.mcName = sessionPayload.mcState.name || existingMeta.mcName || 'Protagonis';
    existingMeta.mcTitle = sessionPayload.mcState.title || existingMeta.mcTitle || 'Pengembara';
    existingMeta.summary = sessionPayload.storySummary || existingMeta.summary;
    await db.stories.put(existingMeta);
  }

  await db.engineState.put({ id: 'guardian_engine_state', state: sessionPayload });
  return db.stories.orderBy('lastPlayedAt').reverse().toArray();
}

export async function cloneDuplicatedStoryInDb(
  db: GameDatabase,
  sourceStoryId: string
): Promise<string> {
  const sourceMeta = await db.stories.get(sourceStoryId);
  const sourceSession = await db.sessions.get(sourceStoryId);
  if (!sourceMeta || !sourceSession) {
    throw new Error(`Source story ${sourceStoryId} not found`);
  }

  const newId = 'story_branch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = Date.now();
  const newMeta: StoryMetadata = {
    ...sourceMeta,
    id: newId,
    title: `${sourceMeta.title} (Cabang Timeline)`,
    createdAt: now,
    updatedAt: now,
    lastPlayedAt: now
  };
  const clonedSession: StorySessionData = cloneDeep(sourceSession.state);
  clonedSession.logs.push(`[Sistem] Cabang timeline diciptakan dari "${sourceMeta.title}".`);
  await db.stories.put(newMeta);
  await db.sessions.put({ id: newId, state: clonedSession });
  return newId;
}

export async function deleteStoryRecordInDb(
  db: GameDatabase,
  storyId: string
): Promise<{ deleted: boolean; nextStoryId?: string | undefined; updatedStories?: StoryMetadata[] | undefined }> {
  const all = await db.stories.toArray();
  if (all.length <= 1) {
    console.warn('Cannot delete the only remaining story.');
    return { deleted: false };
  }
  await db.stories.delete(storyId);
  await db.sessions.delete(storyId);
  try {
    const safeId = storyId.replace(/[^a-zA-Z0-9_-]/g, '_');
    globalThis.indexedDB?.deleteDatabase(`Guardian_Engine_${safeId}`);
  } catch {}

  const nextStory = all.find(s => s.id !== storyId);
  const updatedStories = await db.stories.orderBy('lastPlayedAt').reverse().toArray();
  return {
    deleted: true,
    nextStoryId: nextStory?.id,
    updatedStories
  };
}
