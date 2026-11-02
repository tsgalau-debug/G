export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'bag' | 'consumable' | 'currency' | 'quest' | 'misc';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface ItemStatBonus {
  strength?: number | undefined;
  defense?: number | undefined;
  agility?: number | undefined;
  charisma?: number | undefined;
  stamina?: number | undefined;
  maxHp?: number | undefined;
  maxSp?: number | undefined;
  capacity?: number | undefined;
}

export interface ConsumableEffect {
  hp?: number | undefined;
  sp?: number | undefined;
  status?: string | undefined;
  message?: string | undefined;
}

export interface ItemInfo {
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
  slot?: 'weapon' | 'armor' | 'accessory' | 'bag' | undefined;
  description: string;
  statBonus?: ItemStatBonus | undefined;
  consumableEffect?: ConsumableEffect | undefined;
  value?: number | undefined;
}

export const KNOWN_ITEMS: Record<string, ItemInfo> = {
  'Pedang Legendaris': {
    name: 'Pedang Legendaris',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'legendary',
    icon: 'hardware',
    description: 'Pedang kuno dengan bilah berukir rune yang berpendar biru. Menghasilkan getaran resonansi misterius saat mendekati anomali dimensi di dekat Hutan Perbatasan.',
    statBonus: { strength: 35, agility: 10 }
  },
  'Tas Kulit': {
    name: 'Tas Kulit',
    category: 'bag',
    slot: 'bag',
    rarity: 'common',
    icon: 'backpack',
    description: 'Tas ransel kulit petualang tebal untuk menyimpan perbekalan dan bahan mentah selama penjelajahan.',
    statBonus: { capacity: 10 }
  },
  'Ransum': {
    name: 'Ransum',
    category: 'consumable',
    rarity: 'common',
    icon: 'restaurant',
    description: 'Paket makanan kering berisi dendeng asap, biskuit gandum, dan keju keras bergizi tinggi.',
    consumableEffect: { hp: 30, sp: 20, status: 'Kenyang & Bugar', message: 'Memulihkan 30 HP dan 20 SP' }
  },
  '100 perak': {
    name: '100 perak',
    category: 'currency',
    rarity: 'common',
    icon: 'toll',
    description: 'Sekantong keping perak standar yang sah untuk berbelanja, menginap di penginapan, atau menyewa jasa.',
    value: 100
  },
  '100 Keping Perak': {
    name: '100 Keping Perak',
    category: 'currency',
    rarity: 'common',
    icon: 'toll',
    description: 'Sekantong keping perak standar yang sah untuk transaksi perdagangan di berbagai wilayah.',
    value: 100
  },
  'Ramuan Penyembuh': {
    name: 'Ramuan Penyembuh',
    category: 'consumable',
    rarity: 'uncommon',
    icon: 'local_drink',
    description: 'Cairan merah sari herba pegunungan yang mempercepat pembekuan luka dan menutup goresan fisik.',
    consumableEffect: { hp: 50, status: 'Segar', message: 'Menyembuhkan 50 HP' }
  },
  'Ramuan Mana': {
    name: 'Ramuan Mana',
    category: 'consumable',
    rarity: 'rare',
    icon: 'science',
    description: 'Ekstrak kristal biru cair yang memulihkan fokus mental dan cadangan energi spiritual SP.',
    consumableEffect: { sp: 40, status: 'Fokus Tajam', message: 'Memulihkan 40 SP' }
  },
  'Zirah Rantai Besi': {
    name: 'Zirah Rantai Besi',
    category: 'armor',
    slot: 'armor',
    rarity: 'uncommon',
    icon: 'shield',
    description: 'Anyaman cincin baja tempa yang kokoh meredam tebasan senjata tajam dan taring binatang buas.',
    statBonus: { defense: 25, maxHp: 30 }
  },
  'Jubah Pengelana': {
    name: 'Jubah Pengelana',
    category: 'armor',
    slot: 'armor',
    rarity: 'common',
    icon: 'checkroom',
    description: 'Mantel berkerudung tahan cuaca ekstrim yang menyamarkan siluet pemakainya di keremangan.',
    statBonus: { agility: 8, charisma: 5 }
  },
  'Cincin Pelindung Kuno': {
    name: 'Cincin Pelindung Kuno',
    category: 'accessory',
    slot: 'accessory',
    rarity: 'rare',
    icon: 'diamond',
    description: 'Cincin perak peninggalan masa silam berhiaskan permata biru murni yang memancarkan aura wibawa.',
    statBonus: { charisma: 15, agility: 5 }
  },
  'Cincin Safir Auralis': {
    name: 'Cincin Safir Auralis',
    category: 'accessory',
    slot: 'accessory',
    rarity: 'rare',
    icon: 'diamond',
    description: 'Cincin perak peninggalan bangsawan berhiaskan safir biru murni yang memancarkan aura wibawa.',
    statBonus: { charisma: 15, agility: 5 }
  },
  'Amulet Pelindung': {
    name: 'Amulet Pelindung',
    category: 'accessory',
    slot: 'accessory',
    rarity: 'uncommon',
    icon: 'watch',
    description: 'Jimat kayu berukir simbol suci kuno yang memberikan perlindungan batin dan ketenangan jiwa.',
    statBonus: { defense: 10, stamina: 10 }
  },
  'Peta Kuno': {
    name: 'Peta Kuno',
    category: 'quest',
    rarity: 'rare',
    icon: 'map',
    description: 'Perkamen usang yang menunjukkan kontur wilayah kuno dan jalur rahasia menuju reruntuhan terlarang.'
  },
  'Kunci Berkarat': {
    name: 'Kunci Berkarat',
    category: 'quest',
    rarity: 'common',
    icon: 'key',
    description: 'Kunci besi kuno yang diselimuti patina perunggu. Kemungkinan cocok untuk peti kuno atau pintu bawah tanah.'
  }
};

