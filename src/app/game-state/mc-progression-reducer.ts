import { resolveItemInfo } from '../item-system';
import type {
  GraphUpdate,
  McState,
  StoryImpact
} from '../game-state.types';

export interface McProgressionResult {
  nextMcState: Partial<McState>;
  generatedLogs: string[];
}

export function computeMcStateProgression(
  currentMcState: Partial<McState>,
  newState: Partial<McState>,
  narrativeText?: string
): McProgressionResult {
  const generatedLogs: string[] = [];

  // 1. Capture previous baseline values
  const prevHp = Number(currentMcState.stats?.['hp']) || 85;
  const prevSp = Number(currentMcState.stats?.['sp']) || 42;
  const prevMaxHp = Number(currentMcState.stats?.['maxHp']) || 100;
  const prevMaxSp = Number(currentMcState.stats?.['maxSp']) || 50;
  let currentLevel = currentMcState.level ?? 1;
  let currentExp = currentMcState.exp ?? 35;
  let currentMaxExp = currentMcState.maxExp ?? 100;
  const prevInventory = [...(currentMcState.inventory ?? [])];
  const prevTrust = { ...(currentMcState.trust ?? {}) };

  // 2. Resolve EXP & Leveling progression
  let earnedExp = 0;
  if (typeof newState.expGained === 'number' && newState.expGained > 0) {
    earnedExp = newState.expGained;
  } else if (typeof newState.exp === 'number' && newState.exp > currentExp) {
    earnedExp = newState.exp - currentExp;
  }

  if (earnedExp > 0) {
    currentExp += earnedExp;
    generatedLogs.push(`[Narasi EXP] Memperoleh +${earnedExp} EXP dari perkembangan alur.`);
  }

  let leveledUp = false;
  while (currentExp >= currentMaxExp) {
    currentExp -= currentMaxExp;
    currentLevel += 1;
    currentMaxExp = Math.round(currentMaxExp * 1.35);
    leveledUp = true;
    generatedLogs.push(`[LEVEL UP!] Selamat! Karakter naik ke Level ${currentLevel}!`);
  }

  // 3. Resolve Stats with bounds
  const incomingStats = newState.stats ?? {};
  let targetMaxHp = prevMaxHp + (leveledUp ? 15 : 0);
  if (incomingStats['maxHp'] !== undefined) {
    const parsedMax = Number(incomingStats['maxHp']);
    if (!Number.isNaN(parsedMax) && parsedMax > 0) targetMaxHp = parsedMax;
  }

  let targetMaxSp = prevMaxSp + (leveledUp ? 8 : 0);
  if (incomingStats['maxSp'] !== undefined) {
    const parsedMax = Number(incomingStats['maxSp']);
    if (!Number.isNaN(parsedMax) && parsedMax > 0) targetMaxSp = parsedMax;
  }

  let targetHp = leveledUp ? targetMaxHp : prevHp;
  if (incomingStats['hp'] !== undefined) {
    const parsedHp = Number(incomingStats['hp']);
    if (!Number.isNaN(parsedHp)) {
      targetHp = Math.min(targetMaxHp, Math.max(0, parsedHp));
    }
  }

  let targetSp = leveledUp ? targetMaxSp : prevSp;
  if (incomingStats['sp'] !== undefined) {
    const parsedSp = Number(incomingStats['sp']);
    if (!Number.isNaN(parsedSp)) {
      targetSp = Math.min(targetMaxSp, Math.max(0, parsedSp));
    }
  }

  const mergedStats: Record<string, string | number> = {
    ...currentMcState.stats,
    ...incomingStats,
    hp: targetHp,
    maxHp: targetMaxHp,
    sp: targetSp,
    maxSp: targetMaxSp,
  };

  if (leveledUp) {
    if (mergedStats['strength'] !== undefined) {
      const s = Number(mergedStats['strength']) || 70;
      mergedStats['strength'] = s + 2;
    }
    if (mergedStats['stamina'] !== undefined) {
      const st = Number(mergedStats['stamina']) || 70;
      mergedStats['stamina'] = st + 2;
    }
    if (mergedStats['agility'] !== undefined) {
      const ag = Number(mergedStats['agility']) || 70;
      mergedStats['agility'] = ag + 2;
    }
    if (mergedStats['charisma'] !== undefined) {
      const ch = Number(mergedStats['charisma']) || 70;
      mergedStats['charisma'] = ch + 1;
    }
  }

  // 4. Resolve Trust
  const mergedTrust: Record<string, string | number> = {
    ...prevTrust,
    ...(newState.trust ?? {})
  };
  const trustChanges: Record<string, number> = {};
  for (const [k, v] of Object.entries(mergedTrust)) {
    const numV = Number(v) || 50;
    const prevV = Number(prevTrust[k]) || 50;
    if (numV !== prevV) {
      trustChanges[k] = numV - prevV;
    }
  }

  // 5. Resolve Inventory
  const incomingInventory = newState.inventory ? [...newState.inventory] : prevInventory;
  const itemsAdded = incomingInventory.filter(i => !prevInventory.includes(i));
  const itemsRemoved = prevInventory.filter(i => !incomingInventory.includes(i));

  // 6. Compute Story Impact summary
  const hpDelta = targetHp - prevHp;
  const spDelta = targetSp - prevSp;

  const impactSummaryParts: string[] = [];
  if (hpDelta !== 0) impactSummaryParts.push(`${hpDelta > 0 ? '+' : ''}${hpDelta} HP`);
  if (spDelta !== 0) impactSummaryParts.push(`${spDelta > 0 ? '+' : ''}${spDelta} SP`);
  if (earnedExp > 0) impactSummaryParts.push(`+${earnedExp} EXP`);
  if (leveledUp) impactSummaryParts.push(`Naik ke Lv. ${currentLevel}!`);
  if (itemsAdded.length > 0) impactSummaryParts.push(`Dapat: ${itemsAdded.join(', ')}`);
  if (itemsRemoved.length > 0) impactSummaryParts.push(`Kehilangan: ${itemsRemoved.join(', ')}`);
  for (const [name, diff] of Object.entries(trustChanges)) {
    impactSummaryParts.push(`${name} ${diff > 0 ? '+' : ''}${diff} Trust`);
  }

  let narrativeSummary = '';
  if (narrativeText && narrativeText.trim().length > 0) {
    const clean = narrativeText.replace(/\s+/g, ' ').trim();
    narrativeSummary = clean.length > 140 ? clean.slice(0, 137) + '...' : clean;
  } else if (impactSummaryParts.length > 0) {
    narrativeSummary = impactSummaryParts.join(' | ');
  } else {
    narrativeSummary = 'Kondisi stabil tanpa perubahan fisik signifikan.';
  }

  const prevTime = currentMcState.time || '08:00';
  const prevDay = Math.max(1, Number(currentMcState.day) || 1);
  const temporal = resolveTemporalProgression(
    prevTime,
    prevDay,
    newState.time,
    newState.day
  );
  if (temporal.dayRolloverLog) {
    generatedLogs.push(temporal.dayRolloverLog);
  }

  const storyImpact: StoryImpact = {
    summary: narrativeSummary,
    hpDelta: hpDelta !== 0 ? hpDelta : undefined,
    spDelta: spDelta !== 0 ? spDelta : undefined,
    expGained: earnedExp > 0 ? earnedExp : undefined,
    trustChanges: Object.keys(trustChanges).length > 0 ? trustChanges : undefined,
    itemsAdded: itemsAdded.length > 0 ? itemsAdded : undefined,
    itemsRemoved: itemsRemoved.length > 0 ? itemsRemoved : undefined,
    timestamp: temporal.resolvedTime
  };

  return {
    nextMcState: {
      ...currentMcState,
      ...newState,
      time: temporal.resolvedTime,
      day: temporal.resolvedDay,
      level: currentLevel,
      exp: currentExp,
      maxExp: currentMaxExp,
      inventory: incomingInventory,
      trust: mergedTrust,
      stats: mergedStats,
      lastStoryImpact: storyImpact
    },
    generatedLogs
  };
}

