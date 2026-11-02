import type { FactionState, McState, NpcState, StoryMetadata } from './game-state.types';

export interface ScopedRulesContext {
  storyMeta?: StoryMetadata | null | undefined;
  mcState?: Partial<McState> | undefined;
  npcStates?: Record<string, NpcState> | undefined;
  factions?: Record<string, FactionState> | undefined;
  knowledgeGraph?: Record<string, string[]> | undefined;
  activeLoreKeys?: string[] | undefined;
}

export const PRESET_LOREBOOK_DATABASE: Record<string, string> = {
  "Auralis": "Kerajaan besar yang terdiri dari pusat pemerintahan dan kota luar yang rawan penyelundupan.",
  "Yamato": "Desa satelit dengan perpaduan budaya timur. Sering menjadi tempat transit pelancong atau buronan.",
  "Pedang Legendaris": "Senjata pusaka yang dapat menyerap energi aura dan mengikat memori kombat menjadi vektor aura yang persisten.",
  "Whispering Woods": "Hutan ilusi di perbatasan. Sering mengubah arah petualang yang tidak memiliki artefak penunjuk arah.",
  "Pegunungan Naga": "Tempat dingin dan ekstrem tempat Naga Kuno sedang tertidur pulas.",
  "Lembah Kabut Kage": "Wilayah lembah sunyi yang diselimuti kabut tebal abadi, menjadi markas persembunyian para shinobi bayangan dan tempat pelatihan rahasia Klan Kage.",
  "Puncak Jurang Gagak": "Tebing terjal di tepi jurang berkabut tempat kawanan gagak hitam berkumpul, sering dijadikan pos pengintaian strategis untuk memantau pergerakan pasukan benteng musuh.",
  "Belati Kembar Chidori": "Sepasang belati pendek yang ditempa dengan kristal petir kuno, mampu mengalirkan getaran frekuensi tinggi yang merobek armor dan memotong bayangan.",
  "Klan Kage": "Klan shinobi legendaris yang bersumpah menjaga keseimbangan antara cahaya dan bayangan di balik tabir intrik kekuasaan.",
  "Ordo Arkana Kristal": "Institusi cendekiawan dan penyihir elit yang meneliti resonansi kristal energi dan rahasia sihir kuno.",
  "Perpustakaan Kuno Ibukota": "Kubah arsip raksasa berusia ratusan tahun yang menyimpan gulungan naskah sihir terlarang, catatan kosmologi, dan fragmen memori peradaban masa lalu.",
  "Tongkat Kristal Biru": "Pusaka pemusat mana yang memancarkan pendar safir, mampu menstabilkan matriks mantra dan mendeteksi anomali topologi energi di sekitar pemakainya.",
  "Kota Cyber Neon-Aura": "Metropolis futuristik bertingkat di mana teknologi implan cybernetik berpadu dengan energi aura mistis di bawah gemerlap lampu neon abadi.",
  "Lorong Sektor 7": "Jaringan gang gelap di lantai bawah kota cyber, pusat peredaran data ilegal, bengkel modifikasi siber gelap, dan pangkalan para kurir jalanan bebas.",
  "Pedang Plasma Termal": "Senjata jarak dekat mutakhir dengan bilah plasma super panas, dirancang untuk membelah perisai elektromagnetik dan armor sintetis komposit.",
  "Korporasi Neuro-Tech": "Megakorporasi otoriter yang menguasai jaringan grid data dan aparat keamanan drone di seluruh sektor metropolis neon."
};

