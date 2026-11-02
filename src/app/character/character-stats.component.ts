import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../game-state.service';
import { getEffectiveGearBonuses } from './character.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-character-stats',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="divide-y divide-zinc-800/80 text-zinc-200">
      
      <!-- 1. Radar Polygon & Derived Combat Metrics Split -->
      <section class="pb-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <!-- SVG 4-Axis Minimalist Line Radar Chart -->
        <div class="md:col-span-5 flex flex-col items-center justify-center py-2">
          <svg viewBox="0 0 200 200" class="w-44 h-44 overflow-visible select-none" aria-label="Grafik Radar Atribut Karakter">
            <!-- Outer & Inner Reference Diamonds (1px Hairlines) -->
            <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="#353a47" stroke-width="1" />
            <polygon points="100,46 154,100 100,154 46,100" fill="none" stroke="#353a47" stroke-width="1" stroke-dasharray="2 2" />
            <polygon points="100,73 127,100 100,127 73,100" fill="none" stroke="#353a47" stroke-width="1" />
            
            <!-- Cross Axes -->
            <line x1="100" y1="20" x2="100" y2="180" stroke="#353a47" stroke-width="1" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="#353a47" stroke-width="1" />

            <!-- Dynamic Stat Polygon -->
            <polygon 
              [attr.points]="getRadarPolygonPoints()" 
              fill="rgba(16, 185, 129, 0.14)" 
              stroke="#10b981" 
              stroke-width="1.5" />

            <!-- Axis Labels -->
            <text x="100" y="11" text-anchor="middle" class="fill-zinc-400 text-[9px] font-mono">STR {{ getEffectiveStatNumber('strength') }}</text>
            <text x="188" y="103" text-anchor="start" class="fill-zinc-400 text-[9px] font-mono">CHA {{ getEffectiveStatNumber('charisma') }}</text>
            <text x="100" y="195" text-anchor="middle" class="fill-zinc-400 text-[9px] font-mono">STA {{ getEffectiveStatNumber('stamina') }}</text>
            <text x="12" y="103" text-anchor="end" class="fill-zinc-400 text-[9px] font-mono">AGI {{ getEffectiveStatNumber('agility') }}</text>
          </svg>
        </div>

        <!-- Derived Tactical Metrics (1px Divided Table) -->
        <div class="md:col-span-7 divide-y divide-zinc-800/60 border-t md:border-t-0 border-zinc-800/60 pt-4 md:pt-0">
          <div class="pb-2 flex items-baseline justify-between">
            <span class="text-xs font-semibold text-zinc-300">Ringkasan Kapabilitas Taktis</span>
            <span class="text-[11px] font-mono text-zinc-500">Basis + Perlengkapan</span>
          </div>

          <div class="py-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span class="text-zinc-400 font-sans">Arketipe Dasar</span>
            <span class="text-emerald-400 uppercase">{{ getArchetypeLabel() }}</span>
          </div>

          <div class="py-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span class="text-zinc-400 font-sans">Pertahanan Fisik (DEF)</span>
            <span class="text-zinc-200">+{{ gearBonuses.defense || 0 }}</span>
          </div>

          <div class="py-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span class="text-zinc-400 font-sans">Bonus Serangan Senjata (ATK)</span>
            <span class="text-zinc-200">+{{ gearBonuses.strength || 0 }}</span>
          </div>

          <div class="py-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span class="text-zinc-400 font-sans">Kapasitas Inventaris Maksimal</span>
            <span class="text-zinc-200">{{ 20 + (gearBonuses.capacity || 0) }} Slot</span>
          </div>
        </div>
      </section>

      <!-- 2. Core Attributes Breakdown (1px Hairline Divided Rows) -->
      <section class="pt-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold text-zinc-300 tracking-tight">Rincian Atribut Utama</h3>
          <span class="text-[11px] font-mono text-zinc-500 tabular-nums">Skala 0 – 100</span>
        </div>

        <div class="divide-y divide-zinc-800/60">
          <!-- Strength -->
          <div class="py-3.5 first:pt-1 space-y-1.5">
            <div class="flex justify-between items-baseline text-xs">
              <div>
                <span class="font-semibold text-zinc-100">Strength</span>
                <span class="text-zinc-600 mx-1.5" aria-hidden="true">·</span>
                <span class="text-zinc-400">Kekuatan Fisik & Daya Hantam</span>
              </div>
              <div class="font-mono tabular-nums flex items-baseline gap-2">
                @if (gearBonuses.strength) {
                  <span class="text-[11px] text-emerald-400">(+{{ gearBonuses.strength }} gear)</span>
                }
                <span class="text-sm font-bold text-emerald-400">{{ getEffectiveStat('strength') }}</span>
              </div>
            </div>
            <div class="w-full bg-zinc-900 h-1 overflow-hidden">
              <div class="bg-emerald-500 h-full transition-all duration-200" [style.width]="getStatWidth(getEffectiveStat('strength'))"></div>
            </div>
            <p class="text-[11px] text-zinc-500">Mempengaruhi besaran tebasan senjata berat, beban maksimal, dan intimidasi fisik.</p>
          </div>

          <!-- Charisma -->
          <div class="py-3.5 space-y-1.5">
            <div class="flex justify-between items-baseline text-xs">
              <div>
                <span class="font-semibold text-zinc-100">Charisma</span>
                <span class="text-zinc-600 mx-1.5" aria-hidden="true">·</span>
                <span class="text-zinc-400">Pesona, Diplomasi & Wibawa</span>
              </div>
              <div class="font-mono tabular-nums flex items-baseline gap-2">
                @if (gearBonuses.charisma) {
                  <span class="text-[11px] text-cyan-400">(+{{ gearBonuses.charisma }} gear)</span>
                }
                <span class="text-sm font-bold text-cyan-400">{{ getEffectiveStat('charisma') }}</span>
              </div>
            </div>
            <div class="w-full bg-zinc-900 h-1 overflow-hidden">
              <div class="bg-cyan-400 h-full transition-all duration-200" [style.width]="getStatWidth(getEffectiveStat('charisma'))"></div>
            </div>
            <p class="text-[11px] text-zinc-500">Mempermudah persuasi, mempercepat peningkatan kepercayaan NPC, dan negosiasi harga.</p>
          </div>

          <!-- Stamina -->
          <div class="py-3.5 space-y-1.5">
            <div class="flex justify-between items-baseline text-xs">
              <div>
                <span class="font-semibold text-zinc-100">Stamina</span>
                <span class="text-zinc-600 mx-1.5" aria-hidden="true">·</span>
                <span class="text-zinc-400">Daya Tahan & Ketahanan Fisik</span>
              </div>
              <div class="font-mono tabular-nums flex items-baseline gap-2">
                @if (gearBonuses.stamina) {
                  <span class="text-[11px] text-amber-400">(+{{ gearBonuses.stamina }} gear)</span>
                }
                <span class="text-sm font-bold text-amber-400">{{ getEffectiveStat('stamina') }}</span>
              </div>
            </div>
            <div class="w-full bg-zinc-900 h-1 overflow-hidden">
              <div class="bg-amber-400 h-full transition-all duration-200" [style.width]="getStatWidth(getEffectiveStat('stamina'))"></div>
            </div>
            <p class="text-[11px] text-zinc-500">Memperpanjang kapasitas tenaga tempur, ketahanan racun/cuaca ekstrem, dan pemulihan SP.</p>
          </div>

          <!-- Agility -->
          <div class="py-3.5 last:pb-0 space-y-1.5">
            <div class="flex justify-between items-baseline text-xs">
              <div>
                <span class="font-semibold text-zinc-100">Agility</span>
                <span class="text-zinc-600 mx-1.5" aria-hidden="true">·</span>
                <span class="text-zinc-400">Kelincahan, Refleks & Inisiatif</span>
              </div>
              <div class="font-mono tabular-nums flex items-baseline gap-2">
                @if (gearBonuses.agility) {
                  <span class="text-[11px] text-purple-400">(+{{ gearBonuses.agility }} gear)</span>
                }
                <span class="text-sm font-bold text-purple-400">{{ getEffectiveStat('agility') }}</span>
              </div>
            </div>
            <div class="w-full bg-zinc-900 h-1 overflow-hidden">
              <div class="bg-purple-400 h-full transition-all duration-200" [style.width]="getStatWidth(getEffectiveStat('agility'))"></div>
            </div>
            <p class="text-[11px] text-zinc-500">Meningkatkan peluang menghindar serangan, kecepatan penyergapan, dan ketepatan gerak.</p>
          </div>
        </div>
      </section>
    </div>
  `
})
export class CharacterStatsComponent {
  gameState = inject(GameStateService);
  toast = output<string>();

  get gearBonuses() {
    this.gameState.stateVersion();
    return getEffectiveGearBonuses(
      this.gameState.mcState.equipped,
      this.gameState.mcState.inventory
    );
  }

  getArchetypeLabel(): string {
    const arch = this.gameState.activeStory()?.characterArchetype || 'balanced';
    const labels: Record<string, string> = {
      balanced: 'Seimbang',
      warrior: 'Petarung / Pendekar',
      diplomat: 'Diplomat / Bangsawan',
      scout: 'Pengintai / Agen',
      scholar: 'Cendekiawan / Teknisi'
    };
    return labels[arch] || 'Seimbang';
  }

  getEffectiveStatNumber(statKey: string): number {
    this.gameState.stateVersion();
    const raw = this.gameState.mcState.stats?.[statKey];
    let base = 70;
    if (typeof raw === 'string' && raw.toLowerCase() === 'max') {
      base = 99;
    } else if (raw !== undefined) {
      const parsed = Number(raw);
      base = Number.isNaN(parsed) ? 70 : parsed;
    }
    const bonus = (this.gearBonuses as Record<string, number | undefined>)[statKey] ?? 0;
    return base + bonus;
  }

  getEffectiveStat(statKey: string): string {
    return this.getEffectiveStatNumber(statKey).toString();
  }

  getStatWidth(val: number | string | undefined): string {
    if (val === undefined || val === '') return '0%';
    if (typeof val === 'string' && val.toLowerCase() === 'max') return '100%';
    const num = Number(val);
    if (Number.isNaN(num)) return '0%';
    return `${Math.min(100, Math.max(0, num)).toString()}%`;
  }

  getRadarPolygonPoints(): string {
    const radius = 80;
    const center = 100;
    const clamp = (v: number) => Math.min(100, Math.max(10, v)) / 100;

    const str = clamp(this.getEffectiveStatNumber('strength'));
    const cha = clamp(this.getEffectiveStatNumber('charisma'));
    const sta = clamp(this.getEffectiveStatNumber('stamina'));
    const agi = clamp(this.getEffectiveStatNumber('agility'));

    const top = `${center},${Math.round(center - radius * str)}`;
    const right = `${Math.round(center + radius * cha)},${center}`;
    const bottom = `${center},${Math.round(center + radius * sta)}`;
    const left = `${Math.round(center - radius * agi)},${center}`;

    return `${top} ${right} ${bottom} ${left}`;
  }
}
