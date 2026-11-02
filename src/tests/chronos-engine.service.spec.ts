import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChronosEngineService } from '../app/chronos-engine.service';
import { GameStateService } from '../app/game-state.service';

vi.mock('@angular/core', () => ({
  Injectable: () => (target: unknown) => target,
  inject: (token: unknown) => {
    if (token === GameStateService) {
      return new (token as new () => GameStateService)();
    }
    return {};
  },
  signal: (v: unknown) => {
    let current = v;
    const fn = () => current;
    fn.set = vi.fn((next: unknown) => { current = next; });
    fn.update = vi.fn((updater: (prev: unknown) => unknown) => { current = updater(current); });
    fn.get = () => current;
    return fn;
  },
  computed: (fn: () => unknown) => ({ get: fn }),
  ApplicationRef: class {
    tick = vi.fn();
  },
  Injector: class {
    get = vi.fn();
  },
}));

describe('ChronosEngineService', () => {
  let service: ChronosEngineService;
  let gameState: GameStateService;

  beforeEach(() => {
    service = new ChronosEngineService();
    gameState = service.gameState;
    gameState.logs = [];
    gameState.mcState = {
      time: '08:45',
      day: 1,
    };
    gameState.npcStates = {};
    vi.spyOn(gameState, 'saveState').mockResolvedValue();
  });

  describe('NPC schedule decoupling from system time logic', () => {
    it('does not overwrite NPC states with hardcoded schedule activities on advanceTime', () => {
      gameState.npcStates['Naomi'] = {
        nama: 'Naomi',
        aktivitas: 'Berbicara dengan Kuro tentang legenda tua',
        lokasi: 'Desa Yamato'
      };

      // Advance time by 60 minutes
      service.advanceTime(60);

      // Verify Naomi's AI-generated activity was NOT overwritten by hardcoded schedule
      expect(gameState.npcStates['Naomi'].aktivitas).toBe('Berbicara dengan Kuro tentang legenda tua');
    });

    it('replaces all underscores across multiple words in NPC IDs', () => {
      // Test direct replaceAll behavior on multi-underscore string
      const multiUnderscoreId = 'komandan_pasukan_khusus_auralis';
      const normalized = multiUnderscoreId.replaceAll('_', ' ');
      expect(normalized).toBe('komandan pasukan khusus auralis');
      expect(normalized.includes('_')).toBe(false);
    });
  });

  describe('advanceTime log guarding', () => {
    it('does not log [Chronos] when minutes is 0 and hour has not changed', () => {
      gameState.logs = [];
      service.advanceTime(0);

      const chronosLogs = gameState.logs.filter(l => l.includes('[Chronos] Waktu berlalu'));
      expect(chronosLogs.length).toBe(0);
    });

    it('logs [Chronos] when minutes > 0', () => {
      gameState.logs = [];
      service.advanceTime(15);

      const chronosLogs = gameState.logs.filter(l => l.includes('[Chronos] Waktu berlalu'));
      expect(chronosLogs.length).toBe(1);
      expect(chronosLogs[0]).toContain('09:00');
    });

    it('logs [Chronos] when hour changes even if minutes is 0 (e.g. AI updated time)', () => {
      // Advance to record initial state
      service.advanceTime(0);
      gameState.logs = [];

      // External update from narrative: hour changes from 08:xx to 09:xx
      gameState.mcState.time = '09:15';
      service.advanceTime(0);

      const chronosLogs = gameState.logs.filter(l => l.includes('[Chronos] Waktu berlalu'));
      expect(chronosLogs.length).toBe(1);
      expect(chronosLogs[0]).toContain('09:15');
    });

    it('does not log [Chronos] on multiple advanceTime(0) within the same hour', () => {
      // Hour is 08
      service.advanceTime(0);
      expect(gameState.logs.filter(l => l.includes('[Chronos]')).length).toBe(0);

      // Advance 0 again within same hour
      service.advanceTime(0);
      expect(gameState.logs.filter(l => l.includes('[Chronos]')).length).toBe(0);
    });
  });

  describe('Persistence saveState consistency', () => {
    it('calls saveState on advanceTime', () => {
      const saveSpy = vi.spyOn(gameState, 'saveState');
      service.advanceTime(15);
      expect(saveSpy).toHaveBeenCalled();
    });

    it('calls saveState on advanceTime(0) even when log is guarded', () => {
      const saveSpy = vi.spyOn(gameState, 'saveState');
      service.advanceTime(0);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('P3 (AUD-06): Dynamic NPC Schedule Synthesis & Hourly Movement', () => {
    it('automatically generates a role- & location-aware daily schedule when a new NPC is registered via updateNpcStates', () => {
      gameState.mcState.time = '08:00';
      gameState.mcState.locationName = 'Benteng Auralis';

      gameState.updateNpcStates([
        {
          nama: 'Kapten Vane',
          lokasi: 'Gerbang Benteng Auralis',
          aktivitas: 'Memeriksa kesiapan pasukan jaga pagi.',
          faksi: 'Garda Kerajaan',
          mood: 'Tegas'
        },
        {
          nama: 'Sora si Penempa',
          lokasi: 'Pasar Besi Auralis',
          aktivitas: 'Menata bilah pedang di lapak tempa.',
          faksi: 'Serikat Pengrajin',
          mood: 'Bersemangat'
        }
      ]);

      const vaneSched = gameState.npcSchedules['Kapten Vane'];
      const soraSched = gameState.npcSchedules['Sora si Penempa'];

      expect(vaneSched).toBeDefined();
      expect(vaneSched?.archetype).toBe('guard');
      expect(vaneSched?.homeLocation).toBe('Gerbang Benteng Auralis');
      expect(vaneSched?.slots.length).toBe(6);

      expect(soraSched).toBeDefined();
      expect(soraSched?.archetype).toBe('merchant');
      expect(soraSched?.homeLocation).toBe('Pasar Besi Auralis');
      expect(soraSched?.slots.length).toBe(6);
    });

    it('moves dynamically registered NPCs across locations and activities when +1j (advanceTime(60)) or Istirahat (advanceTime(480)) is triggered', () => {
      gameState.mcState.time = '08:00';
      gameState.mcState.day = 1;
      gameState.mcState.locationName = 'Desa Yamato';

      // Register a newly born LLM NPC at 08:00 (early_morning slot: 06:00-08:59)
      gameState.updateNpcStates([
        {
          nama: 'Kenshin',
          lokasi: 'Gerbang Desa Yamato',
          aktivitas: 'Mengamati jalan masuk desa di pagi hari.',
          faksi: 'Penjaga Perbatasan',
          mood: 'Waspada'
        }
      ]);

      expect(gameState.npcStates['Kenshin']?.lokasi).toBe('Gerbang Desa Yamato');

      // Advance +1 hour to 09:00 (crosses into late_morning slot: 09:00-11:59)
      service.advanceTime(60);
      expect(gameState.mcState.time).toBe('09:00');
      const locAt09 = gameState.npcStates['Kenshin']?.lokasi;
      const actAt09 = gameState.npcStates['Kenshin']?.aktivitas;
      expect(locAt09).toBe('Jalur Patroli Desa Yamato');
      expect(actAt09).toContain('patroli aktif');
      expect(gameState.npcStates['Kenshin']?._fromSchedule).toBe(true);

      // Advance +3 hours to 12:00 (crosses into midday slot: 12:00-14:59)
      service.advanceTime(180);
      expect(gameState.mcState.time).toBe('12:00');
      expect(gameState.npcStates['Kenshin']?.lokasi).toBe('Pos Komando Desa Yamato');

      // Advance +8 hours to 20:00 (evening slot: 18:00-21:59)
      service.advanceTime(480);
      expect(gameState.mcState.time).toBe('20:00');
      expect(gameState.npcStates['Kenshin']?.lokasi).toBe('Kedai Singgah Desa Yamato');

      // Advance +3 hours to 23:00 (night slot: 22:00-05:59, day rollover check at 24:00)
      service.advanceTime(180);
      expect(gameState.mcState.time).toBe('23:00');
      expect(gameState.npcStates['Kenshin']?.lokasi).toBe('Menara Pantau Desa Yamato');
    });

    it('preserves existing background world NPCs when a new NPC is introduced in a subsequent turn', () => {
      gameState.mcState.time = '08:00';
      gameState.updateNpcStates([
        {
          nama: 'Tetua Daichi',
          lokasi: 'Balai Desa',
          aktivitas: 'Memimpin musyawarah pagi',
          faksi: 'Penjaga Desa'
        }
      ]);
      expect(gameState.npcStates['Tetua Daichi']).toBeDefined();

      // Next turn: player meets a new character in the forest
      gameState.updateNpcStates([
        {
          nama: 'Lyra si Pengelana',
          lokasi: 'Hutan Perbatasan',
          aktivitas: 'Memeriksa jejak rusa mistis',
          faksi: 'Serikat Pengelana'
        }
      ]);

      // Both NPCs remain in world state and both have active daily schedules
      expect(gameState.npcStates['Tetua Daichi']).toBeDefined();
      expect(gameState.npcStates['Lyra si Pengelana']).toBeDefined();
      expect(gameState.npcSchedules['Tetua Daichi']).toBeDefined();
      expect(gameState.npcSchedules['Lyra si Pengelana']).toBeDefined();
      expect(gameState.rollingNpcKeys).toEqual(['Lyra si Pengelana']);

      // Advancing time by +1 hour moves both the Genesis/prior NPC and the newly born NPC
      service.advanceTime(60);
      expect(gameState.npcStates['Tetua Daichi']?._fromSchedule).toBe(true);
      expect(gameState.npcStates['Lyra si Pengelana']?._fromSchedule).toBe(true);
    });

    it('dynamically updates sky atmosphere phase, icon, and label as the game clock advances', () => {
      gameState.mcState.time = '05:30';
      expect(service.getSkyAtmosphere().label).toBe('Fajar');

      gameState.mcState.time = '08:00';
      expect(service.getSkyAtmosphere().label).toBe('Pagi Cerah');
      expect(service.getSkyAtmosphere().icon).toBe('wb_sunny');

      service.advanceTime(240); // -> 12:00
      expect(service.getSkyAtmosphere().label).toBe('Terik Siang');
      expect(service.getSkyAtmosphere().icon).toBe('light_mode');

      service.advanceTime(240); // -> 16:00
      expect(service.getSkyAtmosphere().label).toBe('Sore Teduh');
      expect(service.getSkyAtmosphere().icon).toBe('wb_cloudy');

      service.advanceTime(120); // -> 18:00
      expect(service.getSkyAtmosphere().label).toBe('Senja');
      expect(service.getSkyAtmosphere().icon).toBe('wb_twilight');

      service.advanceTime(120); // -> 20:00
      expect(service.getSkyAtmosphere().label).toBe('Malam');
      expect(service.getSkyAtmosphere().icon).toBe('bedtime');

      service.advanceTime(240); // -> 00:00
      expect(service.getSkyAtmosphere().label).toBe('Larut Malam');
      expect(service.getSkyAtmosphere().icon).toBe('dark_mode');
    });

    it('REG-20261023-006: preserves canonical NPC daily schedule when NPC appears in a temporary scene location and protects active scene NPCs during clock transitions', () => {
      gameState.mcState.time = '08:00';
      gameState.mcState.day = 2;
      gameState.mcState.locationName = 'Benteng Auralis';

      // 1. Register Kapten Vane at his canonical home base (Gerbang Benteng Auralis)
      gameState.updateNpcStates([
        {
          nama: 'Kapten Vane',
          lokasi: 'Gerbang Benteng Auralis',
          aktivitas: 'Memeriksa kesiapan pasukan jaga pagi.',
          faksi: 'Garda Kerajaan',
          mood: 'Tegas'
        },
        {
          nama: 'Sora si Penempa',
          lokasi: 'Pasar Besi Auralis',
          aktivitas: 'Menata bilah pedang di lapak tempa.',
          faksi: 'Serikat Pengrajin',
          mood: 'Bersemangat'
        }
      ]);

      expect(gameState.npcSchedules['Kapten Vane']?.homeLocation).toBe('Gerbang Benteng Auralis');
      expect(gameState.npcSchedules['Kapten Vane']?.archetype).toBe('guard');

      // 2. Subsequent turn: Kapten Vane accompanies MC in a temporary forest ambush at 12:15,
      //    and LLM accidentally sends "day": 0 from prompt schema template
      const prevTime = gameState.mcState.time;
      gameState.updateMcState({
        time: '12:15',
        day: 0, // Template leak that previously reset day to 0
        locationName: 'Rawa Kabut Hitam'
      });

      // Verify monotonic day guard prevented regression to 0
      expect(gameState.mcState.day).toBe(2);
      expect(gameState.mcState.time).toBe('12:15');

      // Advance clock with previousTime='08:00' and activeSceneNpcNames=['Kapten Vane']
      service.advanceTime(0, {
        previousTime: prevTime,
        activeSceneNpcNames: ['Kapten Vane'],
        skipTopologicalSync: true
      });
      gameState.updateNpcStates([
        {
          nama: 'Kapten Vane',
          lokasi: 'Rawa Kabut Hitam',
          aktivitas: 'Bertarung bahu-membahu bersama MC melawan penyergap.',
          mood: 'Waspada'
        }
      ]);

      // Canonical homeLocation and archetype in npcSchedules must NOT be overwritten by Rawa Kabut Hitam!
      expect(gameState.npcSchedules['Kapten Vane']?.homeLocation).toBe('Gerbang Benteng Auralis');
      expect(gameState.npcSchedules['Kapten Vane']?.archetype).toBe('guard');

      // Meanwhile, background NPC (Sora si Penempa) transitioned to her 12:00 midday schedule slot,
      // while active scene NPC (Kapten Vane) kept his in-scene location & activity!
      expect(gameState.npcStates['Kapten Vane']?.lokasi).toBe('Rawa Kabut Hitam');
      expect(gameState.npcStates['Kapten Vane']?._fromSchedule).toBe(false);
      expect(gameState.npcStates['Sora si Penempa']?._fromSchedule).toBe(true);

      // 3. Midnight rollover check: advancing from 23:30 to 01:15 without explicit day increment
      gameState.mcState.time = '23:30';
      gameState.updateMcState({
        time: '01:15'
      });
      expect(gameState.mcState.day).toBe(3);
      expect(gameState.mcState.time).toBe('01:15');
    });
  });
});



