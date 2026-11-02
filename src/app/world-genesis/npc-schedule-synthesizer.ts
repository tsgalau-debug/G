import type {
  NpcDailySchedule,
  NpcScheduleArchetype,
  NpcScheduleSlot,
  NpcState
} from '../game-state.types';

// ---------------------------------------------------------------------------
// Dynamic NPC Daily Schedule Synthesizer (AUD-06 P3)
// ---------------------------------------------------------------------------

const VALID_SCHEDULE_ARCHETYPES = new Set<NpcScheduleArchetype>([
  'resident',
  'companion',
  'guard',
  'merchant',
  'scholar',
  'shadow',
  'wanderer'
]);

const RESIDENCE_OR_ESTATE_RE =
  /\b(kediaman|rumah|pondok|vila|paviliun|istana|kastil|asrama|apartemen)\b/i;

/**
 * Infers an NPC's behavioral schedule archetype from their explicit archetype, role, faction, activity, name, and location.
 */
export function inferNpcRoleArchetype(npc: NpcState): NpcScheduleArchetype {
  if (npc.scheduleArchetype && VALID_SCHEDULE_ARCHETYPES.has(npc.scheduleArchetype)) {
    return npc.scheduleArchetype;
  }

  const roleAndFactionText = [
    npc.peran || npc.role || '',
    npc.faksi || npc.faction || '',
    npc.nama || ''
  ]
    .join(' ')
    .toLowerCase();

  const activityAndGoalText = [
    npc.aktivitas || npc.activity || '',
    npc.tujuan || npc.goal || ''
  ]
    .join(' ')
    .toLowerCase();

  const locText = (npc.lokasi || npc.location || '').toLowerCase();
  const signalText = `${roleAndFactionText} ${activityAndGoalText} ${locText}`;

  if (
    /\b(rekan\s+seperjalanan|pendamping|partner\s+setia|sekutu\s+dekat|pengiring|sahabat\s+seperjalanan|mendampingi\s+perjalanan)\b/i.test(
      signalText
    )
  ) {
    return 'companion';
  }

  const hasExplicitCombatOrTradeRole =
    /\b(penjaga|garda|garnisun|ksatria|patroli|kapten|komandan|prajurit|milisi|benteng|pos\s+jaga|pengawal|ronin|pendekar|pedagang|pasar|pengrajin|penempa|bengkel|kurir|niaga|toko|lapak|petani|nelayan|sindikat|bayangan|kage|shinobi|bandit|operatif|penyelundup|inkuisisi|penyusup)\b/i.test(
      roleAndFactionText
    );

  const hasDomesticOrResidentCue =
    /\b(penghuni|keluarga|kerabat|tuan\s+rumah|nyonya\s+rumah|adik|kakak|istri|suami|kekasih|putri|pangeran|tetangga|asisten\s+rumah|pelayan\s+kediaman|menyeduh\s+teh|merapikan\s+ruangan|ruang\s+tamu|lantai\s+tatami|dapur|halaman\s+dalam)\b/i.test(
      signalText
    ) || RESIDENCE_OR_ESTATE_RE.test(locText);

  if (hasDomesticOrResidentCue && !hasExplicitCombatOrTradeRole) {
    return 'resident';
  }

  if (
    /penjaga|garda|garnisun|ksatria|patroli|kapten|komandan|prajurit|milisi|pertahanan|benteng|gerbang|pos jaga|berjaga|pengawal|ronin|pendekar/i.test(
      signalText
    )
  ) {
    return 'guard';
  }

  if (
    /pedagang|pasar|warga|pengrajin|penempa|bengkel|kurir|niaga|toko|lapak|sayur|petani|nelayan|pelayan|koki/i.test(
      signalText
    )
  ) {
    return 'merchant';
  }

  if (
    /arkana|pustakawan|arsip|cendekiawan|penyihir|peneliti|ilmuwan|tabib|informan|hacker|navigasi|observasi|tetua|master|kuil|perpustakaan|inspektur|detektif|arsiparis/i.test(
      signalText
    )
  ) {
    return 'scholar';
  }

  if (
    /sindikat|bayangan|kage|shinobi|bandit|operatif|penyelundup|inkuisisi|rahasia|gelap|kabut|penyusup/i.test(
      signalText
    )
  ) {
    return 'shadow';
  }

  return 'wanderer';
}

