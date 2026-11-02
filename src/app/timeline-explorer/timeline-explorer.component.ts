/* eslint-disable */
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LoreEngineService } from '../rag/lore-engine.service';
import { GameStateService } from '../game-state.service';
import { TimelineNode, WhatIfScenarioData } from '../rag/timeline-dag';
import { MergeResult } from '../rag/world-merge-resolver';

@Component({
  selector: 'app-timeline-explorer',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-zinc-950 border border-zinc-800/80 rounded-xl text-zinc-200 flex flex-col divide-y divide-zinc-800/80 max-w-5xl mx-auto">
      <!-- Header -->
      <div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <mat-icon class="text-purple-400 !w-5 !h-5 !text-[20px]">account_tree</mat-icon>
          <div>
            <div class="flex items-center gap-2.5">
              <h2 class="text-sm font-semibold tracking-tight text-zinc-100">
                Multi-World Timeline Explorer
              </h2>
              <span class="text-[11px] font-mono text-purple-300 border-b border-purple-500/50 pb-0.5">
                DAG · State Snapshot · 3-Way Merge
              </span>
            </div>
            <p class="text-xs text-zinc-400 mt-0.5">
              Cabangkan realitas cerita (State + Memori Holografik), uji hipotesis What-If, dan rekonsiliasi cabang kembali ke Trunk.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="openForkModal()"
            class="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">call_split</mat-icon>
            Fork Garis Waktu
          </button>
          <button
            type="button"
            (click)="openWhatIfModal()"
            class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">psychology</mat-icon>
            What-If Sandbox
          </button>
        </div>
      </div>

      <!-- Timeline Metrics Strip (1px Divided) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 bg-zinc-900/30">
        <div class="px-4 py-3 flex flex-col gap-0.5">
          <span class="text-[11px] text-zinc-400">Realitas Aktif</span>
          <span class="text-xs font-semibold text-emerald-400 truncate">{{ activeNodeName() }}</span>
        </div>
        <div class="px-4 py-3 flex flex-col gap-0.5">
          <span class="text-[11px] text-zinc-400">Koherensi Trunk</span>
          <span class="text-xs font-semibold text-amber-400 font-mono tabular-nums">{{ ((dagState()?.trunkCoherence ?? 1) * 100).toFixed(1) }}%</span>
        </div>
        <div class="px-4 py-3 flex flex-col gap-0.5">
          <span class="text-[11px] text-zinc-400">Slot Memori Dunia</span>
          <span class="text-xs font-semibold text-zinc-200 font-mono tabular-nums">{{ dagState()?.usedWorldSlots ?? 1 }} / {{ dagState()?.totalWorldSlots ?? 8 }}</span>
        </div>
        <div class="px-4 py-3 flex flex-col gap-0.5">
          <span class="text-[11px] text-zinc-400">Cabang Paralel Aktif</span>
          <span class="text-xs font-semibold text-cyan-400 font-mono tabular-nums">{{ countActiveBranches() }}</span>
        </div>
      </div>

      <!-- Timeline DAG Graph View -->
      <div class="flex flex-col divide-y divide-zinc-800/60">
        <div class="px-5 py-2.5 flex items-center justify-between bg-zinc-900/20">
          <span class="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <mat-icon class="!w-4 !h-4 !text-[16px] text-purple-400">device_hub</mat-icon>
            Daftar Cabang Realitas & Snapshot State
          </span>
          <button
            type="button"
            (click)="refreshState()"
            class="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">refresh</mat-icon>
            Segarkan
          </button>
        </div>

        <!-- DAG Flow List -->
        <div class="divide-y divide-zinc-800/60">
          @for (node of dagState()?.nodes || []; track node.id) {
            @if (node.status !== 'pruned') {
              @let snapSummary = getBranchSnapshotSummary(node.id);
              <div
                class="px-5 py-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                [class]="getNodeRowClass(node)"
              >
                <div class="flex items-start gap-3 min-w-0">
                  <mat-icon class="!w-4 !h-4 !text-[16px] mt-0.5 shrink-0" [class]="getNodeIconColor(node)">
                    {{ getNodeIcon(node) }}
                  </mat-icon>
                  <div class="flex flex-col gap-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-sm text-zinc-100">{{ node.name }}</span>
                      @if (isNodeActive(node.id)) {
                        <span class="text-[10px] font-mono font-semibold text-emerald-400 border-b border-emerald-400">
                          AKTIF
                        </span>
                      }
                      <span class="text-[11px] font-mono text-zinc-400 tabular-nums">
                        Slot #{{ node.worldSlot }} · Fork Giliran {{ node.forkTurn }}
                      </span>
                      @if (node.status === 'merged') {
                        <span class="text-[10px] font-mono text-amber-400">
                          [Telah Di-Merge ke Trunk]
                        </span>
                      }
                    </div>
                    <p class="text-xs text-zinc-400 leading-relaxed">{{ node.notes || 'Tidak ada catatan cabang.' }}</p>

                    <!-- Snapshot State Telemetry -->
                    <div class="flex items-center gap-3 text-[11px] font-mono text-zinc-400 tabular-nums pt-0.5">
                      <span>Babak: <strong class="text-zinc-200">{{ snapSummary.turns }}</strong></span>
                      <span class="text-zinc-700">·</span>
                      <span>Lokasi: <strong class="text-zinc-200">{{ snapSummary.location }}</strong></span>
                      <span class="text-zinc-700">·</span>
                      <span>Fakta KG: <strong class="text-zinc-200">{{ snapSummary.kgCount }}</strong></span>
                      <span class="text-zinc-700">·</span>
                      <span>NPC: <strong class="text-zinc-200">{{ snapSummary.npcCount }}</strong></span>
                    </div>

                    @if (node.whatIfScenario) {
                      <div class="mt-1 pl-2.5 border-l-2 border-purple-500/50 text-[11px] text-purple-200">
                        <span class="font-semibold text-amber-300">Hipotesis What-If:</span> "{{ node.whatIfScenario.prompt }}"
                      </div>
                    }
                  </div>
                </div>

                <!-- Metrics & Action Buttons -->
                <div class="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div class="text-right flex flex-col text-[11px] font-mono tabular-nums">
                    <span class="text-zinc-400">Koherensi <strong class="text-zinc-200">{{ (node.coherence * 100).toFixed(0) }}%</strong></span>
                    <span class="text-zinc-400">Bobot <strong class="text-cyan-400">{{ (node.superpositionWeight * 100).toFixed(0) }}%</strong></span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    @if (!isNodeActive(node.id) && (node.status === 'active' || node.status === 'simulating')) {
                      <button
                        type="button"
                        (click)="switchTimeline(node.id)"
                        class="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Muat state cerita & memori garis waktu ini"
                      >
                        <mat-icon class="!w-3.5 !h-3.5 !text-[14px] text-emerald-400">swap_horiz</mat-icon>
                        Beralih
                      </button>
                    }

                    @if (node.id !== 'trunk' && (node.status === 'active' || node.status === 'simulating')) {
                      <button
                        type="button"
                        (click)="openMergeModal(node)"
                        class="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Rekonsiliasi 3-Way Merge kembali ke Trunk"
                      >
                        <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">call_merge</mat-icon>
                        Merge
                      </button>

                      <button
                        type="button"
                        (click)="pruneTimeline(node.id)"
                        class="p-1.5 rounded hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Prune / Hapus cabang ini"
                      >
                        <mat-icon class="!w-4 !h-4 !text-[16px]">delete_outline</mat-icon>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- FORK MODAL DIALOG -->
      @if (showForkModal()) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-xl">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 class="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <mat-icon class="text-purple-400 !w-4 !h-4 !text-[16px]">call_split</mat-icon>
                Fork Garis Waktu Baru
              </h3>
              <button type="button" (click)="closeForkModal()" class="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                <mat-icon class="!w-4 !h-4 !text-[16px]">close</mat-icon>
              </button>
            </div>

            <div class="flex flex-col gap-3 text-xs">
              <div class="flex flex-col gap-1">
                <label class="text-zinc-300 font-medium">Nama Garis Waktu</label>
                <input
                  type="text"
                  [value]="forkName()"
                  (input)="forkName.set($any($event.target).value)"
                  placeholder="cth. Cabang Aliansi Rahasia"
                  class="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-zinc-300 font-medium">Catatan / Alasan Divergensi</label>
                <textarea
                  [value]="forkNotes()"
                  (input)="forkNotes.set($any($event.target).value)"
                  rows="3"
                  placeholder="Jelaskan keputusan berbeda yang ingin diambil pada cabang ini..."
                  class="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500"
                ></textarea>
              </div>

              <label class="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 cursor-pointer">
                <span class="text-zinc-300">Langsung beralih ke garis waktu baru ini</span>
                <input
                  type="checkbox"
                  [checked]="forkSwitchImmediately()"
                  (change)="forkSwitchImmediately.set(!forkSwitchImmediately())"
                  class="accent-purple-500 cursor-pointer"
                />
              </label>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                (click)="closeForkModal()"
                class="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                (click)="executeFork()"
                [disabled]="!forkName().trim()"
                class="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">check</mat-icon>
                Buat Percabangan
              </button>
            </div>
          </div>
        </div>
      }

      <!-- WHAT-IF SANDBOX MODAL DIALOG -->
      @if (showWhatIfModal()) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 class="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <mat-icon class="text-amber-400 !w-4 !h-4 !text-[16px]">psychology</mat-icon>
                What-If Sandbox Simulator
              </h3>
              <button type="button" (click)="closeWhatIfModal()" class="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                <mat-icon class="!w-4 !h-4 !text-[16px]">close</mat-icon>
              </button>
            </div>

            <div class="flex flex-col gap-3 text-xs">
              <p class="text-zinc-400 leading-relaxed">
                Uji hipotesis naratif terhadap memori holografik dan fakta Knowledge Graph aktif tanpa mengorbankan slot dunia sebelum Anda memutuskan untuk mencabangkannya.
              </p>

              <div class="flex flex-col gap-1">
                <label class="text-zinc-300 font-medium">Hipotesis / Aksi Skenario</label>
                <textarea
                  [value]="whatIfPrompt()"
                  (input)="whatIfPrompt.set($any($event.target).value)"
                  rows="3"
                  placeholder="Misal: Bagaimana jika protagonis menolak tawaran faksi penguasa dan membuka rahasia artefak kuno?"
                  class="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="button"
                (click)="executeWhatIfSimulation()"
                [disabled]="isSimulating() || !whatIfPrompt().trim()"
                class="py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                @if (isSimulating()) {
                  <mat-icon class="animate-spin !w-4 !h-4 !text-[16px]">sync</mat-icon>
                  Menganalisis Interferensi Lore & KG...
                } @else {
                  <mat-icon class="!w-4 !h-4 !text-[16px]">play_arrow</mat-icon>
                  Simulasikan Proyeksi Realitas
                }
              </button>

              <!-- Simulation Result Preview -->
              @if (simulationResult()) {
                @let res = simulationResult()!;
                <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3 mt-1">
                  <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span class="font-semibold text-zinc-200">Hasil Proyeksi Realitas</span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
                      [class]="getRiskBadgeClass(res.suggestedAction)"
                    >
                      {{ formatSuggestedAction(res.suggestedAction) }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 divide-x divide-zinc-800 border border-zinc-800 rounded-lg bg-zinc-950">
                    <div class="p-2.5 flex flex-col">
                      <span class="text-[11px] text-zinc-400">Risiko Kontradiksi</span>
                      <span class="font-semibold text-sm font-mono tabular-nums" [class]="res.contradictionRisk > 0.5 ? 'text-red-400' : 'text-emerald-400'">
                        {{ (res.contradictionRisk * 100).toFixed(1) }}%
                      </span>
                    </div>
                    <div class="p-2.5 flex flex-col">
                      <span class="text-[11px] text-zinc-400">Prakiraan Koherensi</span>
                      <span class="font-semibold text-sm font-mono text-amber-400 tabular-nums">
                        {{ (res.coherenceForecast * 100).toFixed(1) }}%
                      </span>
                    </div>
                  </div>

                  <p class="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                    {{ res.projectedImpact }}
                  </p>

                  @if (res.affectedEntities.length > 0) {
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[11px] text-zinc-400">Entitas Terdampak:</span>
                      @for (ent of res.affectedEntities; track ent) {
                        <span class="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50 text-[10px] font-mono">
                          {{ ent }}
                        </span>
                      }
                    </div>
                  }

                  <div class="pt-2 border-t border-zinc-800 flex items-center justify-end">
                    <button
                      type="button"
                      (click)="materializeWhatIfBranch()"
                      class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">call_split</mat-icon>
                      Wujudkan sebagai Cabang Baru & Beralih
                    </button>
                  </div>
                </div>
              }
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                (click)="closeWhatIfModal()"
                class="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 3-WAY MERGE RESOLUTION MODAL -->
      @if (selectedMergeNode()) {
        @let node = selectedMergeNode()!;
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-zinc-950 border border-zinc-800 rounded-xl max-w-xl w-full p-5 flex flex-col gap-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div class="flex items-center gap-2">
                <mat-icon class="text-amber-400 !w-4 !h-4 !text-[16px]">call_merge</mat-icon>
                <h3 class="text-sm font-semibold text-zinc-100">
                  3-Way Merge: {{ node.name }} → Trunk
                </h3>
              </div>
              <button type="button" (click)="closeMergeModal()" class="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                <mat-icon class="!w-4 !h-4 !text-[16px]">close</mat-icon>
              </button>
            </div>

            <div class="flex flex-col gap-3 text-xs">
              <p class="text-zinc-400 leading-relaxed">
                Menyatukan tensor memori holografik serta merekonsiliasi babak cerita baru, fakta Knowledge Graph, progres Quest, dan perubahan relasi NPC/Faksi dari cabang ini ke Realitas Utama (Trunk).
              </p>

              <label class="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex items-center justify-between cursor-pointer">
                <span class="text-zinc-300 font-medium">Prioritaskan Trunk jika terjadi konflik langsung</span>
                <input
                  type="checkbox"
                  [checked]="mergeTrunkPriority()"
                  (change)="mergeTrunkPriority.set(!mergeTrunkPriority())"
                  class="accent-amber-500 cursor-pointer"
                />
              </label>

              <!-- Merge Execution Feedback -->
              @if (activeMergeReport()) {
                <div class="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-2 text-xs">
                  <div class="flex items-center justify-between font-semibold text-emerald-400">
                    <span>Rekonsiliasi 3-Way Merge Selesai</span>
                    <span class="text-zinc-300 font-mono tabular-nums">Koherensi Akhir: {{ (activeMergeReport()!.finalCoherence * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 font-mono tabular-nums">
                    <span>Otomatis Direkonsiliasi: <strong>{{ activeMergeReport()!.autoResolved }}</strong></span>
                    <span>Ditandai Konflik: <strong>{{ activeMergeReport()!.flaggedForLLM }}</strong></span>
                  </div>

                  @if (activeMergeReport()!.conflicts.length > 0) {
                    <div class="flex flex-col gap-1.5 mt-2">
                      <span class="font-semibold text-amber-300">Rincian Konflik Dokumen Lore:</span>
                      @for (c of activeMergeReport()!.conflicts; track c.docId) {
                        <div class="p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] flex flex-col gap-0.5">
                          <span class="font-semibold text-zinc-200 font-mono">[{{ c.type }}] Doc #{{ c.docId }}</span>
                          <span class="text-zinc-400">{{ c.explanation }}</span>
                          <span class="text-emerald-400 font-mono">→ Resolusi: {{ c.resolution }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                (click)="closeMergeModal()"
                class="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                {{ activeMergeReport() ? 'Selesai' : 'Batal' }}
              </button>
              @if (!activeMergeReport()) {
                <button
                  type="button"
                  (click)="executeMerge(node.id)"
                  class="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">call_merge</mat-icon>
                  Jalankan 3-Way Merge
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TimelineExplorerComponent implements OnInit {
  private readonly loreEngine = inject(LoreEngineService);
  readonly gameState = inject(GameStateService);

  readonly dagState = this.loreEngine.timelineState;

  // Fork state
  readonly showForkModal = signal(false);
  readonly forkName = signal('');
  readonly forkNotes = signal('');
  readonly forkSwitchImmediately = signal(true);

  // What-If state
  readonly showWhatIfModal = signal(false);
  readonly whatIfPrompt = signal('');
  readonly isSimulating = signal(false);
  readonly simulationResult = signal<WhatIfScenarioData | null>(null);

  // Merge state
  readonly selectedMergeNode = signal<TimelineNode | null>(null);
  readonly mergeTrunkPriority = signal(true);
  readonly activeMergeReport = signal<MergeResult | null>(null);

  ngOnInit() {
    this.refreshState();
  }

  refreshState() {
    void this.loreEngine.fetchTimelineState();
  }

  isNodeActive(nodeId: string): boolean {
    const activeId = this.dagState()?.activeTimelineId || this.gameState.activeTimelineId() || 'trunk';
    return activeId === nodeId;
  }

  activeNodeName(): string {
    const activeId = this.dagState()?.activeTimelineId || this.gameState.activeTimelineId() || 'trunk';
    const node = this.dagState()?.nodes.find(n => n.id === activeId);
    return node ? node.name : 'Realitas Utama (Trunk)';
  }

  countActiveBranches(): number {
    return (this.dagState()?.nodes || []).filter(
      n => n.id !== 'trunk' && (n.status === 'active' || n.status === 'simulating')
    ).length;
  }

  getBranchSnapshotSummary(nodeId: string): { turns: number; location: string; kgCount: number; npcCount: number } {
    const isActive = this.isNodeActive(nodeId);
    const snap = isActive
      ? this.gameState.captureCurrentBranchSnapshot()
      : (this.gameState.timelineSnapshots?.[nodeId] ?? this.gameState.timelineSnapshots?.['trunk']);

    if (!snap) {
      return {
        turns: this.gameState.chronicle.length,
        location: this.gameState.mcState.locationName || 'Titik Awal',
        kgCount: Object.keys(this.gameState.knowledgeGraph || {}).length,
        npcCount: Object.keys(this.gameState.npcStates || {}).length
      };
    }

    let factTotal = 0;
    for (const facts of Object.values(snap.knowledgeGraph || {})) {
      if (Array.isArray(facts)) factTotal += facts.length;
    }

    return {
      turns: Array.isArray(snap.chronicle) ? snap.chronicle.length : 0,
      location: snap.mcState?.locationName || 'Titik Awal',
      kgCount: factTotal,
      npcCount: Object.keys(snap.npcStates || {}).length
    };
  }

  // Fork Handlers
  openForkModal() {
    this.forkName.set(`Cabang Giliran ${this.gameState.turnCount}`);
    this.forkNotes.set('');
    this.forkSwitchImmediately.set(true);
    this.showForkModal.set(true);
  }

  closeForkModal() {
    this.showForkModal.set(false);
  }

  async executeFork() {
    if (!this.forkName().trim()) return;
    try {
      const activeId = this.dagState()?.activeTimelineId || this.gameState.activeTimelineId() || 'trunk';
      await this.loreEngine.forkTimeline(
        activeId,
        this.forkName().trim(),
        this.gameState.turnCount,
        this.forkNotes().trim(),
        this.forkSwitchImmediately()
      );
      this.closeForkModal();
    } catch (e: any) {
      console.error('Error forking timeline:', e);
    }
  }

  // What-If Handlers
  openWhatIfModal() {
    this.whatIfPrompt.set('');
    this.simulationResult.set(null);
    this.showWhatIfModal.set(true);
  }

  closeWhatIfModal() {
    this.showWhatIfModal.set(false);
  }

  async executeWhatIfSimulation() {
    if (!this.whatIfPrompt().trim()) return;
    this.isSimulating.set(true);
    try {
      const activeId = this.dagState()?.activeTimelineId || this.gameState.activeTimelineId() || 'trunk';
      const res = await this.loreEngine.simulateWhatIf(
        this.whatIfPrompt().trim(),
        activeId,
        this.gameState.turnCount,
        false
      );
      this.simulationResult.set(res.scenario);
    } catch (e: any) {
      console.error('Simulation error:', e);
    } finally {
      this.isSimulating.set(false);
    }
  }

  async materializeWhatIfBranch() {
    const sim = this.simulationResult();
    if (!sim) return;
    try {
      const activeId = this.dagState()?.activeTimelineId || this.gameState.activeTimelineId() || 'trunk';
      const shortTitle = sim.prompt.length > 28 ? `${sim.prompt.slice(0, 28)}...` : sim.prompt;
      await this.loreEngine.forkTimeline(
        activeId,
        `What-If: ${shortTitle}`,
        this.gameState.turnCount,
        sim.projectedImpact,
        true
      );
      this.closeWhatIfModal();
    } catch (e: any) {
      console.error('Materialize What-If branch error:', e);
    }
  }

  // Merge Handlers
  openMergeModal(node: TimelineNode) {
    this.selectedMergeNode.set(node);
    this.activeMergeReport.set(null);
  }

  closeMergeModal() {
    this.selectedMergeNode.set(null);
    this.activeMergeReport.set(null);
    this.refreshState();
  }

  async executeMerge(branchId: string) {
    try {
      const res = await this.loreEngine.mergeTimeline(
        branchId,
        'trunk',
        0.15,
        this.mergeTrunkPriority()
      );
      this.activeMergeReport.set(res.mergeResult);
    } catch (e: any) {
      console.error('Merge error:', e);
    }
  }

  // Switch & Prune
  async switchTimeline(id: string) {
    try {
      await this.loreEngine.switchActiveTimeline(id);
    } catch (e: any) {
      console.error('Switch error:', e);
    }
  }

  async pruneTimeline(id: string) {
    try {
      await this.loreEngine.pruneTimeline(id);
    } catch (e: any) {
      console.error('Prune error:', e);
    }
  }

  // Style Helpers
  getNodeRowClass(node: TimelineNode): string {
    if (this.isNodeActive(node.id)) {
      return 'bg-emerald-950/15 border-l-2 border-l-emerald-400';
    }
    if (node.status === 'merged') {
      return 'bg-zinc-950/50 opacity-60';
    }
    if (node.status === 'simulating') {
      return 'bg-purple-950/10 hover:bg-zinc-900/50';
    }
    return 'hover:bg-zinc-900/40';
  }

  getNodeIcon(node: TimelineNode): string {
    if (node.id === 'trunk') return 'flare';
    if (node.status === 'merged') return 'merge_type';
    if (node.status === 'simulating') return 'science';
    return 'call_split';
  }

  getNodeIconColor(node: TimelineNode): string {
    if (node.id === 'trunk') return 'text-amber-400';
    if (node.status === 'merged') return 'text-zinc-500';
    if (node.status === 'simulating') return 'text-purple-400';
    return 'text-cyan-400';
  }

  formatSuggestedAction(action: WhatIfScenarioData['suggestedAction']): string {
    switch (action) {
      case 'destructive_retcon':
        return 'Risiko Retcon Tinggi';
      case 'high_paradox_risk':
        return 'Risiko Paradoks Sedang';
      case 'safe_to_branch':
      default:
        return 'Aman Dicabangkan';
    }
  }

  getRiskBadgeClass(action: WhatIfScenarioData['suggestedAction']): string {
    switch (action) {
      case 'destructive_retcon':
        return 'bg-red-950/60 text-red-300 border border-red-800/60';
      case 'high_paradox_risk':
        return 'bg-amber-950/60 text-amber-300 border border-amber-800/60';
      case 'safe_to_branch':
      default:
        return 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60';
    }
  }
}
