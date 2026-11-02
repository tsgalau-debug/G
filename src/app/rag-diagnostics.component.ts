import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoreEngineService } from './rag/lore-engine.service';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';
import { HomologyVisualizerComponent } from './topology/homology-visualizer/homology-visualizer.component';
import { TimelineExplorerComponent } from './timeline-explorer/timeline-explorer.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rag-diagnostics',
  standalone: true,
  imports: [CommonModule, MatIconModule, HomologyVisualizerComponent, TimelineExplorerComponent],
  template: `
    <div class="h-full bg-zinc-950 text-zinc-200 font-sans flex flex-col overflow-hidden">
      <!-- Slim 1px Sub-Tab Line Header -->
      <div class="h-9 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between gap-4 bg-zinc-950 shrink-0 text-xs">
        <div class="flex items-center h-full gap-5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            (click)="activeSubTab.set('orchestrator')"
            class="h-full border-b-2 font-medium transition-colors whitespace-nowrap"
            [class.border-emerald-500]="activeSubTab() === 'orchestrator'"
            [class.text-zinc-100]="activeSubTab() === 'orchestrator'"
            [class.border-transparent]="activeSubTab() !== 'orchestrator'"
            [class.text-zinc-500]="activeSubTab() !== 'orchestrator'">
            Orkestrasi Memori & RL
          </button>
          <button
            type="button"
            (click)="activeSubTab.set('homology')"
            class="h-full border-b-2 font-medium transition-colors whitespace-nowrap"
            [class.border-emerald-500]="activeSubTab() === 'homology'"
            [class.text-zinc-100]="activeSubTab() === 'homology'"
            [class.border-transparent]="activeSubTab() !== 'homology'"
            [class.text-zinc-500]="activeSubTab() !== 'homology'">
            Topologi Homologi
          </button>
          <button
            type="button"
            (click)="activeSubTab.set('timeline')"
            class="h-full border-b-2 font-medium transition-colors whitespace-nowrap"
            [class.border-emerald-500]="activeSubTab() === 'timeline'"
            [class.text-zinc-100]="activeSubTab() === 'timeline'"
            [class.border-transparent]="activeSubTab() !== 'timeline'"
            [class.text-zinc-500]="activeSubTab() !== 'timeline'">
            Garis Waktu Kausal (DAG)
          </button>
        </div>

        <button
          type="button"
          (click)="refreshStats()"
          class="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono text-[11px] shrink-0">
          <mat-icon class="text-[14px] h-[14px] w-[14px]">refresh</mat-icon>
          <span class="hidden sm:inline">Muat Ulang</span>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 text-xs">
        @if (activeSubTab() === 'homology') {
          <app-homology-visualizer></app-homology-visualizer>
        } @else if (activeSubTab() === 'timeline') {
          <app-timeline-explorer></app-timeline-explorer>
        } @else {
          <div class="max-w-[1440px] w-full mx-auto divide-y divide-zinc-800/80">
            
            <!-- 1. Latest Retrieval Decision -->
            <section class="pb-5 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold text-zinc-200">Keputusan Pengambilan Memori Terakhir</h3>
                <div class="flex items-center gap-2 font-mono text-[11px] tabular-nums text-zinc-400">
                  @if (loreEngine.lastDecision()?.npcArchetype; as arch) {
                    <span class="text-emerald-400 uppercase">{{ arch }}</span>
                    <span class="text-zinc-700" aria-hidden="true">·</span>
                  }
                  <span>{{ loreEngine.lastRetrievalMs() | number:'1.0-0' }} ms</span>
                </div>
              </div>

              @if (loreEngine.lastDecision(); as dec) {
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y border-zinc-800/60 font-mono tabular-nums">
                  <div>
                    <span class="text-[10px] text-zinc-500 block font-sans">Strategi</span>
                    <span class="text-zinc-200">{{ getStrategyName(dec.strategy) }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-zinc-500 block font-sans">Tindakan</span>
                    <span class="text-zinc-200">{{ dec.action }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-zinc-500 block font-sans">Keyakinan</span>
                    <span class="text-emerald-400">{{ (dec.confidence * 100).toFixed(1) }}%</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-zinc-500 block font-sans">Anomali</span>
                    <span class="text-zinc-200">{{ dec.anomalyCount }}</span>
                  </div>
                </div>

                @if (dec.npcId) {
                  <div class="text-zinc-400 font-mono text-[11px]">
                    Karakter Terkait: <strong class="text-emerald-400">{{ dec.npcId }}</strong>
                  </div>
                }
                <p class="text-zinc-300 leading-relaxed">{{ dec.reasoning }}</p>
              } @else {
                <p class="text-zinc-500">Belum ada kueri pengambilan memori yang dijalankan pada sesi ini.</p>
              }
            </section>

            <!-- 2. Injected Context to Prompt -->
            <section class="py-5 space-y-2">
              <div class="flex items-baseline justify-between">
                <h3 class="text-xs font-semibold text-zinc-200">Konteks Memori yang Disuntikkan ke Prompt</h3>
                <span class="text-[11px] text-zinc-500">Cuplikan aktif pada giliran terakhir</span>
              </div>
              @if (loreEngine.lastSnippet()) {
                <div class="font-mono text-[11px] text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto py-2 border-y border-zinc-800/60 leading-relaxed">{{ loreEngine.lastSnippet() }}</div>
              } @else {
                <p class="text-zinc-500">Belum ada cuplikan konteks yang disuntikkan.</p>
              }
            </section>

            <!-- 3. Multi-Agent Archetype Weights & Q-Learning Policy -->
            <section class="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <h3 class="text-xs font-semibold text-zinc-200">Profil Bobot Kebijakan Agen</h3>
                <div class="divide-y divide-zinc-800/60 border-t border-zinc-800/60 font-mono text-[11px] tabular-nums">
                  <div class="py-2 flex items-center justify-between">
                    <span class="text-blue-400">Scholar (Sages / Analysts)</span>
                    <span class="text-zinc-400">Epistemic 0.95 · Rigor 0.75</span>
                  </div>
                  <div class="py-2 flex items-center justify-between">
                    <span class="text-emerald-400">Guardian (Wardens / Sentinels)</span>
                    <span class="text-zinc-400">Rigor 0.98 · Speed 0.85</span>
                  </div>
                  <div class="py-2 flex items-center justify-between">
                    <span class="text-purple-400">Trickster (Rogues / Adaptive)</span>
                    <span class="text-zinc-400">Novelty 0.95 · Epistemic 0.75</span>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <h3 class="text-xs font-semibold text-zinc-200">Metrik Kebijakan Q-Learning</h3>
                @if (stats()) {
                  <div class="divide-y divide-zinc-800/60 border-t border-zinc-800/60 font-mono text-[11px] tabular-nums">
                    <div class="py-1.5 flex justify-between">
                      <span class="text-zinc-500">Epsilon Eksplorasi</span>
                      <span class="text-zinc-200">{{ stats()?.rlPolicy?.epsilon?.toFixed(3) }}</span>
                    </div>
                    <div class="py-1.5 flex justify-between">
                      <span class="text-zinc-500">Rata-rata Galat TD</span>
                      <span class="text-zinc-200">{{ stats()?.rlPolicy?.meanTDError?.toFixed(4) }}</span>
                    </div>
                    <div class="py-1.5 flex justify-between">
                      <span class="text-zinc-500">Kapasitas Replay</span>
                      <span class="text-zinc-200">{{ stats()?.rlPolicy?.replayUsed }} / {{ stats()?.rlPolicy?.replayCapacity }}</span>
                    </div>
                    <div class="py-1.5 flex justify-between">
                      <span class="text-zinc-500">Total Kueri</span>
                      <span class="text-emerald-400">{{ stats()?.orchestrator?.totalQueries ?? 0 }}</span>
                    </div>
                  </div>
                } @else {
                  <p class="text-zinc-500">Memuat metrik kebijakan...</p>
                }
              </div>
            </section>

          </div>
        }
      </div>
    </div>
  `
})
export class RagDiagnosticsComponent implements OnInit, OnDestroy {
  loreEngine = inject(LoreEngineService);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats = signal<any>(null);
  readonly activeSubTab = signal<'orchestrator' | 'homology' | 'timeline'>('orchestrator');
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.refreshStats();
    this.timer = setInterval(() => {
      this.refreshStats();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  refreshStats() {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.loreEngine.getStats().then((res) => {
      if (res) this.stats.set(res);
    });
  }

  getStrategyName(strategyId: number): string {
    const names = ['Bm25Fast', 'SemanticFhrr', 'GraphDiffuse', 'Holographic', 'HybridFull', 'SelfCorrect'];
    return names[strategyId] || 'Unknown';
  }

  getDistribution() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const dist = this.stats()?.orchestrator?.strategyDistribution;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!dist) return [];
    
    const names = ['Bm25Fast', 'SemanticFhrr', 'GraphDiffuse', 'Holographic', 'HybridFull', 'SelfCorrect'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Object.keys(dist).map(k => ({
      name: names[Number(k)] || k,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      value: dist[k]
    }));
  }
}