export const SYSTEM_RULES = {
  "meta": {
    "title": "Guardian_Engine_Universal_Multi_Story_Core",
    "description": "Mesin simulasi naratif multi-cerita dan multi-karakter universal. Aplikasi utama bersifat netral dan mengadaptasi dunia, faksi, karakter, serta aturan cerita secara dinamis berdasarkan sesi cerita yang sedang aktif.",
    "version": "7.0-universal-multi-story",
    "world_tone": "Adaptif mengikuti latar dunia cerita aktif, kasual di area aman, menantang di area berbahaya."
  },
  "system_core": {
    "guardian_engine": {
      "functions": {
        "chronological_validator": "Memastikan urutan waktu antar scene akurat.",
        "npc_validator": "Memastikan korelasi aktivitas NPC logis dan realistis berdasarkan alur cerita aktif.",
        "inventory_integrity": "Memeriksa konsistensi data barang tiap karakter sesuai konteks dunia."
      },
      "constitution": {
        "steps": [
          "LANGKAH 1: CHRONOS - Waktu, Latar Belakang NPC, Rotasi Fokus.",
          "LANGKAH 2: CONTEXTUS - State game, Fakta awal, summary index.",
          "LANGKAH 3: ANIMA - Psikologi, Reaksi, Draf dialog.",
          "LANGKAH 4: LOGICA - Aturan, Ekonomi, Aksi, World Tick.",
          "LANGKAH 5: SCRIPTOR - Prosa naratif imersif, tanpa klise.",
          "LANGKAH 6: ASSEMBLER - Validasi Inventaris, Susun JSON akhir."
        ],
        "training_modules": {
          "1": "Array-Objek untuk karakter dalam adegan aktif",
          "2": "Tiga Pilar: System, Chronicle, Index",
          "3": "Tidak ada kebocoran pengetahuan lintas cerita atau lintas karakter (tactical cognitive isolation)",
          "4": "Gaya naratif konsisten dengan genre dunia aktif, larangan frasa klise",
          "5": "Temperatur terukur (konsistensi kontinuitas)",
          "6": "Validasi inventaris dan atribut karakter ketat",
          "7": "NPC harus bereaksi secara proaktif dan kontekstual sesuai kepribadian serta faksi mereka di cerita aktif"
        },
        "output_format": "HANYA MENGHASILKAN 2 objek internal_guardian_monologue teks dan JSON bersih yang berisi new_full_chronicle_entry dan new_summary_for_index."
      },
      "mode": "auto",
      "auto_tick_advance": 5,
      "validation_logs": []
    }
  },
  "narrative_mode_system": {
    "current_mode": "Adaptive",
    "triggers_for_adventure_mode": [
      "Pemain memasuki zona berbahaya, konflik terbuka, atau wilayah eksplorasi berisiko",
      "Event acak atau konfrontasi faksi memicu ancaman"
    ],
    "triggers_for_casual_mode": [
      "Pemain berada di area aman, pemukiman, markas, atau tempat istirahat"
    ]
  },
  "principles": {
    "narrative_pacing_guidelines": {
      "core_principle": "Setiap adegan harus memiliki satu tujuan naratif yang jelas (One Central Idea) yang berpusat pada protagonis dan dunia cerita aktif.",
      "rules": [
        "Prioritaskan Aksi dan Dialog di atas deskripsi atmosferik murni.",
        "Saat mendeskripsikan lokasi atau karakter baru, batasi pada 1-2 detail sensorik yang paling berdampak.",
        "Hindari menjelaskan motivasi atau emosi yang sudah tersirat dari aksi atau dialog.",
        "Gunakan monolog internal secara singkat.",
        "JANGAN PERNAH mencampuradukkan karakter, lokasi, atau senjata dari cerita lain ke dalam cerita yang sedang aktif."
      ]
    },
    "narrative_style_settings": {
      "default_style": "Immersive",
      "forbidden_phrases_and_tropes": {
        "phrases": [
          "merinding",
          "napas tertahan",
          "jantung berdebar kencang",
          "darah berdesir",
          "kupu-kupu di perut",
          "lututnya terasa lemas",
          "ambruk total",
          "lemas tak berdaya"
        ]
      }
    },
    "knowledge_integrity_rules": [
      "DILARANG KERAS: Tanpa 'Narasi Penutup'. Jangan menciptakan peristiwa kecil yang kebetulan.",
      "Fokus pada 'Gerakan Besar' (aksi yang disengaja oleh karakter aktif)."
    ]
  },
  "character_principles": {
    "rules": [
      "Setiap karakter utama dan NPC harus bertindak sesuai identitas, gelar, latar dunia, dan tujuan mereka di cerita aktif.",
      "Hormati atribut 'peran', 'kepribadian', 'tujuan', dan 'gaya_bicara' dari setiap NPC yang terdaftar di active_story_context.known_npcs saat menulis dialog maupun tindakan mereka."
    ]
  },
  "modules": {
    "sistem_identifikasi_pilihan": {
      "aturan_format": {
        "struktur": "C-[Nomor Urut Pilihan]"
      }
    }
  },
  "lorebook_database": PRESET_LOREBOOK_DATABASE
};