export function resolveItemInfo(rawName: string): ItemInfo {
  const trimmed = rawName.trim();
  const catalog = KNOWN_ITEMS as Record<string, ItemInfo | undefined>;
  const directMatch = catalog[trimmed];
  if (directMatch !== undefined) {
    return directMatch;
  }

  // Check case-insensitive match in catalog
  const lower = trimmed.toLowerCase();
  for (const [key, item] of Object.entries(KNOWN_ITEMS)) {
    if (key.toLowerCase() === lower) {
      return item;
    }
  }

  // Dynamic inference based on keywords
  let category: ItemCategory = 'misc';
  let slot: 'weapon' | 'armor' | 'accessory' | 'bag' | undefined;
  let icon = 'category';
  const statBonus: ItemStatBonus = {};
  let consumableEffect: ConsumableEffect | undefined;
  let rarity: ItemRarity = 'common';

  // Rarity inference
  if (/legendaris|legendary|kuno|keramat|mitos|abadi/i.test(trimmed)) {
    rarity = 'legendary';
  } else if (/langka|rare|safir|giok|emas|gold|kristal|magis|plasma|termal/i.test(trimmed)) {
    rarity = 'rare';
  } else if (/perak|besi|baja|halus|elixir|tajam|superior|tempa/i.test(trimmed)) {
    rarity = 'uncommon';
  }

  // Category inference
  if (/pedang|senjata|blade|sword|katana|pisau|dagger|belati|tombak|spear|busur|bow|kapak|axe|tongkat|staff|pistol|rifle|senapan|laser|plasma|blaster|golok|sabit|cambuk/i.test(trimmed)) {
    category = 'weapon';
    slot = 'weapon';
    icon = 'hardware';
    statBonus.strength = rarity === 'legendary' ? 30 : (rarity === 'rare' ? 20 : 12);
  } else if (/zirah|armor|baju|pakaian|jubah|robe|mantel|jaket|helm|pelindung|tameng|shield|boots|sepatu/i.test(trimmed)) {
    category = 'armor';
    slot = 'armor';
    icon = 'shield';
    statBonus.defense = rarity === 'legendary' ? 25 : (rarity === 'rare' ? 18 : 10);
  } else if (/cincin|ring|kalung|necklace|amulet|gelang|bracelet|liontin|jimat|talisman|implant|modul/i.test(trimmed)) {
    category = 'accessory';
    slot = 'accessory';
    icon = 'diamond';
    statBonus.charisma = rarity === 'legendary' ? 20 : 10;
    statBonus.agility = 5;
  } else if (/tas|bag|ransel|backpack|kantong|pouch/i.test(trimmed)) {
    category = 'bag';
    slot = 'bag';
    icon = 'backpack';
    statBonus.capacity = 10;
  } else if (/ransum|makanan|food|roti|bread|daging|meat|apel|buah|ramuan|potion|elixir|obat|medkit|stim|jamu|air|teh|herbal/i.test(trimmed)) {
    category = 'consumable';
    icon = /ramuan|potion|elixir|medkit|stim/i.test(trimmed) ? 'local_drink' : 'restaurant';
    consumableEffect = {
      hp: /mana|sp|elixir/i.test(trimmed) ? 10 : 35,
      sp: /mana|sp|elixir/i.test(trimmed) ? 35 : 15,
      status: 'Segar & Bugar',
      message: `Memulihkan vitalitas dengan mengonsumsi ${trimmed}`
    };
  } else if (/perak|silver|emas|gold|koin|coin|uang|money|tembaga|copper|keping|tael|kredit|credit|yen|yuan/i.test(trimmed)) {
    category = 'currency';
    icon = 'toll';
  } else if (/peta|map|kunci|key|surat|letter|dokumen|segel|seal|batu|stone|kristal|artefak|chip|data/i.test(trimmed)) {
    category = 'quest';
    icon = 'auto_stories';
  }

  return {
    name: trimmed,
    category,
    rarity,
    icon,
    slot,
    description: `Barang petualangan (${category.toUpperCase()}): ${trimmed}.`,
    statBonus: Object.keys(statBonus).length > 0 ? statBonus : undefined,
    consumableEffect
  };
}