export function resolveTemporalProgression(
  prevTimeStr: string,
  prevDayInput: number,
  incomingTimeStr?: string | undefined,
  incomingDayInput?: number | undefined
): {
  resolvedTime: string;
  resolvedDay: number;
  dayRolloverLog?: string | undefined;
} {
  const prevDay = Math.max(1, Math.floor(Number(prevDayInput) || 1));
  const parseClock = (raw?: string): { valid: boolean; totalMinutes: number; overflowDays: number } => {
    if (!raw || typeof raw !== 'string') return { valid: false, totalMinutes: 8 * 60, overflowDays: 0 };
    const m = /^(\d{1,2}):(\d{1,2})/.exec(raw.trim());
    if (!m) return { valid: false, totalMinutes: 8 * 60, overflowDays: 0 };
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || mm < 0 || mm >= 60) {
      return { valid: false, totalMinutes: 8 * 60, overflowDays: 0 };
    }
    const overflowDays = Math.floor(hh / 24);
    const wrappedHours = hh % 24;
    return { valid: true, totalMinutes: wrappedHours * 60 + mm, overflowDays };
  };

  const formatClock = (mins: number): string => {
    const wrapped = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const prevParsed = parseClock(prevTimeStr);
  const nextParsed = parseClock(incomingTimeStr);

  const resolvedMinutes = nextParsed.valid ? nextParsed.totalMinutes : prevParsed.totalMinutes;
  const resolvedTime = formatClock(resolvedMinutes);

  // Guard against template leak "day": 0 or backward day regression
  let candidateDay = prevDay;
  if (typeof incomingDayInput === 'number' && !Number.isNaN(incomingDayInput) && incomingDayInput >= 1) {
    candidateDay = Math.max(prevDay, Math.floor(incomingDayInput));
  }

  let dayRolloverLog: string | undefined;
  const prevHour = Math.floor(prevParsed.totalMinutes / 60);
  const nextHour = Math.floor(resolvedMinutes / 60);

  if (nextParsed.valid) {
    const crossedMidnight =
      nextParsed.overflowDays > 0 || (prevHour >= 18 && nextHour < 6);
    if (crossedMidnight && candidateDay === prevDay) {
      candidateDay = prevDay + Math.max(1, nextParsed.overflowDays);
      dayRolloverLog = `[Chronos] Pergantian hari: Memasuki Hari ke-${candidateDay} (${resolvedTime}).`;
    } else if (candidateDay > prevDay) {
      dayRolloverLog = `[Chronos] Pergantian hari: Memasuki Hari ke-${candidateDay} (${resolvedTime}).`;
    }
  }

  return {
    resolvedTime,
    resolvedDay: candidateDay,
    dayRolloverLog
  };
}