const SCHEDULE_TEMPLATE_PREFIX_RE =
  /^(Penginapan\s*&\s*Kedai|Pusat\s+Keramaian|Jalur\s+Utama|Tepi\s+Wilayah|Pasar\s*&\s*Pusat\s+Niaga|Gudang\s*&\s*Bengkel|Alun-Alun|Kedai\s+Minum|Pemukiman\s+Warga|Jalur\s+Patroli|Gerbang\s*&\s*Perimeter|Pos\s+Komando|Menara\s+Pantau|Kedai\s+Singgah|Ruang\s+Arsip\s*&\s*Studi|Pelataran\s+Observasi|Balai\s+Pertemuan|Kedai\s+Teh|Jalur\s+Bayangan|Titik\s+Pantau\s+Tersembunyi|Tempat\s+Persembunyian|Perbatasan\s+Gelap)\s+(.+)$/i;

const INDOOR_OR_MICRO_SPOT_TOKEN_RE =
  /\b(sudut|pojok|lantai|tatami|ruang|ruangan|kamar|meja|kursi|bangku|dalam|depan|belakang|samping|teras|halaman|koridor|lorong|tangga|balkon|atap|pintu|jendela|dapur|kediaman|rumah|pondok|vila|paviliun|istana|kastil)\b/i;

const LEADING_MICRO_POSITION_RE =
  /^(?:di\s+)?(?:sudut|pojok|lantai\s+tatami|lantai\s+kayu|lantai\s+batu|lantai|tatami|meja\s+pojok|meja\s+makan|meja\s+kayu|meja|kursi|bangku|dekat\s+\S+|sisi\s+\S+|bagian\s+\S+|tengah|depan|belakang|samping|dalam|luar|sekitar|area|titik|bawah|atas|ambang\s+pintu|ambang)\s+/i;

const INDOOR_ROOM_PREFIX_RE =
  /^(?:ruang\s+tamu|ruang\s+tengah|ruang\s+makan|ruang\s+kerja|ruang\s+tidur|ruang\s+utama|kamar\s+utama|kamar\s+tidur|kamar\s+tamu|kamar|dapur|teras|halaman\s+dalam|halaman\s+depan|halaman\s+belakang|halaman|koridor|lorong\s+dalam|balkon)\s+(.+)$/i;

/**
 * Strips accidentally concatenated schedule prefixes when followed by an indoor room, sub-spot, or residence name
 * (e.g., "Penginapan & Kedai Sudut Ruang Tamu Kediaman Takeshi" -> "Sudut Ruang Tamu Kediaman Takeshi").
 */
export function cleanCorruptedScheduleLocation(rawLocation: string): string {
  let loc = (rawLocation || '').trim();
  if (!loc) return '';

  for (let i = 0; i < 2; i++) {
    const m = SCHEDULE_TEMPLATE_PREFIX_RE.exec(loc);
    if (m && m[2] && INDOOR_OR_MICRO_SPOT_TOKEN_RE.test(m[2])) {
      loc = m[2].trim();
    } else {
      break;
    }
  }
  return loc;
}

/**
 * Normalizes a micro-spot description to its canonical room or building
 * (e.g., "Sudut Ruang Tamu Kediaman Takeshi" and "Lantai Tatami Ruang Tamu Kediaman Takeshi"
 *  both normalize to "Ruang Tamu Kediaman Takeshi").
 */
export function extractCanonicalRoomOrBuilding(rawLocation: string): string {
  let loc = cleanCorruptedScheduleLocation(rawLocation);
  if (!loc) return '';

  for (let i = 0; i < 3; i++) {
    const stripped = loc.replace(LEADING_MICRO_POSITION_RE, '').trim();
    if (stripped && stripped.length >= 4 && stripped !== loc) {
      loc = stripped;
    } else {
      break;
    }
  }
  return loc;
}

/**
 * Extracts the macro building/estate anchor from a room or micro-spot
 * (e.g., "Ruang Tamu Kediaman Takeshi" -> "Kediaman Takeshi").
 */
export function extractBuildingAnchor(rawLocation: string): string {
  const canonicalRoom = extractCanonicalRoomOrBuilding(rawLocation);
  const roomMatch = INDOOR_ROOM_PREFIX_RE.exec(canonicalRoom);
  if (roomMatch && roomMatch[1] && roomMatch[1].trim().length >= 4) {
    return roomMatch[1].trim();
  }
  return canonicalRoom;
}

/**
 * Checks whether a location string had a corrupted hybrid schedule prefix.
 */
export function hasCorruptedSchedulePrefix(rawLocation: string | undefined): boolean {
  if (!rawLocation) return false;
  const cleaned = cleanCorruptedScheduleLocation(rawLocation);
  return cleaned !== rawLocation.trim();
}

