import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../game-state.service';
import { resolveItemInfo } from '../item-system';
import { NpcTrustDisplay, getEffectiveGearBonuses } from './character.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-character-profile',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="divide-y divide-zinc-800/80 text-zinc-200">
      
      <!-- 1. Protagonist Identity & Combat Rating (Unboxed Minimalist Line Header) -->
      <section class="pb-5 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 truncate">
                {{ getPlayerName() }}
              </h2>
              <button 
                type="button"
                (click)="openEditProfile()" 
                class="p-1 text-zinc-500 hover:text-emerald-400 transition-colors shrink-0"
                title="Ubah Nama & Gelar Karakter">
                <mat-icon class="text-[15px] w-[15px] h-[15px]">edit</mat-icon>
              </button>
            </div>

            <!-- Unboxed Metadata Line: Title · Level · Condition -->
            <div class="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-zinc-400 font-mono tabular-nums">
              <span class="text-emerald-400 font-sans font-medium">{{ getPlayerTitle() }}</span>
              <span class="text-zinc-700" aria-hidden="true">·</span>
              <span class="text-amber-400">Lv. {{ getPlayerLevel() }}</span>
              <span class="text-zinc-700" aria-hidden="true">·</span>
              <span class="text-zinc-300 font-sans">{{ gameState.mcState.status || 'Healthy' }}</span>
            </div>

            <!-- Protagonist Characterization Details (Personality, Background, Goal) -->
            <div class="mt-2.5 space-y-1 text-[11px] text-zinc-400 leading-relaxed">
              <div>
                <span class="text-zinc-500 font-mono">Sifat:</span>
                <span class="text-zinc-300 ml-1">{{ getPlayerPersonality() }}</span>
              </div>
              <div>
                <span class="text-zinc-500 font-mono">Latar:</span>
                <span class="text-zinc-300 ml-1">{{ getPlayerBackground() }}</span>
              </div>
              <div>
                <span class="text-zinc-500 font-mono">Tujuan:</span>
                <span class="text-emerald-400/90 ml-1">{{ getPlayerGoal() }}</span>
              </div>
            </div>
          </div>

          <!-- Right Metric: Combat Rating -->
          <div class="text-right shrink-0 font-mono tabular-nums">
            <span class="text-[10px] uppercase tracking-wider text-zinc-500 block">Rating Tempur</span>
            <span class="text-lg font-bold text-amber-400">{{ getCombatRating() }}</span>
          </div>
        </div>

        <!-- Hairline EXP Bar -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center text-[11px] font-mono tabular-nums text-zinc-400">
            <span>Pengalaman (EXP)</span>
            <span>{{ getPlayerExp() }} / {{ getPlayerMaxExp() }} ({{ getExpPercent() }}%)</span>
          </div>
          <div class="w-full bg-zinc-900 h-1 overflow-hidden">
            <div 
              class="bg-amber-400 h-full transition-transform duration-200 origin-left" 
              [style.width]="getExpPercent() + '%'">
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Vitality Bars (HP & SP) & Quick Recovery -->
      <section class="py-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold text-zinc-300 tracking-tight">Vitalitas & Energi</h3>
          @if (hasConsumablesInInventory()) {
            <button 
              type="button"
              (click)="quickConsumeFood()"
              class="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 whitespace-nowrap">
              <mat-icon class="text-[13px] w-[13px] h-[13px]">restaurant</mat-icon>
              <span>Pulihkan Cepat</span>
            </button>
          }
        </div>

        <div class="grid grid-cols-2 gap-6">
          <!-- HP -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-baseline text-xs font-mono tabular-nums">
              <span class="text-zinc-400">HP</span>
              <span class="text-zinc-100 font-semibold">{{ getPlayerHp() }} <span class="text-zinc-500">/ {{ getPlayerMaxHp() }}</span></span>
            </div>
            <div class="w-full bg-zinc-900 h-1.5 overflow-hidden">
              <div 
                class="h-full transition-all duration-200"
                [class.bg-emerald-500]="getHpPercent() > 50"
                [class.bg-amber-500]="getHpPercent() <= 50 && getHpPercent() > 25"
                [class.bg-red-500]="getHpPercent() <= 25"
                [style.width]="getHpPercent() + '%'">
              </div>
            </div>
          </div>

          <!-- SP -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-baseline text-xs font-mono tabular-nums">
              <span class="text-zinc-400">SP</span>
              <span class="text-zinc-100 font-semibold">{{ getPlayerSp() }} <span class="text-zinc-500">/ {{ getPlayerMaxSp() }}</span></span>
            </div>
            <div class="w-full bg-zinc-900 h-1.5 overflow-hidden">
              <div 
                class="bg-cyan-400 h-full transition-all duration-200" 
                [style.width]="getSpPercent() + '%'">
              </div>
            </div>
          </div>
        </div>

        <!-- Active Combat Notice (Unboxed Line Alert) -->
        @if (gameState.combat.inCombat) {
          <div class="pt-3 border-t border-red-900/50 flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 text-red-400 font-mono">
              <mat-icon class="text-[15px] w-[15px] h-[15px]">warning</mat-icon>
              <span>Pertarungan Aktif · {{ gameState.combat.enemies.length }} Musuh</span>
            </div>
            <button
              type="button"
              (click)="gameState.activeTab.set('story')"
              class="text-xs font-mono text-red-300 hover:text-white underline underline-offset-4 whitespace-nowrap">
              Buka Kronik
            </button>
          </div>
        }

        <!-- Last Story Impact (Clean Editorial Line Summary) -->
        @if (gameState.mcState.lastStoryImpact; as impact) {
          <div class="pt-3 border-t border-zinc-800/60 space-y-1.5 text-xs">
            <div class="flex items-center justify-between text-[11px] font-mono text-zinc-500 tabular-nums">
              <span class="text-emerald-400">Dampak Putaran Terakhir</span>
              <span>{{ impact.timestamp }}</span>
            </div>
            <p class="text-zinc-300 italic font-serif text-xs leading-relaxed">
              "{{ impact.summary }}"
            </p>
            <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums text-zinc-400">
              @if (impact.hpDelta) {
                <span [class.text-red-400]="impact.hpDelta < 0" [class.text-emerald-400]="impact.hpDelta > 0">
                  {{ impact.hpDelta > 0 ? '+' : '' }}{{ impact.hpDelta }} HP
                </span>
              }
              @if (impact.spDelta) {
                <span [class.text-blue-400]="impact.spDelta < 0" [class.text-cyan-400]="impact.spDelta > 0">
                  {{ impact.spDelta > 0 ? '+' : '' }}{{ impact.spDelta }} SP
                </span>
              }
              @if (impact.expGained) {
                <span class="text-amber-400">+{{ impact.expGained }} EXP</span>
              }
              @if (impact.itemsAdded && impact.itemsAdded.length > 0) {
                <span class="text-zinc-300">+{{ impact.itemsAdded.join(', ') }}</span>
              }
            </div>
          </div>
        }
      </section>

      <!-- 3. Factions & NPC Relations List (1px Hairline Rows) -->
      <section class="pt-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold text-zinc-300 tracking-tight">Relasi Karakter & Faksi</h3>
          <span class="text-[11px] font-mono text-zinc-500 tabular-nums">{{ getNpcTrustList().length }} Entitas</span>
        </div>

        @if (getFactionEntries().length > 0) {
          <div class="py-2 border-b border-zinc-800/60 space-y-1.5">
            <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Faksi Dunia</span>
            @for (fac of getFactionEntries(); track fac.id) {
              <div class="flex items-baseline justify-between gap-2 text-xs py-0.5">
                <span class="text-zinc-200 font-medium truncate">{{ fac.name }}</span>
                <span class="text-[11px] text-zinc-400 truncate max-w-[60%] text-right">{{ fac.stance }}</span>
              </div>
            }
          </div>
        }

        <div class="divide-y divide-zinc-800/60">
          @for (npc of getNpcTrustList(); track npc.name) {
            <div class="py-3 first:pt-1 last:pb-0 space-y-1.5">
              <div class="flex items-baseline justify-between gap-2">
                <div class="min-w-0 flex items-baseline gap-1.5 flex-wrap">
                  <span class="text-xs font-semibold text-zinc-100">{{ npc.name }}</span>
                  <span class="text-zinc-700" aria-hidden="true">·</span>
                  <span class="text-[11px] text-zinc-400">{{ npc.tier }}</span>
                  @if (getTrustDelta(npc.name); as delta) {
                    <span class="text-[10px] font-mono tabular-nums"
                          [class.text-emerald-400]="delta > 0"
                          [class.text-red-400]="delta < 0">
                      ({{ delta > 0 ? '+' : '' }}{{ delta }})
                    </span>
                  }
                </div>

                <div class="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                  <span class="text-amber-400">{{ npc.value }}/100</span>
                  <button 
                    type="button"
                    (click)="onInteractNpcInStory(npc.name)"
                    class="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 whitespace-nowrap"
                    title="Ajak bicara di Chronicle">
                    <mat-icon class="text-[13px] w-[13px] h-[13px]">chat_bubble_outline</mat-icon>
                    <span>Bicara</span>
                  </button>
                </div>
              </div>

              <!-- Unboxed NPC Metadata: Faction · Location · Mood -->
              @if (npc.faction || npc.location || npc.mood) {
                <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                  @if (npc.faction) {
                    <span class="text-zinc-400">{{ npc.faction }}</span>
                  }
                  @if (npc.faction && npc.location) {
                    <span class="text-zinc-700" aria-hidden="true">·</span>
                  }
                  @if (npc.location) {
                    <span>{{ npc.location }}</span>
                  }
                  @if ((npc.faction || npc.location) && npc.mood) {
                    <span class="text-zinc-700" aria-hidden="true">·</span>
                  }
                  @if (npc.mood) {
                    <span class="italic text-zinc-400">"{{ npc.mood }}"</span>
                  }
                </div>
              }

              <!-- 1px Trust Line -->
              <div class="w-full bg-zinc-900 h-1 overflow-hidden">
                <div class="h-full transition-all duration-200" [class]="npc.barColor" [style.width]="npc.value + '%'"></div>
              </div>
            </div>
          } @empty {
            <div class="py-6 text-xs text-zinc-500">
              Belum ada karakter yang ditemui dalam kronik ini.
            </div>
          }
        </div>
      </section>
    </div>

    <!-- MODAL: EDIT PROFILE -->
    @if (showProfileModal) {
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-zinc-950 border border-zinc-800 max-w-md w-full p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 class="text-xs font-semibold text-zinc-100 uppercase tracking-wider font-mono">Kustomisasi Detail Karakter Utama</h4>
            <button 
              type="button"
              (click)="showProfileModal = false" 
              class="text-zinc-500 hover:text-zinc-100 transition-colors">
              <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
            </button>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] text-zinc-400 block mb-1">Nama Karakter</label>
                <input 
                  [formControl]="nameControl"
                  type="text" 
                  class="w-full bg-zinc-900/50 border-b border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Nama Karakter"
                >
              </div>

              <div>
                <label class="text-[11px] text-zinc-400 block mb-1">Gelar / Peran</label>
                <input 
                  [formControl]="titleControl"
                  type="text" 
                  class="w-full bg-zinc-900/50 border-b border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Gelar / Peran"
                >
              </div>
            </div>

            <div>
              <label class="text-[11px] text-zinc-400 block mb-1">Kepribadian & Pembawaan</label>
              <input 
                [formControl]="personalityControl"
                type="text" 
                class="w-full bg-zinc-900/50 border-b border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Cth: Tenang, bijaksana, dan perhatian pada keluarga"
              >
            </div>

            <div>
              <label class="text-[11px] text-zinc-400 block mb-1">Latar Belakang Singkat</label>
              <input 
                [formControl]="backgroundControl"
                type="text" 
                class="w-full bg-zinc-900/50 border-b border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Cth: Tuan rumah Kediaman Takeshi yang menghargai kedamaian"
              >
            </div>

            <div>
              <label class="text-[11px] text-zinc-400 block mb-1">Tujuan / Motivasi Utama</label>
              <input 
                [formControl]="goalControl"
                type="text" 
                class="w-full bg-zinc-900/50 border-b border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Cth: Menjaga keharmonisan kediaman dan melindungi kerabat"
              >
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button 
              type="button"
              (click)="showProfileModal = false" 
              class="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
              Batal
            </button>
            <button 
              type="button"
              (click)="onSaveProfile()" 
              class="px-4 py-1.5 border border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1">
              <mat-icon class="text-[14px] w-[14px] h-[14px]">check</mat-icon>
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CharacterProfileComponent {
  gameState = inject(GameStateService);
  toast = output<string>();

  showProfileModal = false;
  nameControl = new FormControl('');
  titleControl = new FormControl('');
  personalityControl = new FormControl('');
  backgroundControl = new FormControl('');
  goalControl = new FormControl('');

  get gearBonuses() {
    this.gameState.stateVersion();
    return getEffectiveGearBonuses(
      this.gameState.mcState.equipped,
      this.gameState.mcState.inventory
    );
  }

  getPlayerName(): string {
    this.gameState.stateVersion();
    const name = this.gameState.mcState.name;
    return typeof name === 'string' && name.trim().length > 0 ? name : (this.gameState.activeStory()?.mcName || 'Protagonis');
  }

  getPlayerTitle(): string {
    this.gameState.stateVersion();
    const title = this.gameState.mcState.title;
    return typeof title === 'string' && title.trim().length > 0 ? title : (this.gameState.activeStory()?.mcTitle || 'Pengembara');
  }

  getPlayerPersonality(): string {
    this.gameState.stateVersion();
    return (
      this.gameState.mcState.personality ||
      this.gameState.activeStory()?.mcPersonality ||
      `Tenang, jeli mengamati sekitar, dan bertindak sebagai ${this.getPlayerTitle()}`
    );
  }

  getPlayerBackground(): string {
    this.gameState.stateVersion();
    const loc = this.gameState.mcState.locationName || this.gameState.activeStory()?.locationName || 'Titik Awal';
    const world = this.gameState.activeStory()?.worldSetting || 'Dunia Petualangan';
    return (
      this.gameState.mcState.background ||
      this.gameState.activeStory()?.mcBackground ||
      `Seorang ${this.getPlayerTitle()} yang memulai langkah di ${loc} (${world})`
    );
  }

  getPlayerGoal(): string {
    this.gameState.stateVersion();
    const world = this.gameState.activeStory()?.worldSetting || 'Dunia Petualangan';
    return (
      this.gameState.mcState.goal ||
      this.gameState.activeStory()?.mcGoal ||
      `Menentukan arah perjalanan dan menyelesaikan tujuan di ${world}`
    );
  }

  getPlayerLevel(): number {
    this.gameState.stateVersion();
    return this.gameState.mcState.level ?? 1;
  }

  getPlayerExp(): number {
    return this.gameState.mcState.exp ?? 35;
  }

  getPlayerMaxExp(): number {
    return this.gameState.mcState.maxExp ?? 100;
  }

  getExpPercent(): number {
    const exp = this.getPlayerExp();
    const max = this.getPlayerMaxExp();
    if (max <= 0) return 0;
    return Math.min(100, Math.round((exp / max) * 100));
  }

  getPlayerHp(): number {
    const hp = this.gameState.mcState.stats?.['hp'];
    if (hp !== undefined) {
      const num = Number(hp);
      return Number.isNaN(num) ? 85 : num;
    }
    return 85;
  }

  getPlayerMaxHp(): number {
    const maxHp = this.gameState.mcState.stats?.['maxHp'];
    const bonus = this.gearBonuses.maxHp ?? 0;
    if (maxHp !== undefined) {
      const num = Number(maxHp);
      return (Number.isNaN(num) ? 100 : num) + bonus;
    }
    return 100 + bonus;
  }

  getHpPercent(): number {
    const hp = this.getPlayerHp();
    const max = this.getPlayerMaxHp();
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((hp / max) * 100)));
  }

  getPlayerSp(): number {
    const sp = this.gameState.mcState.stats?.['sp'];
    if (sp !== undefined) {
      const num = Number(sp);
      return Number.isNaN(num) ? 42 : num;
    }
    return 42;
  }

  getPlayerMaxSp(): number {
    const maxSp = this.gameState.mcState.stats?.['maxSp'];
    const bonus = this.gearBonuses.maxSp ?? 0;
    if (maxSp !== undefined) {
      const num = Number(maxSp);
      return (Number.isNaN(num) ? 50 : num) + bonus;
    }
    return 50 + bonus;
  }

  getSpPercent(): number {
    const sp = this.getPlayerSp();
    const max = this.getPlayerMaxSp();
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((sp / max) * 100)));
  }

  getEffectiveStatNumber(statKey: string): number {
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

  getCombatRating(): number {
    const hp = this.getPlayerHp();
    const sp = this.getPlayerSp();
    const str = this.getEffectiveStatNumber('strength');
    const cha = this.getEffectiveStatNumber('charisma');
    const sta = this.getEffectiveStatNumber('stamina');
    const agi = this.getEffectiveStatNumber('agility');

    return Math.round(hp * 0.3 + sp * 0.4 + str * 1.2 + agi * 1 + sta * 0.8 + cha * 0.5);
  }

  hasConsumablesInInventory(): boolean {
    const list = this.gameState.mcState.inventory ?? [];
    return list.some(item => {
      const info = resolveItemInfo(item);
      return info.category === 'consumable' || info.consumableEffect !== undefined;
    });
  }

  quickConsumeFood() {
    const list = this.gameState.mcState.inventory ?? [];
    const food = list.find(item => {
      const info = resolveItemInfo(item);
      return info.category === 'consumable' || info.consumableEffect !== undefined;
    });

    if (food !== undefined) {
      const res = this.gameState.useItem(food);
      this.toast.emit(res.message);
    }
  }

  getTrustDelta(npcName: string): number | null {
    this.gameState.stateVersion();
    const changes = this.gameState.mcState.lastStoryImpact?.trustChanges;
    if (!changes || changes[npcName] === undefined) return null;
    return changes[npcName];
  }

  getFactionEntries(): { id: string; name: string; stance: string }[] {
    this.gameState.stateVersion();
    const factions = this.gameState.factions || {};
    return Object.entries(factions).map(([id, val]) => {
      if (val && typeof val === 'object') {
        const rep = typeof val.reputation === 'number' ? val.reputation : 0;
        const tier = GameStateService.getFactionReputationTier(rep);
        return {
          id,
          name: val.name || id.replace(/^FAC_/, '').replace(/_/g, ' '),
          stance: `Rep ${rep >= 0 ? '+' : ''}${rep} (${tier.label})`
        };
      }
      return {
        id,
        name: id.replace(/^FAC_/, '').replace(/_/g, ' '),
        stance: String(val || '')
      };
    });
  }

  getNpcTrustList(): NpcTrustDisplay[] {
    this.gameState.stateVersion();
    const trustObj: Record<string, number | string> = { ...(this.gameState.mcState.trust ?? {}) };

    for (const [npcKey, state] of Object.entries(this.gameState.npcStates)) {
      const displayName = state.nama || npcKey.replace(/^NPC_/, '').replace(/_\d+$/, '');
      if (displayName && trustObj[displayName] === undefined && trustObj[npcKey] === undefined) {
        trustObj[displayName] = 50;
      }
    }

    const list: NpcTrustDisplay[] = [];

    for (const [rawName, rawVal] of Object.entries(trustObj)) {
      const npcState = Object.values(this.gameState.npcStates).find(s => s.nama === rawName)
        || this.gameState.npcStates[rawName];
      const displayName = npcState?.nama || rawName.replace(/^NPC_/, '').replace(/_\d+$/, '');

      const num = typeof rawVal === 'number' ? rawVal : (typeof rawVal === 'string' ? Number.parseInt(rawVal, 10) : 50);
      const clamped = Number.isNaN(num) ? 50 : Math.min(100, Math.max(0, num));

      let tier = 'Netral';
      let badgeClass = 'text-zinc-400';
      let barColor = 'bg-zinc-500';

      if (clamped >= 80) {
        tier = 'Sekutu Erat';
        badgeClass = 'text-emerald-400';
        barColor = 'bg-emerald-500';
      } else if (clamped >= 60) {
        tier = 'Sahabat';
        badgeClass = 'text-teal-400';
        barColor = 'bg-teal-500';
      } else if (clamped >= 40) {
        tier = 'Kenalan';
        badgeClass = 'text-zinc-400';
        barColor = 'bg-zinc-500';
      } else if (clamped >= 20) {
        tier = 'Waspada';
        badgeClass = 'text-amber-400';
        barColor = 'bg-amber-500';
      } else {
        tier = 'Bermusuhan';
        badgeClass = 'text-red-400';
        barColor = 'bg-red-500';
      }

      list.push({
        name: displayName,
        value: clamped,
        tier,
        badgeClass,
        barColor,
        location: npcState?.lokasi ?? npcState?.location,
        mood: npcState?.mood,
        faction: npcState?.faksi
      });
    }

    return list;
  }

  onInteractNpcInStory(npcName: string) {
    const actionPrompt = `Aku menghampiri ${npcName} dan mengajaknya berbicara tentang situasi terkini.`;
    this.gameState.queueStoryAction(actionPrompt);
    this.toast.emit(`Aksi berbicara dengan ${npcName} disiapkan di Chronicle.`);
  }

  openEditProfile() {
    this.nameControl.setValue(this.getPlayerName());
    this.titleControl.setValue(this.getPlayerTitle());
    this.personalityControl.setValue(this.getPlayerPersonality());
    this.backgroundControl.setValue(this.getPlayerBackground());
    this.goalControl.setValue(this.getPlayerGoal());
    this.showProfileModal = true;
  }

  onSaveProfile() {
    const nameVal = this.nameControl.value;
    const titleVal = this.titleControl.value;
    const defaultName = this.gameState.activeStory()?.mcName || 'Protagonis';
    const defaultTitle = this.gameState.activeStory()?.mcTitle || 'Pengembara';
    const name = typeof nameVal === 'string' && nameVal.trim().length > 0 ? nameVal.trim() : defaultName;
    const title = typeof titleVal === 'string' && titleVal.trim().length > 0 ? titleVal.trim() : defaultTitle;
    this.gameState.updateProfile(name, title, {
      personality: this.personalityControl.value || undefined,
      background: this.backgroundControl.value || undefined,
      goal: this.goalControl.value || undefined
    });
    this.showProfileModal = false;
    this.toast.emit('Profil & karakterisasi protagonis berhasil diperbarui.');
  }
}
