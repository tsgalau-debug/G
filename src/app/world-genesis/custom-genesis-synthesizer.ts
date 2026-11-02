import type { FactionState, NpcScheduleArchetype, NpcState, QuestState } from '../game-state.types';
import { capitalizeWords, type WorldGenesisOutput } from './world-archetype-presets';
import {
  enrichNpcProfileDefaults,
  extractBuildingAnchor,
  extractCanonicalRoomOrBuilding,
  inferNpcRoleArchetype
} from './npc-schedule-synthesizer';

export type CustomWorldDomain =
  | 'domestic_slice_of_life'
  | 'mystery_investigation'
  | 'scifi_cyber_modern'
  | 'court_politics_dynasty'
  | 'martial_fantasy_adventure';

export interface ExtractedPrologueNpc {
  key: string;
  nama: string;
  peran: string;
  kepribadian: string;
  tujuan: string;
  gaya_bicara: string;
  scheduleArchetype: NpcScheduleArchetype;
  lokasi: string;
  aktivitas: string;
  mood: string;
  faksi: string;
  trust: number;
  fact: string;
}

const STOPWORD_PROPER_NOUNS = new Set([
  'aku', 'saya', 'dia', 'ia', 'mereka', 'kami', 'kita', 'anda', 'kamu', 'engkau',
  'di', 'ke', 'dari', 'pada', 'dalam', 'luar', 'atas', 'bawah', 'depan', 'belakang',
  'sudut', 'pojok', 'lantai', 'tatami', 'ruang', 'ruangan', 'tamu', 'tengah', 'utama',
  'kamar', 'dapur', 'teras', 'halaman', 'taman', 'koridor', 'lorong', 'jalan', 'jalur',
  'kediaman', 'rumah', 'vila', 'pondok', 'paviliun', 'istana', 'kastil', 'benteng',
  'desa', 'kota', 'kerajaan', 'kekaisaran', 'dunia', 'wilayah', 'distrik', 'sektor',
  'stasiun', 'dermaga', 'pelabuhan', 'gerbang', 'pasar', 'kedai', 'penginapan',
  'perpustakaan', 'kuil', 'menara', 'akademi', 'sekolah', 'kampus', 'kantor',
  'hari', 'pagi', 'siang', 'sore', 'senja', 'malam', 'fajar', 'waktu', 'jam',
  'angin', 'hujan', 'kabut', 'awan', 'langit', 'matahari', 'bulan', 'bintang', 'cahaya', 'bayangan',
  'pedang', 'katana', 'belati', 'tombak', 'busur', 'panah', 'tongkat', 'perisai', 'pistol',
  'senjata', 'perlengkapan', 'pakaian', 'jubah', 'tas', 'ransum', 'makanan', 'minuman', 'teh', 'kopi',
  'saat', 'ketika', 'sementara', 'sambil', 'setelah', 'sebelum', 'namun', 'tetapi', 'karena',
  'untuk', 'dengan', 'bersama', 'tanpa', 'sebagai', 'seorang', 'sang', 'para', 'ini', 'itu',
  'tiba', 'mulai', 'memulai', 'berdiri', 'duduk', 'melangkah', 'menatap', 'mengamati', 'berjalan',
  'protagonis', 'pengembara', 'petualang', 'pendekar', 'ksatria', 'shinobi', 'penyihir', 'kapten'
]);

/**
 * Mengklasifikasikan domain/genre cerita custom dari input judul, latar dunia, lokasi, peran MC, dan prolog.
 */