/**
 * Generates a deterministic, role- and location-aware 24-hour daily schedule (6 time bands)
 * for any NPC (whether created during World Genesis or born dynamically from LLM narrative).
 */
export function generateDynamicNpcSchedule(
  npcKey: string,
  npc: NpcState,
  defaultBaseLocation = 'Pusat Wilayah'
): NpcDailySchedule {
  const npcName = (npc.nama || npcKey.replaceAll('_', ' ')).trim() || 'Tokoh';
  const rawLoc = (npc.lokasi || npc.location || defaultBaseLocation).trim() || defaultBaseLocation;
  const canonicalRoom = extractCanonicalRoomOrBuilding(rawLoc) || defaultBaseLocation;
  const buildingAnchor = extractBuildingAnchor(canonicalRoom) || canonicalRoom;
  const homeLocation = RESIDENCE_OR_ESTATE_RE.test(buildingAnchor) ? buildingAnchor : canonicalRoom;

  const faksi = (npc.faksi || npc.faction || 'Independen').trim();
  const rawActivity = (npc.aktivitas || npc.activity || '').trim();
  const initialActivity = hasCorruptedSchedulePrefix(rawLoc) || rawActivity === 'Berada sendirian setelah ditinggalkan.'
    ? ''
    : rawActivity;
  const initialMood = (npc.mood || '').trim();
  const archetype = inferNpcRoleArchetype(npc);

  // Extract regional root name without leaking personal residence names ("Kediaman Takeshi") into public venue names
  const cleanDefaultBase = extractBuildingAnchor(defaultBaseLocation);
  const rawRegionCandidate = RESIDENCE_OR_ESTATE_RE.test(homeLocation)
    ? (RESIDENCE_OR_ESTATE_RE.test(cleanDefaultBase) ? 'Wilayah Sekitar' : (cleanDefaultBase || 'Wilayah Sekitar'))
    : homeLocation;

  const regionName = rawRegionCandidate
    .replace(
      /^(Pos Jaga|Pos Komando|Gerbang\s+(?:Utama|Utara|Selatan|Timur|Barat|Bawah|Luar)|Gerbang|Pasar|Kedai Minum|Kedai Teh|Kedai|Bengkel Besi|Bengkel|Hutan Perbatasan|Hutan|Perbatasan|Ruang Arsip|Perpustakaan|Pelataran|Jalur|Lorong|Menara Pantau|Menara|Kuil|Aula|Benteng|Alun-Alun|Tepi|Puncak)\s+/i,
      ''
    )
    .trim() || 'Wilayah Sekitar';

  let slots: NpcScheduleSlot[];

  switch (archetype) {
    case 'resident': {
      const estateAnchor = buildingAnchor || homeLocation;
      const livingRoomLoc = canonicalRoom.toLowerCase().includes('ruang')
        ? canonicalRoom
        : `Ruang Tamu ${estateAnchor}`;
      const courtyardLoc = `Teras & Halaman Dalam ${estateAnchor}`;
      const hallLoc = `Ruang Tengah ${estateAnchor}`;
      const diningLoc = `Ruang Makan & Jamuan ${estateAnchor}`;
      const bedroomLoc = `Kamar Istirahat ${estateAnchor}`;

      slots = [
        {
          startHour: 6,
          endHour: 8,
          period: 'early_morning',
          lokasi: livingRoomLoc,
          aktivitas: initialActivity || `Menyiapkan teh pagi dan merapikan suasana di ${livingRoomLoc}.`,
          mood: initialMood || 'Tenang dan hangat'
        },
        {
          startHour: 9,
          endHour: 11,
          period: 'late_morning',
          lokasi: courtyardLoc,
          aktivitas: `Merawat ketenangan halaman dalam dan mengurus keperluan harian di ${estateAnchor}.`,
          mood: 'Ramah dan teliti'
        },
        {
          startHour: 12,
          endHour: 14,
          period: 'midday',
          lokasi: hallLoc,
          aktivitas: `Menyiapkan santap siang dan berbincang santai di ${hallLoc}.`,
          mood: 'Akrab dan nyaman'
        },
        {
          startHour: 15,
          endHour: 17,
          period: 'afternoon',
          lokasi: livingRoomLoc,
          aktivitas: `Menikmati waktu sore sambil menekuni kegiatan pribadi di ${livingRoomLoc}.`,
          mood: 'Teduh dan perhatian'
        },
        {
          startHour: 18,
          endHour: 21,
          period: 'evening',
          lokasi: diningLoc,
          aktivitas: `Menghidangkan jamuan makan malam hangat dan bercengkerama di ${diningLoc}.`,
          mood: 'Hangat dan tenang'
        },
        {
          startHour: 22,
          endHour: 5,
          period: 'night',
          lokasi: bedroomLoc,
          aktivitas: `Beristirahat malam dengan tenang di dalam ${bedroomLoc}.`,
          mood: 'Damai'
        }
      ];
      break;
    }

    case 'companion': {
      const baseHub = canonicalRoom || homeLocation;
      const restStopLoc = `Tempat Singgah ${buildingAnchor}`;
      const perimeterLoc = `Sekitar ${buildingAnchor}`;
      const nightRestLoc = `Kamar Istirahat ${buildingAnchor}`;

      slots = [
        {
          startHour: 6,
          endHour: 8,
          period: 'early_morning',
          lokasi: baseHub,
          aktivitas: initialActivity || `Memeriksa kesiapan perlengkapan pagi dan berkoordinasi di ${baseHub}.`,
          mood: initialMood || 'Siap dan setia'
        },
        {
          startHour: 9,
          endHour: 11,
          period: 'late_morning',
          lokasi: baseHub,
          aktivitas: `Mendampingi langkah perjalanan dan mengamati perkembangan situasi di ${baseHub}.`,
          mood: 'Fokus dan suportif'
        },
        {
          startHour: 12,
          endHour: 14,
          period: 'midday',
          lokasi: restStopLoc,
          aktivitas: `Beristirahat sejenak sambil mendiskusikan rencana langkah berikutnya di ${restStopLoc}.`,
          mood: 'Tenang dan kooperatif'
        },
        {
          startHour: 15,
          endHour: 17,
          period: 'afternoon',
          lokasi: perimeterLoc,
          aktivitas: `Menjaga kewaspadaan dan membantu menyelesaikan urusan sore di ${perimeterLoc}.`,
          mood: 'Sigap'
        },
        {
          startHour: 18,
          endHour: 21,
          period: 'evening',
          lokasi: baseHub,
          aktivitas: `Mengevaluasi temuan hari ini sambil melepas lelah di ${baseHub}.`,
          mood: 'Akrab dan reflektif'
        },
        {
          startHour: 22,
          endHour: 5,
          period: 'night',
          lokasi: nightRestLoc,
          aktivitas: `Beristirahat malam sambil tetap siap siaga di ${nightRestLoc}.`,
          mood: 'Tenang'
        }
      ];
      break;
    }

    case 'guard': {
      const patrolLoc = homeLocation.toLowerCase().includes('gerbang')
        ? `Jalur Patroli ${regionName}`
        : `Gerbang & Perimeter ${regionName}`;
      const barrackLoc = `Pos Komando ${regionName}`;
      const watchLoc = `Menara Pantau ${regionName}`;
      const tavernLoc = `Kedai Singgah ${regionName}`;

      slots = [
        {
          startHour: 6,
          endHour: 8,
          period: 'early_morning',
          lokasi: homeLocation,
          aktivitas: initialActivity || `Memeriksa kesiapan pos jaga dan mengamati pergerakan pagi di ${homeLocation}.`,
          mood: initialMood || 'Waspada dan disiplin'
        },
        {
          startHour: 9,
          endHour: 11,
          period: 'late_morning',
          lokasi: patrolLoc,
          aktivitas: `Melakukan patroli aktif menyusuri ${patrolLoc} serta memeriksa keamanan jalur masuk.`,
          mood: 'Siaga penuh'
        },
        {
          startHour: 12,
          endHour: 14,
          period: 'midday',
          lokasi: barrackLoc,
          aktivitas: `Berkoordinasi mengenai laporan situasi siang bersama anggota ${faksi} di ${barrackLoc}.`,
          mood: 'Fokus dan taktis'
        },
        {
          startHour: 15,
          endHour: 17,
          period: 'afternoon',
          lokasi: homeLocation,
          aktivitas: `Mengawasi lalu lintas sore dan melatih ketangkasan bela diri di ${homeLocation}.`,
          mood: 'Tegas'
        },
        {
          startHour: 18,
          endHour: 21,
          period: 'evening',
          lokasi: tavernLoc,
          aktivitas: `Menyantap makan malam sambil memantau kabar dari para pelancong di ${tavernLoc}.`,
          mood: 'Tenang namun awas'
        },
        {
          startHour: 22,
          endHour: 5,
          period: 'night',
          lokasi: watchLoc,
          aktivitas: `Melaksanakan giliran ronda malam dan mengawasi batas gelap dari ${watchLoc}.`,
          mood: 'Waspada tinggi'
        }
      ];
      break;
    }

    case 'merchant': {
      const marketLoc = homeLocation.toLowerCase().includes('pasar')
        ? homeLocation
        : `Pasar & Pusat Niaga ${regionName}`;
      const storageLoc = `Gudang & Bengkel ${regionName}`;
      const squareLoc = `Alun-Alun ${regionName}`;
      const tavernLoc = `Kedai Minum ${regionName}`;
      const homeQuarter = `Pemukiman Warga ${regionName}`;

      slots = [
        {
          startHour: 6,
          endHour: 8,
          period: 'early_morning',
          lokasi: homeLocation,
          aktivitas: initialActivity || `Menata barang dagangan dan membuka aktivitas pagi di ${homeLocation}.`,
          mood: initialMood || 'Bersemangat'
        },
        {
          startHour: 9,
          endHour: 11,
          period: 'late_morning',
          lokasi: marketLoc,
          aktivitas: `Melayani warga dan melakukan transaksi niaga yang ramai di ${marketLoc}.`,
          mood: 'Ramah dan cekatan'
        },
        {
          startHour: 12,
          endHour: 14,
          period: 'midday',
          lokasi: storageLoc,
          aktivitas: `Memeriksa persediaan logistik dan merapikan kiriman barang di ${storageLoc}.`,
          mood: 'Sibuk dan teliti'
        },
        {
          startHour: 15,
          endHour: 17,
          period: 'afternoon',
          lokasi: squareLoc,
          aktivitas: `Menawarkan komoditas sore dan bertukar kabar dengan pelancong di ${squareLoc}.`,
          mood: 'Antusias'
        },
        {
          startHour: 18,
          endHour: 21,
          period: 'evening',
          lokasi: tavernLoc,
          aktivitas: `Bersantai melepas lelah sambil berbincang hangat dengan warga di ${tavernLoc}.`,
          mood: 'Santai dan akrab'
        },
        {
          startHour: 22,
          endHour: 5,
          period: 'night',
          lokasi: homeQuarter,
          aktivitas: `Mengunci persediaan dan beristirahat malam di ${homeQuarter}.`,
          mood: 'Tenang'
        }
      ];
      break;
    }

    case 'scholar': {
      const archiveLoc = homeLocation.toLowerCase().includes('arsip') || homeLocation.toLowerCase().includes('perpustakaan')
        ? homeLocation
        : `Ruang Arsip & Studi ${regionName}`;
      const fieldLoc = `Pelataran Observasi ${regionName}`;
      const councilLoc = `Balai Pertemuan ${regionName}`;
      const teaHouseLoc = `Kedai Teh ${regionName}`;

      slots = [
        {
          startHour: 6,
          endHour: 8,
          period: 'early_morning',
          lokasi: homeLocation,
          aktivitas: initialActivity || `Mempelajari catatan pagi dan memeriksa instrumen di ${homeLocation}.`,
          mood: initialMood || 'Tenang dan analitis'
        },
        {
          startHour: 9,
          endHour: 11,
          period: 'late_morning',
          lokasi: archiveLoc,
          aktivitas: `Menelaah gulungan dokumen dan memetakan anomali informasi di ${archiveLoc}.`,
          mood: 'Fokus mendalam'
        },
        {
          startHour: 12,
          endHour: 14,
          period: 'midday',
          lokasi: councilLoc,
          aktivitas: `Berdiskusi mengenai perkembangan situasi wilayah bersama rekan ${faksi} di ${councilLoc}.`,
          mood: 'Serius dan bijaksana'
        },
        {
          startHour: 15,
          endHour: 17,
          period: 'afternoon',
          lokasi: fieldLoc,
          aktivitas: `Melakukan pengamatan lapangan dan menguji hipotesis di ${fieldLoc}.`,
          mood: 'Ingin tahu'
        },
        {
          startHour: 18,
          endHour: 21,
          period: 'evening',
          lokasi: teaHouseLoc,
          aktivitas: `Menyesap minuman hangat sambil mengumpulkan kabar angin di ${teaHouseLoc}.`,
          mood: 'Reflektif'
        },
        {
          startHour: 22,
          endHour: 5,
          period: 'night',
          lokasi: archiveLoc,
          aktivitas: `Merangkum temuan harian di bawah cahaya lentera sebelum beristirahat di ${archiveLoc}.`,
          mood: 'Hening'
        }
      ];
      break;
    }

    case 'shadow': {
      const alleyLoc = `Jalur Bayangan ${regionName}`;
      const vantageLoc = `Titik Pantau Tersembunyi ${regionName}`;
      const safehouseLoc = `Tempat Persembunyian ${regionName}`;
      const nightRouteLoc = `Perbatasan Gelap ${regionName}`;

      slots = [
        {
          startHour: 6,
          endHour: 8,
          period: 'early_morning',
          lokasi: homeLocation,
          aktivitas: initialActivity || `Mengamati pergantian penjaga pagi dari balik bayangan di ${homeLocation}.`,
          mood: initialMood || 'Dingin dan terukur'
        },
        {
          startHour: 9,
          endHour: 11,
          period: 'late_morning',
          lokasi: vantageLoc,
          aktivitas: `Memantau keluar-masuknya tokoh penting dari ${vantageLoc}.`,
          mood: 'Waspada dan senyap'
        },
        {
          startHour: 12,
          endHour: 14,
          period: 'midday',
          lokasi: safehouseLoc,
          aktivitas: `Menyusun sandi rahasia dan memeriksa perlengkapan taktis di ${safehouseLoc}.`,
          mood: 'Tertutup'
        },
        {
          startHour: 15,
          endHour: 17,
          period: 'afternoon',
          lokasi: alleyLoc,
          aktivitas: `Bertukar pesan terenkripsi dengan kontak ${faksi} di ${alleyLoc}.`,
          mood: 'Mencurigakan'
        },
        {
          startHour: 18,
          endHour: 21,
          period: 'evening',
          lokasi: homeLocation,
          aktivitas: `Menyatu dengan keramaian senja sambil mengintai target di ${homeLocation}.`,
          mood: 'Fokus tajam'
        },
        {
          startHour: 22,
          endHour: 5,
          period: 'night',
          lokasi: nightRouteLoc,
          aktivitas: `Bergerak tanpa suara menjalankan operasi pengintaian malam di ${nightRouteLoc}.`,
          mood: 'Senyap dan mematikan'
        }
      ];
      break;
    }

    default: {
      const roadLoc = `Jalur Utama ${regionName}`;
      const plazaLoc = `Pusat Keramaian ${regionName}`;
      const EdgeLoc = `Tepi Wilayah ${regionName}`;
      const innLoc = `Penginapan & Kedai ${regionName}`;

      slots = [
        {
          startHour: 6,
          endHour: 8,
          period: 'early_morning',
          lokasi: homeLocation,
          aktivitas: initialActivity || `Mempersiapkan perlengkapan perjalanan pagi di ${homeLocation}.`,
          mood: initialMood || 'Tenang'
        },
        {
          startHour: 9,
          endHour: 11,
          period: 'late_morning',
          lokasi: plazaLoc,
          aktivitas: `Menjelajahi sudut ${plazaLoc} dan memperhatikan perkembangan situasi sekitar.`,
          mood: 'Ingin tahu'
        },
        {
          startHour: 12,
          endHour: 14,
          period: 'midday',
          lokasi: innLoc,
          aktivitas: `Beristirahat siang sejenak sambil menyimak perbincangan di ${innLoc}.`,
          mood: 'Santai'
        },
        {
          startHour: 15,
          endHour: 17,
          period: 'afternoon',
          lokasi: EdgeLoc,
          aktivitas: `Menyusuri ${EdgeLoc} dan memeriksa jejak di jalur perbatasan.`,
          mood: 'Waspada'
        },
        {
          startHour: 18,
          endHour: 21,
          period: 'evening',
          lokasi: innLoc,
          aktivitas: `Menghangatkan diri di ${innLoc} dan berbagi cerita perjalanan.`,
          mood: 'Ramah'
        },
        {
          startHour: 22,
          endHour: 5,
          period: 'night',
          lokasi: roadLoc,
          aktivitas: `Beristirahat malam sambil menjaga kewaspadaan di sekitar ${roadLoc}.`,
          mood: 'Tenang'
        }
      ];
      break;
    }
  }

  return {
    npcKey,
    npcName,
    archetype,
    homeLocation,
    faksi,
    slots
  };
}

