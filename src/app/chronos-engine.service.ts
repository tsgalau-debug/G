/* eslint-disable */
import { Injectable, inject } from '@angular/core';
import { GameStateService } from './game-state.service';
import type { NpcDailySchedule, NpcScheduleSlot, NpcState } from './game-state.types';
import {
  generateDynamicNpcSchedule,
  inferNpcRoleArchetype,
  resolveScheduleSlotForHour,
  sanitizeNpcScheduleAndState
} from './world-genesis';

@Injectable({
  providedIn: 'root'
})
export class ChronosEngineService {
  gameState = inject(GameStateService);
  private lastHour: number | null = null;

  constructor() {
    if (this.gameState.mcState?.time) {
      this.lastHour = Math.floor(this.parseTime(this.gameState.mcState.time) / 60) % 24;
    }
  }

  // Time format: "HH:MM"
  public parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  private formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Generates a dynamic role- & location-based schedule for any NPC and registers it in GameStateService.
   */
  public registerDynamicNpcSchedule(key: string, npc: NpcState, forceRefresh = false): NpcDailySchedule {
    if (typeof this.gameState.ensureNpcSchedule === 'function') {
      return this.gameState.ensureNpcSchedule(key, npc, forceRefresh);
    }
    const baseLoc = this.gameState.mcState?.locationName || this.gameState.mcState?.location || 'Pusat Wilayah';
    const schedule = generateDynamicNpcSchedule(key, npc, baseLoc);
    if (!this.gameState.npcSchedules) {
      this.gameState.npcSchedules = {};
    }
    this.gameState.npcSchedules[key] = schedule;
    return schedule;
  }

  /**
   * Resolves the scheduled location, activity, and mood for an NPC at a specific hour (0..23).
   */
  public resolveSlotForHour(schedule: NpcDailySchedule, hour: number): NpcScheduleSlot {
    return resolveScheduleSlotForHour(schedule, hour);
  }

  public inferArchetype(npc: NpcState) {
    return inferNpcRoleArchetype(npc);
  }

  /**
   * Maps the current game clock ("HH:MM") to a dynamic Sky Atmosphere state
   * (label, Material icon, color class, and atmospheric description).
   */
  public getSkyAtmosphere(timeStr?: string): {
    phase: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | 'midnight';
    label: string;
    icon: string;
    colorClass: string;
    description: string;
  } {
    const rawTime = timeStr ?? this.gameState.mcState?.time ?? '08:00';
    const totalMinutes = this.parseTime(rawTime);
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;

    if (hour >= 5 && hour < 7) {
      return {
        phase: 'dawn',
        label: 'Fajar',
        icon: 'wb_twilight',
        colorClass: 'text-amber-300',
        description: 'Langit ufuk timur memerah keemasan, kabut tipis pagi menyelimuti wilayah.'
      };
    }
    if (hour >= 7 && hour < 11) {
      return {
        phase: 'morning',
        label: 'Pagi Cerah',
        icon: 'wb_sunny',
        colorClass: 'text-amber-400',
        description: 'Cahaya matahari pagi bersinar hangat dan jernih.'
      };
    }
    if (hour >= 11 && hour < 15) {
      return {
        phase: 'noon',
        label: 'Terik Siang',
        icon: 'light_mode',
        colorClass: 'text-yellow-300',
        description: 'Matahari tepat di puncak langit dengan cahaya siang yang benderang.'
      };
    }
    if (hour >= 15 && (hour < 17 || (hour === 17 && minute < 30))) {
      return {
        phase: 'afternoon',
        label: 'Sore Teduh',
        icon: 'wb_cloudy',
        colorClass: 'text-amber-200',
        description: 'Sinar matahari mulai condong ke barat diiringi angin sore yang teduh.'
      };
    }
    if ((hour === 17 && minute >= 30) || hour === 18) {
      return {
        phase: 'dusk',
        label: 'Senja',
        icon: 'wb_twilight',
        colorClass: 'text-orange-400',
        description: 'Langit berubah jingga lembayung saat matahari tenggelam di cakrawala.'
      };
    }
    if (hour >= 19 && hour < 23) {
      return {
        phase: 'night',
        label: 'Malam',
        icon: 'bedtime',
        colorClass: 'text-indigo-300',
        description: 'Bulan dan gugusan bintang menerangi langit malam yang tenang.'
      };
    }
    return {
      phase: 'midnight',
      label: 'Larut Malam',
      icon: 'dark_mode',
      colorClass: 'text-sky-300',
      description: 'Malam pekat dan sunyi menyelimuti seluruh penjuru wilayah.'
    };
  }

