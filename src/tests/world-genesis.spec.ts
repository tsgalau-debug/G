import { describe, it, expect } from 'vitest';
import { generateWorldGenesis } from '../app/world-genesis';
import type { CreateStoryPayload } from '../app/game-state.types';

describe('World Genesis Reference Machine', () => {
  it('should initialize Feudal Yamato world package accurately', () => {
    const payload: CreateStoryPayload = {
      title: 'Petualangan di Desa Yamato',
      mcName: 'Kuro',
      mcTitle: 'Pengembara Pedang',
      worldSetting: 'Dunia Auralis: Desa Yamato',
      locationName: 'Desa Yamato',
      initialWeapon: 'Pedang Legendaris',
      prologuePrompt: 'Tiba di Desa Yamato setelah perjalanan panjang melintasi lembah kabut.'
    };

    const genesis = generateWorldGenesis(payload);

    expect(Object.keys(genesis.factions)).toContain('Penjaga Desa Yamato');
    expect(Object.keys(genesis.factions)).toContain('Auralis Royal Guard');
    expect(Object.keys(genesis.factions)).toContain('Sindikat Kabut Hitam');
    expect(genesis.factions['Penjaga Desa Yamato'].reputation).toBeGreaterThan(0);
    expect(genesis.factions['Sindikat Kabut Hitam'].reputation).toBeLessThan(0);

    expect(genesis.knowledgeGraph['Desa Yamato']).toBeDefined();
    expect(genesis.knowledgeGraph['Pedang Legendaris']).toBeDefined();
    expect(genesis.knowledgeGraph['Whispering Woods']).toBeDefined();

    expect(genesis.npcStates['NPC_DAICHI_107']).toBeDefined();
    expect(genesis.npcStates['NPC_HANAKO_103']).toBeDefined();
    expect(genesis.initialTrust['Daichi']).toBe(60);
    expect(genesis.quests['Q-001'].status).toBe('active');
    expect(genesis.activeLoreKeys).toContain('Yamato');
  });

  it('should initialize Shinobi Kage world package accurately', () => {
    const payload: CreateStoryPayload = {
      title: 'Bayangan Klan Kage',
      mcName: 'Ren',
      mcTitle: 'Shinobi Bayangan',
      worldSetting: 'Lembah Kabut Kage',
      locationName: 'Puncak Jurang Gagak',
      initialWeapon: 'Belati Kembar Chidori',
      prologuePrompt: 'Berdiri di dahan pohon cemara kuno mengamati benteng musuh.'
    };

    const genesis = generateWorldGenesis(payload);

    expect(Object.keys(genesis.factions)).toContain('Klan Kage Bayangan');
    expect(Object.keys(genesis.factions)).toContain('Garnisun Benteng Gagak');
    expect(Object.keys(genesis.factions)).toContain('Serikat Pengelana Kabut');
    expect(genesis.factions['Klan Kage Bayangan'].leader).toBe('Master Hanzou');

    expect(genesis.knowledgeGraph['Lembah Kabut Kage']).toBeDefined();
    expect(genesis.knowledgeGraph['Puncak Jurang Gagak']).toBeDefined();
    expect(genesis.npcStates['NPC_OBORO_INFO']).toBeDefined();
    expect(genesis.npcStates['NPC_MASTER_HANZOU']).toBeDefined();
    expect(genesis.activeLoreKeys).toContain('Belati Kembar Chidori');
  });

  it('should initialize Arcane Auralis world package accurately', () => {
    const payload: CreateStoryPayload = {
      title: 'Penyihir Kristal Auralis',
      mcName: 'Elena',
      mcTitle: 'Arkana Penjelajah',
      worldSetting: 'Kekaisaran Auralis',
      locationName: 'Perpustakaan Kuno Ibukota',
      initialWeapon: 'Tongkat Kristal Biru',
      prologuePrompt: 'Membuka gulungan naskah sihir kuno yang bersinar di ruang arsip.'
    };

    const genesis = generateWorldGenesis(payload);

    expect(Object.keys(genesis.factions)).toContain('Ordo Arkana Kristal');
    expect(Object.keys(genesis.factions)).toContain('Serikat Pustakawan & Arsiparis');
    expect(Object.keys(genesis.factions)).toContain('Inkuisisi Kerajaan Auralis');
    expect(genesis.knowledgeGraph['Perpustakaan Kuno Ibukota']).toBeDefined();
    expect(genesis.npcStates['NPC_SELYSE_ARCHIVIST']).toBeDefined();
    expect(genesis.npcStates['NPC_INQUISITOR_MALAKOR']).toBeDefined();
  });

  it('should initialize Cyber Neon world package accurately', () => {
    const payload: CreateStoryPayload = {
      title: 'Sang Kurir Distrik Neon',
      mcName: 'Kenji',
      mcTitle: 'Operatif Jalanan',
      worldSetting: 'Kota Cyber Neon-Aura',
      locationName: 'Lorong Sektor 7',
      initialWeapon: 'Pedang Plasma Termal',
      prologuePrompt: 'Menyalakan motor magi-cyber di bawah lampu neon gang sempit.'
    };

    const genesis = generateWorldGenesis(payload);

    expect(Object.keys(genesis.factions)).toContain('Sindikat Kurir Sektor 7');
    expect(Object.keys(genesis.factions)).toContain('Korporasi Neuro-Tech');
    expect(Object.keys(genesis.factions)).toContain('Jaringan Hacker Ghost-Wire');
    expect(genesis.factions['Korporasi Neuro-Tech'].reputation).toBeLessThan(0);
    expect(genesis.npcStates['NPC_ZERO_ONE']).toBeDefined();
    expect(genesis.npcStates['NPC_NYX_HACKER']).toBeDefined();
    expect(genesis.quests['Q-001'].title).toBe('Paket Panas di Bawah Neon');
  });

  it('should generatively synthesize custom world settings without hardcoded Kael bias', () => {
    const payload: CreateStoryPayload = {
      title: 'Legenda Armada Langit',
      mcName: 'Caelum',
      mcTitle: 'Kapten Kapal Terbang',
      worldSetting: 'Kepulauan Mengambang Aethelgard',
      locationName: 'Dermaga Awan Barat',
      initialWeapon: 'Kait Magnetik Ether',
      prologuePrompt: 'Menatap lautan awan yang membentang tak bertepi dari geladak kapal.'
    };

    const genesis = generateWorldGenesis(payload);

    expect(Object.keys(genesis.factions).length).toBe(3);
    expect(Object.keys(genesis.knowledgeGraph)).toContain('Kepulauan Mengambang Aethelgard');
    expect(Object.keys(genesis.knowledgeGraph)).toContain('Dermaga Awan Barat');
    expect(Object.keys(genesis.knowledgeGraph)).toContain('Kait Magnetik Ether');
    expect(Object.keys(genesis.npcStates).length).toBe(3);
    expect(JSON.stringify(genesis.factions)).not.toContain('Kael');
    expect(JSON.stringify(genesis.npcStates)).not.toContain('Kael');
    expect(genesis.quests['Q-001']).toBeDefined();
    expect(genesis.quests['Q-001'].status).toBe('active');
  });

  it('should handle empty or fallback payload safely', () => {
    const payload: CreateStoryPayload = {
      title: '',
      mcName: '',
      mcTitle: '',
      worldSetting: '',
      locationName: '',
      initialWeapon: '',
      prologuePrompt: ''
    };

    const genesis = generateWorldGenesis(payload);

    expect(genesis).toBeDefined();
    expect(Object.keys(genesis.factions).length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(genesis.knowledgeGraph).length).toBeGreaterThanOrEqual(1);
    expect(genesis.quests['Q-001']).toBeDefined();
    expect(genesis.locationId).toBeDefined();
  });

  it('should differentiate initial character stats based on characterArchetype and mcTitle', async () => {
    const { resolveInitialCharacterStats } = await import('../app/world-genesis');

    const warriorStats = resolveInitialCharacterStats('warrior', 'Pendekar Pedang');
    const diplomatStats = resolveInitialCharacterStats('diplomat', 'Utusan Bangsawan');
    const scoutStats = resolveInitialCharacterStats('scout', 'Shinobi Pengintai');
    const scholarStats = resolveInitialCharacterStats('scholar', 'Penyihir Arkana');
    const balancedStats = resolveInitialCharacterStats('balanced', 'Pengembara');

    expect(warriorStats['strength']).toBeGreaterThan(balancedStats['strength']!);
    expect(warriorStats['maxHp']).toBeGreaterThan(balancedStats['maxHp']!);
    expect(diplomatStats['charisma']).toBeGreaterThan(warriorStats['charisma']!);
    expect(scoutStats['agility']).toBeGreaterThan(diplomatStats['agility']!);
    expect(scholarStats['maxSp']).toBeGreaterThan(warriorStats['maxSp']!);
  });

  it('should keep SYSTEM_RULES story-agnostic and scope rules dynamically via buildScopedSystemRules', async () => {
    const { SYSTEM_RULES, buildScopedSystemRules } = await import('../app/system-rules');

    const rawSystemJson = JSON.stringify(SYSTEM_RULES);
    expect(rawSystemJson).not.toContain('Kuro');
    expect(rawSystemJson).not.toContain('Desa Yamato');
    expect(rawSystemJson).not.toContain('Naomi');
    expect(rawSystemJson).not.toContain('Aiko');

    const cyberPayload: CreateStoryPayload = {
      title: 'Sang Kurir Distrik Neon',
      mcName: 'Kenji',
      mcTitle: 'Operatif Jalanan',
      worldSetting: 'Kota Cyber Neon-Aura',
      locationName: 'Lorong Sektor 7',
      initialWeapon: 'Pedang Plasma Termal',
      prologuePrompt: 'Menyalakan motor magi-cyber di bawah lampu neon.'
    };
    const cyberGenesis = generateWorldGenesis(cyberPayload);
    const scopedCyber = buildScopedSystemRules({
      storyMeta: {
        id: 'story_cyber_1',
        title: cyberPayload.title,
        mcName: cyberPayload.mcName,
        mcTitle: cyberPayload.mcTitle,
        worldSetting: cyberPayload.worldSetting,
        locationName: cyberPayload.locationName,
        createdAt: 1,
        updatedAt: 1,
        lastPlayedAt: 1,
        turnCount: 0,
        summary: cyberPayload.prologuePrompt || ''
      },
      mcState: {
        name: 'Kenji',
        title: 'Operatif Jalanan',
        locationName: 'Lorong Sektor 7'
      },
      npcStates: cyberGenesis.npcStates,
      factions: cyberGenesis.factions,
      knowledgeGraph: cyberGenesis.knowledgeGraph
    });

    const scopedCyberJson = JSON.stringify(scopedCyber);
    expect(scopedCyberJson).toContain('Kenji');
    expect(scopedCyberJson).toContain('Kota Cyber Neon-Aura');
    expect(scopedCyberJson).toContain('Zero-One');
    expect(scopedCyberJson).not.toContain('Desa Yamato');
    expect(scopedCyberJson).not.toContain('Kuro');
  });

  it('should preserve generated NPCs on turn 0 session hydration and restore genesis on resetCurrentStory', async () => {
    const { GameStateService } = await import('../app/game-state.service');
    const { parseCurrencyFromInventory } = await import('../app/item-system');

    const service = new GameStateService();
    const storiesMap = new Map<string, any>();
    const sessionsMap = new Map<string, any>();
    (service as any).db = {
      stories: {
        put: async (meta: any) => { storiesMap.set(meta.id, meta); },
        get: async (id: string) => storiesMap.get(id),
        toArray: async () => Array.from(storiesMap.values()),
        orderBy: () => ({
          reverse: () => ({
            toArray: async () => Array.from(storiesMap.values())
          })
        })
      },
      sessions: {
        put: async (rec: any) => { sessionsMap.set(rec.id, rec); },
        get: async (id: string) => sessionsMap.get(id)
      },
      engineState: {
        put: async () => {},
        get: async () => undefined
      }
    };

    // Neutral initial default before story load
    expect(service.mcState.name).toBe('Protagonis');
    expect(service.mcState.locationName).toBe('Titik Awal');

    // Parse '100 Keping Perak' accurately
    const currency = parseCurrencyFromInventory(['Pedang Tempa', '100 Keping Perak']);
    expect(currency.amount).toBe(100);

    // Create a custom story and verify NPCs are preserved even when chronicle is empty (Turn 0)
    await service.createNewStory({
      title: 'Ekspedisi Bintang',
      mcName: 'Vega',
      mcTitle: 'Navigator Kosmik',
      worldSetting: 'Sektor Galaksi Andromeda',
      locationName: 'Stasiun Orbital Alpha',
      initialWeapon: 'Pistol Foton',
      characterArchetype: 'scholar',
      prologuePrompt: 'Memantau radar kuantum dari anjungan stasiun.'
    });

    expect(service.mcState.name).toBe('Vega');
    expect(service.mcState.stats?.['maxSp']).toBeGreaterThanOrEqual(70);
    expect(Object.keys(service.npcStates).length).toBeGreaterThanOrEqual(3);

    // Simulate wiping NPCs during gameplay and resetting the story
    service.updateNpcStates([]);
    expect(Object.keys(service.npcStates).length).toBe(0);

    await service.resetCurrentStory();
    expect(service.mcState.name).toBe('Vega');
    expect(Object.keys(service.npcStates).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(service.factions).length).toBeGreaterThanOrEqual(3);
  });

  it('REG-20261023-009: should extract custom NPCs from prologuePrompt and synthesize domestic/slice-of-life world without militant boilerplate', async () => {
    const { inferCustomWorldDomain, resolveContextualStartingInventory } = await import('../app/world-genesis');

    const payload: CreateStoryPayload = {
      title: 'Senja Tenang di Kediaman Takeshi',
      mcName: 'Takeshi',
      mcTitle: 'Tuan Rumah',
      worldSetting: 'Desa Lembah Sakura',
      locationName: 'Sudut Ruang Tamu Kediaman Takeshi',
      initialWeapon: 'Kipas Lipat Kayu',
      prologuePrompt:
        'Aku duduk bersantai di ruang tamu bersama Aiko yang sedang menyeduh teh hangat, sementara Hana merapikan halaman depan.'
    };

    const domain = inferCustomWorldDomain(
      payload.title,
      payload.mcTitle,
      payload.worldSetting,
      payload.locationName,
      payload.initialWeapon,
      payload.prologuePrompt || ''
    );
    expect(domain).toBe('domestic_slice_of_life');

    const genesis = generateWorldGenesis(payload);

    // Custom NPCs from prologue ("Aiko" and "Hana") must be registered at Turn 0
    expect(genesis.npcStates['NPC_CUSTOM_AIKO']).toBeDefined();
    expect(genesis.npcStates['NPC_CUSTOM_AIKO']?.nama).toBe('Aiko');
    expect(genesis.npcStates['NPC_CUSTOM_AIKO']?.lokasi).toBe('Ruang Tamu Kediaman Takeshi');
    expect(genesis.npcStates['NPC_CUSTOM_AIKO']?.aktivitas.toLowerCase()).toContain('menyeduh teh hangat');
    expect(genesis.initialTrust['Aiko']).toBeGreaterThanOrEqual(70);

    expect(genesis.npcStates['NPC_CUSTOM_HANA']).toBeDefined();
    expect(genesis.npcStates['NPC_CUSTOM_HANA']?.nama).toBe('Hana');
    expect(genesis.npcStates['NPC_CUSTOM_HANA']?.aktivitas.toLowerCase()).toContain('merapikan halaman depan');

    // Domestic custom story must NOT inject generic "Komandan" or "Sindikat Bayangan"
    const allFactionsJson = JSON.stringify(genesis.factions);
    const allNpcsJson = JSON.stringify(genesis.npcStates);
    expect(allFactionsJson).not.toContain('Sindikat Bayangan');
    expect(allFactionsJson).not.toContain('Otoritas Penjaga');
    expect(allNpcsJson).not.toContain('Komandan');
    expect(allNpcsJson).not.toContain('Operatif');

    // Initial quest and knowledgeGraph must reference Aiko
    expect(genesis.knowledgeGraph['Aiko']).toBeDefined();
    expect(genesis.quests['Q-001']?.description).toContain('Aiko');

    // Contextual starting inventory for domestic domain
    const startGear = resolveContextualStartingInventory(domain, payload.initialWeapon);
    expect(startGear.inventory).toContain('Pakaian Harian Rapi');
    expect(startGear.bagName).toBe('Tas Selempang');
  });

  it('REG-20261023-010: should assign resident/companion schedule archetypes, preserve rich NPC profile fields across AI turns, and support upsertCustomNpc', async () => {
    const { GameStateService } = await import('../app/game-state.service');

    const service = new GameStateService();
    (service as any).db = {
      stories: { put: async () => {}, get: async () => undefined },
      sessions: { put: async () => {}, get: async () => undefined },
      engineState: { put: async () => {}, get: async () => undefined }
    };

    const payload: CreateStoryPayload = {
      title: 'Senja Tenang di Kediaman Takeshi',
      mcName: 'Takeshi',
      mcTitle: 'Tuan Rumah',
      worldSetting: 'Desa Lembah Sakura',
      locationName: 'Sudut Ruang Tamu Kediaman Takeshi',
      initialWeapon: 'Kipas Lipat Kayu',
      prologuePrompt:
        'Aku duduk bersantai bersama adikku Aiko yang sedang menyeduh teh hangat di ruang tamu.'
    };

    const genesis = generateWorldGenesis(payload);
    const aiko = genesis.npcStates['NPC_CUSTOM_AIKO'];
    expect(aiko).toBeDefined();
    expect(aiko?.scheduleArchetype).toBe('resident');
    expect(aiko?.peran).toContain('Keluarga & Penghuni Kediaman Takeshi');
    expect(aiko?.kepribadian).toBeTruthy();
    expect(aiko?.tujuan).toBeTruthy();
    expect(aiko?.gaya_bicara).toBeTruthy();

    // Verify all 6 schedule slots for a 'resident' NPC stay inside Kediaman Takeshi (never wandering to Pusat Keramaian or Tepi Wilayah)
    const aikoSchedule = genesis.npcSchedules?.['NPC_CUSTOM_AIKO'];
    expect(aikoSchedule).toBeDefined();
    expect(aikoSchedule?.archetype).toBe('resident');
    expect(aikoSchedule?.slots.length).toBe(6);
    for (const slot of aikoSchedule?.slots || []) {
      expect(slot.lokasi).toContain('Kediaman Takeshi');
      expect(slot.lokasi).not.toContain('Pusat Keramaian');
      expect(slot.lokasi).not.toContain('Tepi Wilayah');
    }

    // Seed service state and simulate a partial AI update (where AI only emits nama, lokasi, aktivitas, mood)
    service.npcStates = { ...genesis.npcStates };
    service.npcSchedules = { ...(genesis.npcSchedules || {}) };
    service.mcState = {
      ...service.mcState,
      name: 'Takeshi',
      locationName: 'Ruang Tamu Kediaman Takeshi',
      trust: { ...genesis.initialTrust }
    };

    service.updateNpcStates([
      {
        nama: 'Aiko',
        lokasi: 'Ruang Tamu Kediaman Takeshi',
        aktivitas: 'Menuangkan teh hijau ke cangkir keramik.',
        mood: 'Senang'
      }
    ]);

    // Rich profile fields must be preserved and not wiped by partial AI output
    const updatedAiko = service.npcStates['NPC_CUSTOM_AIKO'];
    expect(updatedAiko?.peran).toContain('Keluarga & Penghuni Kediaman Takeshi');
    expect(updatedAiko?.kepribadian).toBeTruthy();
    expect(updatedAiko?.tujuan).toBeTruthy();
    expect(updatedAiko?.scheduleArchetype).toBe('resident');

    // Add a custom companion NPC via upsertCustomNpc and verify schedule & knowledgeGraph
    service.upsertCustomNpc({
      nama: 'Sora',
      peran: 'Rekan Seperjalanan Setia',
      scheduleArchetype: 'companion',
      lokasi: 'Ruang Tamu Kediaman Takeshi',
      faksi: 'Keluarga & Penghuni Kediaman Takeshi',
      kepribadian: 'Tanggap, tenang, dan setia kawan',
      tujuan: 'Mendampingi langkah Takeshi',
      aktivitas: 'Memeriksa peta perjalanan di meja.',
      gaya_bicara: 'Lugas dan bersahabat',
      trust: 85
    });

    const sora = service.npcStates['NPC_CUSTOM_SORA'];
    expect(sora).toBeDefined();
    expect(sora?.peran).toBe('Rekan Seperjalanan Setia');
    expect(sora?.scheduleArchetype).toBe('companion');
    expect(service.getNpcTrust('Sora')).toBe(85);
    expect(service.npcSchedules['NPC_CUSTOM_SORA']?.archetype).toBe('companion');
    expect(service.knowledgeGraph['Sora']?.[0]).toContain('Rekan Seperjalanan Setia');
  });

  it('REG-20261023-011: should persist custom MC characterization, custom starting inventory, and structured initialNpcs across creation, system prompt scoping, profile editing, and story reset', async () => {
    const { GameStateService } = await import('../app/game-state.service');
    const { parseCurrencyFromInventory } = await import('../app/item-system');
    const { buildScopedSystemRules } = await import('../app/system-rules');

    const service = new GameStateService();
    const storiesMap = new Map<string, any>();
    const sessionsMap = new Map<string, any>();
    (service as any).db = {
      stories: {
        put: async (meta: any) => { storiesMap.set(meta.id, meta); },
        get: async (id: string) => storiesMap.get(id),
        toArray: async () => Array.from(storiesMap.values()),
        orderBy: () => ({
          reverse: () => ({
            toArray: async () => Array.from(storiesMap.values())
          })
        })
      },
      sessions: {
        put: async (rec: any) => { sessionsMap.set(rec.id, rec); },
        get: async (id: string) => sessionsMap.get(id)
      },
      engineState: {
        put: async () => {},
        get: async () => undefined
      }
    };

    await service.createNewStory({
      title: 'Jejak Teh dan Bambu',
      mcName: 'Haruka',
      mcTitle: 'Perajin Keramik Lembah',
      worldSetting: 'Desa Bambu Arashiyama',
      locationName: 'Sanggar Keramik Haruka',
      initialWeapon: 'Pahat Bambu Halus',
      mcPersonality: 'Sabar, teliti, dan menghargai keindahan sederhana',
      mcBackground: 'Mewarisi tungku pembakaran keramik kuno milik kakeknya di tepi sungai',
      mcGoal: 'Menciptakan cangkir teh porselen terbaik untuk festival musim gugur',
      customInventory: ['Tanah Liat Putih Pilihan', '150 Keping Perak', 'Buku Sketsa Glasir'],
      initialNpcs: [
        {
          nama: 'Mio',
          peran: 'Asisten Sanggar & Adik Sepupu',
          scheduleArchetype: 'resident',
          lokasi: 'Sanggar Keramik Haruka',
          kepribadian: 'Ceria, cekatan, dan suka bereksperimen dengan warna glasir',
          tujuan: 'Membantu Haruka menyiapkan pameran musim gugur',
          gaya_bicara: 'Akrab dan penuh semangat',
          aktivitas: 'Menumbuk bahan glasir biru di meja kerja.',
          trust: 88
        }
      ],
      prologuePrompt: 'Pagi yang sejuk di sanggar keramik saat bara tungku pertama dinyalakan.'
    });

    // Verify MC custom characterization & inventory
    expect(service.mcState.name).toBe('Haruka');
    expect(service.mcState.personality).toContain('Sabar, teliti');
    expect(service.mcState.background).toContain('tungku pembakaran keramik kuno');
    expect(service.mcState.goal).toContain('cangkir teh porselen terbaik');
    expect(service.mcState.inventory).toContain('Pahat Bambu Halus');
    expect(service.mcState.inventory).toContain('Tanah Liat Putih Pilihan');
    expect(service.mcState.inventory).toContain('Buku Sketsa Glasir');
    expect(parseCurrencyFromInventory(service.mcState.inventory || []).amount).toBe(150);

    // Verify structured initialNpc ("Mio") is registered with resident schedule & trust
    const mio = service.npcStates['NPC_CUSTOM_MIO'];
    expect(mio).toBeDefined();
    expect(mio?.peran).toBe('Asisten Sanggar & Adik Sepupu');
    expect(mio?.scheduleArchetype).toBe('resident');
    expect(service.getNpcTrust('Mio')).toBe(88);
    expect(service.npcSchedules['NPC_CUSTOM_MIO']?.archetype).toBe('resident');

    // Verify scoped system rules inject protagonist personality, background, and goal
    const scopedRules = buildScopedSystemRules({
      storyMeta: service.availableStories().find((s) => s.id === service.activeStoryId()) || null,
      mcState: service.mcState,
      npcStates: service.npcStates,
      factions: service.factions,
      knowledgeGraph: service.knowledgeGraph
    });
    const scopedJson = JSON.stringify(scopedRules);
    expect(scopedJson).toContain('Sabar, teliti');
    expect(scopedJson).toContain('tungku pembakaran keramik kuno');
    expect(scopedJson).toContain('cangkir teh porselen terbaik');

    // Verify updateProfile updates MC custom characterization
    service.updateProfile('Haruka', 'Empu Keramik Lembah', {
      personality: 'Bijaksana dan tenang',
      background: 'Penjaga tradisi keramik Arashiyama',
      goal: 'Mendirikan akademi seni keramik desa'
    });
    expect(service.mcState.title).toBe('Empu Keramik Lembah');
    expect(service.mcState.personality).toBe('Bijaksana dan tenang');
    expect(service.mcState.goal).toBe('Mendirikan akademi seni keramik desa');

    // Verify resetCurrentStory restores original story metadata characterization, custom inventory, and initialNpcs
    service.updateNpcStates([]);
    await service.resetCurrentStory();
    expect(service.mcState.personality).toContain('Sabar, teliti');
    expect(service.mcState.inventory).toContain('Tanah Liat Putih Pilihan');
    expect(service.npcStates['NPC_CUSTOM_MIO']).toBeDefined();
    expect(service.getNpcTrust('Mio')).toBe(88);
  });

  it('REG-20261023-012: should support interactive knowledge graph bind, inline edit, canon reweight, entity unbind, and scoped prompt knowledge pruning', async () => {
    const { GameStateService } = await import('../app/game-state.service');
    const { buildScopedKnowledgeGraphForPrompt } = await import('../app/game-state/mc-progression-reducer');

    const service = new GameStateService();
    (service as any).db = {
      stories: { put: async () => {}, get: async () => undefined, toArray: async () => [], orderBy: () => ({ reverse: () => ({ toArray: async () => [] }) }) },
      sessions: { put: async () => {}, get: async () => undefined },
      engineState: { put: async () => {}, get: async () => undefined }
    };

    const initialVersion = service.stateVersion();

    // 1. Bind custom canon lore with weight 2.0 and standard fact with weight 1.0
    service.updateKnowledgeGraph([
      {
        action: 'bind',
        entity: 'Hukum Lembah Sakura',
        fact: 'Dilarang membawa senjata api ke dalam area kuil dan kediaman.',
        weight: 2.0
      },
      {
        action: 'bind',
        entity: 'Aiko',
        fact: 'Menyukai teh melati hangat di sore hari.',
        weight: 1.0
      }
    ]);

    expect(service.stateVersion()).toBeGreaterThan(initialVersion);
    expect(service.knowledgeGraph['Hukum Lembah Sakura']).toContain(
      'Dilarang membawa senjata api ke dalam area kuil dan kediaman.'
    );
    expect(
      service.knowledgeWeights['Hukum Lembah Sakura::Dilarang membawa senjata api ke dalam area kuil dan kediaman.']
    ).toBe(2.0);

    // 2. Inline edit fact via previousFact while preserving/updating weight
    service.updateKnowledgeGraph([
      {
        action: 'bind',
        entity: 'Aiko',
        fact: 'Menyukai teh hijau panggang (hojicha) hangat di sore hari.',
        previousFact: 'Menyukai teh melati hangat di sore hari.',
        weight: 1.5
      }
    ]);
    expect(service.knowledgeGraph['Aiko']).not.toContain('Menyukai teh melati hangat di sore hari.');
    expect(service.knowledgeGraph['Aiko']).toContain('Menyukai teh hijau panggang (hojicha) hangat di sore hari.');
    expect(service.knowledgeWeights['Aiko::Menyukai teh hijau panggang (hojicha) hangat di sore hari.']).toBe(1.5);

    // 3. Verify buildScopedKnowledgeGraphForPrompt tags [KANON UTAMA] & [PRIORITAS] and caps noisy background entities
    for (let i = 1; i <= 15; i++) {
      service.updateKnowledgeGraph([
        {
          action: 'bind',
          entity: `RumorLama_${i}`,
          fact: `Kabar angin masa lalu nomor ${i}`,
          weight: 1.0
        }
      ]);
    }

    const scopedKg = buildScopedKnowledgeGraphForPrompt(
      service.knowledgeGraph,
      service.knowledgeWeights,
      {
        mcName: 'Takeshi',
        worldSetting: 'Desa Lembah Sakura',
        currentLocation: 'Ruang Tamu Kediaman Takeshi',
        activeEntities: ['Aiko'],
        maxBackgroundEntities: 4
      }
    );

    // Priority & high-weight entities must always be included with priority prefixes
    expect(scopedKg['Hukum Lembah Sakura']?.[0]).toContain('[KANON UTAMA]');
    expect(scopedKg['Aiko']?.[0]).toContain('[PRIORITAS]');
    // Background entities should be capped at 4 (plus the 2 priority entities = 6 total)
    expect(Object.keys(scopedKg).length).toBe(6);

    // 4. Unbind entire entity node via fact: '*'
    service.updateKnowledgeGraph([
      {
        action: 'unbind',
        entity: 'RumorLama_1',
        fact: '*'
      }
    ]);
    expect(service.knowledgeGraph['RumorLama_1']).toBeUndefined();
  });

  it('should preserve gemini-3.5-flash-lite in VALID_AI_MODELS and as default high-RPD model (REG-20261026-014)', async () => {
    const { GameStateService, VALID_AI_MODELS } = await import('../app/game-state.service');
    const { hydrateSessionStatePayload } = await import('../app/game-state/session-storage-coordinator');

    expect(VALID_AI_MODELS.has('gemini-3.5-flash-lite')).toBe(true);
    expect(VALID_AI_MODELS.has('gemini-3.1-flash-lite')).toBe(true);
    expect(VALID_AI_MODELS.has('gemini-3.8-flash')).toBe(true);

    const service = new GameStateService();
    expect(service.aiModel).toBe('gemini-3.5-flash-lite');

    const hydrated = hydrateSessionStatePayload({}, service.mcState, {}, 'Ringkasan');
    expect(hydrated.aiModel).toBe('gemini-3.5-flash-lite');
  });
});



