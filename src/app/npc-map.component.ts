import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GameStateService } from './game-state.service';
import type { NpcDailySchedule, NpcScheduleArchetype, NpcState } from './game-state.types';
import { KnowledgeGraphComponent } from './knowledge-graph.component';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-npc-map',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, KnowledgeGraphComponent],
  template: `
    <div class="flex flex-col h-full bg-zinc-950 text-zinc-200 font-sans overflow-hidden">
      
      <!-- Slim Inline Filter & Workspace Mode Bar (1px Hairline Border) -->
      <div class="h-9 border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 bg-zinc-950 shrink-0 text-xs">
        <!-- Left: Sub-View Line Switcher (Direktori NPC & Faksi | Graf Pengetahuan) -->
        <div class="flex items-center h-full gap-5 shrink-0">
          <button
            type="button"
            (click)="activeSection.set('directory')"
            [class.border-emerald-500]="activeSection() === 'directory'"
            [class.text-zinc-100]="activeSection() === 'directory'"
            [class.border-transparent]="activeSection() !== 'directory'"
            [class.text-zinc-500]="activeSection() !== 'directory'"
            class="h-full border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <mat-icon class="text-[14px] w-[14px] h-[14px]">groups</mat-icon>
            <span>Direktori NPC & Faksi ({{ getNpcs().length }})</span>
          </button>
          <button
            type="button"
            (click)="activeSection.set('graph')"
            [class.border-emerald-500]="activeSection() === 'graph'"
            [class.text-zinc-100]="activeSection() === 'graph'"
            [class.border-transparent]="activeSection() !== 'graph'"
            [class.text-zinc-500]="activeSection() !== 'graph'"
            class="h-full border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <mat-icon class="text-[14px] w-[14px] h-[14px]">hub</mat-icon>
            <span>Graf Pengetahuan</span>
          </button>
        </div>

        <!-- Right: Inline Search & Scope Filter (Visible in Directory Mode) -->
        @if (activeSection() === 'directory') {
          <div class="flex items-center gap-3 min-w-0">
            <div class="hidden sm:flex items-center gap-1.5 border-b border-zinc-800 focus-within:border-emerald-500 py-0.5 px-1">
              <mat-icon class="text-[13px] w-[13px] h-[13px] text-zinc-500">search</mat-icon>
              <input
                [formControl]="searchControl"
                type="text"
                placeholder="Cari karakter, peran, lokasi..."
                class="bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none w-40 lg:w-56"
              />
            </div>

            <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
              <button
                type="button"
                (click)="viewMode = 'all'"
                [class.text-emerald-400]="viewMode === 'all'"
                [class.text-zinc-500]="viewMode !== 'all'"
                class="hover:text-zinc-200 transition-colors whitespace-nowrap">
                Semua
              </button>
              <span class="text-zinc-800" aria-hidden="true">/</span>
              <button
                type="button"
                (click)="viewMode = 'local'"
                [class.text-emerald-400]="viewMode === 'local'"
                [class.text-zinc-500]="viewMode !== 'local'"
                class="hover:text-zinc-200 transition-colors whitespace-nowrap">
                Sekitar
              </button>
              <span class="text-zinc-800" aria-hidden="true">/</span>
              <button
                type="button"
                (click)="viewMode = 'rolling'"
                [class.text-emerald-400]="viewMode === 'rolling'"
                [class.text-zinc-500]="viewMode !== 'rolling'"
                class="hover:text-zinc-200 transition-colors whitespace-nowrap">
                Aktif
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Main Body -->
      @if (activeSection() === 'graph') {
        <div class="flex-1 overflow-hidden">
          <app-knowledge-graph></app-knowledge-graph>
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          <div class="max-w-[1440px] w-full mx-auto lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-800/80 min-h-full">
            
            <!-- Left Column (8/12): NPC Roster, Rich Profiles & Custom Editor (1px Divided) -->
            <div class="lg:col-span-8 p-4 sm:p-5">
              <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                <div class="flex items-center gap-3">
                  <h2 class="text-xs font-semibold text-zinc-300 tracking-tight">Daftar Karakter, Profil & Jadwal Harian</h2>
                  <span class="text-[11px] font-mono text-zinc-500 tabular-nums">
                    Lokasi Anda: {{ gameState.mcState.locationName || gameState.mcState.location || 'Titik Awal' }}
                  </span>
                </div>

                <button
                  type="button"
                  (click)="openCreateNpcForm()"
                  class="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                  <mat-icon class="text-[13px] w-[13px] h-[13px]">person_add</mat-icon>
                  <span>Tambah NPC Custom</span>
                </button>
              </div>

              <!-- New / Edit Custom NPC Drawer Form -->
              @if (editingNpcKey() !== null) {
                <form
                  [formGroup]="npcForm"
                  (ngSubmit)="saveCustomNpc()"
                  class="my-3 p-3.5 border border-zinc-800 bg-zinc-900/40 space-y-3 text-xs">
                  <div class="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div class="flex items-center gap-1.5 font-semibold text-zinc-200">
                      <mat-icon class="text-[14px] w-[14px] h-[14px] text-emerald-400">tune</mat-icon>
                      <span>{{ editingNpcKey() === '__NEW__' ? 'Tambah Karakter NPC Custom Baru' : 'Kustomisasi Profil & Jadwal NPC' }}</span>
                    </div>
                    <button
                      type="button"
                      (click)="cancelEditNpc()"
                      class="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-mono text-[11px]">
                      <mat-icon class="text-[13px] w-[13px] h-[13px]">close</mat-icon>
                      <span>Tutup</span>
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Nama Karakter</label>
                      <input
                        formControlName="nama"
                        type="text"
                        placeholder="Cth: Aiko / Hana / Riku"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Peran & Relasi</label>
                      <input
                        formControlName="peran"
                        type="text"
                        placeholder="Cth: Keluarga & Penghuni Kediaman"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Pola Jadwal Harian</label>
                      <select
                        formControlName="scheduleArchetype"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none">
                        <option value="resident">Penghuni Kediaman / Domestik (Resident)</option>
                        <option value="companion">Rekan Seperjalanan / Pendamping (Companion)</option>
                        <option value="scholar">Cendekiawan / Penelaah (Scholar)</option>
                        <option value="merchant">Pedagang / Pengrajin (Merchant)</option>
                        <option value="guard">Penjaga / Ksatria (Guard)</option>
                        <option value="shadow">Operatif Bayangan (Shadow)</option>
                        <option value="wanderer">Pengelana Umum (Wanderer)</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Lokasi Saat Ini / Basis</label>
                      <input
                        formControlName="lokasi"
                        type="text"
                        placeholder="Cth: Ruang Tamu Kediaman Takeshi"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Afiliasi Faksi / Lingkar</label>
                      <input
                        formControlName="faksi"
                        type="text"
                        placeholder="Cth: Keluarga & Penghuni Kediaman"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Kepercayaan Awal (0–100)</label>
                      <input
                        formControlName="trust"
                        type="number"
                        min="0"
                        max="100"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Kepribadian & Sifat</label>
                      <input
                        formControlName="kepribadian"
                        type="text"
                        placeholder="Cth: Hangat, telaten, dan perhatian pada detail"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Tujuan & Motivasi Pribadi</label>
                      <input
                        formControlName="tujuan"
                        type="text"
                        placeholder="Cth: Menjaga keharmonisan kediaman dan mendukung protagonis"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Aktivitas Saat Ini</label>
                      <input
                        formControlName="aktivitas"
                        type="text"
                        placeholder="Cth: Menyeduh teh hijau di dekat meja rendah."
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-1">Gaya Bicara & Mood</label>
                      <input
                        formControlName="gaya_bicara"
                        type="text"
                        placeholder="Cth: Akrab, lembut, dan santun"
                        class="w-full bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div class="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      (click)="cancelEditNpc()"
                      class="px-3 py-1 text-zinc-400 hover:text-zinc-200 font-mono text-[11px]">
                      Batal
                    </button>
                    <button
                      type="submit"
                      [disabled]="npcForm.invalid"
                      class="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center gap-1 transition-colors">
                      <mat-icon class="text-[14px] w-[14px] h-[14px]">check</mat-icon>
                      <span>Simpan Profil NPC</span>
                    </button>
                  </div>
                </form>
              }

              @if (getNpcs().length === 0) {
                <div class="py-10 text-center space-y-2 text-xs text-zinc-500">
                  <p>Tidak ada karakter yang cocok dengan filter saat ini.</p>
                  @if (viewMode !== 'all') {
                    <button
                      type="button"
                      (click)="viewMode = 'all'"
                      class="text-emerald-400 hover:text-emerald-300 font-mono underline underline-offset-4">
                      Tampilkan Semua Karakter
                    </button>
                  }
                </div>
              } @else {
                <div class="divide-y divide-zinc-800/60">
                  @for (npc of getNpcs(); track npc.key) {
                    @let displayName = npc.value.nama || npc.key.replaceAll('_', ' ');
                    @let schedule = getNpcSchedule(npc.key);
                    <div class="py-3 hover:bg-zinc-900/20 px-1 transition-colors space-y-2">
                      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                        <div class="min-w-0 space-y-1 flex-1">
                          <!-- Identity Header Line -->
                          <div class="flex flex-wrap items-baseline gap-2">
                            <h3 class="text-xs font-semibold text-zinc-100">{{ displayName }}</h3>
                            @if (npc.value.peran || npc.value.role) {
                              <span class="text-zinc-700" aria-hidden="true">·</span>
                              <span class="text-[11px] text-zinc-300">{{ npc.value.peran || npc.value.role }}</span>
                            }
                            @if (npc.value.faksi) {
                              <span class="text-zinc-700" aria-hidden="true">·</span>
                              <span class="text-[11px] text-amber-400/90 font-mono">{{ npc.value.faksi }}</span>
                            }
                            <span class="text-zinc-700" aria-hidden="true">·</span>
                            <span class="text-[10px] font-mono text-zinc-500">[{{ getArchetypeLabel(npc.key, npc.value) }}]</span>
                            @if (npc.value.mood) {
                              <span class="text-zinc-700" aria-hidden="true">·</span>
                              <span [class]="getMoodColorText(npc.value.mood) + ' text-[11px]'">{{ npc.value.mood }}</span>
                            }
                          </div>

                          <!-- Spatial & Current Activity Line -->
                          <div class="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                            @if (npc.value.lokasi || npc.value.location) {
                              <span class="text-emerald-400/90 font-mono text-[11px]">{{ npc.value.lokasi || npc.value.location }}</span>
                            }
                            @if ((npc.value.lokasi || npc.value.location) && (npc.value.aktivitas || npc.value.activity)) {
                              <span class="text-zinc-700" aria-hidden="true">·</span>
                            }
                            @if (npc.value.aktivitas || npc.value.activity) {
                              <span>{{ npc.value.aktivitas || npc.value.activity }}</span>
                            }
                            @if ((npc.value.aktivitas || npc.value.activity) === 'Berada sendirian setelah ditinggalkan.') {
                              <span class="text-[10px] font-mono text-amber-400/90">[Terkoreksi Topologi]</span>
                            } @else if (npc.value._fromSchedule) {
                              <span class="text-[10px] font-mono text-zinc-500">[Jadwal]</span>
                            }
                          </div>

                          <!-- Personality & Goal Line -->
                          @if (npc.value.kepribadian || npc.value.tujuan) {
                            <div class="text-[11px] text-zinc-500 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              @if (npc.value.kepribadian) {
                                <span><strong class="font-normal text-zinc-400">Sifat:</strong> {{ npc.value.kepribadian }}</span>
                              }
                              @if (npc.value.kepribadian && npc.value.tujuan) {
                                <span class="text-zinc-700" aria-hidden="true">·</span>
                              }
                              @if (npc.value.tujuan) {
                                <span><strong class="font-normal text-zinc-400">Tujuan:</strong> {{ npc.value.tujuan }}</span>
                              }
                            </div>
                          }
                        </div>

                        <!-- Right Action Bar -->
                        <div class="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                          <span class="text-zinc-500">Trust {{ getNpcTrust(displayName) }}/100</span>
                          <button
                            type="button"
                            (click)="toggleScheduleView(npc.key)"
                            class="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 whitespace-nowrap">
                            <mat-icon class="text-[13px] w-[13px] h-[13px]">schedule</mat-icon>
                            <span>Jadwal</span>
                          </button>
                          <button
                            type="button"
                            (click)="openEditNpcForm(npc.key, npc.value)"
                            class="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 whitespace-nowrap">
                            <mat-icon class="text-[13px] w-[13px] h-[13px]">edit</mat-icon>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            (click)="interactWithNpc(displayName)"
                            class="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 whitespace-nowrap">
                            <mat-icon class="text-[13px] w-[13px] h-[13px]">chat_bubble_outline</mat-icon>
                            <span>Temui</span>
                          </button>
                        </div>
                      </div>

                      <!-- Collapsible 6-Slot Daily Schedule View -->
                      @if (expandedScheduleKey() === npc.key && schedule) {
                        <div class="pt-2 mt-2 border-t border-zinc-800/70 space-y-1.5 text-[11px]">
                          <div class="flex items-center justify-between text-zinc-400 font-mono">
                            <span>Siklus Harian {{ displayName }} (Basis: {{ schedule.homeLocation }})</span>
                            <span>Pola: {{ getArchetypeLabel(npc.key, npc.value) }}</span>
                          </div>
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            @for (slot of schedule.slots; track slot.period) {
                              <div
                                [class.border-emerald-500/60]="isSlotActiveNow(slot.startHour, slot.endHour)"
                                [class.bg-emerald-950/20]="isSlotActiveNow(slot.startHour, slot.endHour)"
                                [class.border-zinc-800/70]="!isSlotActiveNow(slot.startHour, slot.endHour)"
                                class="border px-2.5 py-1.5 space-y-0.5">
                                <div class="flex items-center justify-between font-mono text-[10px]">
                                  <span class="text-zinc-400">{{ formatSlotRange(slot.startHour, slot.endHour) }}</span>
                                  <span class="text-emerald-400/90">{{ slot.lokasi }}</span>
                                </div>
                                <div class="text-zinc-300 leading-snug">{{ slot.aktivitas }}</div>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Right Column (4/12): World Setting & Factions Overview -->
            <div class="lg:col-span-4 p-4 sm:p-5 border-t lg:border-t-0 border-zinc-800/80 divide-y divide-zinc-800/80">
              <!-- Active World Info -->
              <section class="pb-5 space-y-2">
                <h3 class="text-xs font-semibold text-zinc-300 tracking-tight">Konteks Dunia Aktif</h3>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between py-1 border-b border-zinc-800/50">
                    <span class="text-zinc-500">Latar Dunia</span>
                    <span class="text-zinc-200 font-medium text-right">{{ gameState.activeStory()?.worldSetting || 'Dunia Terbuka' }}</span>
                  </div>
                  <div class="flex justify-between py-1 border-b border-zinc-800/50 font-mono tabular-nums">
                    <span class="text-zinc-500 font-sans">Waktu Dunia</span>
                    <span class="text-emerald-400">Hari {{ gameState.mcState.day || 1 }} · {{ gameState.mcState.time || '08:00' }}</span>
                  </div>
                  <div class="flex justify-between py-1 font-mono tabular-nums">
                    <span class="text-zinc-500 font-sans">Total Memori Lore</span>
                    <span class="text-zinc-200">{{ getKnowledgeEntityCount() }} Entitas</span>
                  </div>
                </div>
              </section>

              <!-- Factions List -->
              <section class="pt-5 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-semibold text-zinc-300 tracking-tight">Faksi & Kekuatan Sosial</h3>
                  <span class="text-[11px] font-mono text-zinc-500 tabular-nums">{{ getFactions().length }}</span>
                </div>

                <div class="divide-y divide-zinc-800/60">
                  @for (fac of getFactions(); track fac.id) {
                    <div class="py-2.5 first:pt-1 last:pb-0 space-y-1">
                      <div class="flex items-baseline justify-between gap-2">
                        <div class="text-xs font-semibold text-zinc-200">{{ fac.name }}</div>
                        <span class="text-[11px] font-mono text-zinc-400 tabular-nums">Rep {{ fac.reputation >= 0 ? '+' : '' }}{{ fac.reputation }}</span>
                      </div>
                      <p class="text-[11px] text-zinc-400 leading-relaxed">{{ fac.description }}</p>
                      @if (fac.leader) {
                        <div class="text-[10px] font-mono text-zinc-500">Tokoh Kunci: {{ fac.leader }}</div>
                      }
                    </div>
                  } @empty {
                    <div class="py-4 text-xs text-zinc-500">
                      Belum ada faksi yang terdaftar di dunia ini.
                    </div>
                  }
                </div>
              </section>
            </div>

          </div>
        </div>
      }
    </div>
  `
})
export class NpcMapComponent {
  gameState = inject(GameStateService);
  closeMap = output();

