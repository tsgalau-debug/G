/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from './game-state.service';
import { LoreEngineService } from './rag/lore-engine.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-knowledge-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-zinc-950 text-zinc-200 relative overflow-hidden">
      <!-- Top Control & Search Bar -->
      <div class="px-4 py-2.5 border-b border-zinc-800/80 z-20 flex flex-wrap items-center justify-between gap-3 bg-zinc-950 shrink-0 text-xs">
        <div class="flex items-center gap-2 min-w-0">
          <mat-icon class="text-fuchsia-400 text-[16px] w-[16px] h-[16px] shrink-0">hub</mat-icon>
          <span class="font-semibold text-zinc-100 tracking-tight truncate">Jejaring Memori & Studio Lore Custom</span>
          <span class="text-zinc-600 hidden sm:inline" aria-hidden="true">·</span>
          <span class="text-[11px] text-zinc-400 font-mono hidden sm:inline tabular-nums">
            {{ getEntityKeys().length }} Entitas · {{ getTotalFactsCount() }} Fakta Aktif
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Search Input -->
          <div class="relative flex items-center">
            <mat-icon class="text-zinc-500 text-[14px] w-[14px] h-[14px] absolute left-2.5 pointer-events-none">search</mat-icon>
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Cari entitas atau lore..."
              class="bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-6 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500/60 w-40 sm:w-48"
            />
            @if (searchControl.value) {
              <button
                type="button"
                (click)="clearSearch()"
                class="absolute right-1.5 text-zinc-500 hover:text-zinc-300 flex items-center"
                title="Bersihkan pencarian"
              >
                <mat-icon class="text-[13px] w-[13px] h-[13px]">close</mat-icon>
              </button>
            }
          </div>

          <!-- Segmented View Switcher -->
          <div class="flex items-center gap-0.5 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button
              type="button"
              (click)="setViewMode('split')"
              class="px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors"
              [class.bg-zinc-800]="viewMode() === 'split'"
              [class.text-zinc-100]="viewMode() === 'split'"
              [class.text-zinc-400]="viewMode() !== 'split'"
            >
              <mat-icon class="text-[13px] w-[13px] h-[13px]">bubble_chart</mat-icon>
              <span>Graf + Editor</span>
            </button>
            <button
              type="button"
              (click)="setViewMode('catalog')"
              class="px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors"
              [class.bg-zinc-800]="viewMode() === 'catalog'"
              [class.text-zinc-100]="viewMode() === 'catalog'"
              [class.text-zinc-400]="viewMode() !== 'catalog'"
            >
              <mat-icon class="text-[13px] w-[13px] h-[13px]">menu_book</mat-icon>
              <span>Katalog Lore</span>
            </button>
          </div>

          <!-- Add New Fact Button -->
          <button
            type="button"
            (click)="openCreateFactForm()"
            class="px-2.5 py-1 rounded-lg bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/40 text-fuchsia-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <mat-icon class="text-[14px] w-[14px] h-[14px]">add_circle</mat-icon>
            <span>Tambah Lore</span>
          </button>
        </div>
      </div>

      <!-- Feedback Banner -->
      @if (feedbackMessage()) {
        <div class="px-4 py-1.5 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between z-20 shrink-0">
          <div class="flex items-center gap-1.5">
            <mat-icon class="text-[14px] w-[14px] h-[14px] text-emerald-400">check_circle</mat-icon>
            <span>{{ feedbackMessage() }}</span>
          </div>
          <span class="text-[10px] font-mono text-emerald-400/80">Tersinkron ke Prompt AI & Vektor RAG</span>
        </div>
      }

      <!-- Quick Entity Selector Bar -->
      <div class="px-4 py-1.5 bg-zinc-950/90 border-b border-zinc-900 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 z-10 text-[11px]">
        <span class="text-zinc-500 font-mono text-[10px] uppercase tracking-wider shrink-0 mr-1">Entitas:</span>
        @for (entityKey of getFilteredEntityKeys(); track entityKey) {
          <button
            type="button"
            (click)="selectEntityByName(entityKey)"
            class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer border"
            [class.bg-indigo-600/25]="selectedEntityKey() === entityKey"
            [class.border-indigo-500/50]="selectedEntityKey() === entityKey"
            [class.text-indigo-200]="selectedEntityKey() === entityKey"
            [class.bg-zinc-900/80]="selectedEntityKey() !== entityKey"
            [class.border-zinc-800]="selectedEntityKey() !== entityKey"
            [class.text-zinc-400]="selectedEntityKey() !== entityKey"
          >
            <span>{{ entityKey }}</span>
            <span class="text-[10px] font-mono text-zinc-500">({{ getFacts(entityKey).length }})</span>
          </button>
        }
      </div>

      <!-- Main Content Area: Split (D3 Graph + Side/Bottom Editor) OR Full Lore Catalog -->
      <div class="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        <!-- D3 Force Graph Canvas (Shown in 'split' mode) -->
        <div
          class="relative flex-1 min-h-[240px] h-full overflow-hidden bg-zinc-950"
          [class.hidden]="viewMode() === 'catalog'"
        >
          <div #graphContainer class="w-full h-full relative overflow-hidden" (window:resize)="onResize()"></div>
          <div class="absolute top-2.5 left-3 pointer-events-none text-[10px] text-zinc-500 font-mono flex items-center gap-2">
            <span>Klik simpul untuk inspeksi/edit</span>
            <span aria-hidden="true">·</span>
            <span>Scroll untuk zoom</span>
          </div>
        </div>

        <!-- Right / Bottom Interactive Lore Studio Panel -->
        <div
          class="bg-zinc-900/95 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col min-h-0 overflow-y-auto custom-scrollbar"
          [class.lg:w-[410px]]="viewMode() === 'split'"
          [class.max-h-[48%]]="viewMode() === 'split'"
          [class.lg:max-h-full]="viewMode() === 'split'"
          [class.w-full]="viewMode() === 'catalog'"
          [class.h-full]="viewMode() === 'catalog'"
        >
          <!-- Add / Edit Lore Form Drawer -->
          @if (isFormOpen()) {
            <form
              [formGroup]="loreForm"
              (ngSubmit)="submitLoreForm()"
              class="p-4 bg-zinc-950/90 border-b border-zinc-800 space-y-3 shrink-0"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <mat-icon class="text-fuchsia-400 text-[15px] w-[15px] h-[15px]">edit_note</mat-icon>
                  <span class="text-xs font-bold text-zinc-100">
                    {{ editingOriginalFact() ? 'Edit Fakta Memori AI' : 'Suntikkan Fakta / Lore Baru ke AI' }}
                  </span>
                </div>
                <button
                  type="button"
                  (click)="closeLoreForm()"
                  class="text-zinc-500 hover:text-zinc-300 flex items-center cursor-pointer"
                >
                  <mat-icon class="text-[15px] w-[15px] h-[15px]">close</mat-icon>
                </button>
              </div>

              <!-- Quick Entity Presets -->
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                    Nama Entitas / Subjek Lore
                  </label>
                  <div class="flex flex-wrap items-center gap-1 text-[10px]">
                    @for (preset of getQuickEntitySuggestions(); track preset.label) {
                      <button
                        type="button"
                        (click)="fillEntityPreset(preset.value)"
                        class="text-fuchsia-400 hover:text-fuchsia-300 hover:underline cursor-pointer font-mono"
                      >
                        +{{ preset.label }}
                      </button>
                    }
                  </div>
                </div>
                <input
                  type="text"
                  formControlName="entity"
                  placeholder="Misal: Takeshi, Aiko, Hukum Lembah Sakura..."
                  class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <!-- Fact Textarea -->
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">
                  Isi Fakta / Aturan Dunia / Ingatan Persisten
                </label>
                <textarea
                  rows="3"
                  formControlName="fact"
                  placeholder="Tulis fakta kanon atau memori yang wajib diingat AI di setiap giliran..."
                  class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500 resize-none leading-relaxed"
                ></textarea>
              </div>

              <!-- Priority Weight Selector -->
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">
                  Prioritas Injeksi Prompt AI & Bobot Vektor RAG
                </label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    (click)="setFormWeight(1.0)"
                    class="px-2 py-1.5 rounded-lg border text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    [class.bg-zinc-800]="loreForm.controls.weight.value === 1.0"
                    [class.border-zinc-600]="loreForm.controls.weight.value === 1.0"
                    [class.text-zinc-100]="loreForm.controls.weight.value === 1.0"
                    [class.bg-zinc-900]="loreForm.controls.weight.value !== 1.0"
                    [class.border-zinc-800]="loreForm.controls.weight.value !== 1.0"
                    [class.text-zinc-400]="loreForm.controls.weight.value !== 1.0"
                  >
                    <mat-icon class="text-[12px] w-[12px] h-[12px]">memory</mat-icon>
                    <span>Standar (1.0x)</span>
                  </button>
                  <button
                    type="button"
                    (click)="setFormWeight(1.5)"
                    class="px-2 py-1.5 rounded-lg border text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    [class.bg-indigo-950/60]="loreForm.controls.weight.value === 1.5"
                    [class.border-indigo-500/60]="loreForm.controls.weight.value === 1.5"
                    [class.text-indigo-200]="loreForm.controls.weight.value === 1.5"
                    [class.bg-zinc-900]="loreForm.controls.weight.value !== 1.5"
                    [class.border-zinc-800]="loreForm.controls.weight.value !== 1.5"
                    [class.text-zinc-400]="loreForm.controls.weight.value !== 1.5"
                  >
                    <mat-icon class="text-[12px] w-[12px] h-[12px]">priority_high</mat-icon>
                    <span>Penting (1.5x)</span>
                  </button>
                  <button
                    type="button"
                    (click)="setFormWeight(2.0)"
                    class="px-2 py-1.5 rounded-lg border text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    [class.bg-fuchsia-950/60]="loreForm.controls.weight.value === 2.0"
                    [class.border-fuchsia-500/60]="loreForm.controls.weight.value === 2.0"
                    [class.text-fuchsia-200]="loreForm.controls.weight.value === 2.0"
                    [class.bg-zinc-900]="loreForm.controls.weight.value !== 2.0"
                    [class.border-zinc-800]="loreForm.controls.weight.value !== 2.0"
                    [class.text-zinc-400]="loreForm.controls.weight.value !== 2.0"
                  >
                    <mat-icon class="text-[12px] w-[12px] h-[12px]">star</mat-icon>
                    <span>Kanon (2.0x)</span>
                  </button>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  (click)="closeLoreForm()"
                  class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <mat-icon class="text-[13px] w-[13px] h-[13px]">close</mat-icon>
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  [disabled]="loreForm.invalid"
                  class="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <mat-icon class="text-[13px] w-[13px] h-[13px]">save</mat-icon>
                  <span>{{ editingOriginalFact() ? 'Simpan Perubahan' : 'Ikat ke Memori AI' }}</span>
                </button>
              </div>
            </form>
          }

          <!-- Entity Facts Inspector & Catalog List -->
          <div class="p-4 space-y-4 flex-1">
            @for (entityKey of getDisplayedInspectorEntities(); track entityKey) {
              <div class="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-3.5 space-y-2.5">
                <div class="flex items-start justify-between gap-2 border-b border-zinc-900 pb-2">
                  <div>
                    <h4 class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      <mat-icon class="text-[14px] w-[14px] h-[14px] text-indigo-400">account_tree</mat-icon>
                      <span>{{ entityKey }}</span>
                    </h4>
                    <p class="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {{ getFacts(entityKey).length }} fakta terikat · Aktif di memori AI
                    </p>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      (click)="openCreateFactForm(entityKey)"
                      class="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-fuchsia-300 border border-zinc-800 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                      title="Tambah fakta pada entitas ini"
                    >
                      <mat-icon class="text-[12px] w-[12px] h-[12px]">add</mat-icon>
                      <span>Tambah</span>
                    </button>
                    <button
                      type="button"
                      (click)="deleteEntireEntity(entityKey)"
                      class="p-1 rounded-md bg-zinc-900 hover:bg-red-950/60 text-zinc-500 hover:text-red-400 border border-zinc-800 text-[10px] flex items-center cursor-pointer"
                      title="Hapus seluruh simpul entitas ini"
                    >
                      <mat-icon class="text-[13px] w-[13px] h-[13px]">delete_sweep</mat-icon>
                    </button>
                  </div>
                </div>

                <ul class="space-y-2">
                  @for (fact of getFacts(entityKey); track fact) {
                    @let weight = getFactWeight(entityKey, fact);
                    <li class="group bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 rounded-lg p-2.5 flex flex-col gap-1.5 transition-colors">
                      <p class="text-[11px] text-zinc-200 leading-relaxed break-words">
                        {{ fact }}
                      </p>
                      <div class="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/50 text-[10px]">
                        <div class="flex items-center gap-1.5 text-zinc-400 font-mono">
                          <span
                            [class.text-fuchsia-400]="weight >= 1.8"
                            [class.font-bold]="weight >= 1.8"
                            [class.text-indigo-300]="weight >= 1.3 && weight < 1.8"
                          >
                            {{ getWeightLabel(weight) }}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Bobot {{ weight | number:'1.1-1' }}x</span>
                        </div>

                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            (click)="toggleCanonWeight(entityKey, fact)"
                            class="px-1.5 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-0.5 cursor-pointer"
                            [class.text-fuchsia-400]="weight >= 1.8"
                            [class.text-zinc-400]="weight < 1.8"
                            title="Sematkan sebagai Hukum Kanon Utama (2.0x) agar selalu masuk prompt AI"
                          >
                            <mat-icon class="text-[12px] w-[12px] h-[12px]">star</mat-icon>
                            <span>Kanon</span>
                          </button>
                          <button
                            type="button"
                            (click)="openEditFactForm(entityKey, fact)"
                            class="px-1.5 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center gap-0.5 cursor-pointer"
                            title="Edit isi fakta ini"
                          >
                            <mat-icon class="text-[12px] w-[12px] h-[12px]">edit</mat-icon>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            (click)="deleteFact(entityKey, fact)"
                            class="px-1.5 py-0.5 rounded bg-zinc-950 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 flex items-center gap-0.5 cursor-pointer"
                            title="Hapus fakta ini dari ingatan AI"
                          >
                            <mat-icon class="text-[12px] w-[12px] h-[12px]">delete</mat-icon>
                          </button>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            } @empty {
              <div class="text-center py-8 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 space-y-2">
                <mat-icon class="text-zinc-600 text-2xl">psychology</mat-icon>
                <p class="text-xs text-zinc-300 font-medium">Belum ada fakta memori yang cocok.</p>
                <p class="text-[11px] text-zinc-500">
                  Klik tombol <strong>Tambah Lore</strong> di atas untuk menyuntikkan aturan dunia, latar belakang, atau rahasia karakter ke dalam ingatan jangka panjang AI.
                </p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class KnowledgeGraphComponent implements AfterViewInit, OnDestroy {
  readonly container = viewChild<ElementRef<HTMLDivElement>>('graphContainer');

  gameState = inject(GameStateService);
  loreEngine = inject(LoreEngineService);
  private cdr = inject(ChangeDetectorRef);

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;

  nodeCount = 0;
  linkCount = 0;
  selectedNode: any = null;

  viewMode = signal<'split' | 'catalog'>('split');
  selectedEntityKey = signal<string | null>(null);
  isFormOpen = signal(false);
  editingOriginalFact = signal<string | null>(null);
  feedbackMessage = signal<string | null>(null);

  searchControl = new FormControl('', { nonNullable: true });

  loreForm = new FormGroup({
    entity: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fact: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    weight: new FormControl<number>(1.5, { nonNullable: true })
  });

  private width = 600;
  private height = 400;

  constructor() {
    effect(() => {
      // Read stateVersion() so any AI or user update to knowledgeGraph triggers a live re-render
      this.gameState.stateVersion();
      const kg = this.gameState.knowledgeGraph || {};
      if (this.svg) {
        this.renderGraph(kg);
      }
      const currentSelected = this.selectedEntityKey();
      const keys = Object.keys(kg);
      if (currentSelected && !(currentSelected in kg)) {
        this.selectedEntityKey.set(keys[0] ?? null);
      } else if (!currentSelected && keys.length > 0) {
        this.selectedEntityKey.set(keys[0] ?? null);
      }
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit() {
    this.initGraph();
    const kg = this.gameState.knowledgeGraph || {};
    this.renderGraph(kg);
    const firstKey = Object.keys(kg)[0] ?? null;
    if (!this.selectedEntityKey() && firstKey) {
      this.selectedEntityKey.set(firstKey);
    }
  }

  ngOnDestroy() {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
  }

  setViewMode(mode: 'split' | 'catalog') {
    this.viewMode.set(mode);
    if (mode === 'split') {
      setTimeout(() => this.onResize(), 30);
    }
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.cdr.markForCheck();
  }

  getEntityKeys(): string[] {
    return Object.keys(this.gameState.knowledgeGraph || {});
  }

  getTotalFactsCount(): number {
    const kg = this.gameState.knowledgeGraph || {};
    return Object.values(kg).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  }

  getFilteredEntityKeys(): string[] {
    const kg = this.gameState.knowledgeGraph || {};
    const q = (this.searchControl.value || '').trim().toLowerCase();
    const keys = Object.keys(kg);
    if (!q) return keys;
    return keys.filter(k => {
      if (k.toLowerCase().includes(q)) return true;
      const facts = kg[k] || [];
      return facts.some(f => f.toLowerCase().includes(q));
    });
  }

  getDisplayedInspectorEntities(): string[] {
    const filtered = this.getFilteredEntityKeys();
    const q = (this.searchControl.value || '').trim();
    if (this.viewMode() === 'catalog' || q.length > 0) {
      return filtered;
    }
    const sel = this.selectedEntityKey();
    if (sel && filtered.includes(sel)) {
      return [sel];
    }
    return filtered.slice(0, 2);
  }

  selectEntityByName(entityKey: string) {
    this.selectedEntityKey.set(entityKey);
    this.highlightNodes(entityKey);
  }

  getQuickEntitySuggestions(): { label: string; value: string }[] {
    const suggestions: { label: string; value: string }[] = [];
    const mcName = this.gameState.mcState.name;
    if (mcName) suggestions.push({ label: `MC (${mcName})`, value: mcName });
    const world = this.gameState.activeStory()?.worldSetting;
    if (world) suggestions.push({ label: 'Dunia', value: world });
    const loc = this.gameState.mcState.locationName || this.gameState.mcState.location;
    if (loc) suggestions.push({ label: 'Lokasi', value: loc });
    const firstNpc = Object.values(this.gameState.npcStates || {})[0]?.nama;
    if (firstNpc) suggestions.push({ label: firstNpc, value: firstNpc });
    return suggestions;
  }

  fillEntityPreset(entityName: string) {
    this.loreForm.controls.entity.setValue(entityName);
  }

  setFormWeight(w: number) {
    this.loreForm.controls.weight.setValue(w);
  }

  openCreateFactForm(prefillEntity?: string) {
    const targetEntity =
      prefillEntity ||
      this.selectedEntityKey() ||
      this.gameState.mcState.name ||
      this.gameState.activeStory()?.worldSetting ||
      'Lore Dunia';
    this.editingOriginalFact.set(null);
    this.loreForm.setValue({
      entity: targetEntity,
      fact: '',
      weight: 1.5
    });
    this.isFormOpen.set(true);
  }

  openEditFactForm(entityKey: string, fact: string) {
    const currentWeight = this.getFactWeight(entityKey, fact);
    this.selectedEntityKey.set(entityKey);
    this.editingOriginalFact.set(fact);
    this.loreForm.setValue({
      entity: entityKey,
      fact,
      weight: currentWeight >= 1.8 ? 2.0 : currentWeight >= 1.3 ? 1.5 : 1.0
    });
    this.isFormOpen.set(true);
  }

  closeLoreForm() {
    this.isFormOpen.set(false);
    this.editingOriginalFact.set(null);
  }

  submitLoreForm() {
    if (this.loreForm.invalid) return;
    const entity = this.loreForm.controls.entity.value.trim();
    const fact = this.loreForm.controls.fact.value.trim();
    const weight = this.loreForm.controls.weight.value;
    if (!entity || !fact) return;

    const prevFact = this.editingOriginalFact() || undefined;
    this.gameState.updateKnowledgeGraph([
      {
        action: 'bind',
        entity,
        fact,
        weight,
        previousFact: prevFact
      }
    ]);
    void this.loreEngine.refreshDynamicContext();

    this.selectedEntityKey.set(entity);
    this.isFormOpen.set(false);
    this.editingOriginalFact.set(null);
    this.showFeedback(
      prevFact
        ? `Fakta pada "${entity}" diperbarui & diindeks ulang ke memori AI.`
        : `Lore baru pada "${entity}" berhasil diikat ke Graf Pengetahuan AI.`
    );
  }

  toggleCanonWeight(entityKey: string, fact: string) {
    const current = this.getFactWeight(entityKey, fact);
    const nextWeight = current >= 1.8 ? 1.0 : 2.0;
    this.gameState.updateKnowledgeGraph([
      {
        action: 'reweight',
        entity: entityKey,
        fact,
        weight: nextWeight
      }
    ]);
    void this.loreEngine.refreshDynamicContext();
    this.showFeedback(
      nextWeight >= 1.8
        ? `Fakta "${entityKey}" disematkan sebagai Hukum Kanon Utama (2.0x).`
        : `Prioritas fakta "${entityKey}" dikembalikan ke Standar (1.0x).`
    );
  }

  deleteFact(entityKey: string, fact: string) {
    this.gameState.updateKnowledgeGraph([
      {
        action: 'unbind',
        entity: entityKey,
        fact
      }
    ]);
    void this.loreEngine.refreshDynamicContext();
    this.showFeedback(`Fakta dihapus dari memori entitas "${entityKey}".`);
  }

  deleteEntireEntity(entityKey: string) {
    this.gameState.updateKnowledgeGraph([
      {
        action: 'unbind',
        entity: entityKey,
        fact: '*'
      }
    ]);
    void this.loreEngine.refreshDynamicContext();
    this.showFeedback(`Simpul entitas "${entityKey}" beserta seluruh faktanya dihapus.`);
  }

  getFactWeight(entity: string, fact: string): number {
    return this.gameState.knowledgeWeights?.[`${entity}::${fact}`] ?? 1.0;
  }

  getWeightLabel(weight: number): string {
    if (weight >= 1.8) return 'Kanon Utama';
    if (weight >= 1.3) return 'Prioritas Tinggi';
    return 'Memori Standar';
  }

  private showFeedback(msg: string) {
    this.feedbackMessage.set(msg);
    setTimeout(() => {
      if (this.feedbackMessage() === msg) {
        this.feedbackMessage.set(null);
        this.cdr.markForCheck();
      }
    }, 3500);
  }

  onResize() {
    const el = this.container();
    if (!el) return;
    this.width = el.nativeElement.clientWidth || 600;
    this.height = el.nativeElement.clientHeight || 400;
    if (this.svg) {
      this.svg.attr('width', this.width).attr('height', this.height);
      if (this.simulation) {
        this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
        this.simulation.alpha(0.3).restart();
      }
    }
  }

  getFacts(entityId: string): string[] {
    const kg = this.gameState.knowledgeGraph || {};
    const raw = kg[entityId];
    if (!Array.isArray(raw)) return [];
    const q = (this.searchControl.value || '').trim().toLowerCase();
    if (!q || entityId.toLowerCase().includes(q)) return raw;
    return raw.filter(f => f.toLowerCase().includes(q));
  }

  private initGraph() {
    const el = this.container();
    if (!el) return;
    this.width = el.nativeElement.clientWidth || 600;
    this.height = el.nativeElement.clientHeight || 400;

    this.svg = d3.select(el.nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          if (this.svg) {
            this.svg.select('g').attr('transform', event.transform);
          }
        })
      )
      .on('click', () => {
        this.selectedNode = null;
        this.highlightNodes(null);
      });

    this.svg.append('g');
  }

  private renderGraph(kg: Record<string, string[]>) {
    if (!this.svg) return;

    if (this.simulation) {
      this.simulation.stop();
    }

    const nodes: any[] = [];
    const links: any[] = [];
    const entitySet = new Set<string>();

    const mcLabel = this.gameState.mcState.name || 'MC';
    nodes.push({ id: 'MC', label: mcLabel, type: 'core', group: 0, radius: 19 });
    entitySet.add('MC');

    for (const [entity, facts] of Object.entries(kg)) {
      if (!Array.isArray(facts)) continue;
      if (!entitySet.has(entity)) {
        nodes.push({ id: entity, label: entity, type: 'entity', group: 1, radius: 14 });
        entitySet.add(entity);
      }

      links.push({ source: 'MC', target: entity, value: 3, type: 'observes' });

      for (const fact of facts) {
        const factId = `${entity}::${fact.slice(0, 36)}${fact.length > 36 ? '...' : ''}`;
        const w = this.getFactWeight(entity, fact);
        if (!entitySet.has(factId)) {
          nodes.push({
            id: factId,
            label: '',
            parentEntity: entity,
            fullText: fact,
            weight: w,
            type: 'fact',
            group: 2,
            radius: w >= 1.8 ? 9 : 7
          });
          entitySet.add(factId);
        }
        links.push({ source: entity, target: factId, value: w, type: 'binds' });
      }
    }

    this.nodeCount = nodes.length;
    this.linkCount = links.length;

    const g = this.svg.select('g');
    g.selectAll('*').remove();

    this.simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance((d: any) => d.type === 'observes' ? 110 : 52))
      .force('charge', d3.forceManyBody().strength(-190))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => d.radius + 9).iterations(2));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value || 1))
      .attr('stroke', (d: any) => d.type === 'observes' ? '#8e44ad' : '#7f8c8d')
      .attr('stroke-opacity', 0.65);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group cursor-pointer')
      .call(this.drag(this.simulation) as any)
      .on('click', (event, d: any) => {
        event.stopPropagation();
        this.selectedNode = d;
        if (d.type === 'entity') {
          this.selectedEntityKey.set(d.id);
        } else if (d.type === 'fact' && d.parentEntity) {
          this.selectedEntityKey.set(d.parentEntity);
        }
        this.highlightNodes(d.id);
        this.cdr.markForCheck();
      });

    node.append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => {
        if (d.type === 'core') return '#9b59b6';
        if (d.type === 'entity') return '#3498db';
        if (d.weight >= 1.8) return '#e74c3c';
        if (d.weight >= 1.3) return '#f1c40f';
        return '#2ecc71';
      })
      .attr('fill-opacity', (d: any) => d.type === 'fact' ? 0.55 : 1)
      .attr('stroke', (d: any) => {
        if (d.type === 'core') return '#ecf0f1';
        if (d.type === 'entity') return '#ecf0f1';
        if (d.weight >= 1.8) return '#f5b7b1';
        if (d.weight >= 1.3) return '#f39c12';
        return '#1abc9c';
      })
      .attr('stroke-width', (d: any) => d.type === 'fact' ? 1.2 : 2);

    node.append('text')
      .text((d: any) => d.type === 'fact' ? '' : (d.label || d.id))
      .attr('x', (d: any) => d.radius + 6)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('fill', '#ecf0f1')
      .attr('font-family', 'ui-monospace, monospace')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.85)');

    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => 'translate(' + d.x + ',' + d.y + ')');
    });
  }

  private drag(simulation: any) {
    return d3.drag()
      .on('start', (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }

  private highlightNodes(focusId: string | null) {
    if (!this.svg) return;
    const g = this.svg.select('g');

    if (!focusId) {
      g.selectAll('circle').attr('opacity', 1);
      g.selectAll('line').attr('opacity', 0.65);
      g.selectAll('text').attr('opacity', 1);
      return;
    }

    const connectedIds = new Set<string>([focusId]);
    g.selectAll('line').each((d: any) => {
      const srcId = String(d?.source?.id ?? d?.source ?? '');
      const tgtId = String(d?.target?.id ?? d?.target ?? '');
      if (srcId === focusId && tgtId.length > 0) connectedIds.add(tgtId);
      if (tgtId === focusId && srcId.length > 0) connectedIds.add(srcId);
    });

    g.selectAll('circle').attr('opacity', (d: any) => {
      const id = String(d?.id ?? '');
      return connectedIds.has(id) ? 1 : 0.2;
    });
    g.selectAll('line').attr('opacity', (d: any) => {
      const srcId = String(d?.source?.id ?? d?.source ?? '');
      const tgtId = String(d?.target?.id ?? d?.target ?? '');
      return (srcId === focusId || tgtId === focusId) ? 0.9 : 0.08;
    });
    g.selectAll('text').attr('opacity', (d: any) => {
      const id = String(d?.id ?? '');
      return connectedIds.has(id) ? 1 : 0.2;
    });
  }
}