/**
 * Synthesizes rich identity defaults (peran, kepribadian, tujuan, gaya_bicara, scheduleArchetype)
 * for any NPC while preserving existing or user-customized fields.
 */
export function enrichNpcProfileDefaults(
  npc: NpcState,
  defaultBaseLocation = 'Pusat Wilayah'
): NpcState {
  if (!npc) return npc;

  const archetype = inferNpcRoleArchetype(npc);
  const rawLoc = (npc.lokasi || npc.location || defaultBaseLocation).trim() || defaultBaseLocation;
  const canonicalRoom = extractCanonicalRoomOrBuilding(rawLoc) || defaultBaseLocation;
  const buildingAnchor = extractBuildingAnchor(canonicalRoom) || canonicalRoom;
  const faksi = (npc.faksi || npc.faction || 'Independen').trim();

  let defaultRole = 'Warga & Kenalan Lokal';
  let defaultPersonality = 'Tenang, perhatian, dan responsif terhadap sekitar';
  let defaultGoal = `Menjalani keseharian dan menjaga ketertiban di ${buildingAnchor}`;
  let defaultVoice = 'Natural, sopan, dan kontekstual';

  switch (archetype) {
    case 'resident':
      defaultRole = `Penghuni & Kerabat ${buildingAnchor}`;
      defaultPersonality = 'Hangat, penuh perhatian, dan peduli pada kenyamanan rumah';
      defaultGoal = `Menjaga keharmonisan serta mengurus keperluan harian di ${buildingAnchor}`;
      defaultVoice = 'Akrab, lembut, dan santun';
      break;
    case 'companion':
      defaultRole = 'Rekan Seperjalanan & Sekutu Dekat';
      defaultPersonality = 'Setia, tanggap, dan suportif dalam berbagai situasi';
      defaultGoal = `Mendampingi langkah perjalanan dan memastikan keselamatan bersama di ${buildingAnchor}`;
      defaultVoice = 'Lugas, hangat, dan kooperatif';
      break;
    case 'guard':
      defaultRole = faksi !== 'Independen' ? `Penjaga Keamanan (${faksi})` : `Penjaga Wilayah ${buildingAnchor}`;
      defaultPersonality = 'Tegas, disiplin, dan selalu siaga';
      defaultGoal = `Memastikan keamanan perimeter dan ketertiban di ${buildingAnchor}`;
      defaultVoice = 'Tegas, formal, dan langsung pada pokok persoalan';
      break;
    case 'merchant':
      defaultRole = faksi !== 'Independen' ? `Niagawan (${faksi})` : `Pedagang & Penyedia Kebutuhan ${buildingAnchor}`;
      defaultPersonality = 'Ramah, jeli melihat peluang, dan komunikatif';
      defaultGoal = `Mengelola perputaran komoditas dan menjalin relasi dagang di ${buildingAnchor}`;
      defaultVoice = 'Bersahabat, persuasif, dan ekspresif';
      break;
    case 'scholar':
      defaultRole = faksi !== 'Independen' ? `Cendekiawan & Penelaah (${faksi})` : `Cendekiawan ${buildingAnchor}`;
      defaultPersonality = 'Analitis, tenang, dan penuh rasa ingin tahu';
      defaultGoal = `Menelaah catatan penting serta mengurai petunjuk di ${buildingAnchor}`;
      defaultVoice = 'Terstruktur, reflektif, dan bernada tenang';
      break;
    case 'shadow':
      defaultRole = faksi !== 'Independen' ? `Operatif Bayangan (${faksi})` : 'Pengamat & Informan Tersembunyi';
      defaultPersonality = 'Waspada, tertutup, dan penuh perhitungan';
      defaultGoal = `Memantau pergerakan pihak-pihak kunci dari balik bayangan ${buildingAnchor}`;
      defaultVoice = 'Pelan, terukur, dan penuh makna tersirat';
      break;
    default:
      defaultRole = faksi !== 'Independen' ? `Anggota ${faksi}` : `Pengelana di ${buildingAnchor}`;
      defaultPersonality = 'Mandiri, adaptif, dan jeli mengamati keadaan';
      defaultGoal = `Menjelajahi peluang dan mengikuti perkembangan situasi di ${buildingAnchor}`;
      defaultVoice = 'Santai namun tetap waspada';
      break;
  }

  const resolvedPeran = (npc.peran || npc.role || defaultRole).trim();
  const resolvedKepribadian = (npc.kepribadian || npc.personality || defaultPersonality).trim();
  const resolvedTujuan = (npc.tujuan || npc.goal || defaultGoal).trim();
  const resolvedGayaBicara = (npc.gaya_bicara || npc.voiceStyle || defaultVoice).trim();

  npc.peran = resolvedPeran;
  npc.role = resolvedPeran;
  npc.kepribadian = resolvedKepribadian;
  npc.personality = resolvedKepribadian;
  npc.tujuan = resolvedTujuan;
  npc.goal = resolvedTujuan;
  npc.gaya_bicara = resolvedGayaBicara;
  npc.voiceStyle = resolvedGayaBicara;
  npc.scheduleArchetype = archetype;

  return npc;
}