  activeSection = signal<'directory' | 'graph'>('directory');
  viewMode: 'all' | 'local' | 'rolling' = 'all';
  searchControl = new FormControl('');

  expandedScheduleKey = signal<string | null>(null);
  editingNpcKey = signal<string | null>(null);

  npcForm = new FormGroup({
    nama: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    peran: new FormControl('', { nonNullable: true }),
    scheduleArchetype: new FormControl<NpcScheduleArchetype>('resident', { nonNullable: true }),
    lokasi: new FormControl('', { nonNullable: true }),
    faksi: new FormControl('', { nonNullable: true }),
    trust: new FormControl(60, { nonNullable: true }),
    kepribadian: new FormControl('', { nonNullable: true }),
    tujuan: new FormControl('', { nonNullable: true }),
    aktivitas: new FormControl('', { nonNullable: true }),
    gaya_bicara: new FormControl('', { nonNullable: true })
  });

  getNpcs() {
    this.gameState.stateVersion();
    const allKeys = Object.keys(this.gameState.npcStates);
    let keys: string[] = [];

    if (this.viewMode === 'rolling') {
      keys = (this.gameState.rollingNpcKeys && this.gameState.rollingNpcKeys.length > 0)
        ? allKeys.filter(k => this.gameState.rollingNpcKeys.includes(k))
        : allKeys;
    } else if (this.viewMode === 'local') {
      const loc = (this.gameState.mcState.locationName ?? this.gameState.mcState.location ?? '').toLowerCase();
      keys = allKeys.filter(k => {
        const npc = this.gameState.npcStates[k];
        const npcLoc = (npc?.lokasi ?? npc?.location ?? '').toLowerCase();
        return loc.length > 0 && npcLoc.length > 0 && (npcLoc.includes(loc) || loc.includes(npcLoc));
      });
    } else {
      keys = allKeys;
    }

    const q = (this.searchControl.value || '').trim().toLowerCase();

    return keys
      .filter(key => Boolean(this.gameState.npcStates[key]))
      .map(key => ({
        key,
        value: this.gameState.npcStates[key]!
      }))
      .filter(item => {
        if (!q) return true;
        const name = (item.value.nama || item.key).toLowerCase();
        const role = (item.value.peran || item.value.role || '').toLowerCase();
        const loc = (item.value.lokasi || item.value.location || '').toLowerCase();
        const fac = (item.value.faksi || '').toLowerCase();
        return name.includes(q) || role.includes(q) || loc.includes(q) || fac.includes(q);
      });
  }

