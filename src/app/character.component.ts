import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from './game-state.service';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';
import { CharacterProfileComponent } from './character/character-profile.component';
import { CharacterStatsComponent } from './character/character-stats.component';
import { CharacterInventoryComponent } from './character/character-inventory.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-character',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CharacterProfileComponent,
    CharacterStatsComponent,
    CharacterInventoryComponent
  ],
  template: `
    <div class="h-full overflow-y-auto bg-zinc-950 text-zinc-200 font-sans relative">
      
      <!-- Toast Feedback Banner -->
      @if (toastMessage()) {
        <div class="fixed bottom-5 right-5 z-50 bg-zinc-950 border border-emerald-500/60 text-emerald-300 px-3.5 py-2 flex items-center gap-2 text-xs font-mono">
          <mat-icon class="text-[15px] w-[15px] h-[15px] text-emerald-400">check</mat-icon>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <!-- Mobile Sub-Tab Line Bar (Visible below lg) -->
      <div class="flex lg:hidden border-b border-zinc-800/80 px-4 bg-zinc-950 sticky top-0 z-10">
        <button 
          type="button"
          (click)="mobileTab.set('profile')" 
          [class.border-emerald-500]="mobileTab() === 'profile'"
          [class.text-zinc-100]="mobileTab() === 'profile'"
          [class.border-transparent]="mobileTab() !== 'profile'"
          [class.text-zinc-500]="mobileTab() !== 'profile'"
          class="py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap">
          Profil & Relasi
        </button>
        <button 
          type="button"
          (click)="mobileTab.set('inventory')" 
          [class.border-emerald-500]="mobileTab() === 'inventory'"
          [class.text-zinc-100]="mobileTab() === 'inventory'"
          [class.border-transparent]="mobileTab() !== 'inventory'"
          [class.text-zinc-500]="mobileTab() !== 'inventory'"
          class="py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap">
          Tas ({{ (gameState.mcState.inventory || []).length }})
        </button>
        <button 
          type="button"
          (click)="mobileTab.set('stats')" 
          [class.border-emerald-500]="mobileTab() === 'stats'"
          [class.text-zinc-100]="mobileTab() === 'stats'"
          [class.border-transparent]="mobileTab() !== 'stats'"
          [class.text-zinc-500]="mobileTab() !== 'stats'"
          class="py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap">
          Atribut & Radar
        </button>
      </div>

      <!-- TWO-COLUMN MINIMALIST LINE WORKSPACE -->
      <div class="max-w-[1440px] w-full mx-auto lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-800/80 min-h-full">
        
        <!-- Left Column (5/12): Identity, Vitality & Faction/NPC Relations -->
        <div 
          class="lg:col-span-5 p-4 sm:p-5"
          [class.hidden]="mobileTab() !== 'profile'"
          [class.lg:block]="true">
          <app-character-profile (toast)="showToast($event)"></app-character-profile>
        </div>

        <!-- Right Column (7/12): Spacious Sub-Tabbed Inventory & Attributes -->
        <div 
          class="lg:col-span-7 flex flex-col"
          [class.hidden]="mobileTab() === 'profile'"
          [class.lg:flex]="true">
          
          <!-- Desktop Right Column Sub-Tab Line Header -->
          <div class="hidden lg:flex items-center justify-between border-b border-zinc-800/80 px-5 h-9 shrink-0">
            <div class="flex items-center h-full gap-6">
              <button 
                type="button"
                (click)="desktopRightTab.set('inventory')"
                [class.border-emerald-500]="desktopRightTab() === 'inventory'"
                [class.text-zinc-100]="desktopRightTab() === 'inventory'"
                [class.border-transparent]="desktopRightTab() !== 'inventory'"
                [class.text-zinc-500]="desktopRightTab() !== 'inventory'"
                class="h-full border-b-2 text-xs font-medium transition-colors flex items-center gap-2 hover:text-zinc-200 whitespace-nowrap">
                <mat-icon class="text-[14px] w-[14px] h-[14px]">inventory_2</mat-icon>
                <span>Perlengkapan & Tas ({{ (gameState.mcState.inventory || []).length }})</span>
              </button>
              <button 
                type="button"
                (click)="desktopRightTab.set('stats')"
                [class.border-emerald-500]="desktopRightTab() === 'stats'"
                [class.text-zinc-100]="desktopRightTab() === 'stats'"
                [class.border-transparent]="desktopRightTab() !== 'stats'"
                [class.text-zinc-500]="desktopRightTab() !== 'stats'"
                class="h-full border-b-2 text-xs font-medium transition-colors flex items-center gap-2 hover:text-zinc-200 whitespace-nowrap">
                <mat-icon class="text-[14px] w-[14px] h-[14px]">insights</mat-icon>
                <span>Atribut & Analisis Radar</span>
              </button>
            </div>

            <span class="text-[11px] font-mono text-zinc-500 tabular-nums">
              Lv. {{ gameState.mcState.level || 1 }} · {{ gameState.mcState.status || 'Healthy' }}
            </span>
          </div>

          <!-- Right Column Body -->
          <div class="p-4 sm:p-5 flex-1">
            <!-- Inventory Sub-View -->
            <div 
              [class.hidden]="!isInventoryVisible()"
              class="block">
              <app-character-inventory (toast)="showToast($event)"></app-character-inventory>
            </div>

            <!-- Stats & Radar Sub-View -->
            <div 
              [class.hidden]="!isStatsVisible()"
              class="block">
              <app-character-stats (toast)="showToast($event)"></app-character-stats>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class CharacterComponent {
  gameState = inject(GameStateService);
  mobileTab = signal<'profile' | 'inventory' | 'stats'>('profile');
  desktopRightTab = signal<'inventory' | 'stats'>('inventory');
  toastMessage = signal<string | null>(null);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  isInventoryVisible(): boolean {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return this.mobileTab() === 'inventory';
    }
    return this.desktopRightTab() === 'inventory' || this.mobileTab() === 'inventory';
  }

  isStatsVisible(): boolean {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return this.mobileTab() === 'stats';
    }
    return this.desktopRightTab() === 'stats';
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
