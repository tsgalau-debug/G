import { ChangeDetectionStrategy, Component, inject, viewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { GameStateService } from './game-state.service';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-engine-log',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="h-full bg-zinc-950 text-zinc-300 font-mono flex flex-col overflow-hidden">
      <!-- Slim 1px Header Bar -->
      <div class="h-9 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950 shrink-0 text-xs">
        <div class="flex items-center gap-2 font-sans">
          <mat-icon class="text-[14px] w-[14px] h-[14px] text-emerald-400">terminal</mat-icon>
          <span class="font-semibold text-zinc-200 tracking-tight">Riwayat Eksekusi Sistem</span>
        </div>
        <span class="text-[11px] text-zinc-500 tabular-nums">{{ gameState.logs.length }} Baris</span>
      </div>
      
      <div #scrollContainer class="flex-1 overflow-y-auto px-4 sm:px-6 py-3 divide-y divide-zinc-900/80 tabular-nums">
        <div class="max-w-[1440px] w-full mx-auto divide-y divide-zinc-900/80">
          @for (log of gameState.logs; track $index) {
            <div class="py-1.5 flex items-baseline gap-3 text-[11px] leading-relaxed hover:bg-zinc-900/30 px-1 transition-colors">
              <span class="text-zinc-600 shrink-0 select-none">{{ ($index + 1).toString().padStart(4, '0') }}</span>
              <span class="whitespace-pre-wrap text-zinc-300" [innerHTML]="formatLog(log)"></span>
            </div>
          }
          @if (gameState.logs.length === 0) {
            <div class="py-8 text-zinc-500 text-xs font-sans">
              Belum ada catatan eksekusi pada sesi ini.
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class EngineLogComponent implements AfterViewChecked {
  gameState = inject(GameStateService);
  private readonly scrollContainer = viewChild<ElementRef>('scrollContainer');

  private prevLogCount = 0;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const container = this.scrollContainer();
      if (container && this.gameState.logs.length !== this.prevLogCount) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
        this.prevLogCount = this.gameState.logs.length;
      }
    } catch { /* ignore */ }
  }

  formatLog(log: string): string {
    return log.replaceAll(/(\[.*?\])/g, '<span class="text-emerald-400 font-semibold">$1</span>')
              .replaceAll(/(Error|Memori Ditolak|Gagal)/ig, '<span class="text-red-400 font-semibold">$1</span>');
  }
}
