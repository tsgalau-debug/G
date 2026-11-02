import { TopologicalSyncSystem } from '../topology/topological-sync';
import type { HomologyAnalysisResult } from '../topology/simplicial-complex';
import {
  enrichNpcProfileDefaults,
  generateDynamicNpcSchedule,
  isScheduleCorrupted,
  sanitizeNpcScheduleAndState
} from '../world-genesis';
import type {
  ChronicleEntry,
  FactionState,
  McState,
  NpcDailySchedule,
  NpcScheduleArchetype,
  NpcState
} from '../game-state.types';

export interface CustomNpcUpsertPayload {
  key?: string | undefined;
  nama: string;
  peran?: string | undefined;
  kepribadian?: string | undefined;
  tujuan?: string | undefined;
  gaya_bicara?: string | undefined;
  scheduleArchetype?: NpcScheduleArchetype | undefined;
  faksi?: string | undefined;
  lokasi?: string | undefined;
  aktivitas?: string | undefined;
  mood?: string | undefined;
  trust?: number | undefined;
}

export function resolveIncomingNpcArray(
  newNpcs: NpcState[] | Record<string, NpcState>
): NpcState[] {
  if (Array.isArray(newNpcs)) {
    return newNpcs;
  }
  if (newNpcs && typeof newNpcs === 'object') {
    return Object.entries(newNpcs).map(([k, v]) => ({
      ...v,
      nama: v?.nama || k.replaceAll('_', ' ')
    }));
  }
  return [];
}

export function resolveHydratedNpcTopology(
  chronicle: ChronicleEntry[] | undefined,
  baseNpcs: Record<string, NpcState> | undefined,
  numericTrust: Record<string, number>,
  factions: Record<string, FactionState>
): {
  npcStates: Record<string, NpcState>;
  rollingNpcKeys: string[];
  homology: HomologyAnalysisResult | null;
} {
  const latestEntry = chronicle && chronicle.length > 0 ? chronicle[chronicle.length - 1] : undefined;
  const safeBase = baseNpcs || {};
  const hasBaseNpcs = Object.keys(safeBase).length > 0;

  if (latestEntry?.npc_state && Array.isArray(latestEntry.npc_state) && latestEntry.npc_state.length > 0) {
    // Only backfill NPCs from latestEntry.npc_state that are missing in safeBase, so post-turn Chronos/Topological updates in safeBase are preserved
    const normalizeName = (s: string) => s.replaceAll('_', ' ').toLowerCase().trim();
    const existingNames = new Set(
      Object.entries(safeBase).flatMap(([k, v]) => [normalizeName(k), normalizeName(v?.nama || k)])
    );
    const missingIncoming = hasBaseNpcs
      ? latestEntry.npc_state.filter(n => n?.nama && !existingNames.has(normalizeName(n.nama)))
      : latestEntry.npc_state;

    const { resolvedState, homology } = TopologicalSyncSystem.resolveState(
      safeBase,
      missingIncoming,
      numericTrust,
      factions
    );
    for (const npc of Object.values(resolvedState)) {
      enrichNpcProfileDefaults(npc);
    }
    return {
      npcStates: resolvedState,
      rollingNpcKeys: Object.keys(resolvedState),
      homology
    };
  }

  if (hasBaseNpcs) {
    const { resolvedState, homology } = TopologicalSyncSystem.resolveState(
      safeBase,
      [],
      numericTrust,
      factions
    );
    for (const npc of Object.values(resolvedState)) {
      enrichNpcProfileDefaults(npc);
    }
    return {
      npcStates: resolvedState,
      rollingNpcKeys: Object.keys(resolvedState),
      homology
    };
  }

  return {
    npcStates: {},
    rollingNpcKeys: [],
    homology: null
  };
}

export function sanitizeAllNpcSchedulesMap(
  npcStates: Record<string, NpcState>,
  npcSchedules: Record<string, NpcDailySchedule> | undefined,
  baseLoc: string
): Record<string, NpcDailySchedule> {
  const nextSchedules: Record<string, NpcDailySchedule> = { ...(npcSchedules || {}) };
  for (const [key, npc] of Object.entries(npcStates || {})) {
    if (!npc || !npc.nama) continue;
    const { schedule } = sanitizeNpcScheduleAndState(key, npc, nextSchedules[key], baseLoc);
    nextSchedules[key] = schedule;
  }
  return nextSchedules;
}

