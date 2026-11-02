import {
  generateWorldGenesis,
  resolveInitialCharacterStats,
  generateNpcSchedulesMap,
  inferCustomWorldDomain,
  resolveContextualStartingInventory
} from '../world-genesis';
import type {
  CreateStoryPayload,
  McState,
  StoryMetadata,
  StorySessionData
} from '../game-state.types';

export function buildLegacyMigratedStoryMeta(
  defaultId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: any
): StoryMetadata {
  const legacyName = parsed?.mcState?.name || 'Protagonis';
  const legacyLoc = parsed?.mcState?.locationName || 'Titik Awal';
  return {
    id: defaultId,
    title: `Kisah ${legacyName}`,
    mcName: legacyName,
    mcTitle: parsed?.mcState?.title || 'Pengembara',
    worldSetting: 'Dunia Petualangan',
    locationName: legacyLoc,
    initialWeapon: parsed?.mcState?.equipped?.weapon || 'Perlengkapan Dasar',
    characterArchetype: 'balanced',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    lastPlayedAt: Date.now(),
    turnCount: Array.isArray(parsed?.chronicle) ? parsed.chronicle.length : 0,
    summary: parsed?.storySummary || `Perjalanan ${legacyName} di ${legacyLoc}.`
  };
}

export function buildDefaultSandboxStoryAndSession(
  defaultId: string,
  baseMcState: Partial<McState>
): { initialMeta: StoryMetadata; initialSession: StorySessionData } {
  const sandboxPayload: CreateStoryPayload = {
    title: 'Skenario Bebas (Sandbox)',
    mcName: 'Protagonis',
    mcTitle: 'Pengembara',
    worldSetting: 'Dunia Terbuka',
    locationName: 'Titik Awal',
    initialWeapon: 'Perlengkapan Dasar',
    characterArchetype: 'balanced',
    prologuePrompt: 'Memulai perjalanan baru di Titik Awal. Dunia terbentang luas tanpa terikat skenario tertentu.'
  };
  const genesis = generateWorldGenesis(sandboxPayload);
  const initialMeta: StoryMetadata = {
    id: defaultId,
    title: sandboxPayload.title,
    mcName: sandboxPayload.mcName,
    mcTitle: sandboxPayload.mcTitle,
    worldSetting: sandboxPayload.worldSetting,
    locationName: sandboxPayload.locationName,
    initialWeapon: sandboxPayload.initialWeapon,
    characterArchetype: 'balanced',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastPlayedAt: Date.now(),
    turnCount: 0,
    summary: sandboxPayload.prologuePrompt!
  };
  const initialSession: StorySessionData = {
    chronicle: [],
    mcState: {
      ...baseMcState,
      location: genesis.locationId,
      locationName: sandboxPayload.locationName,
      trust: genesis.initialTrust
    },
    npcStates: genesis.npcStates,
    npcSchedules: genesis.npcSchedules ?? generateNpcSchedulesMap(genesis.npcStates, sandboxPayload.locationName),
    factions: genesis.factions,
    logs: ['[Sistem] Inisialisasi sandbox universal selesai.', ...genesis.initialLogs],
    knowledgeGraph: genesis.knowledgeGraph,
    activeLoreKeys: genesis.activeLoreKeys,
    storySummary: initialMeta.summary,
    quests: genesis.quests,
    combat: { inCombat: false, enemies: [], advantage: 'neutral' },
    aiModel: 'gemini-3.5-flash-lite'
  };
  return { initialMeta, initialSession };
}

export function resolveDefaultMcCharacterization(
  mcName: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  payload?: { mcPersonality?: string | undefined; mcBackground?: string | undefined; mcGoal?: string | undefined }
): { personality: string; background: string; goal: string } {
  const personality =
    payload?.mcPersonality?.trim() ||
    `Tenang, jeli mengamati keadaan sekitar, dan bertindak sesuai peran sebagai ${mcTitle}`;
  const background =
    payload?.mcBackground?.trim() ||
    `Seorang ${mcTitle} yang memulai langkah penting di ${locationName} (${worldSetting})`;
  const goal =
    payload?.mcGoal?.trim() ||
    `Menentukan arah perjalanan ${mcName} dan menjaga keutuhan langkah di ${worldSetting}`;
  return { personality, background, goal };
}