export function consumeInventoryItem(
  currentMcState: Partial<McState>,
  item: string
): {
  success: boolean;
  message: string;
  hpRestored?: number;
  spRestored?: number;
  nextMcState?: Partial<McState>;
} {
  const info = resolveItemInfo(item);
  const currentInv = currentMcState.inventory ? [...currentMcState.inventory] : [];
  const itemIndex = currentInv.indexOf(item);
  if (itemIndex === -1) {
    return { success: false, message: `Barang "${item}" tidak ditemukan di tas.` };
  }

  if (info.category !== 'consumable' && !info.consumableEffect) {
    return { success: false, message: `"${item}" bukan barang konsumsi yang dapat langsung digunakan.` };
  }

  currentInv.splice(itemIndex, 1);

  const stats: Record<string, string | number> = currentMcState.stats
    ? { ...currentMcState.stats }
    : { hp: 85, maxHp: 100, sp: 42, maxSp: 50 };

  const currentHp = typeof stats['hp'] === 'number' ? stats['hp'] : Number(stats['hp']) || 85;
  const maxHp = typeof stats['maxHp'] === 'number' ? stats['maxHp'] : 100;
  const currentSp = typeof stats['sp'] === 'number' ? stats['sp'] : Number(stats['sp']) || 42;
  const maxSp = typeof stats['maxSp'] === 'number' ? stats['maxSp'] : 50;

  const hpBonus = info.consumableEffect?.hp ?? 25;
  const spBonus = info.consumableEffect?.sp ?? 15;

  const newHp = Math.min(maxHp, currentHp + hpBonus);
  const newSp = Math.min(maxSp, currentSp + spBonus);
  stats['hp'] = newHp;
  stats['sp'] = newSp;

  const newStatus = info.consumableEffect?.status || (newHp === maxHp ? 'Sangat Bugar' : 'Healthy');
  const msg = info.consumableEffect?.message || `Mengonsumsi ${item}. Memulihkan +${newHp - currentHp} HP dan +${newSp - currentSp} SP.`;

  return {
    success: true,
    message: msg,
    hpRestored: newHp - currentHp,
    spRestored: newSp - currentSp,
    nextMcState: {
      ...currentMcState,
      stats,
      inventory: currentInv,
      status: newStatus
    }
  };
}