export function reconcileNpcTurnAndSchedules(
  currentNpcStates: Record<string, NpcState>,
  currentNpcSchedules: Record<string, NpcDailySchedule>,
  npcArray: NpcState[],
  numericTrust: Record<string, number>,
  factions: Record<string, FactionState>,
  baseLoc: string
): {
  resolvedState: Record<string, NpcState>;
  nextSchedules: Record<string, NpcDailySchedule>;
  rollingNpcKeys: string[];
  homology: HomologyAnalysisResult;
  anomalyMessages: string[];
  scheduleLogs: string[];
} {
  const { resolvedState, anomalies, homology } = TopologicalSyncSystem.resolveState(
    currentNpcStates,
    npcArray,
    numericTrust,
    factions
  );

  const anomalyMessages = anomalies.map(
    anomaly => `[Topological Warning] Desync detected: ${anomaly.reason} Auto-correcting ${anomaly.npcA}.`
  );

  const nextSchedules: Record<string, NpcDailySchedule> = { ...(currentNpcSchedules || {}) };
  const normalizeName = (s: string) => s.replaceAll('_', ' ').toLowerCase().trim();
  const incomingNames = new Set(
    npcArray.filter(n => Boolean(n?.nama)).map(n => normalizeName(n.nama))
  );
  const activeSceneKeys: string[] = [];
  const scheduleLogs: string[] = [];

  for (const [key, npc] of Object.entries(resolvedState)) {
    enrichNpcProfileDefaults(npc, baseLoc);
    const normNpcName = normalizeName(npc.nama || key);
    const normKey = normalizeName(key);
    const isIncoming = incomingNames.has(normNpcName) || incomingNames.has(normKey);

    let existingSchedule: NpcDailySchedule | undefined = nextSchedules[key];
    if (!existingSchedule) {
      for (const [schedKey, schedVal] of Object.entries(nextSchedules)) {
        if (
          normalizeName(schedKey) === normNpcName ||
          normalizeName(schedKey) === normKey ||
          (schedVal?.npcName && normalizeName(schedVal.npcName) === normNpcName)
        ) {
          existingSchedule = schedVal;
          break;
        }
      }
    }

    if (existingSchedule && isScheduleCorrupted(existingSchedule, npc)) {
      existingSchedule = generateDynamicNpcSchedule(key, npc, baseLoc);
    }

    if (isIncoming) {
      npc._fromSchedule = false;
      activeSceneKeys.push(key);
      if (existingSchedule) {
        nextSchedules[key] = existingSchedule;
      } else {
        const schedule = generateDynamicNpcSchedule(key, npc, baseLoc);
        nextSchedules[key] = schedule;
        scheduleLogs.push(
          `[Chronos] Jadwal harian otomatis dibuat untuk NPC baru "${npc.nama || key}" (Peran: ${schedule.archetype}, Basis: ${schedule.homeLocation}).`
        );
      }
    } else if (!existingSchedule) {
      nextSchedules[key] = generateDynamicNpcSchedule(key, npc, baseLoc);
    } else {
      nextSchedules[key] = existingSchedule;
    }
  }

  return {
    resolvedState,
    nextSchedules,
    rollingNpcKeys: activeSceneKeys.length > 0 ? activeSceneKeys : Object.keys(resolvedState),
    homology,
    anomalyMessages,
    scheduleLogs
  };
}

