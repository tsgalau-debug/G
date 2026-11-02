import {ChangeDetectionStrategy, Component, inject, ElementRef, viewChild, AfterViewChecked, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {GameStateService} from './game-state.service';
import {EngineService} from './engine.service';
import {ChronosEngineService} from './chronos-engine.service';
// eslint-disable-next-line import/no-unresolved
import {MatIconModule} from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-story',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-zinc-950 text-zinc-200 font-sans relative">
      
      <!-- Slim Utility & Collapsible Strip (1px Hairline Border) -->
      <div class="h-8 border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between bg-zinc-950/95 shrink-0 z-10 text-xs">
        <!-- Left: Quest Drawer Toggle, Mobile Status & Combat Indicator -->
        <div class="flex items-center gap-3 min-w-0 truncate">
          @if (getQuestKeys().length > 0) {
            <button 
              type="button"
              (click)="toggleQuestDrawer()"
              class="flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 transition-colors font-mono text-[11px] tabular-nums whitespace-nowrap shrink-0">
              <mat-icon class="text-[14px] w-[14px] h-[14px] text-amber-400">flag</mat-icon>
              <span>Misi ({{ getActiveQuestCount() }})</span>
              <mat-icon class="text-[13px] w-[13px] h-[13px] text-zinc-500">
                {{ showQuestDrawer() ? 'expand_less' : 'expand_more' }}
              </mat-icon>
            </button>
          } @else {
            <span class="text-[11px] font-mono text-zinc-500">Kronik Aktif</span>
          }

          <!-- Mobile-only compact status (hidden on md+ since Top Bar shows it) -->
          <div class="flex md:hidden items-center gap-1.5 text-[11px] text-zinc-400 font-mono tabular-nums truncate">
            <span class="text-zinc-700" aria-hidden="true">·</span>
            <span>H{{ gameState.mcState.day || 1 }}</span>
            <span class="text-zinc-700" aria-hidden="true">·</span>
            <span class="text-emerald-400">{{ gameState.mcState.time || '08:00' }}</span>
            <span class="text-zinc-700" aria-hidden="true">·</span>
            <span class="truncate">{{ gameState.mcState.locationName || gameState.mcState.location }}</span>
          </div>

          @if (gameState.combat.inCombat) {
            <span class="text-zinc-700" aria-hidden="true">·</span>
            <button 
              type="button"
              (click)="toggleCombatDrawer()"
              class="flex items-center gap-1 text-red-400 hover:text-red-300 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap shrink-0">
              <mat-icon class="text-[14px] w-[14px] h-[14px]">gavel</mat-icon>
              <span>Tempur ({{ gameState.combat.enemies.length }})</span>
            </button>
          }
        </div>

        <!-- Right: Minimalist Line Time Controls & Clock-Linked Sky Atmosphere -->
        @let sky = getSkyAtmosphere();
        <div class="flex items-center gap-3 font-mono text-[11px] tabular-nums shrink-0">
          <button 
            (click)="advanceManualTime(60)" 
            [disabled]="engine.isProcessing()"
            class="text-zinc-400 hover:text-zinc-100 disabled:opacity-40 transition-colors flex items-center gap-1 whitespace-nowrap"
            title="Lewatkan waktu 1 jam untuk memicu jadwal dunia dan perubahan langit">
            <mat-icon class="text-[13px] w-[13px] h-[13px]">schedule</mat-icon>
            <span>+1j</span>
          </button>
          <span class="text-zinc-800" aria-hidden="true">/</span>
          <div 
            class="flex items-center gap-1.5 whitespace-nowrap select-none"
            [title]="'Suasana Langit (' + (gameState.mcState.time || '08:00') + '): ' + sky.description">
            <mat-icon [class]="sky.colorClass + ' text-[13px] w-[13px] h-[13px]'">{{ sky.icon }}</mat-icon>
            <span [class]="sky.colorClass">{{ sky.label }}</span>
          </div>
        </div>
      </div>

      <!-- Collapsible Quest Drawer (1px Hairline Divided, Zero Box Nesting) -->
      @if (showQuestDrawer() && getQuestKeys().length > 0) {
        <div class="border-b border-zinc-800/80 bg-zinc-950/98 px-4 sm:px-6 py-2.5 shrink-0 z-10">
          <div class="max-w-5xl w-full mx-auto divide-y divide-zinc-800/60">
            @for (key of getQuestKeys(); track key) {
              @let q = gameState.quests[key];
              <div class="py-1.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-zinc-200">{{ q.title }}</span>
                    <span class="text-zinc-600" aria-hidden="true">·</span>
                    <span class="font-mono text-[10px] uppercase tracking-wider"
                          [class.text-amber-400]="q.status === 'active'"
                          [class.text-emerald-400]="q.status === 'completed'"
                          [class.text-red-400]="q.status === 'failed'">
                      {{ q.status }}
                    </span>
                  </div>
                  <p class="text-zinc-400 text-[11px] mt-0.5">{{ q.description }}</p>
                </div>
                @if (q.objectives && q.objectives.length > 0) {
                  <div class="text-[11px] text-zinc-400 font-mono shrink-0 sm:text-right">
                    @for (obj of q.objectives; track obj; let last = $last) {
                      <span>{{ obj }}</span>@if (!last) {<span class="text-zinc-700"> · </span>}
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Collapsible Combat Strip (When in Combat) -->
      @if (gameState.combat.inCombat && showCombatDrawer()) {
        <div class="border-b border-red-900/50 bg-red-950/15 px-4 sm:px-6 py-2 shrink-0 z-10">
          <div class="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 text-red-400 font-mono uppercase tracking-wider text-[11px]">
              <mat-icon class="text-[15px] w-[15px] h-[15px]">warning</mat-icon>
              <span>Situasi Tempur</span>
              <span class="text-zinc-600" aria-hidden="true">·</span>
              <span class="text-zinc-300">Posisi: {{ gameState.combat.advantage }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-[11px] font-mono tabular-nums">
              @for (enemy of gameState.combat.enemies; track enemy.name) {
                <div class="flex items-center gap-1.5">
                  <span class="text-zinc-200 font-sans font-medium">{{ enemy.name }}</span>
                  <span class="text-zinc-600" aria-hidden="true">·</span>
                  <span class="text-red-400">{{ enemy.hp }}</span>
                  <span class="text-zinc-600" aria-hidden="true">·</span>
                  <span class="text-zinc-400">{{ enemy.status }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Editorial Story Stream (Pure 1px Hairline Flow, No Boxed Cards) -->
      <div #scrollContainer class="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
        <div class="max-w-5xl w-full mx-auto divide-y divide-zinc-800/60">
          @for (entry of gameState.chronicle; track $index; let turnIdx = $index) {
            <article class="py-4 first:pt-0 space-y-3.5">
              <!-- Turn Kicker -->
              <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500 tabular-nums">
                <span>Giliran {{ turnIdx + 1 | number:'2.0-0' }}</span>
                @if (entry.mc_state?.locationName || entry.mc_state?.time) {
                  <span>
                    {{ entry.mc_state?.locationName || entry.mc_state?.location }}
                    @if (entry.mc_state?.time) { · {{ entry.mc_state?.time }} }
                  </span>
                }
              </div>

              @if (entry.narrative_blocks && entry.narrative_blocks.length > 0) {
                <div class="space-y-3.5">
                  @for (block of entry.narrative_blocks; track $index) {
                    <div class="space-y-1.5">
                      @if (block.name || block.action) {
                        <div class="flex flex-wrap items-baseline gap-2 text-xs">
                          @if (block.name) {
                            <span 
                              [class.text-emerald-400]="isMc(block.name)"
                              [class.text-amber-400]="!isMc(block.name)"
                              class="font-mono font-bold uppercase tracking-wider text-[11px]">
                              {{ block.name }}
                            </span>
                          }
                          @if (block.action) {
                            <span class="text-zinc-600" aria-hidden="true">·</span>
                            <span class="text-zinc-400 italic text-xs">{{ block.action }}</span>
                          }
                        </div>
                      }

                      @if (block.narration) {
                        <div class="text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif text-[13.5px] sm:text-sm">
                          {{ block.narration }}
                        </div>
                      }

                      @if (block.dialogue && block.dialogue !== '...') {
                        <blockquote class="pl-3 border-l border-emerald-500/60 text-emerald-100/90 italic font-serif text-[13.5px] sm:text-sm leading-relaxed">
                          "{{ block.dialogue }}"
                        </blockquote>
                      }
                    </div>
                  }
                </div>
              } @else {
                <!-- Fallback for legacy single narrative string -->
                <div class="text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif text-[13.5px] sm:text-sm">
                  {{ entry.narrative }}
                </div>
              }
            </article>
          }
          
          @if (engine.isProcessing()) {
            <div class="py-4 flex items-center gap-2 text-zinc-400 font-mono text-xs">
              <mat-icon class="animate-spin text-emerald-500 text-[15px] w-[15px] h-[15px]">autorenew</mat-icon>
              <span>Merangkai kelanjutan kronik...</span>
            </div>
          }
        </div>
      </div>

      <!-- Compact Action Dock (1px Hairline Indexed Choices & Minimalist Input) -->
      <div class="border-t border-zinc-800/80 bg-zinc-950 px-4 sm:px-8 py-2.5 shrink-0">
        @if (gameState.chronicle.length === 0 && !engine.isProcessing()) {
          <div class="max-w-5xl w-full mx-auto py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span class="text-zinc-200 font-sans font-semibold">{{ gameState.activeStory()?.title || 'Kisah Petualangan' }}</span>
                <span class="text-zinc-700" aria-hidden="true">·</span>
                <span>{{ gameState.activeStory()?.worldSetting || 'Dunia Terbuka' }}</span>
              </div>
              <p class="text-zinc-400 text-xs font-serif italic mt-0.5 line-clamp-2">
                "{{ gameState.getInitialStoryPrompt() }}"
              </p>
            </div>
            <button 
              id="btn-start-adventure"
              (click)="startSimulation()" 
              class="px-3.5 py-1.5 border border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <mat-icon class="text-[14px] w-[14px] h-[14px]">play_arrow</mat-icon>
              <span>Mulai Kronik</span>
            </button>
          </div>
        } @else if (latestChoices.length > 0 && !engine.isProcessing()) {
          <div class="max-w-5xl w-full mx-auto space-y-2">
            <!-- Indexed 1px Hairline Choices -->
            <div class="divide-y divide-zinc-800/60 border-b border-zinc-800/60">
              @for (choice of latestChoices; track choice.id; let idx = $index) {
                <button 
                  (click)="makeChoice(choice.text)"
                  class="w-full text-left py-1.5 px-1 hover:bg-zinc-900/50 transition-colors flex items-baseline gap-2.5 group text-xs">
                  <span class="font-mono text-[11px] text-emerald-500/80 group-hover:text-emerald-400 tabular-nums shrink-0">
                    0{{ idx + 1 }}
                  </span>
                  <span class="text-zinc-300 group-hover:text-zinc-100 leading-snug">
                    {{ choice.text }}
                  </span>
                </button>
              }
            </div>
            
            <!-- Minimalist Bottom-Line Custom Input -->
            <div class="flex items-center gap-2.5 pt-0.5">
              <span class="font-mono text-[11px] text-zinc-500 shrink-0">&gt;</span>
              <input 
                [formControl]="customAction" 
                (keyup.enter)="submitCustomAction()"
                placeholder="Ketik tindakan atau dialog kustom..." 
                class="flex-1 bg-transparent border-b border-zinc-800/80 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button 
                (click)="submitCustomAction()"
                [disabled]="!customAction.value?.trim()"
                aria-label="Kirim Tindakan"
                class="text-zinc-400 hover:text-emerald-400 disabled:opacity-30 transition-colors py-1 px-2 text-xs font-mono uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span>Kirim</span>
                <mat-icon class="text-[13px] w-[13px] h-[13px]">east</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class StoryComponent implements AfterViewChecked, OnInit {
  gameState = inject(GameStateService);
  engine = inject(EngineService);
  chronos = inject(ChronosEngineService);
  customAction = new FormControl('');
  
  showQuestDrawer = signal(false);
  showCombatDrawer = signal(true);

  private readonly scrollContainer = viewChild<ElementRef>('scrollContainer');
  private lastChronicleLength = 0;
  private wasProcessing = false;

  ngOnInit() {
    if (this.gameState.pendingStoryAction) {
      const action = this.gameState.pendingStoryAction;
      this.gameState.pendingStoryAction = undefined;
      this.customAction.setValue(action);
    }
  }

  ngAfterViewChecked() {
    const currentLen = this.gameState.chronicle.length;
    const isProc = this.engine.isProcessing();
    if (currentLen !== this.lastChronicleLength || isProc !== this.wasProcessing) {
      this.lastChronicleLength = currentLen;
      this.wasProcessing = isProc;
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      const container = this.scrollContainer();
      if (container) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
      }
    } catch {
      // ignore
    }
  }

  toggleQuestDrawer() {
    this.showQuestDrawer.update(v => !v);
  }

  toggleCombatDrawer() {
    this.showCombatDrawer.update(v => !v);
  }

  get latestChoices() {
    const lastEntry = this.gameState.chronicle[this.gameState.chronicle.length - 1];
    return lastEntry?.choices ?? [];
  }

  getQuestKeys() {
    return Object.keys(this.gameState.quests || {});
  }

  getActiveQuestCount(): number {
    return Object.values(this.gameState.quests || {}).filter(q => q.status === 'active').length;
  }

  isMc(name: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase();
    const mcName = (this.gameState.mcState.name || '').toLowerCase();
    return (mcName.length > 0 && lower.includes(mcName)) || lower.includes('player') || lower === 'aku' || lower === 'mc';
  }

  advanceManualTime(minutes: number) {
    this.chronos.advanceTime(minutes);
  }

  getSkyAtmosphere() {
    this.gameState.stateVersion();
    return this.chronos.getSkyAtmosphere(this.gameState.mcState.time);
  }

  makeChoice(choiceText: string) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.engine.processTurn(choiceText);
  }

  submitCustomAction() {
    const val = this.customAction.value;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
    if (val && val.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.engine.processTurn(val.trim());
      this.customAction.setValue('');
    }
  }

  startSimulation() {
    const prompt = this.gameState.getInitialStoryPrompt();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.engine.processTurn(prompt);
  }
}