export function computeFactionReputationTier(reputation: number): {
  label: string;
  badgeClass: string;
  barColor: string;
  textColor: string;
} {
  if (reputation >= 50) {
    return {
      label: 'Sekutu Setia',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400'
    };
  }
  if (reputation >= 15) {
    return {
      label: 'Bersahabat',
      badgeClass: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      barColor: 'bg-teal-500',
      textColor: 'text-teal-300'
    };
  }
  if (reputation > -15) {
    return {
      label: 'Netral',
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
      barColor: 'bg-zinc-500',
      textColor: 'text-zinc-400'
    };
  }
  if (reputation > -50) {
    return {
      label: 'Waspada',
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-400'
    };
  }
  return {
    label: 'Musuh Bebuyutan',
    badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
    barColor: 'bg-red-500',
    textColor: 'text-red-400'
  };
}

export function applyKnowledgeGraphUpdatesWithWeights(
  currentGraph: Record<string, string[]>,
  currentWeights: Record<string, number>,
  updates: GraphUpdate[]
): {
  nextGraph: Record<string, string[]>;
  nextWeights: Record<string, number>;
  generatedLogs: string[];
} {
  const nextGraph: Record<string, string[]> = { ...currentGraph };
  const nextWeights: Record<string, number> = { ...currentWeights };
  const generatedLogs: string[] = [];
  const toPrune = new Set<string>();

  for (const u of updates) {
    const entity = (u.entity || '').trim();
    if (!entity) continue;
    const fact = (u.fact || '').trim();
    const prevFact = u.previousFact?.trim();
    const clampedWeight =
      typeof u.weight === 'number' && !Number.isNaN(u.weight)
        ? Math.max(0.1, Math.min(3.0, Number(u.weight.toFixed(2))))
        : undefined;

    if (u.action === 'bind') {
      if (!fact) continue;
      const existing = [...(nextGraph[entity] ?? [])];
      if (prevFact && prevFact !== fact) {
        const prevIdx = existing.indexOf(prevFact);
        if (prevIdx !== -1) {
          existing[prevIdx] = fact;
        } else if (!existing.includes(fact)) {
          existing.push(fact);
        }
        const oldWeightKey = `${entity}::${prevFact}`;
        const inheritedWeight = clampedWeight ?? nextWeights[oldWeightKey] ?? 1.0;
        delete nextWeights[oldWeightKey];
        nextWeights[`${entity}::${fact}`] = inheritedWeight;
        generatedLogs.push(`[Graf Pengetahuan] Memperbarui fakta pada "${entity}": "${fact}" (Bobot: ${inheritedWeight}x).`);
      } else {
        if (!existing.includes(fact)) {
          existing.push(fact);
          generatedLogs.push(`[Graf Pengetahuan] Mengikat fakta baru pada "${entity}": "${fact}".`);
        }
        if (clampedWeight !== undefined) {
          nextWeights[`${entity}::${fact}`] = clampedWeight;
        } else if (nextWeights[`${entity}::${fact}`] === undefined) {
          nextWeights[`${entity}::${fact}`] = 1.0;
        }
      }
      nextGraph[entity] = existing;
      toPrune.delete(entity);
    } else if (u.action === 'reweight') {
      if (!fact) continue;
      const existing = nextGraph[entity] ?? [];
      if (!existing.includes(fact)) {
        nextGraph[entity] = [...existing, fact];
      }
      const w = clampedWeight ?? 1.5;
      nextWeights[`${entity}::${fact}`] = w;
      toPrune.delete(entity);
      generatedLogs.push(`[Graf Pengetahuan] Bobot prioritas memori "${entity}" diatur ke ${w}x.`);
    } else if (u.action === 'unbind') {
      const existing = nextGraph[entity];
      if (existing) {
        if (fact === '*') {
          for (const f of existing) {
            delete nextWeights[`${entity}::${f}`];
          }
          toPrune.add(entity);
          generatedLogs.push(`[Graf Pengetahuan] Menghapus seluruh simpul entitas "${entity}".`);
        } else {
          const filtered = existing.filter(f => f !== fact);
          delete nextWeights[`${entity}::${fact}`];
          if (filtered.length === 0) {
            toPrune.add(entity);
          } else {
            nextGraph[entity] = filtered;
          }
          generatedLogs.push(`[Graf Pengetahuan] Melepas fakta dari "${entity}": "${fact}".`);
        }
      }
    }
  }

  if (toPrune.size > 0) {
    const cleanGraph: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(nextGraph)) {
      if (!toPrune.has(key)) {
        cleanGraph[key] = value;
      }
    }
    return { nextGraph: cleanGraph, nextWeights, generatedLogs };
  }

  return { nextGraph, nextWeights, generatedLogs };
}