export function inferCustomWorldDomain(
  title: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  weapon: string,
  prompt: string
): CustomWorldDomain {
  const signalText = `${title} ${mcTitle} ${worldSetting} ${locationName} ${weapon} ${prompt}`.toLowerCase();

  if (
    /\b(stasiun\s+orbital|galaksi|kosmik|kuantum|foton|luar\s+angkasa|planet|koloni|pesawat|android|cyborg|mecha|reaktor|orbit|antariksa)\b/i.test(
      signalText
    )
  ) {
    return 'scifi_cyber_modern';
  }

  if (
    /\b(detektif|investigasi|kasus|polisi|komisaris|inspektur|forensik|saksi|tersangka|kejahatan|pembunuhan|misteri\s+kota|kantor\s+berita|jurnalis)\b/i.test(
      signalText
    )
  ) {
    return 'mystery_investigation';
  }

  if (
    /\b(istana|kerajaan|kekaisaran|tahta|mahkota|adipati|bangsawan|permaisuri|pangeran|putri|senat|dinasti|upeti|diplomasi\s+istana)\b/i.test(
      signalText
    ) &&
    !/\b(desa|hutan|pengembara)\b/i.test(locationName.toLowerCase())
  ) {
    return 'court_politics_dynasty';
  }

  const hasCombatOrFrontierCue =
    /\b(pertarungan|tempur|monster|dungeon|iblis|naga|siluman|perang|invasi|benteng|pasukan|prajurit|pembunuh|bandit|sindikat|klan|pendekar|ksatria)\b/i.test(
      signalText
    );

  const hasDomesticOrSliceOfLifeCue =
    /\b(kediaman|rumah|ruang\s+tamu|kamar|dapur|halaman|taman|sekolah|akademi|kampus|kelas|kafe|toko\s+roti|toko\s+buku|apartemen|asrama|tetangga|keluarga|adik|kakak|istri|suami|kekasih|sahabat|teman\s+masa\s+kecil|menyeduh\s+teh|sarapan|makan\s+malam|bersantai|damai|keseharian)\b/i.test(
      signalText
    );

  if (hasDomesticOrSliceOfLifeCue && !hasCombatOrFrontierCue) {
    return 'domestic_slice_of_life';
  }

  return 'martial_fantasy_adventure';
}

/**
 * Mengekstrak tokoh/NPC custom yang disebutkan secara eksplisit oleh pengguna di dalam prolog atau judul cerita.
 */