export function applyCustomNpcUpsert(
  currentNpcStates: Record<string, NpcState>,
  currentNpcSchedules: Record<string, NpcDailySchedule>,
  currentKnowledgeGraph: Record<string, string[]>,
  payload: CustomNpcUpsertPayload,
  baseLoc: string
): {
  nextNpcStates: Record<string, NpcState>;
  nextNpcSchedules: Record<string, NpcDailySchedule>;
  nextKnowledgeGraph: Record<string, string[]>;
  npcKey: string;
  canonicalName: string;
  logMessage: string;
} {
  const canonicalName = (payload.nama || '').trim() || 'Tokoh Baru';
  const normalizeName = (s: string) => s.replaceAll('_', ' ').toLowerCase().trim();
  const targetNorm = normalizeName(canonicalName);

  let resolvedKey = payload.key?.trim() || '';
  if (!resolvedKey) {
    for (const [k, existing] of Object.entries(currentNpcStates)) {
      if (normalizeName(k) === targetNorm || normalizeName(existing?.nama || '') === targetNorm) {
        resolvedKey = k;
        break;
      }
    }
  }
  if (!resolvedKey) {
    resolvedKey = 'NPC_CUSTOM_' + canonicalName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  }

  const prev = currentNpcStates[resolvedKey];
  const isNew = !prev;
  const resolvedLoc = (payload.lokasi || prev?.lokasi || prev?.location || baseLoc).trim();
  const resolvedAct = (
    payload.aktivitas ||
    prev?.aktivitas ||
    prev?.activity ||
    `Beraktivitas di ${resolvedLoc}.`
  ).trim();
  const resolvedMood = (payload.mood || prev?.mood || 'Tenang').trim();
  const resolvedFaksi = (payload.faksi || prev?.faksi || prev?.faction || 'Independen').trim();

  const updatedNpc: NpcState = enrichNpcProfileDefaults(
    {
      ...prev,
      nama: canonicalName,
      peran: payload.peran?.trim() || prev?.peran || prev?.role,
      role: payload.peran?.trim() || prev?.peran || prev?.role,
      kepribadian: payload.kepribadian?.trim() || prev?.kepribadian || prev?.personality,
      personality: payload.kepribadian?.trim() || prev?.kepribadian || prev?.personality,
      tujuan: payload.tujuan?.trim() || prev?.tujuan || prev?.goal,
      goal: payload.tujuan?.trim() || prev?.tujuan || prev?.goal,
      gaya_bicara: payload.gaya_bicara?.trim() || prev?.gaya_bicara || prev?.voiceStyle,
      voiceStyle: payload.gaya_bicara?.trim() || prev?.gaya_bicara || prev?.voiceStyle,
      scheduleArchetype: payload.scheduleArchetype || prev?.scheduleArchetype,
      faksi: resolvedFaksi,
      faction: resolvedFaksi,
      lokasi: resolvedLoc,
      location: resolvedLoc,
      aktivitas: resolvedAct,
      activity: resolvedAct,
      mood: resolvedMood,
      status: prev?.status || 'Healthy',
      _fromSchedule: false
    },
    baseLoc
  );

  const nextNpcStates: Record<string, NpcState> = {
    ...currentNpcStates,
    [resolvedKey]: updatedNpc
  };

  const nextSchedule = generateDynamicNpcSchedule(resolvedKey, updatedNpc, baseLoc);
  const nextNpcSchedules: Record<string, NpcDailySchedule> = {
    ...currentNpcSchedules,
    [resolvedKey]: nextSchedule
  };

  const nextKnowledgeGraph: Record<string, string[]> = { ...currentKnowledgeGraph };
  const profileFact = `${canonicalName} (${updatedNpc.peran || 'Tokoh'}) berafiliasi dengan ${resolvedFaksi} di ${resolvedLoc}. Kepribadian: ${updatedNpc.kepribadian}. Tujuan: ${updatedNpc.tujuan}.`;
  const existingFacts = Array.isArray(nextKnowledgeGraph[canonicalName])
    ? [...nextKnowledgeGraph[canonicalName]]
    : [];
  const filteredFacts = existingFacts.filter(f => !f.includes('Kepribadian:') && !f.includes('berafiliasi dengan'));
  nextKnowledgeGraph[canonicalName] = [profileFact, ...filteredFacts].slice(0, 6);

  const logMessage = isNew
    ? `[Direktori NPC] Karakter custom baru ditambahkan: "${canonicalName}" (${updatedNpc.peran}, Jadwal: ${nextSchedule.archetype}, Lokasi: ${resolvedLoc}).`
    : `[Direktori NPC] Profil karakter "${canonicalName}" diperbarui (${updatedNpc.peran}, Jadwal: ${nextSchedule.archetype}, Lokasi: ${resolvedLoc}).`;

  return {
    nextNpcStates,
    nextNpcSchedules,
    nextKnowledgeGraph,
    npcKey: resolvedKey,
    canonicalName,
    logMessage
  };
}

export function mergeFactionUpdates(
  currentFactions: Record<string, FactionState>,
  newFactions: FactionState[]
): {
  nextFactions: Record<string, FactionState>;
  factionChanges: Record<string, number>;
  generatedLogs: string[];
} {
  const nextFactions: Record<string, FactionState> = { ...currentFactions };
  const factionChanges: Record<string, number> = {};
  const generatedLogs: string[] = [];

  for (const faction of newFactions) {
    if (faction && faction.name) {
      const oldRep = nextFactions[faction.name]?.reputation ?? 0;
      const newRep = typeof faction.reputation === 'number' ? faction.reputation : oldRep;
      const delta = newRep - oldRep;
      if (delta !== 0) {
        factionChanges[faction.name] = delta;
        generatedLogs.push(
          `[Faksi] Reputasi dengan "${faction.name}" berubah ${delta > 0 ? '+' : ''}${delta} (Total: ${newRep}).`
        );
      }
      nextFactions[faction.name] = {
        ...nextFactions[faction.name],
        ...faction,
        reputation: newRep
      };
    }
  }

  return { nextFactions, factionChanges, generatedLogs };
}

