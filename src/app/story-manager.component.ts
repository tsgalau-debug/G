import { ChangeDetectionStrategy, Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';
import {
  GameStateService,
  type CreateStoryPayload,
  type CharacterArchetype,
  type InitialCustomNpcInput,
  type NpcScheduleArchetype
} from './game-state.service';
import { resolveInitialCharacterStats } from './world-genesis';

interface StoryPreset {
  title: string;
  mcName: string;
  mcTitle: string;
  mcPersonality?: string;
  mcBackground?: string;
  mcGoal?: string;
  worldSetting: string;
  locationName: string;
  initialWeapon: string;
  characterArchetype: CharacterArchetype;
  prologuePrompt: string;
  initialNpcs?: InitialCustomNpcInput[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-story-manager',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <mat-icon class="text-[20px] w-[20px] h-[20px]">auto_stories</mat-icon>
            </div>
            <div>
              <h2 class="text-base font-bold text-zinc-100 tracking-tight leading-snug">Daftar Cerita & Studio Kustomisasi</h2>
              <p class="text-xs text-zinc-400">Pilih cerita yang sedang berjalan atau rancang cerita kustom lengkap dengan detail MC & NPC awal.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            @if (!isCreatingNew()) {
              <button 
                id="btn-open-create-story"
                type="button"
                (click)="openCreateModal()" 
                class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">add</mat-icon>
                <span>Cerita Baru</span>
              </button>
            }
            <button 
              id="btn-close-story-manager"
              type="button"
              (click)="close.emit()" 
              aria-label="Tutup Manajer Cerita"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
              <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Notification Banner -->
        @if (feedbackMessage()) {
          <div class="px-5 py-2 bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <mat-icon class="text-[16px] w-[16px] h-[16px]">check_circle</mat-icon>
            <span>{{ feedbackMessage() }}</span>
          </div>
        }

        <!-- Main Content Area: List vs Form -->
        <div class="flex-1 overflow-y-auto p-5">
          @if (isCreatingNew()) {
            <!-- Form: Create New Story -->
            <div class="space-y-5">
              <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <h3 class="text-sm font-bold text-zinc-100">Studio Konfigurasi Cerita Baru</h3>
                  <p class="text-xs text-zinc-400">Sesuaikan latar dunia, karakterisasi mendalam protagonis (MC), serta daftar tokoh NPC pendamping awal.</p>
                </div>
                <button 
                  type="button"
                  (click)="isCreatingNew.set(false)" 
                  class="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors">
                  <mat-icon class="text-[14px] w-[14px] h-[14px]">arrow_back</mat-icon>
                  <span>Kembali ke Daftar</span>
                </button>
              </div>

              <!-- Quick Presets -->
              <div>
                <label class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-2 block">
                  Template Cepat (Atau Tulis Cerita Kustom Anda Sendiri di Bawah)
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  @for (preset of presets; track preset.title) {
                    <button 
                      type="button"
                      (click)="applyPreset(preset)" 
                      class="text-left p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/40 transition-all text-xs group">
                      <div class="font-semibold text-zinc-200 group-hover:text-emerald-400 truncate">{{ preset.title }}</div>
                      <div class="text-[10px] text-zinc-500 truncate">{{ preset.mcName }} &bull; {{ preset.mcTitle }}</div>
                    </button>
                  }
                </div>
              </div>

              <!-- New Story Form -->
              <form [formGroup]="createForm" (ngSubmit)="onCreateStorySubmit()" class="space-y-4">
                <!-- Core World & MC Identity Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs font-semibold text-zinc-300 block mb-1">Judul Cerita *</label>
                    <input 
                      id="input-story-title"
                      type="text" 
                      formControlName="title"
                      placeholder="cth: Senja Tenang di Kediaman Takeshi"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500">
                    @if (createForm.get('title')?.touched && createForm.get('title')?.invalid) {
                      <span class="text-[10px] text-rose-400 mt-1 block">Judul cerita wajib diisi.</span>
                    }
                  </div>

                  <div>
                    <label class="text-xs font-semibold text-zinc-300 block mb-1">Latar Dunia / Genre Setting *</label>
                    <input 
                      id="input-world-setting"
                      type="text" 
                      formControlName="worldSetting"
                      placeholder="cth: Desa Lembah Sakura / Cyberpunk Neo-Jakarta / Kerajaan Fantasi"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500">
                  </div>

                  <div>
                    <label class="text-xs font-semibold text-zinc-300 block mb-1">Nama Protagonis (MC) *</label>
                    <input 
                      id="input-mc-name"
                      type="text" 
                      formControlName="mcName"
                      placeholder="cth: Takeshi / Ren / Elena"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500">
                  </div>

                  <div>
                    <label class="text-xs font-semibold text-zinc-300 block mb-1">Gelar / Peran MC *</label>
                    <input 
                      id="input-mc-title"
                      type="text" 
                      formControlName="mcTitle"
                      placeholder="cth: Tuan Rumah / Detektif Swasta / Pengembara Pedang"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500">
                  </div>

                  <div>
                    <label class="text-xs font-semibold text-zinc-300 block mb-1">Lokasi Awal Cerita *</label>
                    <input 
                      id="input-location-name"
                      type="text" 
                      formControlName="locationName"
                      placeholder="cth: Ruang Tamu Kediaman Takeshi / Pelabuhan Kabut"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500">
                  </div>

                  <div>
                    <label class="text-xs font-semibold text-zinc-300 block mb-1">Senjata / Benda Pegangan Utama</label>
                    <input 
                      id="input-initial-weapon"
                      type="text" 
                      formControlName="initialWeapon"
                      placeholder="cth: Kipas Lipat Kayu / Katana Warisan / Buku Catatan"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500">
                  </div>
                </div>

                <!-- Character Archetype & Live Starting Stats Preview -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label class="text-xs font-semibold text-zinc-300 block mb-1">Spesialisasi Atribut Karakter</label>
                    <select
                      id="input-mc-archetype"
                      formControlName="characterArchetype"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500">
                      <option value="balanced">Seimbang (Serbabisa)</option>
                      <option value="warrior">Petarung / Pendekar (STR & HP Tinggi)</option>
                      <option value="diplomat">Diplomat / Tuan Rumah (CHA & Negosiasi)</option>
                      <option value="scout">Pengintai / Agen (AGI & Taktik)</option>
                      <option value="scholar">Cendekiawan / Peneliti (SP & Fokus Tinggi)</option>
                    </select>
                  </div>
                  @let previewStats = getPreviewStats();
                  <div class="bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <span class="text-emerald-400">HP {{ previewStats['hp'] }}</span>
                    <span class="text-sky-400">SP {{ previewStats['sp'] }}</span>
                    <span class="text-zinc-300">STR {{ previewStats['strength'] }}</span>
                    <span class="text-zinc-300">CHA {{ previewStats['charisma'] }}</span>
                    <span class="text-zinc-300">STA {{ previewStats['stamina'] }}</span>
                    <span class="text-zinc-300">AGI {{ previewStats['agility'] }}</span>
                  </div>
                </div>

                <!-- Collapsible Deep Customization Section: Custom MC Details & Custom Initial NPCs -->
                <div class="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                  <div class="px-3.5 py-2.5 bg-zinc-900/70 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-4 text-xs">
                      <button
                        type="button"
                        (click)="customSectionTab.set('mc')"
                        [class.text-emerald-400]="customSectionTab() === 'mc'"
                        [class.font-semibold]="customSectionTab() === 'mc'"
                        [class.text-zinc-400]="customSectionTab() !== 'mc'"
                        class="flex items-center gap-1.5 transition-colors">
                        <mat-icon class="text-[15px] w-[15px] h-[15px]">badge</mat-icon>
                        <span>Detail Karakter Utama (MC)</span>
                      </button>
                      <span class="text-zinc-700" aria-hidden="true">|</span>
                      <button
                        type="button"
                        (click)="customSectionTab.set('npcs')"
                        [class.text-emerald-400]="customSectionTab() === 'npcs'"
                        [class.font-semibold]="customSectionTab() === 'npcs'"
                        [class.text-zinc-400]="customSectionTab() !== 'npcs'"
                        class="flex items-center gap-1.5 transition-colors">
                        <mat-icon class="text-[15px] w-[15px] h-[15px]">groups</mat-icon>
                        <span>Tokoh NPC Custom Awal ({{ customInitialNpcs().length }})</span>
                      </button>
                    </div>
                    <span class="text-[10px] font-mono text-zinc-500">Mendukung Kustomisasi Penuh</span>
                  </div>

                  @if (customSectionTab() === 'mc') {
                    <div class="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="text-[11px] text-zinc-400 block mb-1">Kepribadian & Pembawaan MC</label>
                        <input
                          type="text"
                          formControlName="mcPersonality"
                          placeholder="cth: Tenang, hangat, namun tegas melindungi keluarga"
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label class="text-[11px] text-zinc-400 block mb-1">Tujuan / Motivasi Utama MC</label>
                        <input
                          type="text"
                          formControlName="mcGoal"
                          placeholder="cth: Menjaga ketenangan kediaman & menguak misteri masa lalu"
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label class="text-[11px] text-zinc-400 block mb-1">Latar Belakang Singkat MC</label>
                        <input
                          type="text"
                          formControlName="mcBackground"
                          placeholder="cth: Mantan pengelana yang kini menetap bersama kerabatnya"
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label class="text-[11px] text-zinc-400 block mb-1">Barang Bawaan Awal Tambahan (Pisahkan Koma)</label>
                        <input
                          type="text"
                          formControlName="customInventoryText"
                          placeholder="cth: Kunci Kediaman, Gulungan Kaligrafi, Cincin Pusaka"
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  } @else {
                    <div class="p-3.5 space-y-3">
                      <div class="flex items-center justify-between text-xs">
                        <p class="text-[11px] text-zinc-400">
                          Tambahkan tokoh NPC custom yang langsung hadir sejak Giliran 0 (selain yang otomatis diekstrak dari teks prolog).
                        </p>
                      </div>

                      <!-- Add Custom NPC Sub-Row -->
                      <div [formGroup]="draftNpcForm" class="grid grid-cols-1 sm:grid-cols-6 gap-2 bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/80">
                        <input
                          type="text"
                          formControlName="nama"
                          placeholder="Nama NPC (cth: Aiko)"
                          class="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          formControlName="peran"
                          placeholder="Peran (cth: Adik / Rekan)"
                          class="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        <select
                          formControlName="scheduleArchetype"
                          class="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500">
                          <option value="resident">Penghuni Kediaman</option>
                          <option value="companion">Rekan Seperjalanan</option>
                          <option value="scholar">Cendekiawan</option>
                          <option value="merchant">Pedagang</option>
                          <option value="guard">Penjaga</option>
                          <option value="shadow">Operatif Bayangan</option>
                        </select>
                        <input
                          type="text"
                          formControlName="kepribadian"
                          placeholder="Sifat (cth: Hangat & teliti)"
                          class="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          formControlName="aktivitas"
                          placeholder="Aktivitas awal..."
                          class="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          (click)="addDraftInitialNpc()"
                          class="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs rounded flex items-center justify-center gap-1 transition-colors">
                          <mat-icon class="text-[14px] w-[14px] h-[14px]">person_add</mat-icon>
                          <span>Tambah NPC</span>
                        </button>
                      </div>

                      @if (customInitialNpcs().length > 0) {
                        <div class="divide-y divide-zinc-800/70 border border-zinc-800/70 rounded-lg bg-zinc-950/50">
                          @for (npc of customInitialNpcs(); track npc.nama; let idx = $index) {
                            <div class="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                              <div class="min-w-0 flex-1">
                                <span class="font-semibold text-zinc-100">{{ npc.nama }}</span>
                                <span class="text-zinc-600 mx-1.5">·</span>
                                <span class="text-emerald-400 text-[11px]">{{ npc.peran }}</span>
                                <span class="text-zinc-600 mx-1.5">·</span>
                                <span class="font-mono text-[10px] text-zinc-400">[{{ npc.scheduleArchetype }}]</span>
                                @if (npc.kepribadian) {
                                  <span class="text-zinc-600 mx-1.5">·</span>
                                  <span class="text-zinc-400 text-[11px]">{{ npc.kepribadian }}</span>
                                }
                              </div>
                              <button
                                type="button"
                                (click)="removeDraftInitialNpc(idx)"
                                class="text-zinc-500 hover:text-rose-400 transition-colors p-1">
                                <mat-icon class="text-[14px] w-[14px] h-[14px]">delete</mat-icon>
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>

                <div>
                  <label class="text-xs font-semibold text-zinc-300 block mb-1">Prolog / Adegan Pertama (Tokoh yang Disebut Otomatis Masuk ke Direktori NPC)</label>
                  <textarea 
                    id="input-prologue"
                    rows="3"
                    formControlName="prologuePrompt"
                    placeholder="Tuliskan adegan pembuka... (Contoh: Aku duduk di ruang tamu bersama Aiko yang sedang menyeduh teh hangat, sementara Hana merapikan halaman depan.)"
                    class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"></textarea>
                </div>

                <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button 
                    type="button"
                    (click)="isCreatingNew.set(false)"
                    class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors">
                    Batal
                  </button>
                  <button 
                    id="btn-submit-new-story"
                    type="submit"
                    [disabled]="createForm.invalid || isBusy()"
                    class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm">
                    <mat-icon class="text-[16px] w-[16px] h-[16px]">play_arrow</mat-icon>
                    <span>Mulai Cerita Baru</span>
                  </button>
                </div>
              </form>
            </div>
          } @else {
            <!-- Stories Grid View -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              @for (story of gameState.availableStories(); track story.id) {
                <div 
                  [class.border-emerald-500]="story.id === gameState.activeStoryId()"
                  [class.bg-emerald-950\/10]="story.id === gameState.activeStoryId()"
                  class="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-zinc-700 relative group">
                  
                  <div>
                    <!-- Card Top Header -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                          {{ story.title }}
                        </h4>
                        @if (story.id === gameState.activeStoryId()) {
                          <span class="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Aktif
                          </span>
                        }
                      </div>

                      <span class="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md shrink-0">
                        {{ story.turnCount || 0 }} Giliran
                      </span>
                    </div>

                    <!-- Protagonist and Location Specs -->
                    <div class="grid grid-cols-2 gap-2 text-xs py-2 my-2 border-y border-zinc-800/60 font-sans">
                      <div>
                        <span class="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Protagonis</span>
                        <span class="text-zinc-200 font-semibold">{{ story.mcName }}</span>
                        <span class="text-zinc-500 text-[11px] block">({{ story.mcTitle || 'Pengembara' }})</span>
                      </div>
                      <div>
                        <span class="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Dunia & Lokasi</span>
                        <span class="text-zinc-200 font-semibold truncate block">{{ story.locationName }}</span>
                        <span class="text-zinc-500 text-[11px] truncate block">{{ story.worldSetting }}</span>
                      </div>
                    </div>

                    <!-- Summary / Excerpt -->
                    @if (story.summary) {
                      <p class="text-xs text-zinc-400 line-clamp-2 italic font-serif mb-3">
                        "{{ story.summary }}"
                      </p>
                    }
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/50 mt-2">
                    <span class="text-[10px] font-mono text-zinc-500">
                      {{ formatLastPlayed(story.lastPlayedAt) }}
                    </span>

                    <div class="flex items-center gap-1.5">
                      @if (story.id !== gameState.activeStoryId()) {
                        <button 
                          type="button"
                          (click)="onSwitchStory(story.id)"
                          [disabled]="isBusy()"
                          class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1">
                          <mat-icon class="text-[14px] w-[14px] h-[14px]">play_circle</mat-icon>
                          <span>Pilih</span>
                        </button>
                      } @else {
                        <button 
                          type="button"
                          (click)="onContinueCurrent()"
                          class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1">
                          <mat-icon class="text-[14px] w-[14px] h-[14px]">arrow_forward</mat-icon>
                          <span>Lanjut</span>
                        </button>
                      }

                      <!-- Branch/Duplicate button -->
                      <button 
                        type="button"
                        (click)="onDuplicateStory(story.id)"
                        [disabled]="isBusy()"
                        title="Buat Cabang Timeline Baru Dari Cerita Ini"
                        class="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-purple-300 transition-colors">
                        <mat-icon class="text-[15px] w-[15px] h-[15px]">fork_right</mat-icon>
                      </button>

                      <!-- Reset button -->
                      @if (story.id === gameState.activeStoryId()) {
                        <button 
                          type="button"
                          (click)="onResetCurrentStory()"
                          [disabled]="isBusy()"
                          title="Reset Kisah Ini ke Titik Awal"
                          class="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 transition-colors">
                          <mat-icon class="text-[15px] w-[15px] h-[15px]">restart_alt</mat-icon>
                        </button>
                      }

                      <!-- Delete button (disabled if only 1 story) -->
                      @if (gameState.availableStories().length > 1) {
                        <button 
                          type="button"
                          (click)="onDeleteStory(story.id)"
                          [disabled]="isBusy()"
                          title="Hapus Cerita Ini"
                          class="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors">
                          <mat-icon class="text-[15px] w-[15px] h-[15px]">delete</mat-icon>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class StoryManagerComponent {
  gameState = inject(GameStateService);
  close = output<void>();

  isCreatingNew = signal<boolean>(false);
  isBusy = signal<boolean>(false);
  feedbackMessage = signal<string | null>(null);
  customSectionTab = signal<'mc' | 'npcs'>('mc');
  customInitialNpcs = signal<InitialCustomNpcInput[]>([]);

  presets: StoryPreset[] = [
    {
      title: 'Senja di Kediaman Takeshi',
      mcName: 'Takeshi',
      mcTitle: 'Tuan Rumah Kediaman',
      mcPersonality: 'Tenang, bijaksana, dan sangat peduli pada keharmonisan rumah',
      mcBackground: 'Pemilik Kediaman Takeshi di Desa Lembah Sakura yang hidup berdampingan bersama kerabat dekatnya',
      mcGoal: 'Menjaga kedamaian keseharian di Kediaman Takeshi dan mempererat ikatan keluarga',
      worldSetting: 'Desa Lembah Sakura',
      locationName: 'Ruang Tamu Kediaman Takeshi',
      initialWeapon: 'Kipas Lipat Kayu',
      characterArchetype: 'diplomat',
      prologuePrompt: 'Aku duduk bersantai di ruang tamu bersama Aiko yang sedang menyeduh teh hijau hangat, sementara Hana merapikan gulungan kaligrafi di dekat beranda.',
      initialNpcs: [
        {
          nama: 'Aiko',
          peran: 'Keluarga & Penghuni Kediaman Takeshi',
          scheduleArchetype: 'resident',
          kepribadian: 'Lembut, perhatian, dan telaten mengurus kediaman',
          tujuan: 'Menjaga kenyamanan Kediaman Takeshi bersama Takeshi',
          aktivitas: 'Menyeduh teh hijau hangat di meja rendah ruang tamu.',
          trust: 80
        },
        {
          nama: 'Hana',
          peran: 'Sahabat & Penghuni Kediaman Takeshi',
          scheduleArchetype: 'resident',
          kepribadian: 'Ceria, rapi, dan menyukai seni kaligrafi',
          tujuan: 'Merawat koleksi gulungan keluarga dan halaman kediaman',
          aktivitas: 'Merapikan gulungan kaligrafi di dekat beranda ruang tamu.',
          trust: 75
        }
      ]
    },
    {
      title: 'Petualangan di Desa Yamato',
      mcName: 'Kuro',
      mcTitle: 'Pengembara Pedang',
      worldSetting: 'Dunia Auralis: Desa Yamato',
      locationName: 'Desa Yamato',
      initialWeapon: 'Pedang Legendaris',
      characterArchetype: 'balanced',
      prologuePrompt: 'Tiba di Desa Yamato setelah perjalanan panjang melintasi lembah kabut. Angin berhembus sejuk membawa aroma rempah pasar desa.'
    },
    {
      title: 'Bayangan Klan Kage',
      mcName: 'Ren',
      mcTitle: 'Shinobi Bayangan',
      worldSetting: 'Lembah Kabut Kage',
      locationName: 'Puncak Jurang Gagak',
      initialWeapon: 'Belati Kembar Chidori',
      characterArchetype: 'scout',
      prologuePrompt: 'Berdiri di dahan pohon cemara kuno mengamati benteng musuh di kejauhan di bawah guyuran hujan gerimis.'
    },
    {
      title: 'Penyihir Kristal Auralis',
      mcName: 'Elena',
      mcTitle: 'Arkana Penjelajah',
      worldSetting: 'Kekaisaran Auralis',
      locationName: 'Perpustakaan Kuno Ibukota',
      initialWeapon: 'Tongkat Kristal Biru',
      characterArchetype: 'scholar',
      prologuePrompt: 'Membuka gulungan naskah sihir kuno yang bersinar di tengah keheningan ruang arkana ibukota.'
    },
    {
      title: 'Sang Kurir Distrik Neon',
      mcName: 'Kenji',
      mcTitle: 'Operatif Jalanan',
      worldSetting: 'Kota Cyber Neon-Aura',
      locationName: 'Lorong Sektor 7',
      initialWeapon: 'Pedang Plasma Termal',
      characterArchetype: 'warrior',
      prologuePrompt: 'Menyalakan motor magi-cyber di bawah guyuran lampu neon gang sempit, bersiap mengantarkan paket rahasia.'
    }
  ];

  createForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(2)]),
    mcName: new FormControl('', [Validators.required]),
    mcTitle: new FormControl('Pengembara', [Validators.required]),
    mcPersonality: new FormControl(''),
    mcBackground: new FormControl(''),
    mcGoal: new FormControl(''),
    customInventoryText: new FormControl(''),
    worldSetting: new FormControl('Dunia Petualangan', [Validators.required]),
    locationName: new FormControl('Gerbang Kota', [Validators.required]),
    initialWeapon: new FormControl('Pedang Tempa'),
    characterArchetype: new FormControl<CharacterArchetype>('balanced'),
    prologuePrompt: new FormControl('')
  });

  draftNpcForm = new FormGroup({
    nama: new FormControl('', { nonNullable: true }),
    peran: new FormControl('', { nonNullable: true }),
    scheduleArchetype: new FormControl<NpcScheduleArchetype>('resident', { nonNullable: true }),
    kepribadian: new FormControl('', { nonNullable: true }),
    aktivitas: new FormControl('', { nonNullable: true })
  });

  getPreviewStats(): Record<string, number> {
    const raw = this.createForm.value;
    return resolveInitialCharacterStats(
      (raw.characterArchetype as CharacterArchetype) || 'balanced',
      raw.mcTitle || 'Pengembara'
    );
  }

  openCreateModal() {
    this.createForm.reset({
      title: '',
      mcName: '',
      mcTitle: 'Pengembara',
      mcPersonality: '',
      mcBackground: '',
      mcGoal: '',
      customInventoryText: '',
      worldSetting: 'Dunia Petualangan',
      locationName: 'Gerbang Kota',
      initialWeapon: 'Pedang Tempa',
      characterArchetype: 'balanced',
      prologuePrompt: ''
    });
    this.customInitialNpcs.set([]);
    this.customSectionTab.set('mc');
    this.isCreatingNew.set(true);
  }

  applyPreset(preset: StoryPreset) {
    this.createForm.patchValue({
      title: preset.title,
      mcName: preset.mcName,
      mcTitle: preset.mcTitle,
      mcPersonality: preset.mcPersonality || '',
      mcBackground: preset.mcBackground || '',
      mcGoal: preset.mcGoal || '',
      worldSetting: preset.worldSetting,
      locationName: preset.locationName,
      initialWeapon: preset.initialWeapon,
      characterArchetype: preset.characterArchetype,
      prologuePrompt: preset.prologuePrompt
    });
    this.customInitialNpcs.set(preset.initialNpcs ? [...preset.initialNpcs] : []);
  }

  addDraftInitialNpc() {
    const val = this.draftNpcForm.getRawValue();
    const nama = val.nama.trim();
    if (!nama) return;
    const loc = (this.createForm.value.locationName || 'Lokasi Awal').trim();
    const newNpc: InitialCustomNpcInput = {
      nama,
      peran: val.peran.trim() || `Penghuni & Rekan di ${loc}`,
      scheduleArchetype: val.scheduleArchetype,
      kepribadian: val.kepribadian.trim() || 'Tenang, perhatian, dan mudah berinteraksi',
      tujuan: `Mendukung perjalanan dan beraktivitas di ${loc}`,
      lokasi: loc,
      aktivitas: val.aktivitas.trim() || `Berada di ${loc}.`,
      trust: 70
    };
    const existing = this.customInitialNpcs().filter(n => n.nama.toLowerCase() !== nama.toLowerCase());
    this.customInitialNpcs.set([...existing, newNpc]);
    this.draftNpcForm.reset({
      nama: '',
      peran: '',
      scheduleArchetype: 'resident',
      kepribadian: '',
      aktivitas: ''
    });
  }

  removeDraftInitialNpc(index: number) {
    const next = [...this.customInitialNpcs()];
    next.splice(index, 1);
    this.customInitialNpcs.set(next);
  }

  async onCreateStorySubmit() {
    if (this.createForm.invalid || this.isBusy()) return;

    this.isBusy.set(true);
    try {
      const raw = this.createForm.value;
      const customInventory = (raw.customInventoryText || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload: CreateStoryPayload = {
        title: raw.title || 'Kisah Baru',
        mcName: raw.mcName || 'Protagonis',
        mcTitle: raw.mcTitle || 'Pengembara',
        mcPersonality: raw.mcPersonality?.trim() || undefined,
        mcBackground: raw.mcBackground?.trim() || undefined,
        mcGoal: raw.mcGoal?.trim() || undefined,
        customInventory: customInventory.length > 0 ? customInventory : undefined,
        initialNpcs: this.customInitialNpcs().length > 0 ? this.customInitialNpcs() : undefined,
        worldSetting: raw.worldSetting || 'Dunia Petualangan',
        locationName: raw.locationName || 'Gerbang Kota',
        initialWeapon: raw.initialWeapon || 'Pedang Tempa',
        characterArchetype: (raw.characterArchetype as CharacterArchetype) || 'balanced',
        prologuePrompt: raw.prologuePrompt || ''
      };

      await this.gameState.createNewStory(payload);
      this.feedbackMessage.set(`Kisah baru "${payload.title}" berhasil dibuat dan diaktifkan!`);
      setTimeout(() => {
        this.close.emit();
      }, 600);
    } catch (err) {
      console.error("Gagal membuat cerita baru:", err);
    } finally {
      this.isBusy.set(false);
    }
  }

  async onSwitchStory(storyId: string) {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    try {
      const ok = await this.gameState.switchStory(storyId);
      if (ok) {
        this.feedbackMessage.set("Berhasil beralih cerita.");
        setTimeout(() => {
          this.close.emit();
        }, 400);
      }
    } finally {
      this.isBusy.set(false);
    }
  }

  onContinueCurrent() {
    this.gameState.activeTab.set('story');
    this.close.emit();
  }

  async onDuplicateStory(storyId: string) {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    try {
      await this.gameState.duplicateStory(storyId);
      this.feedbackMessage.set("Cabang timeline baru berhasil dibuat!");
      setTimeout(() => {
        this.close.emit();
      }, 500);
    } catch (err) {
      console.error("Gagal menduplikasi cerita:", err);
    } finally {
      this.isBusy.set(false);
    }
  }

  async onResetCurrentStory() {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    try {
      await this.gameState.resetCurrentStory();
      this.feedbackMessage.set("Kisah berhasil di-reset ke kondisi awal.");
      setTimeout(() => {
        this.close.emit();
      }, 500);
    } finally {
      this.isBusy.set(false);
    }
  }

  async onDeleteStory(storyId: string) {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    try {
      await this.gameState.deleteStory(storyId);
      this.feedbackMessage.set("Cerita berhasil dihapus.");
      setTimeout(() => {
        this.feedbackMessage.set(null);
      }, 2000);
    } finally {
      this.isBusy.set(false);
    }
  }

  formatLastPlayed(timestamp?: number): string {
    if (!timestamp) return 'Baru saja';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return `${Math.floor(diff / 86400000)} hari lalu`;
  }
}