  getNpcSchedule(npcKey: string): NpcDailySchedule | undefined {
    this.gameState.stateVersion();
    return this.gameState.npcSchedules?.[npcKey];
  }

  getArchetypeLabel(npcKey: string, npc: NpcState): string {
    const arch = npc.scheduleArchetype || this.gameState.npcSchedules?.[npcKey]?.archetype || 'resident';
    switch (arch) {
      case 'resident':
        return 'Penghuni Kediaman';
      case 'companion':
        return 'Rekan Seperjalanan';
      case 'guard':
        return 'Penjaga & Patroli';
      case 'merchant':
        return 'Niaga & Kerajinan';
      case 'scholar':
        return 'Cendekiawan & Riset';
      case 'shadow':
        return 'Operatif Bayangan';
      default:
        return 'Pengelana';
    }
  }

  toggleScheduleView(npcKey: string) {
    if (this.expandedScheduleKey() === npcKey) {
      this.expandedScheduleKey.set(null);
    } else {
      const npc = this.gameState.npcStates[npcKey];
      if (npc) {
        this.gameState.ensureNpcSchedule(npcKey, npc);
      }
      this.expandedScheduleKey.set(npcKey);
    }
  }

  formatSlotRange(startHour: number, endHour: number): string {
    const pad = (n: number) => String(n).padStart(2, '0') + ':00';
    return `${pad(startHour)}–${pad(endHour)}`;
  }