export function parseCurrencyFromInventory(inventory: string[]): { amount: number; unit: string; label: string } {
  let silver = 0;
  let hasCurrency = false;

  for (const item of inventory) {
    const match = /(\d+)\s*(?:keping\s+|koin\s+|batang\s+|kantong\s+)?(perak|emas|koin|silver|gold|tael|kredit|credit|yen|yuan)/i.exec(item);
    if (match?.[1] !== undefined) {
      const val = Number.parseInt(match[1], 10);
      if (!Number.isNaN(val)) {
        const currencyType = match[2] || 'perak';
        silver += /emas|gold|tael/i.test(currencyType) ? val * 10 : val;
        hasCurrency = true;
      }
    }
  }

  if (!hasCurrency) {
    return { amount: 0, unit: 'perak', label: '0 Perak' };
  }

  return {
    amount: silver,
    unit: 'perak',
    label: `${silver.toLocaleString('id-ID')} Perak`
  };
}

export function calculateGearStatBonuses(equipped: {
  weapon?: string | undefined;
  armor?: string | undefined;
  accessory?: string | undefined;
  bag?: string | undefined;
}): ItemStatBonus {
  const totals: ItemStatBonus = {
    strength: 0,
    defense: 0,
    agility: 0,
    charisma: 0,
    stamina: 0,
    maxHp: 0,
    maxSp: 0,
    capacity: 0
  };

  const slots = [equipped.weapon, equipped.armor, equipped.accessory, equipped.bag];
  for (const item of slots) {
    if (item === undefined || item.length === 0) continue;
    const info = resolveItemInfo(item);
    if (info.statBonus !== undefined) {
      if (info.statBonus.strength !== undefined) totals.strength = (totals.strength ?? 0) + info.statBonus.strength;
      if (info.statBonus.defense !== undefined) totals.defense = (totals.defense ?? 0) + info.statBonus.defense;
      if (info.statBonus.agility !== undefined) totals.agility = (totals.agility ?? 0) + info.statBonus.agility;
      if (info.statBonus.charisma !== undefined) totals.charisma = (totals.charisma ?? 0) + info.statBonus.charisma;
      if (info.statBonus.stamina !== undefined) totals.stamina = (totals.stamina ?? 0) + info.statBonus.stamina;
      if (info.statBonus.maxHp !== undefined) totals.maxHp = (totals.maxHp ?? 0) + info.statBonus.maxHp;
      if (info.statBonus.maxSp !== undefined) totals.maxSp = (totals.maxSp ?? 0) + info.statBonus.maxSp;
      if (info.statBonus.capacity !== undefined) totals.capacity = (totals.capacity ?? 0) + info.statBonus.capacity;
    }
  }

  return totals;
}