function mergeCustomInventory(baseInventory: string[], customInventory?: string[]): string[] {
  if (!customInventory || customInventory.length === 0) {
    return [...baseInventory];
  }
  const currencyRegex = /^\d+\s*(?:keping\s+perak|perak|koin|emas|kredit|gold|silver|coin|ryo)\b/i;
  const hasCustomCurrency = customInventory.some(item => currencyRegex.test(item.trim()));
  const merged = hasCustomCurrency
    ? baseInventory.filter(item => !currencyRegex.test(item.trim()))
    : [...baseInventory];

  for (const rawItem of customInventory) {
    const item = rawItem.trim();
    if (!item) continue;
    if (!merged.some(existing => existing.toLowerCase() === item.toLowerCase())) {
      merged.push(item);
    }
  }
  return merged;
}

export function buildNewStoryMetaAndSession(
  payload: CreateStoryPayload,
  aiModel: string
): { storyId: string; newMeta: StoryMetadata; newSession: StorySessionData } {
  const storyId = 'story_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const mcName = payload.mcName.trim() || 'Protagonis';
  const mcTitle = payload.mcTitle.trim() || 'Pengembara';
  const worldSetting = payload.worldSetting.trim() || 'Dunia Petualangan';
  const locName = payload.locationName.trim() || 'Gerbang Wilayah';
  const weapon = payload.initialWeapon.trim() || 'Pedang Tempa';
  const characterArchetype = payload.characterArchetype || 'balanced';
  const prologue = payload.prologuePrompt?.trim() || `${mcName} (${mcTitle}) tiba di ${locName} bersiap memulai perjalanan baru.`;

  const mcChar = resolveDefaultMcCharacterization(mcName, mcTitle, worldSetting, locName, payload);
  const customInventory = Array.isArray(payload.customInventory)
    ? payload.customInventory.map(i => i.trim()).filter(Boolean)
    : undefined;
  const initialNpcs = Array.isArray(payload.initialNpcs) && payload.initialNpcs.length > 0
    ? payload.initialNpcs
    : undefined;

  const newMeta: StoryMetadata = {
    id: storyId,
    title: payload.title.trim() || `Kisah ${mcName}`,
    mcName,
    mcTitle,
    mcPersonality: mcChar.personality,
    mcBackground: mcChar.background,
    mcGoal: mcChar.goal,
    customInventory,
    initialNpcs,
    worldSetting,
    locationName: locName,
    initialWeapon: weapon,
    characterArchetype,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastPlayedAt: Date.now(),
    turnCount: 0,
    summary: prologue
  };

  const genesis = generateWorldGenesis(payload);
  const initialStats = resolveInitialCharacterStats(characterArchetype, mcTitle);
  const domain = inferCustomWorldDomain(newMeta.title, mcTitle, worldSetting, locName, weapon, prologue);
  const { inventory: baseInventory, bagName } = resolveContextualStartingInventory(domain, weapon);
  const mergedInventory = mergeCustomInventory(baseInventory, customInventory);

  const newSession: StorySessionData = {
    chronicle: [],
    mcState: {
      name: mcName,
      title: mcTitle,
      personality: mcChar.personality,
      background: mcChar.background,
      goal: mcChar.goal,
      level: 1,
      exp: 0,
      maxExp: 100,
      inventory: mergedInventory,
      equipped: {
        weapon: weapon,
        bag: bagName
      },
      status: 'Healthy',
      location: genesis.locationId,
      locationName: locName,
      trust: genesis.initialTrust,
      time: '08:00',
      day: 1,
      stats: initialStats
    },
    npcStates: genesis.npcStates,
    npcSchedules: genesis.npcSchedules ?? generateNpcSchedulesMap(genesis.npcStates, locName),
    factions: genesis.factions,
    logs: [
      `[Sistem] Cerita baru dimulai: "${newMeta.title}" (${worldSetting})`,
      ...genesis.initialLogs
    ],
    knowledgeGraph: genesis.knowledgeGraph,
    activeLoreKeys: genesis.activeLoreKeys,
    storySummary: newMeta.summary,
    quests: genesis.quests,
    combat: { inCombat: false, enemies: [], advantage: 'neutral' },
    aiModel
  };

  return { storyId, newMeta, newSession };
}

