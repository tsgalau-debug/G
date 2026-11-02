import type { CreateStoryPayload } from './game-state.types';
import {
  type WorldGenesisOutput,
  generateYamatoGenesis,
  generateKageGenesis,
  generateArcaneAuralisGenesis,
  generateNeonCyberGenesis,
  generateCustomGenerativeGenesis
} from './world-genesis/world-archetype-presets';
import {
  inferNpcRoleArchetype,
  generateDynamicNpcSchedule,
  generateNpcSchedulesMap,
  resolveScheduleSlotForHour
} from './world-genesis/npc-schedule-synthesizer';
import {
  inferCustomWorldDomain,
  extractPrologueCustomNpcs,
  resolveContextualStartingInventory,
  synthesizeCustomWorldGenesis
} from './world-genesis/custom-genesis-synthesizer';

export * from './world-genesis/world-archetype-presets';
export * from './world-genesis/npc-schedule-synthesizer';
export * from './world-genesis/custom-genesis-synthesizer';
export {
  type WorldGenesisOutput,
  generateYamatoGenesis,
  generateKageGenesis,
  generateArcaneAuralisGenesis,
  generateNeonCyberGenesis,
  generateCustomGenerativeGenesis,
  inferNpcRoleArchetype,
  generateDynamicNpcSchedule,
  generateNpcSchedulesMap,
  resolveScheduleSlotForHour,
  inferCustomWorldDomain,
  extractPrologueCustomNpcs,
  resolveContextualStartingInventory,
  synthesizeCustomWorldGenesis
};

/**
 * World Genesis Reference Machine
 * Translates input story parameters into a coherent, balanced, and dynamic world state.
 * Supports known archetypes (Feudal Yamato, Kage Shinobi, Arcane Auralis, Cyber Neon)
 * and features an open generative synthesizer for any arbitrary custom world.
 */