export function applyKnowledgeGraphUpdates(
  currentGraph: Record<string, string[]>,
  updates: GraphUpdate[]
): Record<string, string[]> {
  return applyKnowledgeGraphUpdatesWithWeights(currentGraph, {}, updates).nextGraph;
}

export interface ScopedKnowledgeGraphOptions {
  mcName?: string | undefined;
  worldSetting?: string | undefined;
  currentLocation?: string | undefined;
  activeEntities?: string[] | undefined;
  localNpcNames?: string[] | undefined;
  activeLoreKeys?: string[] | undefined;
  maxBackgroundEntities?: number | undefined;
}

export function buildScopedKnowledgeGraphForPrompt(
  knowledgeGraph: Record<string, string[]>,
  knowledgeWeights: Record<string, number>,
  options: ScopedKnowledgeGraphOptions
): Record<string, string[]> {
  if (!knowledgeGraph || typeof knowledgeGraph !== 'object') return {};

  const priorityTokens = new Set<string>();
  const addToken = (val?: string) => {
    const t = (val || '').trim().toLowerCase();
    if (t.length >= 2) priorityTokens.add(t);
  };

  addToken(options.mcName);
  addToken(options.worldSetting);
  addToken(options.currentLocation);
  for (const e of options.activeEntities || []) addToken(e);
  for (const n of options.localNpcNames || []) addToken(n);
  for (const k of options.activeLoreKeys || []) addToken(k);

  const sortFactsByWeight = (entity: string, facts: string[]): string[] => {
    return [...facts].sort((a, b) => {
      const wa = knowledgeWeights[`${entity}::${a}`] ?? 1.0;
      const wb = knowledgeWeights[`${entity}::${b}`] ?? 1.0;
      return wb - wa;
    });
  };

  const formatFactWithBadge = (entity: string, fact: string): string => {
    const w = knowledgeWeights[`${entity}::${fact}`] ?? 1.0;
    if (w >= 1.8) return `[KANON UTAMA] ${fact}`;
    if (w >= 1.3) return `[PRIORITAS] ${fact}`;
    return fact;
  };

  const scoped: Record<string, string[]> = {};
  const backgroundCandidates: { entity: string; facts: string[]; maxWeight: number }[] = [];

  for (const [entity, rawFacts] of Object.entries(knowledgeGraph)) {
    if (!Array.isArray(rawFacts) || rawFacts.length === 0) continue;
    const entityLower = entity.toLowerCase().trim();
    const isPriorityEntity = Array.from(priorityTokens).some(
      tok => entityLower === tok || entityLower.includes(tok) || tok.includes(entityLower)
    );
    const maxWeight = rawFacts.reduce(
      (acc, f) => Math.max(acc, knowledgeWeights[`${entity}::${f}`] ?? 1.0),
      1.0
    );

    const sortedFacts = sortFactsByWeight(entity, rawFacts);
    if (isPriorityEntity || maxWeight >= 1.2) {
      scoped[entity] = sortedFacts.slice(0, 8).map(f => formatFactWithBadge(entity, f));
    } else {
      backgroundCandidates.push({ entity, facts: sortedFacts, maxWeight });
    }
  }

  backgroundCandidates.sort((a, b) => b.maxWeight - a.maxWeight || b.facts.length - a.facts.length);
  const maxBg = options.maxBackgroundEntities ?? 10;
  for (const bg of backgroundCandidates.slice(0, maxBg)) {
    scoped[bg.entity] = bg.facts.slice(0, 4).map(f => formatFactWithBadge(bg.entity, f));
  }

  return scoped;
}