/**
 * Builds a story-scoped system rules object dynamically from the active story session,
 * ensuring zero cross-story or character bias.
 */
export function buildScopedSystemRules(ctx: ScopedRulesContext) {
  const mcName = ctx.mcState?.name || ctx.storyMeta?.mcName || 'Protagonis';
  const mcTitle = ctx.mcState?.title || ctx.storyMeta?.mcTitle || 'Pengembara';
  const worldSetting = ctx.storyMeta?.worldSetting || 'Dunia Petualangan';
  const locationName = ctx.mcState?.locationName || ctx.storyMeta?.locationName || 'Wilayah Awal';
  const storyTitle = ctx.storyMeta?.title || `Kisah ${mcName}`;

  const activeNpcs = Object.values(ctx.npcStates || {}).map(npc => ({
    nama: npc.nama,
    peran: npc.peran || npc.role || 'Warga & Kenalan Lokal',
    kepribadian: npc.kepribadian || npc.personality || 'Natural dan responsif',
    tujuan: npc.tujuan || npc.goal || `Beraktivitas di ${npc.lokasi || locationName}`,
    gaya_bicara: npc.gaya_bicara || npc.voiceStyle || 'Natural dan kontekstual',
    arketipe_jadwal: npc.scheduleArchetype || 'resident',
    lokasi: npc.lokasi || npc.location || locationName,
    aktivitas: npc.aktivitas || npc.activity || 'Beraktivitas',
    mood: npc.mood || 'Netral',
    faksi: npc.faksi || npc.faction || 'Independen',
    status: npc.status || 'Healthy'
  }));

  const activeFactions = Object.values(ctx.factions || {}).map(f => ({
    name: f.name,
    description: f.description,
    reputation: f.reputation,
    leader: f.leader || 'Tidak diketahui'
  }));

  const scopedLorebook: Record<string, string> = {};
  if (ctx.knowledgeGraph) {
    for (const [entity, facts] of Object.entries(ctx.knowledgeGraph)) {
      if (Array.isArray(facts) && facts.length > 0) {
        scopedLorebook[entity] = facts.join(' | ');
      }
    }
  }

  return {
    meta: {
      ...SYSTEM_RULES.meta,
      active_story_title: storyTitle,
      active_world_setting: worldSetting
    },
    system_core: {
      ...SYSTEM_RULES.system_core,
      world_clock: {
        current_day: ctx.mcState?.day ?? 1,
        current_time: ctx.mcState?.time ?? '08:00',
        active_location: locationName
      }
    },
    narrative_mode_system: SYSTEM_RULES.narrative_mode_system,
    principles: SYSTEM_RULES.principles,
    character_principles: SYSTEM_RULES.character_principles,
    active_story_context: {
      protagonist: {
        name: mcName,
        role: mcTitle,
        personality: ctx.mcState?.personality || ctx.storyMeta?.mcPersonality || `Bertindak sesuai peran sebagai ${mcTitle}`,
        background: ctx.mcState?.background || ctx.storyMeta?.mcBackground || `Berada di ${locationName} (${worldSetting})`,
        goal: ctx.mcState?.goal || ctx.storyMeta?.mcGoal || `Menentukan langkah perjalanan di ${worldSetting}`,
        level: ctx.mcState?.level ?? 1,
        equipped: ctx.mcState?.equipped ?? {},
        stats: ctx.mcState?.stats ?? {}
      },
      world_setting: worldSetting,
      current_location: locationName,
      registered_factions: activeFactions,
      known_npcs: activeNpcs
    },
    modules: SYSTEM_RULES.modules,
    lorebook_database: scopedLorebook
  };
}
