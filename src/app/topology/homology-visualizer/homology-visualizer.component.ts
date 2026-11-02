/* eslint-disable */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../game-state.service';
import { Simplex0, TopologicalFormation } from '../simplicial-complex';

@Component({
  selector: 'app-homology-visualizer',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-neutral-100 flex flex-col gap-4 shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div class="flex items-center gap-2">
          <mat-icon class="text-amber-400">hub</mat-icon>
          <div>
            <h3 class="font-bold text-sm text-neutral-100 tracking-wide">Topological State Sync & Homology Tracking</h3>
            <p class="text-xs text-neutral-400">Vietoris-Rips Simplicial Complex & Betti Invariants (β₀, β₁)</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/50">
            β₀: {{ homology()?.betti0 ?? 0 }} (Klaster)
          </span>
          <span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
            β₁: {{ homology()?.betti1 ?? 0 }} (Cavity/Loop)
          </span>
        </div>
      </div>

      <!-- Controls & Filtration Epsilon -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <span class="text-xs text-neutral-400 whitespace-nowrap">Filtration Epsilon (ε):</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            [value]="filtrationEpsilon()"
            (input)="onEpsilonChange($event)"
            class="w-36 accent-amber-500 cursor-pointer"
          />
          <span class="font-mono text-xs text-amber-400 font-bold">{{ filtrationEpsilon().toFixed(2) }}</span>
        </div>

        <div class="flex items-center gap-4 text-xs text-neutral-400">
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            0-Simplex ({{ homology()?.totalVertices ?? 0 }})
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block"></span>
            1-Simplex ({{ homology()?.totalEdges ?? 0 }})
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 bg-amber-500/40 border border-amber-400 inline-block transform rotate-45"></span>
            2-Simplex ({{ homology()?.totalTriangles ?? 0 }})
          </span>
        </div>
      </div>

      <!-- Main Visualizer Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <!-- SVG Simplicial Complex Canvas -->
        <div class="lg:col-span-7 bg-neutral-950 rounded-lg border border-neutral-800 p-2 relative flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          @if (!homology() || homology()!.simplices0.length === 0) {
            <div class="flex flex-col items-center justify-center text-neutral-500 gap-2 py-12">
              <mat-icon class="text-3xl text-neutral-600">bubble_chart</mat-icon>
              <p class="text-xs">Belum ada NPC aktif dalam turn ini untuk dipetakan.</p>
            </div>
          } @else {
            <svg class="w-full h-[280px]" viewBox="0 0 400 280">
              <defs>
                <!-- Glow Filters -->
                <filter id="glow-loop" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <!-- 2-Simplices (Filled Triangles) -->
              @for (tri of homology()!.simplices2; track tri.id) {
                @let pA = getNodePos(tri.vertices[0]);
                @let pB = getNodePos(tri.vertices[1]);
                @let pC = getNodePos(tri.vertices[2]);
                <polygon
                  [attr.points]="pA.x + ',' + pA.y + ' ' + pB.x + ',' + pB.y + ' ' + pC.x + ',' + pC.y"
                  class="fill-amber-500/20 stroke-amber-400/40 hover:fill-amber-500/35 transition-colors"
                  stroke-width="1"
                />
              }

              <!-- 1-Simplices (Edges) -->
              @for (edge of homology()!.simplices1; track edge.id) {
                @let pU = getNodePos(edge.u);
                @let pV = getNodePos(edge.v);
                <line
                  [attr.x1]="pU.x"
                  [attr.y1]="pU.y"
                  [attr.x2]="pV.x"
                  [attr.y2]="pV.y"
                  class="stroke-cyan-500/60 transition-all duration-300"
                  stroke-width="2"
                  stroke-dasharray="edge.distance > 0.4 ? '4,3' : 'none'"
                />
              }

              <!-- Highlight Cavities / Patrol Loops -->
              @for (cav of homology()!.cavities; track cav.description) {
                @for (member of cav.loop; track member; let idx = $index) {
                  @let nextMember = cav.loop[(idx + 1) % cav.loop.length];
                  @let p1 = getNodePosByName(member);
                  @let p2 = getNodePosByName(nextMember);
                  <line
                    [attr.x1]="p1.x"
                    [attr.y1]="p1.y"
                    [attr.x2]="p2.x"
                    [attr.y2]="p2.y"
                    class="stroke-pink-500 animate-pulse"
                    stroke-width="3"
                    filter="url(#glow-loop)"
                  />
                }
              }

              <!-- 0-Simplices (Vertices / NPCs) -->
              @for (vertex of homology()!.simplices0; track vertex.id) {
                @let pos = getNodePos(vertex.id);
                <g class="cursor-pointer group" (click)="selectedNpc.set(vertex)">
                  <!-- Outer Pulse if selected -->
                  @if (selectedNpc()?.id === vertex.id) {
                    <circle
                      [attr.cx]="pos.x"
                      [attr.cy]="pos.y"
                      r="16"
                      class="fill-amber-500/20 stroke-amber-400 animate-ping"
                    />
                  }

                  <!-- Vertex Circle -->
                  <circle
                    [attr.cx]="pos.x"
                    [attr.cy]="pos.y"
                    r="10"
                    class="fill-neutral-900 stroke-emerald-400 group-hover:stroke-amber-300 transition-colors"
                    stroke-width="2.5"
                  />
                  
                  <!-- Vertex Label -->
                  <text
                    [attr.x]="pos.x"
                    [attr.y]="pos.y + 18"
                    text-anchor="middle"
                    class="fill-neutral-300 text-[10px] font-medium tracking-tight pointer-events-none drop-shadow"
                  >
                    {{ vertex.name }}
                  </text>
                </g>
              }
            </svg>
          }
        </div>

        <!-- Right: Formations & Persistent Homology Bar Chart -->
        <div class="lg:col-span-5 flex flex-col gap-3">
          <!-- Active Formations List -->
          <div class="bg-neutral-950 rounded-lg border border-neutral-800 p-3 flex flex-col gap-2">
            <span class="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <mat-icon class="text-xs text-amber-400">group_work</mat-icon>
              Formasi Topologis Aktif ({{ homology()?.formations?.length ?? 0 }})
            </span>

            <div class="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              @if (!homology()?.formations?.length) {
                <p class="text-xs text-neutral-500 italic">Tidak ada formasi khusus (keadaan netral).</p>
              } @else {
                @for (form of homology()!.formations; track form.title) {
                  <div
                    class="p-2 rounded border text-xs flex flex-col gap-0.5"
                    [class]="getFormationClass(form.severity)"
                  >
                    <div class="flex items-center justify-between font-semibold">
                      <span>{{ form.title }}</span>
                      <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/40">
                        Dim {{ form.dimension }}
                      </span>
                    </div>
                    <p class="text-[11px] opacity-90 leading-relaxed">{{ form.description }}</p>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Persistence Bar Diagram -->
          <div class="bg-neutral-950 rounded-lg border border-neutral-800 p-3 flex flex-col gap-2">
            <span class="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <mat-icon class="text-xs text-cyan-400">bar_chart</mat-icon>
              Persistent Homology Lifetime (ε Filtration)
            </span>

            <div class="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
              @if (!homology()?.persistenceDiagram?.length) {
                <p class="text-xs text-neutral-500 italic">Belum ada fitur persisten.</p>
              } @else {
                @for (bar of homology()!.persistenceDiagram; track bar.featureName) {
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center justify-between text-[10px] text-neutral-400">
                      <span class="truncate max-w-[180px]">{{ bar.featureName }}</span>
                      <span class="font-mono text-neutral-300">
                        [{{ bar.birth.toFixed(2) }} → {{ bar.death >= 1.0 ? '∞' : bar.death.toFixed(2) }}]
                      </span>
                    </div>
                    <div class="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden relative">
                      <div
                        class="h-full rounded-full transition-all"
                        [class]="bar.dimension === 0 ? 'bg-amber-500' : 'bg-cyan-400'"
                        [style.margin-left.%]="bar.birth * 100"
                        [style.width.%]="(bar.death - bar.birth) * 100"
                      ></div>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomologyVisualizerComponent {
  private readonly gameState = inject(GameStateService);

  readonly homology = this.gameState.homologyState;
  readonly filtrationEpsilon = signal<number>(0.55);
  readonly selectedNpc = signal<Simplex0 | null>(null);

  onEpsilonChange(event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.filtrationEpsilon.set(val);
    this.gameState.recomputeHomology(val);
  }

  getNodePos(id: string): { x: number; y: number } {
    const list = this.homology()?.simplices0 || [];
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return { x: 200, y: 140 };

    const total = Math.max(1, list.length);
    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
    const radiusX = 140;
    const radiusY = 90;
    return {
      x: 200 + radiusX * Math.cos(angle),
      y: 135 + radiusY * Math.sin(angle)
    };
  }

  getNodePosByName(name: string): { x: number; y: number } {
    const list = this.homology()?.simplices0 || [];
    const target = list.find(s => s.name === name || s.id === name);
    return target ? this.getNodePos(target.id) : { x: 200, y: 140 };
  }

  getFormationClass(severity: TopologicalFormation['severity']): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-950/40 border-red-800 text-red-200';
      case 'warning':
        return 'bg-amber-950/40 border-amber-800 text-amber-200';
      case 'info':
      default:
        return 'bg-emerald-950/40 border-emerald-800 text-emerald-200';
    }
  }
}