export function buildResetStoryGenesisState(
  currentMeta: StoryMetadata,
  fallbackWeapon?: string
) {
  const weapon = currentMeta.initialWeapon || fallbackWeapon || 'Pedang Tempa';
  const genesis = generateWorldGenesis({
    title: currentMeta.title,
    mcName: currentMeta.mcName,
    mcTitle: currentMeta.mcTitle,
    mcPersonality: currentMeta.mcPersonality,
    mcBackground: currentMeta.mcBackground,
    mcGoal: currentMeta.mcGoal,
    customInventory: currentMeta.customInventory,
    initialNpcs: currentMeta.initialNpcs,
    worldSetting: currentMeta.worldSetting,
    locationName: currentMeta.locationName,
    initialWeapon: weapon,
    characterArchetype: currentMeta.characterArchetype,
    prologuePrompt: currentMeta.summary
  });
  const initialStats = resolveInitialCharacterStats(currentMeta.characterArchetype, currentMeta.mcTitle);
  const domain = inferCustomWorldDomain(
    currentMeta.title,
    currentMeta.mcTitle,
    currentMeta.worldSetting,
    currentMeta.locationName,
    weapon,
    currentMeta.summary
  );
  const { inventory: baseInventory, bagName } = resolveContextualStartingInventory(domain, weapon);
  const mergedInventory = mergeCustomInventory(baseInventory, currentMeta.customInventory);
  const mcChar = resolveDefaultMcCharacterization(
    currentMeta.mcName,
    currentMeta.mcTitle,
    currentMeta.worldSetting,
    currentMeta.locationName,
    currentMeta
  );

  const mcState: Partial<McState> = {
    name: currentMeta.mcName,
    title: currentMeta.mcTitle,
    personality: mcChar.personality,
    background: mcChar.background,
    goal: mcChar.goal,
    level: 1,
    exp: 0,
    maxExp: 100,
    inventory: mergedInventory,
    equipped: { weapon, bag: bagName },
    status: 'Healthy',
    location: genesis.locationId,
    locationName: currentMeta.locationName,
    trust: genesis.initialTrust,
    time: '08:00',
    day: 1,
    stats: initialStats
  };

  return { genesis, mcState };
}

export function normalizeHydratedMcState(
  parsedMcState: Partial<McState> | undefined,
  fallbackMcState: Partial<McState>
): Partial<McState> {
  if (!parsedMcState) {
    return { ...fallbackMcState };
  }
  return {
    name: parsedMcState.name || 'Protagonis',
    title: parsedMcState.title || 'Pengembara',
    level: parsedMcState.level || 1,
    exp: parsedMcState.exp !== undefined ? parsedMcState.exp : 0,
    maxExp: parsedMcState.maxExp || 100,
    inventory: parsedMcState.inventory
      ? [...parsedMcState.inventory]
      : ['Perlengkapan Dasar', 'Tas Pengembara', 'Ransum Makanan', '100 Koin'],
    ...parsedMcState,
    stats: {
      hp: 100,
      maxHp: 100,
      sp: 50,
      maxSp: 50,
      strength: 75,
      charisma: 75,
      stamina: 80,
      agility: 75,
      ...(parsedMcState.stats || {})
    },
    equipped: {
      weapon: parsedMcState.equipped?.weapon || 'Perlengkapan Dasar',
      bag: parsedMcState.equipped?.bag || 'Tas Pengembara',
      ...(parsedMcState.equipped || {})
    },
    trust: {
      ...(parsedMcState.trust || {})
    }
  };
}