  isSlotActiveNow(startHour: number, endHour: number): boolean {
    const rawTime = this.gameState.mcState.time || '08:00';
    const hour = Number.parseInt(rawTime.split(':')[0] || '8', 10);
    const normalizedHour = Number.isNaN(hour) ? 8 : ((hour % 24) + 24) % 24;
    if (startHour <= endHour) {
      return normalizedHour >= startHour && normalizedHour <= endHour;
    }
    return normalizedHour >= startHour || normalizedHour <= endHour;
  }

  openCreateNpcForm() {
    const currentLoc = this.gameState.mcState.locationName || this.gameState.mcState.location || 'Lokasi Saat Ini';
    const firstFaction = Object.keys(this.gameState.factions || {})[0] || 'Independen';
    this.npcForm.reset({
      nama: '',
      peran: `Penghuni & Kerabat ${currentLoc}`,
      scheduleArchetype: 'resident',
      lokasi: currentLoc,
      faksi: firstFaction,
      trust: 65,
      kepribadian: 'Hangat, perhatian, dan mudah diajak bekerja sama',
      tujuan: `Menjaga keharmonisan dan mendukung aktivitas di ${currentLoc}`,
      aktivitas: `Beraktivitas bersama di ${currentLoc}.`,
      gaya_bicara: 'Akrab, sopan, dan tenang'
    });
    this.editingNpcKey.set('__NEW__');
  }