export function generateWorldGenesis(payload: CreateStoryPayload): WorldGenesisOutput {
  const title = (payload.title || '').trim();
  const mcName = (payload.mcName || 'Protagonis').trim();
  const mcTitle = (payload.mcTitle || 'Pengembara').trim();
  const worldSetting = (payload.worldSetting || 'Dunia Petualangan').trim();
  const locationName = (payload.locationName || 'Gerbang Wilayah').trim();
  const weapon = (payload.initialWeapon || 'Pedang Tempa').trim();
  const prompt = (payload.prologuePrompt || '').trim();

  const primaryContext = `${title} ${worldSetting} ${locationName}`.toLowerCase();
  const fullContext = `${primaryContext} ${mcTitle} ${prompt}`.toLowerCase();

  let output: WorldGenesisOutput;

  // 1. Archetype: Petualangan di Desa Yamato (Eastern Frontier / Yamato)
  if (
    primaryContext.includes('yamato') ||
    fullContext.includes('desa yamato') ||
    fullContext.includes('kuro')
  ) {
    output = generateYamatoGenesis(mcName, mcTitle, worldSetting, locationName, weapon);
  } else if (
    // 2. Archetype: Bayangan Klan Kage (Shinobi / Feudal Shadow)
    primaryContext.includes('kage') ||
    fullContext.includes('klan kage') ||
    fullContext.includes('shinobi') ||
    fullContext.includes('jurang gagak') ||
    fullContext.includes('lembah kabut kage')
  ) {
    output = generateKageGenesis(mcName, mcTitle, worldSetting, locationName, weapon);
  } else if (
    // 3. Archetype: Sang Kurir Distrik Neon (Cyberpunk / Tech-Noir)
    primaryContext.includes('neon') ||
    primaryContext.includes('cyber') ||
    fullContext.includes('distrik neon') ||
    fullContext.includes('sektor 7') ||
    fullContext.includes('kurir jalanan') ||
    fullContext.includes('pedang plasma')
  ) {
    output = generateNeonCyberGenesis(mcName, mcTitle, worldSetting, locationName, weapon);
  } else if (
    // 4. Archetype: Penyihir Kristal Auralis (High Arcane / Fantasy)
    primaryContext.includes('arkana') ||
    primaryContext.includes('kristal') ||
    fullContext.includes('penyihir kristal') ||
    fullContext.includes('perpustakaan kuno') ||
    fullContext.includes('tongkat kristal') ||
    (primaryContext.includes('auralis') && fullContext.includes('penyihir'))
  ) {
    output = generateArcaneAuralisGenesis(mcName, mcTitle, worldSetting, locationName, weapon);
  } else {
    // 5. Open Generative Synthesizer for Any Custom World
    output = generateCustomGenerativeGenesis(
      title,
      mcName,
      mcTitle,
      worldSetting,
      locationName,
      weapon,
      prompt
    );
  }

  // Enrich protagonist lore in knowledgeGraph when custom MC details are provided
  const mcFacts = output.knowledgeGraph[mcName] ? [...output.knowledgeGraph[mcName]!] : [];
  if (payload.mcPersonality?.trim()) {
    mcFacts.push(`Kepribadian ${mcName}: ${payload.mcPersonality.trim()}.`);
  }
  if (payload.mcBackground?.trim()) {
    mcFacts.push(`Latar belakang ${mcName}: ${payload.mcBackground.trim()}.`);
  }
  if (payload.mcGoal?.trim()) {
    mcFacts.push(`Tujuan utama ${mcName}: ${payload.mcGoal.trim()}.`);
  }
  if (mcFacts.length > 0) {
    output.knowledgeGraph[mcName] = mcFacts;
  }

  // Merge structured initialNpcs defined explicitly by the user in the Story Builder (Tahap 3)
  if (Array.isArray(payload.initialNpcs) && payload.initialNpcs.length > 0) {
    const primaryFaction = Object.keys(output.factions)[0] || 'Independen';
    for (const rawNpc of payload.initialNpcs) {
      const npcName = (rawNpc?.nama || '').trim();
      if (!npcName) continue;
      const cleanKey = 'NPC_CUSTOM_' + npcName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const npcLoc = (rawNpc.lokasi || locationName).trim();
      const npcAct = (rawNpc.aktivitas || `Berada di ${npcLoc} bersama ${mcName}.`).trim();
      const npcFaction = (rawNpc.faksi || primaryFaction).trim();
      const npcTrust = typeof rawNpc.trust === 'number' && !Number.isNaN(rawNpc.trust)
        ? Math.max(0, Math.min(100, Math.round(rawNpc.trust)))
        : 65;

      output.npcStates[cleanKey] = {
        nama: npcName,
        peran: rawNpc.peran?.trim() || undefined,
        role: rawNpc.peran?.trim() || undefined,
        kepribadian: rawNpc.kepribadian?.trim() || undefined,
        personality: rawNpc.kepribadian?.trim() || undefined,
        tujuan: rawNpc.tujuan?.trim() || undefined,
        goal: rawNpc.tujuan?.trim() || undefined,
        gaya_bicara: rawNpc.gaya_bicara?.trim() || undefined,
        voiceStyle: rawNpc.gaya_bicara?.trim() || undefined,
        scheduleArchetype: rawNpc.scheduleArchetype,
        lokasi: npcLoc,
        location: npcLoc,
        aktivitas: npcAct,
        activity: npcAct,
        mood: 'Tenang dan perhatian',
        faksi: npcFaction,
        faction: npcFaction,
        status: 'Healthy'
      };
      output.initialTrust[npcName] = npcTrust;
      output.knowledgeGraph[npcName] = [
        `${npcName} (${rawNpc.peran || 'Tokoh Penting'}) berada di ${npcLoc}: ${npcAct}`,
        rawNpc.kepribadian ? `Kepribadian: ${rawNpc.kepribadian}.` : `Memiliki relasi awal (Trust ${npcTrust}/100) dengan ${mcName}.`
      ];
      if (!output.activeLoreKeys.includes(npcName)) {
        output.activeLoreKeys.push(npcName);
      }
    }
    output.initialLogs.push(
      `[World Genesis] ${payload.initialNpcs.length} tokoh NPC custom terstruktur berhasil diinisialisasi.`
    );
  }

  output.npcSchedules = generateNpcSchedulesMap(output.npcStates, locationName);
  return output;
}

export function resolveInitialCharacterStats(
  archetype?: string,
  mcTitle?: string
): Record<string, number> {
  const arch = (archetype || '').toLowerCase();
  const role = (mcTitle || '').toLowerCase();

  if (arch === 'warrior' || /pendekar|ksatria|petarung|prajurit|tentara|gladiator|pemburu/i.test(role)) {
    return {
      hp: 115,
      maxHp: 115,
      sp: 45,
      maxSp: 45,
      strength: 88,
      charisma: 68,
      stamina: 85,
      agility: 74
    };
  }

  if (arch === 'scout' || /shinobi|kurir|pembunuh|pencuri|operatif|pengintai|penjelajah/i.test(role)) {
    return {
      hp: 95,
      maxHp: 95,
      sp: 60,
      maxSp: 60,
      strength: 72,
      charisma: 70,
      stamina: 80,
      agility: 92
    };
  }

  if (arch === 'scholar' || /penyihir|arkana|cendekiawan|ilmuwan|tabib|alchemist|detektif|peneliti/i.test(role)) {
    return {
      hp: 90,
      maxHp: 90,
      sp: 75,
      maxSp: 75,
      strength: 62,
      charisma: 84,
      stamina: 72,
      agility: 76
    };
  }

  if (arch === 'diplomat' || /bangsawan|diplomat|pedagang|kapten|pemimpin|negosiator|politisi/i.test(role)) {
    return {
      hp: 100,
      maxHp: 100,
      sp: 55,
      maxSp: 55,
      strength: 70,
      charisma: 92,
      stamina: 76,
      agility: 75
    };
  }

  return {
    hp: 100,
    maxHp: 100,
    sp: 50,
    maxSp: 50,
    strength: 75,
    charisma: 75,
    stamina: 80,
    agility: 75
  };
}