export function extractPrologueCustomNpcs(
  mcName: string,
  locationName: string,
  worldSetting: string,
  weapon: string,
  prologuePrompt: string,
  primaryFactionName: string
): ExtractedPrologueNpc[] {
  const prompt = (prologuePrompt || '').trim();
  if (!prompt) return [];

  const canonicalLoc = extractCanonicalRoomOrBuilding(locationName) || locationName || 'Lokasi Awal';
  const buildingAnchor = extractBuildingAnchor(canonicalLoc) || canonicalLoc;
  const excludedTokens = new Set<string>(STOPWORD_PROPER_NOUNS);

  const addExcludedPhrase = (phrase: string) => {
    for (const part of (phrase || '').toLowerCase().split(/[^a-zA-Z0-9]+/)) {
      if (part.length >= 2) excludedTokens.add(part);
    }
  };

  addExcludedPhrase(mcName);
  addExcludedPhrase(worldSetting);
  addExcludedPhrase(weapon);
  const locWithoutResidence = locationName.replace(/\b(?:kediaman|rumah|vila|pondok)\s+[A-Z][a-z]+/gi, '');
  addExcludedPhrase(locWithoutResidence);

  const candidateNames: string[] = [];
  const registerCandidate = (rawName: string) => {
    const cleaned = rawName.trim().replace(/^[,.;:!?()"']+|[,.;:!?()"']+$/g, '').trim();
    if (!cleaned || cleaned.length < 3 || cleaned.length > 28) return;
    const words = cleaned.split(/\s+/);
    if (words.length > 2) return;
    if (words.every(w => excludedTokens.has(w.toLowerCase()))) return;
    if (excludedTokens.has(words[0]!.toLowerCase())) return;
    if (cleaned.toLowerCase() === mcName.toLowerCase()) return;
    if (!candidateNames.some(n => n.toLowerCase() === cleaned.toLowerCase())) {
      candidateNames.push(cleaned);
    }
  };

  // Pola 1: Kata petunjuk relasional/interaksi ("bersama Aiko", "dengan Rina", "ditemani Hana", "menemui Kael", "adikku Sora", dll.)
  const relationalRegex =
    /\b(?:bersama(?:\s+dengan)?|ditemani(?:\s+oleh)?|bertemu(?:\s+dengan)?|menemui|menghampiri|menyapa|berbincang\s+dengan|berbicara\s+dengan|menunggu|adik(?:ku|\s+angkatku)?|kakak(?:ku|\s+angkatku)?|sahabat(?:ku)?|teman(?:ku)?|rekan(?:ku)?|guru(?:ku)?|master|paman|bibi|nyonya|tuan|nona|putri|pangeran)\s+([A-Z][a-zA-Z]{2,15}(?:\s+[A-Z][a-zA-Z]{2,15})?)/g;

  let m: RegExpExecArray | null;
  while ((m = relationalRegex.exec(prompt)) !== null) {
    if (m[1]) registerCandidate(m[1]);
  }

  // Pola 2: Subjek kata kerja aksi karakter ("Aiko yang sedang...", "Aiko duduk...", "Hana merapikan...", "Kael berdiri...")
  const subjectActionRegex =
    /\b([A-Z][a-z]{2,15})\s+(?:yang\s+sedang|sedang|duduk|berdiri|menyeduh|merapikan|menatap|tersenyum|membaca|memegang|menyiapkan|menunggu|berjalan|memasak|berbicara|berkata|bertanya|menjaga)/g;

  while ((m = subjectActionRegex.exec(prompt)) !== null) {
    if (m[1]) registerCandidate(m[1]);
  }

  const results: ExtractedPrologueNpc[] = [];
  const clauses = prompt
    .split(/[.!?;]+|\bsementara\b|\bsedangkan\b/i)
    .map(c => c.trim())
    .filter(Boolean);

  for (const name of candidateNames.slice(0, 4)) {
    const nameLower = name.toLowerCase();
    const matchingClause =
      clauses.find(c => c.toLowerCase().includes(nameLower)) || prompt;

    // Ekstrak aktivitas kontekstual dari klausa tempat nama NPC tersebut muncul
    let activity = `Berada di ${canonicalLoc} bersama ${mcName}.`;
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const afterNameMatch = new RegExp(
      String.raw`\b${escapedName}\s+(?:yang\s+)?(?:sedang\s+)?([^,.;!?]{6,90})`,
      'i'
    ).exec(matchingClause);

    if (afterNameMatch && afterNameMatch[1]) {
      const actRaw = afterNameMatch[1].trim();
      activity = actRaw.charAt(0).toUpperCase() + actRaw.slice(1);
      if (!activity.endsWith('.')) activity += '.';
    } else if (matchingClause.length >= 10 && matchingClause.length <= 120) {
      activity = matchingClause.charAt(0).toUpperCase() + matchingClause.slice(1);
      if (!activity.endsWith('.')) activity += '.';
    }

    const clauseLower = matchingClause.toLowerCase();
    let trust = 60;
    let mood = 'Tenang dan perhatian';
    let peran = `Penghuni & Kerabat ${buildingAnchor}`;
    let kepribadian = 'Tenang, perhatian, dan peka terhadap keadaan sekitar';
    let tujuan = `Menjalani aktivitas bersama ${mcName} dan menjaga keharmonisan di ${buildingAnchor}`;
    let gayaBicara = 'Natural, hangat, dan santun';

    if (/\b(?:adik|kakak|istri|suami|keluarga|kerabat)(?:ku|mu|nya)?\b/i.test(clauseLower)) {
      peran = `Keluarga & Penghuni ${buildingAnchor}`;
    } else if (/\b(?:rekan|partner|pendamping|sekutu)(?:ku|mu|nya)?\b/i.test(clauseLower)) {
      peran = `Rekan Seperjalanan ${mcName}`;
    } else if (/\b(?:sahabat|teman)(?:ku|mu|nya)?\b/i.test(clauseLower)) {
      peran = `Sahabat Dekat ${mcName}`;
    } else if (/\b(?:guru|master|mentor)(?:ku|mu|nya)?\b/i.test(clauseLower)) {
      peran = `Mentor & Pembimbing di ${buildingAnchor}`;
    }

    if (
      /\b(?:adik|kakak|sahabat|teman|istri|suami|kekasih|hangat|ramah|tersenyum|menyeduh|merapikan|membantu|akrab|setia|peduli)(?:ku|mu|nya)?\b/i.test(
        clauseLower
      )
    ) {
      trust = 75;
      mood = 'Ramah dan hangat';
      kepribadian = 'Hangat, telaten, dan peduli pada kenyamanan sekitar';
      gayaBicara = 'Akrab, lembut, dan penuh perhatian';
    } else if (
      /\b(musuh|rival|curiga|waspada|dingin|mengancam|menghadang|marah|tegang|lawan)\b/i.test(
        clauseLower
      )
    ) {
      trust = 25;
      mood = 'Waspada dan dingin';
      peran = `Sosok Waspada di ${canonicalLoc}`;
      kepribadian = 'Tajam, berhati-hati, dan tidak mudah percaya';
      tujuan = `Menguji niat ${mcName} di ${canonicalLoc}`;
      gayaBicara = 'Tegas, singkat, dan penuh kewaspadaan';
    }

    const draftNpc: NpcState = {
      nama: name,
      peran,
      kepribadian,
      tujuan,
      gaya_bicara: gayaBicara,
      lokasi: canonicalLoc,
      aktivitas: activity,
      mood,
      faksi: primaryFactionName
    };
    const scheduleArchetype = inferNpcRoleArchetype(draftNpc);

    const cleanKey = 'NPC_CUSTOM_' + name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    results.push({
      key: cleanKey,
      nama: name,
      peran,
      kepribadian,
      tujuan,
      gaya_bicara: gayaBicara,
      scheduleArchetype,
      lokasi: canonicalLoc,
      aktivitas: activity,
      mood,
      faksi: primaryFactionName,
      trust,
      fact: `${name} (${peran}) berada di ${canonicalLoc}: ${activity}`
    });
  }

  return results;
}

/**
 * Menyusun inventaris & perlengkapan awal yang kontekstual sesuai domain cerita (tanpa memutus kompatibilitas mata uang).
 */
export function resolveContextualStartingInventory(
  domain: CustomWorldDomain,
  weapon: string
): { inventory: string[]; bagName: string } {
  const cleanWeapon = (weapon || '').trim() || 'Perlengkapan Dasar';
  switch (domain) {
    case 'domestic_slice_of_life':
      return {
        inventory: [cleanWeapon, 'Pakaian Harian Rapi', 'Kudapan & Teh Hangat', '100 Keping Perak'],
        bagName: 'Tas Selempang'
      };
    case 'mystery_investigation':
      return {
        inventory: [cleanWeapon, 'Buku Catatan Investigasi', 'Lencana Identitas', '100 Keping Perak'],
        bagName: 'Tas Kerja Kulit'
      };
    case 'scifi_cyber_modern':
      return {
        inventory: [cleanWeapon, 'Jaket Taktis Siber', 'Kapsul Energi Stim', '100 Keping Perak'],
        bagName: 'Ransel Modular'
      };
    case 'court_politics_dynasty':
      return {
        inventory: [cleanWeapon, 'Jubah Kebangsawanan', 'Cincin Stempel Resmi', '100 Keping Perak'],
        bagName: 'Kantung Sutra'
      };
    default:
      return {
        inventory: [cleanWeapon, 'Pakaian Pengembara', 'Ransum Makanan', '100 Keping Perak'],
        bagName: 'Tas Pengembara'
      };
  }
}

/**
 * Synthesizer World Genesis Kontekstual untuk cerita custom (Tahap Dekomposisi 1).
 * Menghormati tokoh/NPC yang ditulis pengguna di prolog dan menyesuaikan faksi serta suasana awal dengan genre cerita.
 */
export function synthesizeCustomWorldGenesis(
  title: string,
  mcName: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  weapon: string,
  prompt: string
): WorldGenesisOutput {
  const safeLoc = (locationName || '').trim() || 'Gerbang Wilayah';
  const safeWorld = (worldSetting || '').trim() || 'Dunia Petualangan';
  const safeMc = (mcName || '').trim() || 'Protagonis';
  const safeRole = (mcTitle || '').trim() || 'Pengembara';
  const safeWeapon = (weapon || '').trim() || 'Perlengkapan Dasar';

  const cleanLocId = safeLoc.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const locationId = `LOC_${cleanLocId || 'ORIGIN'}`;

  const domain = inferCustomWorldDomain(title, safeRole, safeWorld, safeLoc, safeWeapon, prompt);
  const canonicalLoc = extractCanonicalRoomOrBuilding(safeLoc) || safeLoc;
  const buildingAnchor = extractBuildingAnchor(canonicalLoc) || canonicalLoc;

  const locToken = capitalizeWords(
    buildingAnchor.split(/\s+/).find(w => w.length > 2 && !/^(kediaman|rumah|ruang|kamar)$/i.test(w)) ||
      safeLoc.split(/\s+/).find(w => w.length > 2) ||
      safeLoc.split(/\s+/)[0] ||
      'Wilayah'
  );
  const worldToken = capitalizeWords(
    safeWorld.split(/\s+/).find(w => w.length > 2) || safeWorld.split(/\s+/)[0] || 'Mandiri'
  );
  const titleToken = capitalizeWords(
    title.split(/\s+/).find(w => w.length > 2) || locToken
  );

  // 1. Bangun Faksi sesuai domain cerita
  let factions: Record<string, FactionState>;
  let primaryFactionName: string;
  let fallbackNpcs: Array<{
    key: string;
    nama: string;
    lokasi: string;
    aktivitas: string;
    mood: string;
    faksi: string;
    trust: number;
  }>;

  if (domain === 'domestic_slice_of_life') {
    const householdFaction = `Keluarga & Penghuni ${buildingAnchor}`;
    const neighborFaction = `Warga & Tetangga ${worldToken}`;
    const merchantFaction = `Serikat Pedagang & Pengrajin ${locToken}`;
    primaryFactionName = householdFaction;

    const elderName = `Tetua ${worldToken}`;
    const merchantName = `Pedagang ${locToken}`;
    const caretakerName = `Penjaga Lingkungan ${locToken}`;

    factions = {
      [householdFaction]: {
        name: householdFaction,
        description: `Lingkungan terdekat, kerabat, dan penghuni yang tinggal atau beraktivitas di ${buildingAnchor}.`,
        reputation: 45,
        leader: safeMc
      },
      [neighborFaction]: {
        name: neighborFaction,
        description: `Komunitas warga sekitar di ${safeWorld} yang menjaga keharmonisan keseharian.`,
        reputation: 20,
        leader: elderName
      },
      [merchantFaction]: {
        name: merchantFaction,
        description: `Para pedagang, pengrajin, dan penyedia kebutuhan harian di sekitar ${buildingAnchor}.`,
        reputation: 15,
        leader: merchantName
      }
    };

    fallbackNpcs = [
      {
        key: 'NPC_NEIGHBOR_ELDER',
        nama: elderName,
        lokasi: `Sekitar ${buildingAnchor}`,
        aktivitas: `Menyapa warga sekitar dan memperhatikan ketenangan lingkungan ${buildingAnchor}.`,
        mood: 'Ramah dan bijaksana',
        faksi: neighborFaction,
        trust: 60
      },
      {
        key: 'NPC_LOCAL_MERCHANT',
        nama: merchantName,
        lokasi: `Pusat Pertokoan ${worldToken}`,
        aktivitas: 'Menata kebutuhan harian warga dan berbagi kabar lingkungan.',
        mood: 'Bersahabat',
        faksi: merchantFaction,
        trust: 55
      },
      {
        key: 'NPC_LOCAL_CARETAKER',
        nama: caretakerName,
        lokasi: `Jalur Masuk ${buildingAnchor}`,
        aktivitas: `Merawat ketertiban dan kebersihan jalan di sekitar ${buildingAnchor}.`,
        mood: 'Tenang dan sopan',
        faksi: neighborFaction,
        trust: 55
      }
    ];
  } else if (domain === 'mystery_investigation') {
    const bureauFaction = `Biro Investigasi ${locToken}`;
    const informantFaction = `Jaringan Informan ${worldToken}`;
    const civicFaction = `Dewan Otoritas ${titleToken}`;
    primaryFactionName = bureauFaction;

    const inspectorName = `Inspektur ${locToken}`;
    const informantName = `Informan ${worldToken}`;
    const archivistName = `Arsiparis ${titleToken}`;

    factions = {
      [bureauFaction]: {
        name: bureauFaction,
        description: `Unit penyelidik dan penegak hukum yang menangani kasus-kasus pelik di ${safeLoc}.`,
        reputation: 25,
        leader: inspectorName
      },
      [informantFaction]: {
        name: informantFaction,
        description: `Jaringan pengumpul informasi jalanan dan saksi kunci di sepanjang ${safeWorld}.`,
        reputation: 5,
        leader: informantName
      },
      [civicFaction]: {
        name: civicFaction,
        description: `Pejabat dan pengelola arsip resmi yang mengatur administrasi di ${safeLoc}.`,
        reputation: 10,
        leader: archivistName
      }
    };

    fallbackNpcs = [
      {
        key: 'NPC_LEAD_INSPECTOR',
        nama: inspectorName,
        lokasi: canonicalLoc,
        aktivitas: `Menelaah berkas petunjuk awal dan mengawasi situasi di ${canonicalLoc}.`,
        mood: 'Fokus dan analitis',
        faksi: bureauFaction,
        trust: 55
      },
      {
        key: 'NPC_STREET_INFORMANT',
        nama: informantName,
        lokasi: `Sudut Jalan ${safeLoc}`,
        aktivitas: 'Mengamati pergerakan orang-orang mencurigakan sambil mencatat kabar angin.',
        mood: 'Waspada dan cerdik',
        faksi: informantFaction,
        trust: 45
      },
      {
        key: 'NPC_CIVIC_ARCHIVIST',
        nama: archivistName,
        lokasi: `Ruang Catatan ${safeLoc}`,
        aktivitas: 'Merapikan dokumen riwayat wilayah dan laporan kejadian terbaru.',
        mood: 'Teliti',
        faksi: civicFaction,
        trust: 50
      }
    ];
  } else {
    const authorityFactionName = `Otoritas Penjaga ${safeLoc}`;
    const underworldFactionName = `Sindikat Bayangan ${safeWorld}`;
    const guildFactionName = `Persekutuan Pedagang & Pengelana`;
    primaryFactionName = guildFactionName;

    const leadAuthority = `Komandan ${locToken}`;
    const leadUnderworld = `Gembong ${worldToken}`;
    const leadGuild = `Ketua Serikat ${titleToken}`;

    factions = {
      [authorityFactionName]: {
        name: authorityFactionName,
        description: `Garda penegak hukum dan penjaga ketertiban di wilayah ${safeLoc}.`,
        reputation: 10,
        leader: leadAuthority
      },
      [underworldFactionName]: {
        name: underworldFactionName,
        description: `Faksi bawah tanah yang mengincar pengaruh kekuasaan di sepanjang ${safeWorld}.`,
        reputation: -20,
        leader: leadUnderworld
      },
      [guildFactionName]: {
        name: guildFactionName,
        description: `Perkumpulan bebas pedagang, pengrajin, dan pengelana lintas wilayah.`,
        reputation: 15,
        leader: leadGuild
      }
    };

    fallbackNpcs = [
      {
        key: 'NPC_LOCAL_GUARD',
        nama: leadAuthority,
        lokasi: canonicalLoc,
        aktivitas: `Mengawasi ketertiban dan kedatangan orang asing di ${canonicalLoc}.`,
        mood: 'Tegas dan siaga',
        faksi: authorityFactionName,
        trust: 50
      },
      {
        key: 'NPC_LOCAL_MERCHANT',
        nama: leadGuild,
        lokasi: canonicalLoc,
        aktivitas: 'Menata barang perbekalan dan bertukar kabar dengan para pengelana.',
        mood: 'Ramah dan cerdik',
        faksi: guildFactionName,
        trust: 60
      },
      {
        key: 'NPC_SHADOW_OPERATIVE',
        nama: `Operatif ${worldToken}`,
        lokasi: `Perbatasan ${buildingAnchor}`,
        aktivitas: 'Mengamati situasi dari sudut tersembunyi.',
        mood: 'Mencurigakan',
        faksi: underworldFactionName,
        trust: 20
      }
    ];
  }

  // 2. Ekstrak NPC Custom dari Prolog Pengguna dan prioritaskan di urutan pertama
  const extractedNpcs = extractPrologueCustomNpcs(
    safeMc,
    safeLoc,
    safeWorld,
    safeWeapon,
    prompt,
    primaryFactionName
  );

  const npcStates: Record<string, NpcState> = {};
  const initialTrust: Record<string, number> = {};
  const knowledgeGraph: Record<string, string[]> = {
    [safeWorld]: [
      `Latar dunia "${safeWorld}" yang menjadi panggung utama perjalanan ${safeMc}.`,
      prompt ? `Konteks awal: ${prompt}` : `Memiliki dinamika sosial dan kisah yang berkembang mengikuti tindakan ${safeMc}.`
    ],
    [safeLoc]: [
      `Lokasi penting di ${safeWorld} tempat ${safeMc} memulai kisahnya.`,
      `Area kanonis: ${canonicalLoc}.`
    ],
    [safeWeapon]: [
      `${safeWeapon} merupakan perlengkapan utama yang dibawa oleh ${safeMc} (${safeRole}).`
    ],
    [safeMc]: [
      `Dikenal sebagai ${safeRole} yang berada di ${safeLoc}.`,
      prompt || `Memulai langkah awal di ${safeWorld}.`
    ]
  };

  for (const customNpc of extractedNpcs) {
    npcStates[customNpc.key] = enrichNpcProfileDefaults(
      {
        nama: customNpc.nama,
        peran: customNpc.peran,
        role: customNpc.peran,
        kepribadian: customNpc.kepribadian,
        personality: customNpc.kepribadian,
        tujuan: customNpc.tujuan,
        goal: customNpc.tujuan,
        gaya_bicara: customNpc.gaya_bicara,
        voiceStyle: customNpc.gaya_bicara,
        scheduleArchetype: customNpc.scheduleArchetype,
        lokasi: customNpc.lokasi,
        location: customNpc.lokasi,
        aktivitas: customNpc.aktivitas,
        activity: customNpc.aktivitas,
        mood: customNpc.mood,
        faksi: customNpc.faksi,
        status: 'Healthy'
      },
      safeLoc
    );
    initialTrust[customNpc.nama] = customNpc.trust;
    knowledgeGraph[customNpc.nama] = [
      customNpc.fact,
      `Kepribadian: ${customNpc.kepribadian}. Tujuan: ${customNpc.tujuan}.`,
      `Memiliki hubungan awal (Trust ${customNpc.trust}/100) dengan ${safeMc}.`
    ];
  }

  // Tambahkan NPC pendukung domain hingga minimal 3 NPC terdaftar di dunia
  for (const fb of fallbackNpcs) {
    if (Object.keys(npcStates).length >= 3 && extractedNpcs.length > 0) {
      break;
    }
    const alreadyExists = Object.values(npcStates).some(
      existing => existing.nama.toLowerCase() === fb.nama.toLowerCase()
    );
    if (!alreadyExists) {
      npcStates[fb.key] = enrichNpcProfileDefaults(
        {
          nama: fb.nama,
          lokasi: fb.lokasi,
          location: fb.lokasi,
          aktivitas: fb.aktivitas,
          activity: fb.aktivitas,
          mood: fb.mood,
          faksi: fb.faksi,
          status: 'Healthy'
        },
        safeLoc
      );
      initialTrust[fb.nama] = fb.trust;
    }
  }

  // 3. Bangun Misi Awal (Q-001) yang mencerminkan prolog & NPC custom pengguna
  const primaryCustomNpc = extractedNpcs[0];
  const questObjectives = primaryCustomNpc
    ? [
        `Berinteraksi dengan ${primaryCustomNpc.nama} di ${canonicalLoc}`,
        `Cermati situasi dan detail di sekitar ${safeLoc}`,
        `Tentukan langkah pertama ${safeMc} selanjutnya`
      ]
    : [
        `Kenali keadaan sekitar dan temui tokoh di ${safeLoc}`,
        `Jalin interaksi dengan pihak-pihak di ${safeWorld}`,
        `Manfaatkan ${safeWeapon} secara bijak sesuai situasi`
      ];

  const initialQuest: QuestState = {
    title: `Langkah Pertama di ${canonicalLoc}`,
    description: primaryCustomNpc
      ? `Menjalani situasi awal bersama ${extractedNpcs.map(n => n.nama).join(', ')} di ${canonicalLoc} (${safeWorld}).`
      : `Beradaptasi dengan situasi di ${safeLoc} (${safeWorld}) dan menentukan arah perjalanan ${safeMc}.`,
    status: 'active',
    objectives: questObjectives
  };

  knowledgeGraph['Misi Awal'] = [initialQuest.description];

  const activeLoreKeys = [
    safeWorld,
    safeLoc,
    safeWeapon,
    ...extractedNpcs.map(n => n.nama)
  ];

  const customNpcLog =
    extractedNpcs.length > 0
      ? `[World Genesis] Tokoh prolog terdeteksi & didaftarkan ke Direktori NPC: ${extractedNpcs.map(n => `${n.nama} (${n.lokasi})`).join(', ')}.`
      : `[World Genesis] 3 tokoh pendukung awal disintesis untuk ${safeLoc}.`;

  return {
    locationId,
    factions,
    knowledgeGraph,
    npcStates,
    activeLoreKeys,
    quests: {
      'Q-001': initialQuest
    },
    initialTrust,
    initialLogs: [
      `[World Genesis] Inisialisasi dunia "${safeWorld}" (Domain: ${domain}) untuk kisah "${title || safeMc}" (${safeMc} - ${safeRole}).`,
      customNpcLog,
      `[Lore] Knowledge Graph kontekstual diinjeksikan ke dalam memori RAG.`
    ]
  };
}