  openEditNpcForm(npcKey: string, npc: NpcState) {
    const displayName = npc.nama || npcKey.replaceAll('_', ' ');
    const arch = npc.scheduleArchetype || this.gameState.npcSchedules?.[npcKey]?.archetype || 'resident';
    this.npcForm.reset({
      nama: displayName,
      peran: npc.peran || npc.role || '',
      scheduleArchetype: arch,
      lokasi: npc.lokasi || npc.location || '',
      faksi: npc.faksi || npc.faction || 'Independen',
      trust: this.getNpcTrust(displayName),
      kepribadian: npc.kepribadian || npc.personality || '',
      tujuan: npc.tujuan || npc.goal || '',
      aktivitas: npc.aktivitas || npc.activity || '',
      gaya_bicara: npc.gaya_bicara || npc.voiceStyle || ''
    });
    this.editingNpcKey.set(npcKey);
  }

  cancelEditNpc() {
    this.editingNpcKey.set(null);
  }

  saveCustomNpc() {
    if (this.npcForm.invalid) return;
    const val = this.npcForm.getRawValue();
    const editingKey = this.editingNpcKey();
    this.gameState.upsertCustomNpc({
      key: editingKey && editingKey !== '__NEW__' ? editingKey : undefined,
      nama: val.nama,
      peran: val.peran,
      scheduleArchetype: val.scheduleArchetype,
      lokasi: val.lokasi,
      faksi: val.faksi,
      trust: Number(val.trust),
      kepribadian: val.kepribadian,
      tujuan: val.tujuan,
      aktivitas: val.aktivitas,
      gaya_bicara: val.gaya_bicara
    });
    this.editingNpcKey.set(null);
  }