  // Advance time by N minutes (e.g., typical action takes 15 mins, travel takes 60 mins)
  advanceTime(
    minutes: number,
    options?: {
      previousTime?: string | undefined;
      activeSceneNpcNames?: string[] | undefined;
      skipTopologicalSync?: boolean | undefined;
    }
  ) {
    if (!this.gameState.mcState.time) return;

    const currentMins = this.parseTime(this.gameState.mcState.time);
    const currentHour = Math.floor(currentMins / 60) % 24;
    let nextMins = currentMins + minutes;
    
    // Day rollover
    if (nextMins >= 24 * 60) {
      if (this.gameState.mcState.day) {
        this.gameState.mcState.day += 1;
      }
      nextMins = nextMins % (24 * 60);
    }

    const nextHour = Math.floor(nextMins / 60) % 24;
    const explicitPrevHour =
      options?.previousTime && typeof options.previousTime === 'string'
        ? Math.floor(this.parseTime(options.previousTime) / 60) % 24
        : null;
    const hourChanged =
      (explicitPrevHour !== null && explicitPrevHour !== nextHour) ||
      (this.lastHour !== null && this.lastHour !== nextHour) ||
      (currentHour !== nextHour);

    this.gameState.mcState.time = this.formatTime(nextMins);

    if (minutes > 0 || hourChanged) {
      this.gameState.logs.push(`[Chronos] Waktu berlalu. Sekarang jam ${this.gameState.mcState.time}`);
      this.lastHour = nextHour;
    } else if (this.lastHour === null) {
      this.lastHour = nextHour;
    }

    this.simulateWorldEvents(
      hourChanged,
      minutes,
      nextHour,
      nextMins,
      options?.activeSceneNpcNames,
      options?.skipTopologicalSync
    );
    this.gameState.stateVersion.update(v => v + 1);
    this.gameState.saveState();
  }

  // Simulate background activities of scheduled NPCs (both World Genesis & dynamic LLM-born NPCs)
  private simulateWorldEvents(
    hourChanged = false,
    minutesAdvanced = 0,
    targetHour?: number | undefined,
    targetMins?: number | undefined,
    activeSceneNpcNames?: string[] | undefined,
    skipTopologicalSync = false
  ) {
    if (!this.gameState.mcState.time) return;

    const mins = targetMins ?? this.parseTime(this.gameState.mcState.time);
    const hour = targetHour ?? (Math.floor(mins / 60) % 24);
    const shouldAdvanceSchedules = hourChanged || minutesAdvanced >= 60;

    if (shouldAdvanceSchedules && this.gameState.npcSchedules) {
      const schedules = this.gameState.npcSchedules;
      const baseLoc = this.gameState.mcState?.locationName || this.gameState.mcState?.location || 'Pusat Wilayah';
      const normalize = (s: string) => s.replaceAll('_', ' ').toLowerCase().trim();
      const activeSceneSet = new Set(
        (activeSceneNpcNames || []).filter(Boolean).map(n => normalize(String(n)))
      );

      for (const [key, npc] of Object.entries(this.gameState.npcStates || {})) {
        if (!npc) continue;

        const normKey = normalize(key);
        const normName = npc.nama ? normalize(npc.nama) : normKey;
        if (activeSceneSet.has(normKey) || activeSceneSet.has(normName)) {
          continue;
        }

        // Look up registered schedule by key or normalized NPC name
        let schedule: NpcDailySchedule | undefined = schedules[key];
        let matchedScheduleKey = key;
        if (!schedule && npc.nama) {
          const targetNorm = normalize(npc.nama);
          for (const [schedKey, schedVal] of Object.entries(schedules)) {
            if (normalize(schedKey) === targetNorm || normalize(schedVal.npcName) === targetNorm) {
              schedule = schedVal;
              matchedScheduleKey = schedKey;
              break;
            }
          }
        }

        // Only transition NPCs that have an active registered schedule (from World Genesis or updateNpcStates)
        // This preserves raw unscheduled AI scene overrides (e.g. chronos-engine.service.spec.ts)
        if (!schedule) continue;

        const sanitized = sanitizeNpcScheduleAndState(matchedScheduleKey, npc, schedule, baseLoc);
        schedule = sanitized.schedule;
        schedules[matchedScheduleKey] = schedule;

        const slot = resolveScheduleSlotForHour(schedule, hour);
        const prevLoc = npc.lokasi || npc.location || '';
        const prevAct = npc.aktivitas || npc.activity || '';

        npc.lokasi = slot.lokasi;
        npc.location = slot.lokasi;
        npc.aktivitas = slot.aktivitas;
        npc.activity = slot.aktivitas;
        if (slot.mood) {
          npc.mood = slot.mood;
        }
        npc._fromSchedule = true;
        npc._lastScheduleTime = mins;

        if (prevLoc !== slot.lokasi || prevAct !== slot.aktivitas) {
          this.gameState.logs.push(
            `[Chronos] Jadwal NPC: ${npc.nama || key} berpindah ke ${slot.lokasi} — ${slot.aktivitas}`
          );
        }
      }
    }

    if (!skipTopologicalSync) {
      this.gameState.enforceTopologicalSync();
    }
  }
}

