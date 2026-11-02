import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
// eslint-disable-next-line import/no-unresolved
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../game-state.service';
import { ItemInfo, resolveItemInfo, parseCurrencyFromInventory } from '../item-system';
import {
  resolveEquippedItem,
  getEffectiveGearBonuses,
  getRarityLabel,
  getRarityTextColor,
  getRarityBadgeClass
} from './character.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-character-inventory',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="divide-y divide-zinc-800/80 text-zinc-200">
      
      <!-- 1. Compact 4-Slot Equipment Line Strip -->
      <section class="pb-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold text-zinc-300 tracking-tight">Perlengkapan Terpasang</h3>
          <span class="text-[11px] font-mono text-zinc-500">Pilih slot untuk ganti</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 border-y border-zinc-800/80 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80">
          <!-- Weapon Slot -->
          <button
            type="button"
            (click)="openEquipSlot('weapon')"
            class="py-3 px-3 text-left hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 group">
            <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span>Senjata</span>
              <mat-icon class="text-[13px] w-[13px] h-[13px]" [class.text-emerald-400]="getEquippedItem('weapon')">hardware</mat-icon>
            </div>
            <div class="text-xs font-semibold truncate" [class.text-zinc-100]="getEquippedItem('weapon')" [class.text-zinc-500]="!getEquippedItem('weapon')">
              {{ getEquippedItem('weapon') || 'Kosong' }}
            </div>
            <div class="text-[10px] font-mono tabular-nums" [class.text-emerald-400]="getEquippedItem('weapon')" [class.text-zinc-600]="!getEquippedItem('weapon')">
              {{ getEquippedItem('weapon') ? ('+' + (gearBonuses.strength || 0) + ' ATK') : 'Pasang' }}
            </div>
          </button>

          <!-- Armor Slot -->
          <button
            type="button"
            (click)="openEquipSlot('armor')"
            class="py-3 px-3 text-left hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 group">
            <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span>Zirah</span>
              <mat-icon class="text-[13px] w-[13px] h-[13px]" [class.text-cyan-400]="getEquippedItem('armor')">shield</mat-icon>
            </div>
            <div class="text-xs font-semibold truncate" [class.text-zinc-100]="getEquippedItem('armor')" [class.text-zinc-500]="!getEquippedItem('armor')">
              {{ getEquippedItem('armor') || 'Kosong' }}
            </div>
            <div class="text-[10px] font-mono tabular-nums" [class.text-cyan-400]="getEquippedItem('armor')" [class.text-zinc-600]="!getEquippedItem('armor')">
              {{ getEquippedItem('armor') ? ('+' + (gearBonuses.defense || 0) + ' DEF') : 'Pasang' }}
            </div>
          </button>

          <!-- Accessory Slot -->
          <button
            type="button"
            (click)="openEquipSlot('accessory')"
            class="py-3 px-3 text-left hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 group">
            <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span>Aksesoris</span>
              <mat-icon class="text-[13px] w-[13px] h-[13px]" [class.text-amber-400]="getEquippedItem('accessory')">watch</mat-icon>
            </div>
            <div class="text-xs font-semibold truncate" [class.text-zinc-100]="getEquippedItem('accessory')" [class.text-zinc-500]="!getEquippedItem('accessory')">
              {{ getEquippedItem('accessory') || 'Kosong' }}
            </div>
            <div class="text-[10px] font-mono tabular-nums" [class.text-amber-400]="getEquippedItem('accessory')" [class.text-zinc-600]="!getEquippedItem('accessory')">
              {{ getEquippedItem('accessory') ? ('+' + (gearBonuses.charisma || 0) + ' CHA') : 'Pasang' }}
            </div>
          </button>

          <!-- Bag Slot -->
          <button
            type="button"
            (click)="openEquipSlot('bag')"
            class="py-3 px-3 text-left hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 group">
            <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span>Wadah</span>
              <mat-icon class="text-[13px] w-[13px] h-[13px]" [class.text-purple-400]="getEquippedItem('bag')">backpack</mat-icon>
            </div>
            <div class="text-xs font-semibold truncate" [class.text-zinc-100]="getEquippedItem('bag')" [class.text-zinc-500]="!getEquippedItem('bag')">
              {{ getEquippedItem('bag') || 'Standar' }}
            </div>
            <div class="text-[10px] font-mono tabular-nums" [class.text-purple-400]="getEquippedItem('bag')" [class.text-zinc-600]="!getEquippedItem('bag')">
              {{ getEquippedItem('bag') ? ('+' + (gearBonuses.capacity || 10) + ' Slot') : '20 Slot' }}
            </div>
          </button>
        </div>
      </section>

      <!-- 2. Wallet, Capacity & Category Line Filter Strip -->
      <section class="pt-5 space-y-3">
        <!-- Single-Line Telemetry: Currency · Capacity · Add Trigger -->
        <div class="flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums">
          <div class="flex items-center gap-2 text-zinc-400">
            <span>Dompet: <strong class="text-amber-400 font-semibold">{{ getCurrencyInfo().label }}</strong></span>
            <span class="text-zinc-700" aria-hidden="true">·</span>
            <span>Kapasitas: <strong class="text-zinc-200 font-semibold">{{ gameState.mcState.inventory?.length ?? 0 }}/{{ getMaxCapacity() }}</strong></span>
          </div>

          <button 
            type="button"
            (click)="openAddModal()" 
            class="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 whitespace-nowrap"
            title="Tambah Barang Kustom">
            <mat-icon class="text-[14px] w-[14px] h-[14px]">add</mat-icon>
            <span>Tambah Barang</span>
          </button>
        </div>

        <!-- Minimalist Line Category Filter Tabs -->
        <div class="flex items-center gap-4 border-b border-zinc-800/80 overflow-x-auto no-scrollbar">
          <button
            type="button"
            (click)="activeCategory = 'all'"
            class="pb-2 border-b-2 text-xs font-medium transition-colors whitespace-nowrap"
            [class.border-emerald-500]="activeCategory === 'all'"
            [class.text-zinc-100]="activeCategory === 'all'"
            [class.border-transparent]="activeCategory !== 'all'"
            [class.text-zinc-500]="activeCategory !== 'all'">
            Semua ({{ gameState.mcState.inventory?.length ?? 0 }})
          </button>
          <button
            type="button"
            (click)="activeCategory = 'gear'"
            class="pb-2 border-b-2 text-xs font-medium transition-colors whitespace-nowrap"
            [class.border-emerald-500]="activeCategory === 'gear'"
            [class.text-zinc-100]="activeCategory === 'gear'"
            [class.border-transparent]="activeCategory !== 'gear'"
            [class.text-zinc-500]="activeCategory !== 'gear'">
            Perlengkapan
          </button>
          <button
            type="button"
            (click)="activeCategory = 'consumable'"
            class="pb-2 border-b-2 text-xs font-medium transition-colors whitespace-nowrap"
            [class.border-emerald-500]="activeCategory === 'consumable'"
            [class.text-zinc-100]="activeCategory === 'consumable'"
            [class.border-transparent]="activeCategory !== 'consumable'"
            [class.text-zinc-500]="activeCategory !== 'consumable'">
            Konsumsi
          </button>
          <button
            type="button"
            (click)="activeCategory = 'quest'"
            class="pb-2 border-b-2 text-xs font-medium transition-colors whitespace-nowrap"
            [class.border-emerald-500]="activeCategory === 'quest'"
            [class.text-zinc-100]="activeCategory === 'quest'"
            [class.border-transparent]="activeCategory !== 'quest'"
            [class.text-zinc-500]="activeCategory !== 'quest'">
            Misi & Berharga
          </button>
        </div>

        <!-- 3. 1px Hairline Divided Inventory Rows -->
        <div class="divide-y divide-zinc-800/60">
          @for (item of getFilteredInventory(); track $index) {
            @let info = getItemInfo(item);
            @let isEquipped = isItemEquipped(item);

            <div class="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-900/30 px-1 transition-colors">
              <!-- Left: Icon & Unboxed Metadata -->
              <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" (click)="openItemInspector(info)">
                <mat-icon 
                  class="text-[18px] w-[18px] h-[18px] shrink-0"
                  [class.text-amber-400]="info.rarity === 'legendary'"
                  [class.text-blue-400]="info.rarity === 'rare'"
                  [class.text-emerald-400]="info.rarity === 'uncommon'"
                  [class.text-zinc-500]="info.rarity === 'common'">
                  {{ info.icon }}
                </mat-icon>

                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="text-xs sm:text-sm text-zinc-100 font-medium truncate">{{ info.name }}</span>
                    @if (isEquipped) {
                      <span class="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">· Terpasang</span>
                    }
                  </div>
                  
                  <!-- Unboxed Metadata: Category · Rarity · Bonus -->
                  <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                    <span class="capitalize">{{ info.category }}</span>
                    <span class="text-zinc-700" aria-hidden="true">·</span>
                    <span class="font-mono" [class]="getRarityTextColor(info.rarity)">{{ getRarityLabel(info.rarity) }}</span>
                    
                    @if (info.consumableEffect) {
                      <span class="text-zinc-700" aria-hidden="true">·</span>
                      <span class="text-emerald-400 font-mono tabular-nums">+{{ info.consumableEffect.hp || 0 }} HP</span>
                    }
                    @if (info.statBonus?.strength) {
                      <span class="text-zinc-700" aria-hidden="true">·</span>
                      <span class="text-emerald-400 font-mono tabular-nums">+{{ info.statBonus?.strength }} STR</span>
                    }
                    @if (info.statBonus?.defense) {
                      <span class="text-zinc-700" aria-hidden="true">·</span>
                      <span class="text-cyan-400 font-mono tabular-nums">+{{ info.statBonus?.defense }} DEF</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Right: Clean Inline Action Controls -->
              <div class="flex items-center gap-3 shrink-0 font-mono text-xs">
                @if (info.category === 'consumable' || info.consumableEffect) {
                  <button 
                    type="button"
                    (click)="onUseItem(item)"
                    class="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 whitespace-nowrap">
                    <mat-icon class="text-[13px] w-[13px] h-[13px]">restaurant</mat-icon>
                    <span>Gunakan</span>
                  </button>
                }

                @if (info.slot) {
                  @if (isEquipped) {
                    <button 
                      type="button"
                      (click)="onUnequipItem(info.slot)"
                      class="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 whitespace-nowrap">
                      <mat-icon class="text-[13px] w-[13px] h-[13px]">close</mat-icon>
                      <span>Lepas</span>
                    </button>
                  } @else {
                    <button 
                      type="button"
                      (click)="onEquipItem(item, info.slot)"
                      class="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 whitespace-nowrap">
                      <mat-icon class="text-[13px] w-[13px] h-[13px]">check</mat-icon>
                      <span>Pasang</span>
                    </button>
                  }
                }

                <button 
                  type="button"
                  (click)="openItemInspector(info)"
                  class="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                  title="Rincian Barang">
                  <mat-icon class="text-[15px] w-[15px] h-[15px]">east</mat-icon>
                </button>
              </div>
            </div>
          } @empty {
            <div class="py-8 text-center text-xs text-zinc-500 space-y-2">
              <p>Tidak ada barang dalam kategori ini.</p>
              <button 
                type="button"
                (click)="openAddModal()" 
                class="text-emerald-400 hover:text-emerald-300 font-mono underline underline-offset-4">
                + Tambah Barang Baru
              </button>
            </div>
          }
        </div>
      </section>
    </div>

    <!-- MODAL 1: ITEM INSPECTOR MODAL -->
    @if (selectedItem) {
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-zinc-950 border border-zinc-800 max-w-sm w-full p-5 space-y-4 relative">
          <div class="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h4 class="text-sm font-bold text-zinc-100">{{ selectedItem.name }}</h4>
              <div class="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-zinc-400">
                <span [class]="getRarityTextColor(selectedItem.rarity)">{{ getRarityLabel(selectedItem.rarity) }}</span>
                <span class="text-zinc-700" aria-hidden="true">·</span>
                <span class="capitalize">{{ selectedItem.category }}</span>
              </div>
            </div>
            <button 
              type="button"
              (click)="selectedItem = null" 
              class="text-zinc-500 hover:text-zinc-100 transition-colors">
              <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
            </button>
          </div>

          <p class="text-xs text-zinc-300 leading-relaxed">
            {{ selectedItem.description }}
          </p>

          @if (selectedItem.statBonus) {
            <div class="pt-2 border-t border-zinc-800/80 space-y-1 text-xs font-mono tabular-nums">
              <span class="text-[10px] uppercase tracking-wider text-zinc-500 block">Efek Atribut</span>
              <div class="flex flex-wrap gap-3 pt-1">
                @if (selectedItem.statBonus.strength) {
                  <span class="text-emerald-400">+{{ selectedItem.statBonus.strength }} STR</span>
                }
                @if (selectedItem.statBonus.defense) {
                  <span class="text-cyan-400">+{{ selectedItem.statBonus.defense }} DEF</span>
                }
                @if (selectedItem.statBonus.agility) {
                  <span class="text-purple-400">+{{ selectedItem.statBonus.agility }} AGI</span>
                }
                @if (selectedItem.statBonus.charisma) {
                  <span class="text-blue-400">+{{ selectedItem.statBonus.charisma }} CHA</span>
                }
                @if (selectedItem.statBonus.stamina) {
                  <span class="text-amber-400">+{{ selectedItem.statBonus.stamina }} STA</span>
                }
                @if (selectedItem.statBonus.capacity) {
                  <span class="text-zinc-300">+{{ selectedItem.statBonus.capacity }} Slot</span>
                }
              </div>
            </div>
          }

          @if (selectedItem.consumableEffect) {
            <div class="pt-2 border-t border-zinc-800/80 text-xs font-mono tabular-nums text-emerald-400 space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-zinc-500 block">Khasiat Konsumsi</span>
              @if (selectedItem.consumableEffect.hp) {
                <div>+{{ selectedItem.consumableEffect.hp }} HP</div>
              }
              @if (selectedItem.consumableEffect.sp) {
                <div>+{{ selectedItem.consumableEffect.sp }} SP</div>
              }
            </div>
          }

          <!-- Action Buttons in Modal -->
          <div class="divide-y divide-zinc-800/80 border-t border-zinc-800 pt-1 text-xs font-mono">
            @if (selectedItem.category === 'consumable' || selectedItem.consumableEffect) {
              <button 
                type="button"
                (click)="onUseItem(selectedItem.name); selectedItem = null"
                class="w-full py-2.5 text-left text-emerald-400 hover:text-emerald-300 flex items-center justify-between transition-colors">
                <span>Gunakan Sekarang</span>
                <mat-icon class="text-[15px] w-[15px] h-[15px]">restaurant</mat-icon>
              </button>
            }

            @if (selectedItem.slot) {
              @if (isItemEquipped(selectedItem.name)) {
                <button 
                  type="button"
                  (click)="onUnequipItem(selectedItem.slot); selectedItem = null"
                  class="w-full py-2.5 text-left text-zinc-300 hover:text-white flex items-center justify-between transition-colors">
                  <span>Lepas Dari Perlengkapan</span>
                  <mat-icon class="text-[15px] w-[15px] h-[15px]">close</mat-icon>
                </button>
              } @else {
                <button 
                  type="button"
                  (click)="onEquipItem(selectedItem.name, selectedItem.slot); selectedItem = null"
                  class="w-full py-2.5 text-left text-emerald-400 hover:text-emerald-300 flex items-center justify-between transition-colors">
                  <span>Pasang Sebagai {{ selectedItem.slot | uppercase }}</span>
                  <mat-icon class="text-[15px] w-[15px] h-[15px]">check</mat-icon>
                </button>
              }
            }

            <button 
              type="button"
              (click)="onUseInStory(selectedItem.name); selectedItem = null"
              class="w-full py-2.5 text-left text-zinc-300 hover:text-white flex items-center justify-between transition-colors">
              <span>Gunakan Dalam Kronik Cerita</span>
              <mat-icon class="text-[15px] w-[15px] h-[15px]">auto_stories</mat-icon>
            </button>

            <button 
              type="button"
              (click)="onDropItem(selectedItem.name); selectedItem = null"
              class="w-full py-2.5 text-left text-red-400 hover:text-red-300 flex items-center justify-between transition-colors">
              <span>Buang Dari Tas</span>
              <mat-icon class="text-[15px] w-[15px] h-[15px]">delete</mat-icon>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 2: EQUIP SLOT PICKER -->
    @if (selectedSlotForEquip) {
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-zinc-950 border border-zinc-800 max-w-sm w-full p-5 space-y-4 relative">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 class="text-xs font-semibold text-zinc-100 uppercase font-mono tracking-wider">
              Pilih Perlengkapan · {{ selectedSlotForEquip }}
            </h4>
            <button 
              type="button"
              (click)="selectedSlotForEquip = null" 
              class="text-zinc-500 hover:text-zinc-100 transition-colors">
              <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
            </button>
          </div>

          <div class="divide-y divide-zinc-800/60 max-h-60 overflow-y-auto">
            @for (compatibleItem of getCompatibleItemsForSlot(selectedSlotForEquip); track compatibleItem) {
              @let cInfo = getItemInfo(compatibleItem);
              <button
                type="button"
                (click)="onEquipItem(compatibleItem, selectedSlotForEquip); selectedSlotForEquip = null"
                class="w-full py-2.5 px-1 hover:bg-zinc-900/50 flex items-center justify-between gap-2 text-left transition-colors">
                <div>
                  <span class="text-xs font-semibold text-zinc-100 block">{{ cInfo.name }}</span>
                  <span class="text-[11px] font-mono text-zinc-500">{{ getRarityLabel(cInfo.rarity) }}</span>
                </div>
                <span class="text-xs font-mono text-emerald-400">Pasang</span>
              </button>
            } @empty {
              <div class="py-6 text-center text-zinc-500 text-xs">
                Tidak ada barang di tas yang cocok untuk slot {{ selectedSlotForEquip }}.
              </div>
            }
          </div>

          @if (getEquippedItem(selectedSlotForEquip)) {
            <button
              type="button"
              (click)="onUnequipItem(selectedSlotForEquip); selectedSlotForEquip = null"
              class="w-full pt-3 border-t border-zinc-800 text-red-400 hover:text-red-300 font-mono text-xs text-left transition-colors">
              Lepas Perlengkapan Saat Ini
            </button>
          }
        </div>
      </div>
    }

    <!-- MODAL 3: ADD CUSTOM ITEM -->
    @if (showAddModal) {
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-zinc-950 border border-zinc-800 max-w-sm w-full p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 class="text-xs font-semibold text-zinc-100 uppercase font-mono tracking-wider">
              Tambah Barang ke Tas
            </h4>
            <button 
              type="button"
              (click)="showAddModal = false" 
              class="text-zinc-500 hover:text-zinc-100 transition-colors">
              <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-[11px] text-zinc-400 block mb-1">Nama Barang</label>
              <input 
                [formControl]="newItemNameControl"
                (keydown.enter)="onAddNewItem()"
                type="text" 
                class="w-full bg-zinc-900/50 border-b border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Contoh: Ramuan Penyembuh, Belati Baja..."
              >
            </div>

            <div>
              <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">Contoh Cepat</span>
              <div class="flex flex-wrap gap-1.5 font-mono text-[11px]">
                <button 
                  type="button"
                  (click)="newItemNameControl.setValue('Ramuan Penyembuh')"
                  class="px-2 py-1 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 transition-colors">
                  Ramuan Penyembuh
                </button>
                <button 
                  type="button"
                  (click)="newItemNameControl.setValue('Ramuan Mana')"
                  class="px-2 py-1 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 transition-colors">
                  Ramuan Mana
                </button>
                <button 
                  type="button"
                  (click)="newItemNameControl.setValue('Zirah Rantai Besi')"
                  class="px-2 py-1 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 transition-colors">
                  Zirah Rantai Besi
                </button>
                <button 
                  type="button"
                  (click)="newItemNameControl.setValue('Cincin Pelindung Kuno')"
                  class="px-2 py-1 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 transition-colors">
                  Cincin Pelindung Kuno
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button 
              type="button"
              (click)="showAddModal = false" 
              class="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
              Batal
            </button>
            <button 
              type="button"
              [disabled]="!newItemNameControl.value?.trim()"
              (click)="onAddNewItem()" 
              class="px-4 py-1.5 border border-emerald-500/60 hover:bg-emerald-500/10 disabled:opacity-40 text-emerald-300 text-xs font-mono uppercase tracking-wider transition-colors">
              Tambahkan
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CharacterInventoryComponent {
  gameState = inject(GameStateService);
  toast = output<string>();

  activeCategory: 'all' | 'gear' | 'consumable' | 'quest' = 'all';
  selectedItem: ItemInfo | null = null;
  selectedSlotForEquip: 'weapon' | 'armor' | 'accessory' | 'bag' | null = null;
  showAddModal = false;
  newItemNameControl = new FormControl('');

  get gearBonuses() {
    this.gameState.stateVersion();
    return getEffectiveGearBonuses(
      this.gameState.mcState.equipped,
      this.gameState.mcState.inventory
    );
  }

  getMaxCapacity(): number {
    const base = 20;
    return base + (this.gearBonuses.capacity ?? 0);
  }

  getEquippedItem(type: 'weapon' | 'armor' | 'accessory' | 'bag'): string | null {
    this.gameState.stateVersion();
    return resolveEquippedItem(
      this.gameState.mcState.equipped,
      this.gameState.mcState.inventory,
      type
    );
  }

  isItemEquipped(itemName: string): boolean {
    this.gameState.stateVersion();
    const equipped = this.gameState.mcState.equipped ?? {};
    return Object.values(equipped).includes(itemName);
  }

  getItemInfo(itemName: string): ItemInfo {
    return resolveItemInfo(itemName);
  }

  getFilteredInventory(): string[] {
    this.gameState.stateVersion();
    const list = this.gameState.mcState.inventory ?? [];
    if (this.activeCategory === 'all') {
      return list;
    }

    return list.filter(item => {
      const info = resolveItemInfo(item);
      if (this.activeCategory === 'gear') {
        return ['weapon', 'armor', 'accessory', 'bag'].includes(info.category);
      }
      if (this.activeCategory === 'consumable') {
        return info.category === 'consumable' || info.consumableEffect !== undefined;
      }
      if (this.activeCategory === 'quest') {
        return info.category === 'quest' || info.category === 'currency';
      }
      return true;
    });
  }

  getCurrencyInfo() {
    return parseCurrencyFromInventory(this.gameState.mcState.inventory ?? []);
  }

  openItemInspector(info: ItemInfo) {
    this.selectedItem = info;
  }

  openEquipSlot(slot: 'weapon' | 'armor' | 'accessory' | 'bag') {
    const current = this.getEquippedItem(slot);
    if (current === null) {
      this.selectedSlotForEquip = slot;
    } else {
      this.selectedItem = resolveItemInfo(current);
    }
  }

  getCompatibleItemsForSlot(slot: 'weapon' | 'armor' | 'accessory' | 'bag'): string[] {
    const list = this.gameState.mcState.inventory ?? [];
    return list.filter(item => {
      const info = resolveItemInfo(item);
      return info.slot === slot;
    });
  }

  onUseItem(item: string) {
    const res = this.gameState.useItem(item);
    this.toast.emit(res.message);
  }

  onEquipItem(item: string, slot?: 'weapon' | 'armor' | 'accessory' | 'bag') {
    this.gameState.equipItem(item, slot);
    this.toast.emit(`Berhasil memasang ${item}!`);
  }

  onUnequipItem(slot?: 'weapon' | 'armor' | 'accessory' | 'bag') {
    if (!slot) return;
    this.gameState.unequipItem(slot);
    this.toast.emit(`Berhasil melepas perlengkapan.`);
  }

  onDropItem(item: string) {
    this.gameState.dropItem(item);
    this.toast.emit(`Barang "${item}" dibuang dari tas.`);
  }

  onUseInStory(itemName: string) {
    const actionPrompt = `Aku menggunakan ${itemName} untuk membantuku mengatasi situasi saat ini.`;
    this.gameState.queueStoryAction(actionPrompt);
    this.toast.emit(`Aksi "${itemName}" disiapkan di Chronicle.`);
  }

  openAddModal() {
    this.newItemNameControl.setValue('');
    this.showAddModal = true;
  }

  onAddNewItem() {
    const val = this.newItemNameControl.value;
    if (typeof val === 'string' && val.trim().length > 0) {
      this.gameState.addItem(val.trim());
      this.toast.emit(`Item "${val.trim()}" ditambahkan ke tas.`);
      this.showAddModal = false;
    }
  }

  getRarityLabel(rarity: string): string {
    return getRarityLabel(rarity);
  }

  getRarityTextColor(rarity: string): string {
    return getRarityTextColor(rarity);
  }

  getRarityBadgeClass(rarity: string): string {
    return getRarityBadgeClass(rarity);
  }
}
