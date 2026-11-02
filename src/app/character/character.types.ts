import { EquippedGear } from '../game-state.types';
import { calculateGearStatBonuses } from '../item-system';

export interface NpcTrustDisplay {
  name: string;
  value: number;
  tier: string;
  badgeClass: string;
  barColor: string;
  location?: string | undefined;
  mood?: string | undefined;
  faction?: string | undefined;
}

export function resolveEquippedItem(
  equipped: EquippedGear | undefined,
  inventory: string[] | undefined,
  type: 'weapon' | 'armor' | 'accessory' | 'bag'
): string | null {
  const item = equipped?.[type];
  if (typeof item === 'string' && item.length > 0) {
    return item;
  }

  const inv = inventory ?? [];
  if (inv.length === 0) return null;

  let regex: RegExp;
  switch (type) {
    case 'weapon': {
      regex = /pedang|senjata|blade|sword|katana|pisau|tombak|busur/i;
      break;
    }
    case 'armor': {
      regex = /baju|jubah|zirah|armor|robe|mantel/i;
      break;
    }
    case 'accessory': {
      regex = /cincin|kalung|amulet|gelang|ring/i;
      break;
    }
    case 'bag': {
      regex = /tas|ransel|bag|pouch|kantong/i;
      break;
    }
  }

  const match = inv.find(i => regex.test(i));
  return match ?? null;
}

export function getEffectiveGearBonuses(
  equipped: EquippedGear | undefined,
  inventory: string[] | undefined
) {
  const resolved: EquippedGear = {
    weapon: resolveEquippedItem(equipped, inventory, 'weapon') ?? undefined,
    armor: resolveEquippedItem(equipped, inventory, 'armor') ?? undefined,
    accessory: resolveEquippedItem(equipped, inventory, 'accessory') ?? undefined,
    bag: resolveEquippedItem(equipped, inventory, 'bag') ?? undefined
  };
  return calculateGearStatBonuses(resolved);
}

export function getRarityLabel(rarity: string): string {
  switch (rarity) {
    case 'legendary': {
      return 'Legendaris';
    }
    case 'rare': {
      return 'Langka';
    }
    case 'uncommon': {
      return 'Superior';
    }
    default: {
      return 'Biasa';
    }
  }
}

export function getRarityTextColor(rarity: string): string {
  switch (rarity) {
    case 'legendary': {
      return 'text-amber-400 font-bold';
    }
    case 'rare': {
      return 'text-blue-400 font-bold';
    }
    case 'uncommon': {
      return 'text-emerald-400 font-medium';
    }
    default: {
      return 'text-zinc-500';
    }
  }
}

export function getRarityBadgeClass(rarity: string): string {
  switch (rarity) {
    case 'legendary': {
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }
    case 'rare': {
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
    }
    case 'uncommon': {
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
    default: {
      return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
    }
  }
}