/**
 * Generates a map of daily schedules for a record of NPC states.
 */
export function generateNpcSchedulesMap(
  npcStates: Record<string, NpcState>,
  defaultBaseLocation = 'Pusat Wilayah'
): Record<string, NpcDailySchedule> {
  const schedules: Record<string, NpcDailySchedule> = {};
  for (const [key, npc] of Object.entries(npcStates || {})) {
    if (npc && npc.nama) {
      enrichNpcProfileDefaults(npc, defaultBaseLocation);
      schedules[key] = generateDynamicNpcSchedule(key, npc, defaultBaseLocation);
    }
  }
  return schedules;
}

/**
 * Resolves the active schedule slot for a given hour (0..23) or total minutes.
 */
export function resolveScheduleSlotForHour(
  schedule: NpcDailySchedule,
  hour: number
): NpcScheduleSlot {
  const normalizedHour = ((Math.floor(hour) % 24) + 24) % 24;
  for (const slot of schedule.slots) {
    if (slot.startHour <= slot.endHour) {
      if (normalizedHour >= slot.startHour && normalizedHour <= slot.endHour) {
        return slot;
      }
    } else {
      // Overnight wrap-around slot (e.g. 22..5)
      if (normalizedHour >= slot.startHour || normalizedHour <= slot.endHour) {
        return slot;
      }
    }
  }
  return schedule.slots[0]!;
}