  getNpcTrust(displayName: string): number {
    return this.gameState.getNpcTrust(displayName);
  }

  interactWithNpc(displayName: string) {
    const actionPrompt = `Aku menemui ${displayName} dan memulai percakapan.`;
    this.gameState.queueStoryAction(actionPrompt);
  }

  getFactions(): { id: string; name: string; description: string; reputation: number; leader?: string | undefined }[] {
    this.gameState.stateVersion();
    const factions = this.gameState.factions || {};
    return Object.entries(factions).map(([id, val]) => {
      if (val && typeof val === 'object') {
        return {
          id,
          name: val.name || id.replace(/^FAC_/, '').replaceAll('_', ' '),
          description: val.description || '',
          reputation: typeof val.reputation === 'number' ? val.reputation : 0,
          leader: val.leader
        };
      }
      return {
        id,
        name: id.replace(/^FAC_/, '').replaceAll('_', ' '),
        description: String(val || ''),
        reputation: 0
      };
    });
  }

  getKnowledgeEntityCount(): number {
    return Object.keys(this.gameState.knowledgeGraph || {}).length;
  }

  getMoodColor(mood?: string): string {
    if (!mood) return 'text-zinc-500';
    const m = mood.toLowerCase();
    if (m.includes('marah') || m.includes('kesal') || m.includes('hostile')) return 'text-red-500';
    if (m.includes('waspada') || m.includes('curiga')) return 'text-amber-500';
    if (m.includes('sedih') || m.includes('murung')) return 'text-blue-500';
    if (m.includes('senang') || m.includes('ramah') || m.includes('hangat')) return 'text-emerald-500';
    return 'text-zinc-400';
  }
  
  getMoodColorText(mood?: string): string {
    if (!mood) return 'text-zinc-500';
    const m = mood.toLowerCase();
    if (m.includes('marah') || m.includes('kesal') || m.includes('hostile')) return 'text-red-400';
    if (m.includes('waspada') || m.includes('curiga')) return 'text-amber-400';
    if (m.includes('sedih') || m.includes('murung')) return 'text-blue-400';
    if (m.includes('senang') || m.includes('ramah') || m.includes('hangat')) return 'text-emerald-400';
    return 'text-zinc-300';
  }
}
