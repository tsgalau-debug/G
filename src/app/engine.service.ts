/* eslint-disable */
import {Injectable, signal, inject} from '@angular/core';
import {GameStateService, ChronicleEntry} from './game-state.service';
import {SYSTEM_RULES, buildScopedSystemRules} from './system-rules';
import {LoreEngineService} from './rag/lore-engine.service';
import {ChronosEngineService} from './chronos-engine.service';
import {buildScopedKnowledgeGraphForPrompt} from './game-state/mc-progression-reducer';

@Injectable({
  providedIn: 'root',
})
export class EngineService {
  isProcessing = signal(false);
  gameState = inject(GameStateService);
  loreEngine = inject(LoreEngineService);
  chronosEngine = inject(ChronosEngineService);

  async processTurn(playerChoice: string) {
    this.isProcessing.set(true);
    this.gameState.addLog('Player choice: ' + playerChoice);
    
    let llmAccepted = false;
    let startTime = 0;
    try {
      const prompt = await this.buildPrompt(playerChoice);
      startTime = performance.now();

      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: this.gameState.aiModel,
          temperature: 0.5,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = (await res.json()) as { text?: string; error?: string };
      if (data.error) {
        throw new Error(data.error);
      }

      const text = data.text || '';
      const evalOutcome = this.handleResponse(text);
      llmAccepted = evalOutcome.llmAccepted;
      
      const latencyMs = performance.now() - startTime;
      // Report dynamic evaluated outcome to train the AgenticChunkOrchestrator's VSA-RL policy
      void this.loreEngine.reportOutcome(evalOutcome.userSatisfied, evalOutcome.llmAccepted, latencyMs);
      
      void this.loreEngine.refreshDynamicContext();
    } catch (error: unknown) {
      if (!llmAccepted) {
        void this.loreEngine.reportOutcome(false, false, performance.now() - startTime);
        this.handleResponse('');
      }
      if (error instanceof Error) {
        this.gameState.addLog('Error: ' + error.message);
      }
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async buildPrompt(playerChoice: string) {
     
    const currentLocation = this.gameState.mcState.locationName || this.gameState.mcState.location || 'Unknown';
    const activeEntities = this._extractEntities(playerChoice);
    const contextTags = [currentLocation, 'narrative'];

    // Identify primary active NPC for hierarchical retrieval conditioning
    const locLower = currentLocation.toLowerCase();
    const allNpcEntries = Object.entries(this.gameState.npcStates);
    let activeNpc: any = null;
    for (const ent of activeEntities) {
      const entLower = ent.toLowerCase();
      const found = allNpcEntries.find(([k, n]) => 
        (n.nama || k).toLowerCase() === entLower || k.toLowerCase() === entLower
      );
      if (found) {
        activeNpc = found[1];
        break;
      }
    }
    if (!activeNpc) {
      const local = allNpcEntries.find(([_, n]) => {
        const npcLoc = (n.lokasi || n.location || '').toLowerCase();
        return locLower && (npcLoc.includes(locLower) || locLower.includes(npcLoc));
      });
      if (local) activeNpc = local[1];
    }

    const dynamicContext = await this.loreEngine.getContextSnippet(
      currentLocation,
      activeEntities,
      contextTags,
      playerChoice,
      activeNpc
    );

    const scopedRules = buildScopedSystemRules({
      storyMeta: this.gameState.activeStory(),
      mcState: this.gameState.mcState,
      npcStates: this.gameState.npcStates,
      factions: this.gameState.factions,
      knowledgeGraph: this.gameState.knowledgeGraph,
    });

    const staticSnippets: string[] = [];
     
    if (this.gameState.activeLoreKeys?.length > 0) {
       
      const book = (scopedRules as { lorebook_database?: Record<string, string> })?.lorebook_database
        || (SYSTEM_RULES as { lorebook_database?: Record<string, string> })?.lorebook_database
        || {};
       
      this.gameState.activeLoreKeys.forEach((k: string) => {
        if (book[k]) {
          staticSnippets.push(`[${k}]: ${book[k]}`);
        } else if (this.gameState.knowledgeGraph?.[k]?.length) {
          staticSnippets.push(`[${k}]: ${this.gameState.knowledgeGraph[k]!.join(' | ')}`);
        }
      });
    }

    // Prioritize NPCs relevant to the current scene:
    // 1. Entities mentioned in player choice or local to the scene (activeEntities)
    // 2. NPCs located at the current location (currentLocation)
    // 3. Other world NPCs to maintain continuity
    const activeLowerSet = new Set(activeEntities.map(e => e.toLowerCase()));

    const priorityNpcs: [string, any][] = [];
    const localNpcs: [string, any][] = [];
    const remainingNpcs: [string, any][] = [];

    for (const [key, npc] of allNpcEntries) {
      const nameLower = (npc.nama || key).toLowerCase();
      const npcLoc = (npc.lokasi || npc.location || '').toLowerCase();
      
      if (activeLowerSet.has(nameLower) || activeLowerSet.has(key.toLowerCase())) {
        priorityNpcs.push([key, npc]);
      } else if (locLower && (npcLoc.includes(locLower) || locLower.includes(npcLoc))) {
        localNpcs.push([key, npc]);
      } else {
        remainingNpcs.push([key, npc]);
      }
    }

    // Shuffle remaining world NPCs for variety
    for (let i = remainingNpcs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingNpcs[i], remainingNpcs[j]] = [remainingNpcs[j]!, remainingNpcs[i]!];
    }

    const mergedSelected = [...priorityNpcs, ...localNpcs, ...remainingNpcs].slice(0, 4);
    const rollingNpcs = Object.fromEntries(mergedSelected);
    this.gameState.rollingNpcKeys = Object.keys(rollingNpcs);

    const charHistory = this._buildCharacterHistory(activeEntities);
    const globalHistory = this._buildGlobalHistory(currentLocation);
    const scopedKnowledgeGraph = buildScopedKnowledgeGraphForPrompt(
      this.gameState.knowledgeGraph || {},
      this.gameState.knowledgeWeights || {},
      {
        mcName: this.gameState.mcState.name,
        worldSetting: this.gameState.activeStory()?.worldSetting,
        currentLocation,
        activeEntities,
        localNpcNames: mergedSelected.map(([k, n]) => n?.nama || k),
        activeLoreKeys: this.gameState.activeLoreKeys
      }
    );

    return `
      System Rules:
      ${JSON.stringify(scopedRules, null, 2)}
      
      Current Game State:
      Time: ${this.gameState.mcState.time ?? ''} (Day ${String(this.gameState.mcState.day ?? 0)})
      Location: ${this.gameState.mcState.locationName ?? ''} (${this.gameState.mcState.location ?? ''})
      Inventory: ${JSON.stringify(this.gameState.mcState.inventory)}
      Status: ${this.gameState.mcState.status ?? ''}
      Stats: ${JSON.stringify(this.gameState.mcState.stats)}
      
      KNOWLEDGE GRAPH (Fakta Persisten / Long-Term Memory):
      ${JSON.stringify(scopedKnowledgeGraph, null, 2)}
      
      STORY SUMMARY (Ringkasan Narasi Keseluruhan):
      ${this.gameState.storySummary}

      ACTIVE QUESTS:
      ${JSON.stringify(this.gameState.quests, null, 2)}
      
      COMBAT STATE:
      ${JSON.stringify(this.gameState.combat, null, 2)}

      WORLD STATE (NPC DI LUAR LOKASI PEMAIN):
      Berikut adalah sebagian aktivitas NPC di latar belakang saat ini.
      Catatan & Aturan Kritis:
      - Waktu saat ini: ${this.gameState.mcState.time ?? '08:45'}.
      - Jadwal harian NPC di SYSTEM_RULES.modules.npc_daily_schedules_v2 adalah referensi panduan untuk Anda (LLM), bukan aturan otomatis kaku dari sistem. Anda (LLM) yang menentukan dan memperbarui aktivitas, lokasi, mood, dan status NPC pada 'npc_state' untuk ditampilkan ke UI sesuai alur cerita dan waktu saat ini. Namun, jangan jadikan mereka sebagai pilihan (choices) jika player belum berada di lokasi mereka.
      - REALISME WAKTU: Pada jam pagi hingga sore (07:30 - 18:00), seluruh NPC warga dan tokoh aktif beraktivitas (bekerja, berdagang, berpatroli, rapat, berjalan-jalan). DILARANG membuat NPC masih tidur pada jam 09:30 pagi (setengah 10) atau siang hari kecuali sedang sakit parah/pingsan!
      - DINAMISME UI: 'npc_state' HANYA diisi jika ada NPC yang benar-benar berada di tempat/adegan pemain saat ini. Jika tidak ada NPC di adegan pemain, kembalikan array kosong [] agar UI tidak menampilkan data usang.
      ${JSON.stringify(rollingNpcs, null, 2)}
      
      ${this.gameState.topologicalAnomalies.length > 0 ? `[CRITICAL SYSTEM FEEDBACK DARI GILIRAN SEBELUMNYA]:\n${this.gameState.topologicalAnomalies.join('\n')}\nTolong perbaiki relasi mereka jika perlu (atau perjelas perpisahan mereka).` : ''}

      ${charHistory}
      ${globalHistory}

      ${dynamicContext}

      STATIC LOREBOOK (Active Keys):
      ${staticSnippets.length > 0 ? staticSnippets.join('\n') : 'Tidak ada Lore spesifik yang aktif.'}
      
      CURRENT FACTIONS STATE:
      ${JSON.stringify(this.gameState.factions, null, 2)}
      
      CURRENT STORY & WORLD SETTING:
      - Judul Kisah: ${this.gameState.activeStory()?.title || 'Kisah Petualangan'}
      - Latar Dunia: ${this.gameState.activeStory()?.worldSetting || 'Dunia Petualangan'}
      - Ringkasan Latar: ${this.gameState.activeStory()?.summary || this.gameState.storySummary}

      CURRENT PLAYER STATE (KONDISI & STATISTIK SAAT INI):
      - Nama: ${this.gameState.mcState.name || 'Protagonis'} (${this.gameState.mcState.title || 'Pengembara'}, Level ${this.gameState.mcState.level || 1})
      - EXP: ${this.gameState.mcState.exp ?? 0} / ${this.gameState.mcState.maxExp ?? 100}
      - HP (Darah): ${this.gameState.mcState.stats?.['hp'] ?? 100} / ${this.gameState.mcState.stats?.['maxHp'] ?? 100}
      - SP (Tenaga/Stamina): ${this.gameState.mcState.stats?.['sp'] ?? 50} / ${this.gameState.mcState.stats?.['maxSp'] ?? 50}
      - Kondisi Tubuh: ${this.gameState.mcState.status || 'Healthy'}
      - Status Tempur: ${this.gameState.combat.inCombat ? 'SEDANG BERTARUNG' : 'Aman/Eksplorasi'}
      - Lokasi: ${this.gameState.mcState.locationName || this.gameState.mcState.location || 'Wilayah Petualangan'} (Hari ${this.gameState.mcState.day || 1}, Jam ${this.gameState.mcState.time || '08:00'})
      - Senjata Utama: ${this.gameState.mcState.equipped?.weapon || 'Senjata'}
      - Isi Tas (Inventory): ${JSON.stringify(this.gameState.mcState.inventory || [])}
      - Relasi/Trust: ${JSON.stringify(this.gameState.mcState.trust || {})}

      Recent Chronicle:
      ${JSON.stringify(this.gameState.chronicle.slice(-3), null, 2)}
      
      Player Choice: "${playerChoice}"

      PEDOMAN KONSEKUENSI STATUS & PERKEMBANGAN MC:
      1. HP & KESEHATAN: Peristiwa cerita HARUS mengubah 'mc_state' secara nyata!
         - Jika terkena serangan, jatuh, terkena sabetan senjata, atau racun: kurangi 'stats.hp' secara logis (-5 s/d -30) dan ubah 'status' (cth: 'Terluka Ringan', 'Luka Sayat', 'Luka Berat').
         - Jika beristirahat, tidur di penginapan, makan, atau diobati: pulihkan 'stats.hp' ke arah maxHp dan set 'status' menjadi 'Bugar' atau 'Sangat Bugar'.
      2. SP & STAMINA:
         - Jika berlari kencang, adu fisik intens, mengangkat beban berat, atau adu tenaga dalam: kurangi 'stats.sp' (-5 s/d -20). Jika SP rendah ubah 'status' menjadi 'Kelelahan'.
         - Jika bernapas santai atau minum air: pulihkan 'stats.sp'.
      3. EXP & PERKEMBANGAN:
         - Selalu cantumkan 'expGained' (angka 10 s/d 40) pada 'mc_state' untuk setiap aksi signifikan, dialog bermakna, pertarungan, atau penemuan penting.
      4. BARANG & INVENTARIS:
         - Jika menerima uang perak/hadiah/barang: tambahkan ke array 'inventory'. Jika kehilangan/membayar/mengonsumsi: perbarui array 'inventory'.
      5. RELASI NPC (TRUST):
         - Naikkan nilai trust (+5 s/d +15) jika membantu atau menyenangkan NPC. Turunkan (-5 s/d -20) jika menyinggung/bermusuhan. Masukkan NPC baru yang diajak bicara ke daftar trust dengan nilai awal 35-50.

      Jalankan 6 langkah:
      1. CHRONOS
      2. CONTEXTUS
      3. ANIMA
      4. LOGICA
      5. SCRIPTOR
      6. ASSEMBLER
      
      Gunakan format laporan eksekutif ringkas untuk monolog.
      Lalu buat blok \`\`\`json berisi:
      {
        "new_full_chronicle_entry": {
          "narrative": "Ringkasan fallback narasi singkat",
          "narrative_blocks": [
            {
              "name": "nama karakter (mc atau npc)",
              "narration": "deskripsi narasi dari sudut pandang karakter",
              "dialogue": "dialog karakter jika ada",
              "action": "aksi fisik karakter"
            }
          ],
          "_note": "mc tidak harus berada di index pertama array narrative_blocks, tergantung kronologis adegan. buat block baru untuk setiap giliran/reaksi.",
          "mc_state": { 
            "action": "...", 
            "dialogue": "...", 
            "inventory": ["...", "..."], 
            "status": "Kondisi fisik terkini (cth: Bugar, Terluka Ringan, Kelelahan)",
            "expGained": 15,
            "stats": {
              "hp": 85,
              "maxHp": 100,
              "sp": 42,
              "maxSp": 50,
              "strength": 80,
              "charisma": 90,
              "stamina": 92,
              "agility": 68
            },
            "location": "...",
            "locationName": "...",
            "time": "...",
            "day": ${this.gameState.mcState.day || 1},
            "trust": {"Nama NPC": 60}
          },
          "npc_state": [
            {
              "_note": "HANYA masukkan NPC yang berada di LOKASI YANG SAMA dengan MC saat ini. Jika tidak ada NPC di adegan pemain, kembalikan array kosong: \"npc_state\": []",
              "nama": "...", "peran": "Peran/relasi singkat (cth: Kerabat Kediaman / Rekan / Pedagang)", "kepribadian": "...", "tujuan": "...", "faksi": "...", "lokasi": "Nama ruangan/bangunan kanonis (cth: Ruang Tamu Kediaman Takeshi)", "aktivitas": "...", "mood": "...", "status": "..."
            }
          ],
          "factions": [
            {"name": "...", "description": "...", "reputation": 10, "leader": "..."}
          ],
          "room_layout": "...",
          "environment": "...",
          "graph_updates": [
            { "action": "bind|unbind|reweight", "entity": "...", "fact": "...", "weight": 1.0 }
          ],
          "quest_updates": {
            "quest_id_1": { "title": "...", "description": "...", "status": "active|completed|failed", "objectives": ["..."] }
          },
          "combat_updates": {
            "inCombat": false,
            "enemies": [{"name": "...", "hp": "...", "status": "..."}],
            "advantage": "neutral|player|enemy"
          },
          "query_lore_keys": [ "KataKunciLore1", "KataKunciLore2" ],
          "update_story_summary": "...",
          "choices": [ 
            // MAX 3 PILIHAN SAJA. Jangan lebih.
            {
              "id": "C-1", 
              "text": "...", 
              "weight": 0.8, 
              "targetEntity": "...", 
              "targetFaction": "...",
              "requirements": {
                 "inventory": ["Nama Barang Prasyarat"],
                 "trust": {"Nama Faksi atau NPC": 20}
              }
            } 
          ]
        },
        "new_summary_for_index": "..."
      }
    `;
  }

  handleResponse(text: string): {
    parsedValidJson: boolean;
    usedFallbackNarrative: boolean;
    llmAccepted: boolean;
    userSatisfied: boolean;
    groundingScore: number;
  } {
    const jsonMatch = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i.exec(text);
    let monologue = text;
    let jsonOutput: { new_full_chronicle_entry?: ChronicleEntry } | null = null;

    if (jsonMatch) {
      monologue = text.replace(jsonMatch[0], '').trim();
      try {
        jsonOutput = JSON.parse(jsonMatch[1]!);
      } catch (error) {
        console.error('Failed to parse JSON', error);
      }
    } else {
      // Fallback: try to find anything that looks like a JSON object
      const fallbackMatch = /(\{[\s\S]*\})/.exec(text);
      if (fallbackMatch) {
        try {
          jsonOutput = JSON.parse(fallbackMatch[1]!);
          monologue = text.replace(fallbackMatch[0], '').trim();
        } catch (error) {
          console.error('Failed to parse fallback JSON', error);
        }
      }
    }

    this.gameState.addLog('Engine Monologue:\n' + monologue);

    const parsedValidJson = Boolean(jsonOutput?.new_full_chronicle_entry);
    const isServerFallbackMonologue = monologue.includes('[CHRONOS: Normal Flow] [CONTEXTUS: Baseline Simulation]');
    let usedFallbackNarrative = !parsedValidJson || isServerFallbackMonologue;
    let validChoiceRatio = 1.0;

    if (!jsonOutput?.new_full_chronicle_entry) {
      usedFallbackNarrative = true;
      const loc = this.gameState.mcState.locationName || this.gameState.mcState.location || 'Wilayah Petualangan';
      const name = this.gameState.mcState.name || 'Protagonis';
      jsonOutput = {
        new_full_chronicle_entry: {
          narrative: `${name} mencermati situasi sekelilingnya dengan waspada. Suasana di ${loc} terasa hening dan penuh misteri.`,
          narrative_blocks: [
            {
              name,
              narration: `${name} memperhatikan setiap sudut dan memastikan perlengkapannya tetap aman di posisinya.`,
              dialogue: '...',
              action: 'Mengamati keadaan sekitar'
            }
          ],
          choices: [
            {
              id: 'C-1',
              text: `Menyelidiki jalan setapak menuju pusat ${loc}`,
              weight: 0.85
            },
            {
              id: 'C-2',
              text: 'Mendekati kedai terdekat untuk mencari petunjuk baru',
              weight: 0.75
            },
            {
              id: 'C-3',
              text: 'Beristirahat sejenak sambil memeriksa perlengkapan',
              weight: 0.65
            }
          ]
        }
      };
    }

    let groundingScore = 0;

    if (jsonOutput?.new_full_chronicle_entry) {
      const entry = jsonOutput.new_full_chronicle_entry;

      if (Array.isArray(entry.choices) && entry.choices.length > 0) {
        const totalRawChoices = entry.choices.length;
        const scored = this.loreEngine.scoreChoices(entry.choices);
        const validScored = scored.filter(s => s.isValid);
        validChoiceRatio = totalRawChoices > 0 ? validScored.length / totalRawChoices : 0;

        // Log rejected choices for diagnostic transparency
        for (const rejected of scored.filter(s => !s.isValid)) {
          this.gameState.addLog(`[Sistem Filtrasi] Membuang opsi tidak valid: "${rejected.text}". Alasan: ${rejected.failureReasons?.join(', ')}`);
        }

        if (validScored.length > 0) {
          entry.choices = validScored
            .slice(0, 3)
            .map(s => ({ id: s.id, text: s.text, weight: s.weight }));
        } else {
          const fallbackLoc =
            entry.mc_state?.locationName ||
            this.gameState.mcState.locationName ||
            this.gameState.mcState.location ||
            'sekitar lokasi ini';
          entry.choices = [
            {
              id: 'C-FB-1',
              text: `Mengamati situasi di ${fallbackLoc} untuk mencari celah atau petunjuk baru`,
              weight: 0.8
            },
            {
              id: 'C-FB-2',
              text: 'Berbicara dengan warga atau tokoh terdekat guna mengumpulkan informasi',
              weight: 0.72
            },
            {
              id: 'C-FB-3',
              text: 'Memeriksa perlengkapan dan menyiapkan langkah alternatif',
              weight: 0.65
            }
          ];
        }
      } else {
        validChoiceRatio = 0;
        const fallbackLoc =
          entry.mc_state?.locationName ||
          this.gameState.mcState.locationName ||
          this.gameState.mcState.location ||
          'sekitar lokasi ini';
        entry.choices = [
          {
            id: 'C-FB-1',
            text: `Menyelidiki keadaan di ${fallbackLoc} lebih lanjut`,
            weight: 0.8
          },
          {
            id: 'C-FB-2',
            text: 'Mencari informasi dari orang-orang di sekitar',
            weight: 0.72
          },
          {
            id: 'C-FB-3',
            text: 'Mengatur ulang strategi dan memeriksa perbekalan',
            weight: 0.65
          }
        ];
      }

      // Compute grounding & structural quality score in [0, 1]
      const hasNarrative = Boolean(
        (entry.narrative && entry.narrative.trim().length > 20) ||
        (Array.isArray(entry.narrative_blocks) && entry.narrative_blocks.length > 0)
      );
      if (hasNarrative) groundingScore += 0.35;
      groundingScore += 0.25 * validChoiceRatio;
      if (entry.mc_state && Object.keys(entry.mc_state).length > 0) groundingScore += 0.15;

      // Check lexical/entity grounding against retrieved chunks or scene state
      const retrievedItems = this.loreEngine.lastRetrieval?.() || [];
      const combinedOutputText = [
        entry.narrative || '',
        ...(entry.narrative_blocks || []).map(b => `${b.name || ''} ${b.narration || ''} ${b.dialogue || ''} ${b.action || ''}`)
      ].join(' ').toLowerCase();

      if (retrievedItems.length > 0) {
        let matchedChunks = 0;
        for (const item of retrievedItems) {
          const contentTokens = String(item?.entry?.content || '')
            .toLowerCase()
            .match(/\b[a-z0-9_]{4,}\b/g) || [];
          const hasOverlap = contentTokens.some(tok => combinedOutputText.includes(tok));
          if (hasOverlap) matchedChunks++;
        }
        groundingScore += 0.25 * Math.min(1, matchedChunks / Math.max(1, Math.min(3, retrievedItems.length)));
      } else {
        groundingScore += 0.20;
      }

      const prevTime = this.gameState.mcState.time || '08:00';
      const activeSceneNpcNames =
        entry.npc_state && Array.isArray(entry.npc_state)
          ? entry.npc_state
            .map(n => n?.nama)
            .filter((nama): nama is string => typeof nama === 'string' && nama.trim().length > 0)
          : [];

      if (entry.mc_state) {
        this.gameState.updateMcState(entry.mc_state, entry.narrative);
        entry.mc_state.time = this.gameState.mcState.time ?? entry.mc_state.time;
        entry.mc_state.day = this.gameState.mcState.day ?? entry.mc_state.day;
        // Sync time updates with world simulation rules while protecting active in-scene NPCs
        this.chronosEngine.advanceTime(0, {
          previousTime: prevTime,
          activeSceneNpcNames,
          skipTopologicalSync: true
        });
      }
      if (entry.npc_state && Array.isArray(entry.npc_state) && entry.npc_state.length > 0) {
        this.gameState.updateNpcStates(entry.npc_state);
        const normalize = (s: string) => s.replaceAll('_', ' ').toLowerCase().trim();
        const resolvedList = Object.values(this.gameState.npcStates || {});
        entry.npc_state = entry.npc_state.map(rawNpc => {
          if (!rawNpc?.nama) return rawNpc;
          const target = normalize(rawNpc.nama);
          const resolved = resolvedList.find(r => r?.nama && normalize(r.nama) === target);
          return resolved ? { ...rawNpc, ...resolved } : rawNpc;
        });
      } else {
        this.gameState.rollingNpcKeys = [];
        this.gameState.enforceTopologicalSync();
      }

      this.gameState.addChronicleEntry(entry);
      
      if (entry.factions && Array.isArray(entry.factions)) {
        this.gameState.updateFactions(entry.factions);
      }
      
      if (entry.graph_updates && Array.isArray(entry.graph_updates)) {
        this.gameState.updateKnowledgeGraph(entry.graph_updates);
        this.loreEngine.syncKnowledgeGraph();
      }
      
      if (entry.quest_updates) {
        this.gameState.updateQuests(entry.quest_updates);
      }
      
      if (entry.combat_updates !== undefined) {
        this.gameState.updateCombat(entry.combat_updates);
      }
      
      if (entry.query_lore_keys && Array.isArray(entry.query_lore_keys)) {
        this.gameState.updateActiveLoreKeys(entry.query_lore_keys);
      } else {
        this.gameState.updateActiveLoreKeys([]);
      }

      if (entry.update_story_summary && typeof entry.update_story_summary === 'string') {
        this.gameState.updateStorySummary(entry.update_story_summary);
      }
    }

    const llmAccepted = parsedValidJson && !usedFallbackNarrative && validChoiceRatio > 0;
    const userSatisfied = llmAccepted && groundingScore >= 0.55;

    return {
      parsedValidJson,
      usedFallbackNarrative,
      llmAccepted,
      userSatisfied,
      groundingScore
    };
  }

  private _buildCharacterHistory(entities: string[]): string {
    if (entities.length === 0) return '';
    const MAX_LOOKBACK = 20;
    const startIdx = Math.max(0, this.gameState.chronicle.length - MAX_LOOKBACK);
    let output = '';

    const recentEvents = this.gameState.chronicle.slice(startIdx);
    
    entities.forEach(ent => {
      const charEvents: Set<string> = new Set();
      const entLower = ent.toLowerCase();
      recentEvents.forEach((entry, idx) => {
        const blocks = entry.narrative_blocks || [];
        blocks.forEach(b => {
          if ((b.name && b.name.toLowerCase().includes(entLower)) || 
              (b.narration && b.narration.toLowerCase().includes(entLower)) ||
              (b.dialogue && b.dialogue.toLowerCase().includes(entLower)) ||
              (b.action && b.action.toLowerCase().includes(entLower))) {
            let blk = `[T-${recentEvents.length - idx}] ${b.name ? `[${b.name}]` : ''} `;
            if (b.narration) blk += `${b.narration} `;
            if (b.action) blk += `*(Action)* ${b.action} `;
            if (b.dialogue) blk += `*(Dialogue)* "${b.dialogue}"`;
            charEvents.add(blk.trim());
          }
        });
        
        if (entry.narrative && entry.narrative.toLowerCase().includes(entLower)) {
           charEvents.add(`[T-${recentEvents.length - idx}] ${entry.narrative}`);
        }
      });
      if (charEvents.size > 0) {
        output += `\nTimeline of ${ent} (Recent):\n` + Array.from(charEvents).join('\n') + `\n`;
      }
    });

    return output.trim();
  }

  private _buildGlobalHistory(locationName: string): string {
    if (!locationName) return '';
    const MAX_LOOKBACK = 15;
    const startIdx = Math.max(0, this.gameState.chronicle.length - MAX_LOOKBACK);
    let output = '';

    const recentEvents = this.gameState.chronicle.slice(startIdx);
    const locEvents: Set<string> = new Set();
    const locLower = locationName.toLowerCase();

    recentEvents.forEach((entry, idx) => {
      let isHere = false;
      if (entry.mc_state && (entry.mc_state.locationName?.toLowerCase().includes(locLower) || entry.mc_state.location?.toLowerCase().includes(locLower))) {
        isHere = true;
      } else if (entry.narrative && entry.narrative.toLowerCase().includes(locLower)) {
        isHere = true;
      }

      if (isHere && entry.narrative) {
          locEvents.add(`[T-${recentEvents.length - idx}] ${entry.narrative}`);
      }
    });

    if (locEvents.size > 0) {
      output = `\nRecent Global History at ${locationName}:\n` + Array.from(locEvents).join('\n');
    }
    
    return output;
  }

  private _extractEntities(playerChoice: string): string[] {
    const set = new Set<string>();
    const choiceLower = playerChoice.toLowerCase();
    
     
    if (this.gameState.npcStates) {
      Object.entries(this.gameState.npcStates).forEach(([key, npc]) => {
        const displayName = npc.nama || key;
        if (
          npc.lokasi === this.gameState.mcState.locationName ||
          npc.lokasi === this.gameState.mcState.location ||
          choiceLower.includes(key.toLowerCase()) ||
          choiceLower.includes(displayName.toLowerCase())
        ) {
          set.add(displayName);
        }
      });
    }
    
     
    if (this.gameState.knowledgeGraph) {
      for (const e of Object.keys(this.gameState.knowledgeGraph)) {
        if (choiceLower.includes(e.toLowerCase())) set.add(e);
      }
    }
    
     
    if (this.gameState.factions) {
       
      Object.entries(this.gameState.factions).forEach(([fname, f]: [string, { leader?: string }]) => {
         
        if (choiceLower.includes(fname.toLowerCase()) || (f.leader && choiceLower.includes(f.leader.toLowerCase()))) {
           
          if (f.leader) set.add(f.leader);
          set.add(fname);
        }
      });
    }
    return [...set];
  }
}
