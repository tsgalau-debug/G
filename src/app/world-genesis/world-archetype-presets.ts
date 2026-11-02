import type {
  FactionState,
  NpcDailySchedule,
  NpcState,
  QuestState
} from '../game-state.types';

export interface WorldGenesisOutput {
  factions: Record<string, FactionState>;
  knowledgeGraph: Record<string, string[]>;
  npcStates: Record<string, NpcState>;
  npcSchedules?: Record<string, NpcDailySchedule>;
  activeLoreKeys: string[];
  quests: Record<string, QuestState>;
  initialTrust: Record<string, number>;
  locationId: string;
  initialLogs: string[];
}

export function capitalizeWords(str: string): string {
  return str
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ---------------------------------------------------------------------------
// Archetype 1: Feudal Yamato & Auralis Frontier
// ---------------------------------------------------------------------------
export function generateYamatoGenesis(
  mcName: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  weapon: string
): WorldGenesisOutput {
  const cleanLoc = locationName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const locationId = `LOC_${cleanLoc || 'YAMATO_VILLAGE'}`;

  return {
    locationId,
    factions: {
      'Penjaga Desa Yamato': {
        name: 'Penjaga Desa Yamato',
        description: 'Garda keamanan milisi desa yang dipimpin oleh tetua desa untuk melindungi warga dari monster hutan.',
        reputation: 15,
        leader: 'Tetua Daichi'
      },
      'Auralis Royal Guard': {
        name: 'Auralis Royal Guard',
        description: 'Pasukan garnisun resmi dari ibukota kerajaan yang mengawasi ketertiban di wilayah perbatasan.',
        reputation: 0,
        leader: 'Jenderal Kael'
      },
      'Sindikat Kabut Hitam': {
        name: 'Sindikat Kabut Hitam',
        description: 'Jaringan penyelundup dan bandit yang bersembunyi di sekitar Whispering Woods.',
        reputation: -15,
        leader: 'Goro si Tangan Besi'
      }
    },
    knowledgeGraph: {
      'Desa Yamato': [
        'Desa satelit damai dengan perpaduan budaya timur di tepi hutan Whispering Woods.',
        'Sering menjadi tempat transit pelancong, pendekar pedang, dan pedagang rempah.'
      ],
      'Pedang Legendaris': [
        `${weapon} yang dibawa oleh ${mcName} menyimpan resonansi aura kuno yang mulai bangkit.`,
        'Banyak pihak di perbatasan mulai mengamati gelombang energi dari senjata ini.'
      ],
      'Whispering Woods': [
        'Hutan ilusi di utara desa yang dihuni oleh satwa anomali dan kabut pergeseran ruang.'
      ],
      [mcName]: [
        `Dikenal sebagai ${mcTitle} yang baru saja tiba di ${locationName}.`,
        'Memiliki tekad untuk mengungkap asal-usul pusaka dan misteri tanah perbatasan.'
      ],
      'Misi Awal': [
        `Menyelidiki respon aura ${weapon} di sekitar ${locationName} dan mengenal para tokoh kunci desa.`
      ]
    },
    npcStates: {
      'NPC_DAICHI_107': {
        nama: 'Daichi',
        lokasi: locationName,
        location: locationName,
        aktivitas: 'Memeriksa pos jaga gerbang desa dan mengamati pelancong yang tiba.',
        activity: 'Inspecting village gate and greeting travelers',
        mood: 'Waspada namun ramah',
        faksi: 'Penjaga Desa Yamato',
        status: 'Healthy'
      },
      'NPC_HANAKO_103': {
        nama: 'Hanako',
        lokasi: 'Pasar Desa Yamato',
        location: 'Pasar Desa Yamato',
        aktivitas: 'Menata sayuran segar dan menyapa warga yang berbelanja.',
        activity: 'Arranging fresh vegetables at the market',
        mood: 'Ceria',
        faksi: 'Warga Desa',
        status: 'Healthy'
      },
      'NPC_ELDRIN_RECON': {
        nama: 'Eldrin',
        lokasi: 'Kedai Minum Yamato',
        location: 'Kedai Minum Yamato',
        aktivitas: 'Menyesap teh hangat sambil menyimak kabar angin tentang Whispering Woods.',
        activity: 'Drinking tea and listening to wilderness rumors',
        mood: 'Tenang dan analitis',
        faksi: 'Netral',
        status: 'Healthy'
      }
    },
    activeLoreKeys: ['Yamato', 'Auralis', 'Pedang Legendaris', 'Whispering Woods'],
    quests: {
      'Q-001': {
        title: 'Langkah Pertama di Yamato',
        description: `Mulai petualangan di ${locationName}, cari tahu rumor seputar Hutan Perbatasan dan perkenalkan dirimu.`,
        status: 'active',
        objectives: [
          `Bicara dengan penjaga atau warga di ${locationName}`,
          'Kunjungi pasar desa atau kedai minum untuk mengumpulkan informasi',
          'Periksa kestabilan energi pusaka sebelum melangkah ke luar batas aman'
        ]
      }
    },
    initialTrust: {
      'Daichi': 60,
      'Hanako': 50,
      'Eldrin': 40
    },
    initialLogs: [
      `[World Genesis] Inisialisasi dunia Feudal Yamato ("${worldSetting}") untuk ${mcName} (${mcTitle}).`,
      `[Faksi] 3 Faksi terdaftar: Penjaga Desa Yamato, Auralis Royal Guard, Sindikat Kabut Hitam.`,
      `[Lore] Knowledge Graph dan Lorebook Yamato/Auralis telah disinkronkan ke memori RAG.`
    ]
  };
}

// ---------------------------------------------------------------------------
// Archetype 2: Shinobi / Lembah Kabut Kage
// ---------------------------------------------------------------------------
export function generateKageGenesis(
  mcName: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  weapon: string
): WorldGenesisOutput {
  const cleanLoc = locationName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const locationId = `LOC_${cleanLoc || 'JURANG_GAGAK'}`;

  return {
    locationId,
    factions: {
      'Klan Kage Bayangan': {
        name: 'Klan Kage Bayangan',
        description: 'Ordo shinobi tersembunyi yang beroperasi dari balik kabut lembah, menjaga keseimbangan tak terlihat.',
        reputation: 25,
        leader: 'Master Hanzou'
      },
      'Garnisun Benteng Gagak': {
        name: 'Garnisun Benteng Gagak',
        description: 'Pasukan penjaga benteng musuh di seberang tebing jurang yang bersiaga penuh terhadap infiltrasi.',
        reputation: -25,
        leader: 'Komandan Ryuu'
      },
      'Serikat Pengelana Kabut': {
        name: 'Serikat Pengelana Kabut',
        description: 'Jaringan informan dan kurir rahasia yang menjual kabar di sepanjang jalur Lembah Kabut.',
        reputation: 10,
        leader: 'Oboro si Penjual Informasi'
      }
    },
    knowledgeGraph: {
      'Lembah Kabut Kage': [
        'Lembah terjal yang diselimuti kabut tebal abadi tempat berseminya rahasia klan bayangan.',
        'Suhu udara dingin dan jarak pandang terbatas menjadi perisai alami klan.'
      ],
      'Puncak Jurang Gagak': [
        `Pos pengintaian di puncak tebing tempat ${mcName} memantau benteng pertahanan musuh.`,
        'Angin kencang dan suara kokok gagak sering menyamarkan desingan senjata rahasia.'
      ],
      [weapon]: [
        `${weapon} mengalirkan energi petir frekuensi tinggi yang mampu menembus perisai dan bayangan.`,
        'Ditempa khusus untuk eksekusi senyap dan pergerakan akrobatik secepat kilat.'
      ],
      [mcName]: [
        `Dikenal sebagai ${mcTitle} dari garis keturunan bayangan.`,
        'Mengemban misi rahasia untuk menyusup dan mengungkap konspirasi di Benteng Gagak.'
      ],
      'Misi Awal': [
        `Mengamati patroli Benteng Gagak dari ${locationName} dan menghubungi informan Oboro.`
      ]
    },
    npcStates: {
      'NPC_OBORO_INFO': {
        nama: 'Oboro',
        lokasi: locationName,
        location: locationName,
        aktivitas: 'Berjongkok di balik batu karang mengamati jalur patroli musuh.',
        activity: 'Crouching behind rock face tracking guard rotations',
        mood: 'Tenang, fokus',
        faksi: 'Serikat Pengelana Kabut',
        status: 'Healthy'
      },
      'NPC_MASTER_HANZOU': {
        nama: 'Master Hanzou',
        lokasi: 'Kuil Tersembunyi Kabut',
        location: 'Kuil Tersembunyi Kabut',
        aktivitas: 'Bermeditasi di depan api dupa sambil memantau sinyal chakra klan.',
        activity: 'Meditating before clan incense altar',
        mood: 'Khidmat dan berwibawa',
        faksi: 'Klan Kage Bayangan',
        status: 'Healthy'
      },
      'NPC_PATROLI_GAGAK': {
        nama: 'Kapten Hayate',
        lokasi: 'Gerbang Bawah Benteng Gagak',
        location: 'Gerbang Bawah Benteng Gagak',
        aktivitas: 'Memeriksa kewaspadaan regu pemanah di dinding benteng pertahanan.',
        activity: 'Checking archer squad readiness at fortress walls',
        mood: 'Ketat dan waspada',
        faksi: 'Garnisun Benteng Gagak',
        status: 'Healthy'
      }
    },
    activeLoreKeys: ['Lembah Kabut Kage', 'Puncak Jurang Gagak', 'Belati Kembar Chidori', 'Klan Kage'],
    quests: {
      'Q-001': {
        title: 'Mata di Balik Kabut',
        description: `Pindai rotasi penjaga benteng dari ${locationName} dan temui kontak klan untuk arahan lebih lanjut.`,
        status: 'active',
        objectives: [
          'Amati celah patroli garnisun dari dahan cemara kuno',
          'Bertukar kode rahasia dengan Oboro si Penjual Informasi',
          'Siapkan rute infiltrasi sebelum hujan badai reda'
        ]
      }
    },
    initialTrust: {
      'Oboro': 65,
      'Master Hanzou': 80,
      'Kapten Hayate': 10
    },
    initialLogs: [
      `[World Genesis] Inisialisasi dunia Lembah Kabut Kage ("${worldSetting}") untuk ${mcName} (${mcTitle}).`,
      `[Faksi] 3 Faksi terdaftar: Klan Kage Bayangan, Garnisun Benteng Gagak, Serikat Pengelana Kabut.`,
      `[Lore] Knowledge Graph dan taktik Shinobi diindeks ke dalam memori RAG.`
    ]
  };
}

// ---------------------------------------------------------------------------
// Archetype 3: High Arcane / Kekaisaran Auralis
// ---------------------------------------------------------------------------
export function generateArcaneAuralisGenesis(
  mcName: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  weapon: string
): WorldGenesisOutput {
  const cleanLoc = locationName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const locationId = `LOC_${cleanLoc || 'PERPUSTAKAAN_KUNO'}`;

  return {
    locationId,
    factions: {
      'Ordo Arkana Kristal': {
        name: 'Ordo Arkana Kristal',
        description: 'Persekutuan cendekiawan dan magus terkemuka yang menguasai seni resonansi kristal energi kerajaan.',
        reputation: 25,
        leader: 'Grand Magus Vael'
      },
      'Serikat Pustakawan & Arsiparis': {
        name: 'Serikat Pustakawan & Arsiparis',
        description: 'Para penjaga manuskrip kuno dan gulungan mantra terlarang yang mengawasi lorong-lorong perpustakaan.',
        reputation: 15,
        leader: 'Arsiparis Selyse'
      },
      'Inkuisisi Kerajaan Auralis': {
        name: 'Inkuisisi Kerajaan Auralis',
        description: 'Badan pemeriksa ortodoks yang mencurigai penelitian sihir terlarang di luar regulasi mahkota.',
        reputation: -10,
        leader: 'Inkuisitor Malakor'
      }
    },
    knowledgeGraph: {
      'Kekaisaran Auralis': [
        'Kekaisaran megah yang ditenagai oleh resonansi kristal etherium kuno.',
        'Pusat kemajuan arsitektur sihir, kebudayaan kerajaan, dan hukum tata negara arkana.'
      ],
      'Perpustakaan Kuno Ibukota': [
        `Kubah arsip megah tempat ${mcName} meneliti gulungan manuskrip berumur ribuan tahun.`,
        'Menyimpan catatan topologi dimensi dan gerbang etherium yang terlupakan.'
      ],
      [weapon]: [
        `${weapon} mengkristalisasi aliran mana murni menjadi proyeksi sihir ofensif dan defensif.`,
        'Mampu mendeteksi fluktuasi medan sihir terlarang di sekeliling pemegangnya.'
      ],
      [mcName]: [
        `Dikenal sebagai ${mcTitle} berbakat dengan pemahaman mendalam tentang manuskrip arkana.`,
        'Bertekad membuka rahasia gulungan bercahaya yang ditemukan di ruang kubah arsip.'
      ],
      'Misi Awal': [
        `Menerjemahkan naskah rahasia di ${locationName} sebelum diketahui oleh Inkuisisi Kerajaan.`
      ]
    },
    npcStates: {
      'NPC_SELYSE_ARCHIVIST': {
        nama: 'Arsiparis Selyse',
        lokasi: locationName,
        location: locationName,
        aktivitas: 'Mengkatalogkan naskah gulungan sihir kuno di meja arsip.',
        activity: 'Cataloging ancient arcane manuscripts at reading desk',
        mood: 'Fokus dan ingin tahu',
        faksi: 'Serikat Pustakawan & Arsiparis',
        status: 'Healthy'
      },
      'NPC_MAGUS_VAEL': {
        nama: 'Grand Magus Vael',
        lokasi: 'Menara Puncak Ordo Arkana',
        location: 'Menara Puncak Ordo Arkana',
        aktivitas: 'Mengamati bola resonansi kristal raksasa yang berputar di kubah menara.',
        activity: 'Monitoring floating crystal sphere resonance',
        mood: 'Misterius dan bijaksana',
        faksi: 'Ordo Arkana Kristal',
        status: 'Healthy'
      },
      'NPC_INQUISITOR_MALAKOR': {
        nama: 'Inkuisitor Malakor',
        lokasi: 'Gerbang Luar Perpustakaan',
        location: 'Gerbang Luar Perpustakaan',
        aktivitas: 'Memeriksa surat izin riset para cendekiawan yang hendak memasuki arsip terlarang.',
        activity: 'Inspecting scholar research permits at archive entrance',
        mood: 'Dingin dan curiga',
        faksi: 'Inkuisisi Kerajaan Auralis',
        status: 'Healthy'
      }
    },
    activeLoreKeys: [
      'Auralis',
      'Ordo Arkana Kristal',
      'Perpustakaan Kuno Ibukota',
      'Tongkat Kristal Biru'
    ],
    quests: {
      'Q-001': {
        title: 'Rahasia Manuskrip Arkana',
        description: `Pelajari gulungan bercahaya di ${locationName} dan hindari pengawasan ketat aparat inkuisisi.`,
        status: 'active',
        objectives: [
          `Periksa segel naskah kuno di meja transkripsi ${locationName}`,
          'Konsultasikan simbol glif tersembunyi dengan Arsiparis Selyse',
          'Pastikan aktivitasmu tidak menarik kecurigaan Inkuisitor Malakor'
        ]
      }
    },
    initialTrust: {
      'Arsiparis Selyse': 70,
      'Grand Magus Vael': 55,
      'Inkuisitor Malakor': 20
    },
    initialLogs: [
      `[World Genesis] Inisialisasi dunia Kekaisaran Auralis ("${worldSetting}") untuk ${mcName} (${mcTitle}).`,
      `[Faksi] 3 Faksi terdaftar: Ordo Arkana Kristal, Serikat Pustakawan, Inkuisisi Kerajaan.`,
      `[Lore] Resonansi naskah arkana dan kristal mana diindeks ke dalam memori RAG.`
    ]
  };
}

// ---------------------------------------------------------------------------
// Archetype 4: Cyberpunk / Kota Cyber Neon-Aura
// ---------------------------------------------------------------------------
export function generateNeonCyberGenesis(
  mcName: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  weapon: string
): WorldGenesisOutput {
  const cleanLoc = locationName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const locationId = `LOC_${cleanLoc || 'SEKTOR_7'}`;

  return {
    locationId,
    factions: {
      'Sindikat Kurir Sektor 7': {
        name: 'Sindikat Kurir Sektor 7',
        description: 'Perkumpulan operatif jalanan dan kurir motor magi-cyber independen yang menguasai jalur bawah kota.',
        reputation: 25,
        leader: 'Zero-One'
      },
      'Korporasi Neuro-Tech': {
        name: 'Korporasi Neuro-Tech',
        description: 'Konglomerat siber otoriter yang memonopoli grid data, augmentasi saraf, dan armada drone penegak hukum.',
        reputation: -30,
        leader: 'Direktur Vance'
      },
      'Jaringan Hacker Ghost-Wire': {
        name: 'Jaringan Hacker Ghost-Wire',
        description: 'Kolektif peretas bawah tanah yang mendistribusikan data rahasia dan program modifikasi ilegal.',
        reputation: 15,
        leader: 'Nyx'
      }
    },
    knowledgeGraph: {
      'Kota Cyber Neon-Aura': [
        'Metropolis bertingkat vertikal di mana gemerlap lampu neon menutupi bayangan korporasi.',
        'Lantai atas dikuasai gedung megah elit konglomerat, lantai bawah dipadati distrik jalanan.'
      ],
      'Lorong Sektor 7': [
        `Wilayah lantai bawah yang menjadi rute operasi utama bagi ${mcName}.`,
        'Penuh dengan warung mie sintetis, bengkel cyberware ilegal, dan jalur pelarian pipa uap.'
      ],
      [weapon]: [
        `${weapon} mengonversi energi sel baterai plasma menjadi bilah pemotong bersuhu 3000°C.`,
        'Mampu memotong bodi kendaraan lapis baja dan melumpuhkan sirkuit drone pengintai.'
      ],
      [mcName]: [
        `Dikenal sebagai ${mcTitle} jalanan tercepat dengan rekor pengantaran tanpa kompromi.`,
        'Membawa paket terenkripsi tingkat tinggi yang diburu oleh regu taktis Neuro-Tech.'
      ],
      'Misi Awal': [
        `Menyalakan motor magi-cyber di ${locationName} dan mengantarkan paket rahasia ke titik drop-off.`
      ]
    },
    npcStates: {
      'NPC_ZERO_ONE': {
        nama: 'Zero-One',
        lokasi: locationName,
        location: locationName,
        aktivitas: 'Menyetel karburator motor magi-cyber di dalam bengkel remang-remang.',
        activity: 'Tuning magi-cyber bike carburetor in neon workshop',
        mood: 'Fokus dan bersahabat',
        faksi: 'Sindikat Kurir Sektor 7',
        status: 'Healthy'
      },
      'NPC_NYX_HACKER': {
        nama: 'Nyx',
        lokasi: 'Terminal Server Gelap Sektor 7',
        location: 'Terminal Server Gelap Sektor 7',
        aktivitas: 'Membobol frekuensi radio drone patroli kepolisian korporasi.',
        activity: 'Hacking corporate drone patrol frequencies',
        mood: 'Sinistis dan lincah',
        faksi: 'Jaringan Hacker Ghost-Wire',
        status: 'Healthy'
      },
      'NPC_AGENT_VANCE': {
        nama: 'Enforcer Kane',
        lokasi: 'Pos Pemeriksaan Jembatan Atas',
        location: 'Pos Pemeriksaan Jembatan Atas',
        aktivitas: 'Mengawasi pemindaian retina warga dengan pemindai cybernetik.',
        activity: 'Overseeing biometric retina scans of street pedestrians',
        mood: 'Kaku dan mengancam',
        faksi: 'Korporasi Neuro-Tech',
        status: 'Healthy'
      }
    },
    activeLoreKeys: [
      'Kota Cyber Neon-Aura',
      'Lorong Sektor 7',
      'Pedang Plasma Termal',
      'Korporasi Neuro-Tech'
    ],
    quests: {
      'Q-001': {
        title: 'Paket Panas di Bawah Neon',
        description: `Bawa paket terenkripsi melintasi ${locationName} menuju titik kontak rahasia tanpa terlacak sensor drone.`,
        status: 'active',
        objectives: [
          `Periksa integritas segel paket dan kesiapan ${weapon}`,
          'Dapatkan jalur bypass sensor dari Nyx di jaringan Ghost-Wire',
          'Hindari patroli deteksi Enforcer Neuro-Tech di jalan layang'
        ]
      }
    },
    initialTrust: {
      'Zero-One': 75,
      'Nyx': 60,
      'Enforcer Kane': -10
    },
    initialLogs: [
      `[World Genesis] Inisialisasi dunia Cyber Neon-Aura ("${worldSetting}") untuk ${mcName} (${mcTitle}).`,
      `[Faksi] 3 Faksi terdaftar: Sindikat Kurir Sektor 7, Korporasi Neuro-Tech, Jaringan Ghost-Wire.`,
      `[Lore] Data grid cybernetik dan protokol jalanan diindeks ke dalam memori RAG.`
    ]
  };
}

// ---------------------------------------------------------------------------
// Archetype 5: Open Generative Reference Machine (For ANY arbitrary custom input)
// ---------------------------------------------------------------------------
import { synthesizeCustomWorldGenesis } from './custom-genesis-synthesizer';

export function generateCustomGenerativeGenesis(
  title: string,
  mcName: string,
  mcTitle: string,
  worldSetting: string,
  locationName: string,
  weapon: string,
  prompt: string
): WorldGenesisOutput {
  return synthesizeCustomWorldGenesis(
    title,
    mcName,
    mcTitle,
    worldSetting,
    locationName,
    weapon,
    prompt
  );
}