/**
 * Checks whether an existing NpcDailySchedule has micro-spot or residence pollution in its slots
 * (e.g. "Penginapan & Kedai Sudut Ruang Tamu Kediaman Takeshi") or an outdated archetype.
 */
export function isScheduleCorrupted(
  schedule: NpcDailySchedule | undefined,
  npc?: NpcState
): boolean {
  if (!schedule || !Array.isArray(schedule.slots) || schedule.slots.length === 0) {
    return true;
  }
  if (hasCorruptedSchedulePrefix(schedule.homeLocation)) {
    return true;
  }
  if (extractCanonicalRoomOrBuilding(schedule.homeLocation) !== schedule.homeLocation.trim()) {
    return true;
  }
  if (npc) {
    const expectedArchetype = inferNpcRoleArchetype(npc);
    if (schedule.archetype !== expectedArchetype) {
      return true;
    }
  }
  for (const slot of schedule.slots) {
    if (hasCorruptedSchedulePrefix(slot.lokasi)) {
      return true;
    }
  }
  return false;
}

/**
 * Repairs an NPC's state and schedule if either was polluted by micro-spot schedule prefixes,
 * and backfills rich profile defaults (peran, kepribadian, tujuan, gaya_bicara).
 */
export function sanitizeNpcScheduleAndState(
  npcKey: string,
  npc: NpcState,
  existingSchedule: NpcDailySchedule | undefined,
  defaultBaseLocation = 'Pusat Wilayah'
): { npc: NpcState; schedule: NpcDailySchedule; wasRepaired: boolean } {
  let wasRepaired = false;
  const rawLoc = (npc.lokasi || npc.location || '').trim();
  if (rawLoc && hasCorruptedSchedulePrefix(rawLoc)) {
    const cleanRoom = extractCanonicalRoomOrBuilding(rawLoc);
    npc.lokasi = cleanRoom;
    npc.location = cleanRoom;
    wasRepaired = true;

    const rawAct = (npc.aktivitas || npc.activity || '').trim();
    if (
      rawAct.toLowerCase().includes(rawLoc.toLowerCase()) ||
      rawAct === 'Berada sendirian setelah ditinggalkan.'
    ) {
      const cleanAct = `Beraktivitas dengan tenang di ${cleanRoom}.`;
      npc.aktivitas = cleanAct;
      npc.activity = cleanAct;
    }
  }

  enrichNpcProfileDefaults(npc, defaultBaseLocation);

  let schedule = existingSchedule;
  if (!schedule || isScheduleCorrupted(schedule, npc)) {
    schedule = generateDynamicNpcSchedule(npcKey, npc, defaultBaseLocation);
    wasRepaired = true;
  }

  return { npc, schedule, wasRepaired };
}