export function resolveNpcTrustScore(
  trustMap: Record<string, string | number> | undefined,
  npcStates: Record<string, NpcState>,
  npcNameOrKey: string
): number {
  if (!trustMap) return 50;
  if (trustMap[npcNameOrKey] !== undefined) {
    const val = Number(trustMap[npcNameOrKey]);
    return Number.isNaN(val) ? 50 : Math.max(0, Math.min(100, val));
  }
  const npcObj =
    Object.values(npcStates).find(s => s.nama === npcNameOrKey) ||
    npcStates[npcNameOrKey];
  if (npcObj?.nama && trustMap[npcObj.nama] !== undefined) {
    const val = Number(trustMap[npcObj.nama]);
    return Number.isNaN(val) ? 50 : Math.max(0, Math.min(100, val));
  }
  return 50;
}

export function filterFactionNpcs(
  npcStates: Record<string, NpcState>,
  factionName: string
): { key: string; state: NpcState }[] {
  if (!factionName) return [];
  const target = factionName.toLowerCase();
  return Object.entries(npcStates)
    .filter(([_, state]) => {
      const fac = (state.faksi ?? '').toLowerCase();
      return fac.length > 0 && (fac === target || fac.includes(target) || target.includes(fac));
    })
    .map(([key, state]) => ({ key, state }));
}

export function applyFactionReputationAdjustment(
  currentFactions: Record<string, FactionState>,
  factionName: string,
  delta: number,
  reason?: string
): {
  nextFactions: Record<string, FactionState>;
  logMessage: string;
} | null {
  if (!factionName || !currentFactions[factionName]) return null;
  const oldRep = currentFactions[factionName].reputation ?? 0;
  const newRep = Math.max(-100, Math.min(100, oldRep + delta));
  const nextFactions: Record<string, FactionState> = {
    ...currentFactions,
    [factionName]: { ...currentFactions[factionName], reputation: newRep }
  };
  const logMessage = reason
    ? `[Faksi] Reputasi ${factionName} ${delta >= 0 ? '+' : ''}${delta}: ${reason} (Kini: ${newRep}).`
    : `[Faksi] Reputasi ${factionName} ${delta >= 0 ? '+' : ''}${delta} (Kini: ${newRep}).`;
  return { nextFactions, logMessage };
}

export function applyNpcTrustAdjustment(
  currentMcState: Partial<McState>,
  npcStates: Record<string, NpcState>,
  npcNameOrKey: string,
  delta: number,
  reason?: string
): {
  nextMcState: Partial<McState>;
  canonicalName: string;
  logMessage: string;
} | null {
  if (!npcNameOrKey) return null;
  const npcObj =
    Object.values(npcStates).find(s => s.nama === npcNameOrKey) || npcStates[npcNameOrKey];
  const canonicalName =
    npcObj?.nama || npcNameOrKey.replace(/^NPC_/, '').replace(/_\d+$/, '');
  const currentTrust = resolveNpcTrustScore(currentMcState.trust, npcStates, canonicalName);
  const newTrust = Math.max(0, Math.min(100, currentTrust + delta));

  const nextMcState: Partial<McState> = {
    ...currentMcState,
    trust: { ...(currentMcState.trust ?? {}), [canonicalName]: newTrust }
  };
  if (nextMcState.lastStoryImpact) {
    nextMcState.lastStoryImpact = {
      ...nextMcState.lastStoryImpact,
      trustChanges: {
        ...(nextMcState.lastStoryImpact.trustChanges ?? {}),
        [canonicalName]: delta
      }
    };
  }
  const logMessage = reason
    ? `[Relasi] Kepercayaan ${canonicalName} ${delta >= 0 ? '+' : ''}${delta}: ${reason} (Kini: ${newTrust}/100).`
    : `[Relasi] Kepercayaan ${canonicalName} ${delta >= 0 ? '+' : ''}${delta} (Kini: ${newTrust}/100).`;
  return { nextMcState, canonicalName, logMessage };
}