export function equipMcItem(
  currentMcState: Partial<McState>,
  item: string,
  slot?: 'weapon' | 'armor' | 'accessory' | 'bag'
): { nextMcState: Partial<McState>; logMessage: string } {
  const info = resolveItemInfo(item);
  const targetSlot = slot || info.slot || 'weapon';
  const equipped = { ...(currentMcState.equipped || {}), [targetSlot]: item };
  const inventory = currentMcState.inventory ? [...currentMcState.inventory] : [];
  if (!inventory.includes(item)) {
    inventory.push(item);
  }
  return {
    nextMcState: { ...currentMcState, equipped, inventory },
    logMessage: `[Perlengkapan] Memasang ${item} pada slot ${targetSlot.toUpperCase()}.`
  };
}

export function unequipMcItem(
  currentMcState: Partial<McState>,
  slot: 'weapon' | 'armor' | 'accessory' | 'bag'
): { nextMcState?: Partial<McState>; logMessage?: string } {
  const prevItem = currentMcState.equipped?.[slot];
  if (!prevItem) return {};
  const equipped = { ...(currentMcState.equipped || {}), [slot]: undefined };
  return {
    nextMcState: { ...currentMcState, equipped },
    logMessage: `[Perlengkapan] Melepas ${prevItem} dari slot ${slot.toUpperCase()}.`
  };
}

export function dropMcItem(
  currentMcState: Partial<McState>,
  item: string
): { nextMcState?: Partial<McState>; logMessage?: string } {
  if (!currentMcState.inventory) return {};
  const idx = currentMcState.inventory.indexOf(item);
  if (idx === -1) return {};
  const inventory = [...currentMcState.inventory];
  inventory.splice(idx, 1);
  const equipped = currentMcState.equipped ? { ...currentMcState.equipped } : undefined;
  if (equipped) {
    for (const slot of ['weapon', 'armor', 'accessory', 'bag'] as const) {
      if (equipped[slot] === item) {
        equipped[slot] = undefined;
      }
    }
  }
  return {
    nextMcState: { ...currentMcState, inventory, ...(equipped ? { equipped } : {}) },
    logMessage: `[Inventory] Membuang "${item}".`
  };
}

