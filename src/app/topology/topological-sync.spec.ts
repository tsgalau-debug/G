import { describe, it, expect } from 'vitest';
import { TopologicalSyncSystem } from './topological-sync';
import { NpcState } from '../game-state.types';

describe('TopologicalSyncSystem', () => {

  it('should not mutate valid joint states', () => {
    const globalState: Record<string, NpcState> = {
      "Raja Aldric": { nama: "Raja Aldric", lokasi: "Kamar", aktivitas: "Bersantai dengan Ratu Selene" },
      "Ratu Selene": { nama: "Ratu Selene", lokasi: "Kamar", aktivitas: "Melayani batin Raja Aldric" }
    };
    
    // AI merespon dengan state tidak ada perubahan
    const incoming: NpcState[] = [];

    const { resolvedState, anomalies } = TopologicalSyncSystem.resolveState(globalState, incoming);
    
    expect(anomalies.length).toBe(0);
    expect(resolvedState['Ratu Selene'].aktivitas).toBe("Melayani batin Raja Aldric");
  });

  it('should detect and auto-correct topological anomaly when one NPC moves abruptly', () => {
    const globalState: Record<string, NpcState> = {
      "Raja_Aldric": { nama: "Raja Aldric", lokasi: "Kamar", aktivitas: "Bersantai dengan Ratu Selene" },
      "Ratu_Selene": { nama: "Ratu Selene", lokasi: "Kamar", aktivitas: "Melayani batin Raja Aldric" }
    };
    
    // AI tiba-tiba memindahkan Raja ke Aula Utama, tapi Ratu tidak disebutkan ikut
    const incoming: NpcState[] = [
      { nama: "Raja Aldric", lokasi: "Aula Utama", aktivitas: "Memimpin Rapat Dewan" }
    ];

    const { resolvedState, anomalies } = TopologicalSyncSystem.resolveState(globalState, incoming);
    
    // Harusnya Ratu Selene terkena auto-correct karena Raja pindah
    expect(anomalies.length).toBe(1);
    expect(anomalies[0].npcA).toBe('Ratu Selene');
    expect(anomalies[0].npcB).toBe('Raja Aldric');
    
    // Raja berhasil pindah (dan data tertuju ke key Raja_Aldric yang ada)
    expect(resolvedState['Raja_Aldric'].lokasi).toBe("Aula Utama");
    expect(resolvedState['Raja_Aldric'].aktivitas).toBe("Memimpin Rapat Dewan");
    
    // Aktivitas ratu harusnya direset, tidak lagi melayani Raja yang ga ada
    expect(resolvedState['Ratu_Selene'].lokasi).toBe("Kamar");
    expect(resolvedState['Ratu_Selene'].aktivitas).toBe("Berada sendirian setelah ditinggalkan.");
  });

  it('REG-20261023-008: should repair corrupted schedule prefixes, ignore place-name collisions ("Kediaman Takeshi"), and unify sub-spots in the same room ("Sudut Ruang Tamu" vs "Lantai Tatami Ruang Tamu")', () => {
    const globalState: Record<string, NpcState> = {
      Aiko: {
        nama: 'Aiko',
        lokasi: 'Penginapan & Kedai Sudut Ruang Tamu Kediaman Takeshi',
        aktivitas: 'Menghangatkan diri di Penginapan & Kedai Sudut Ruang Tamu Kediaman Takeshi dan memperhatikan Takeshi'
      },
      Takeshi: {
        nama: 'Takeshi',
        lokasi: 'Penginapan & Kedai Lantai Tatami Ruang Tamu Kediaman Takeshi',
        aktivitas: 'Duduk bersila di lantai tatami'
      }
    };

    const { resolvedState, anomalies } = TopologicalSyncSystem.resolveState(globalState, []);

    // Tidak boleh ada false-positive desync karena keduanya berada di ruangan kanonis yang sama ("Ruang Tamu Kediaman Takeshi")
    expect(anomalies.length).toBe(0);
    expect(resolvedState['Aiko'].lokasi).toBe('Ruang Tamu Kediaman Takeshi');
    expect(resolvedState['Takeshi'].lokasi).toBe('Ruang Tamu Kediaman Takeshi');
  });

  it('REG-20261023-008: should not trigger social desync when another character name only appears as a building/residence name ("Kediaman Takeshi")', () => {
    const globalState: Record<string, NpcState> = {
      Aiko: {
        nama: 'Aiko',
        lokasi: 'Kediaman Takeshi',
        aktivitas: 'Merapikan halaman depan di Kediaman Takeshi.'
      },
      Takeshi: {
        nama: 'Takeshi',
        lokasi: 'Gerbang Utara Desa',
        aktivitas: 'Berpatroli di gerbang utara.'
      }
    };

    const { resolvedState, anomalies } = TopologicalSyncSystem.resolveState(globalState, []);

    expect(anomalies.length).toBe(0);
    expect(resolvedState['Aiko'].aktivitas).toBe('Merapikan halaman depan di Kediaman Takeshi.');
  });

  it('REG-20261023-008: should synchronize npcA location to npcB location when both are active in incomingAIState with a genuine location mismatch', () => {
    const globalState: Record<string, NpcState> = {};
    const incoming: NpcState[] = [
      {
        nama: 'Aiko',
        lokasi: 'Pasar Lama',
        aktivitas: 'Berbincang serius dengan Takeshi mengenai rencana perjalanan'
      },
      {
        nama: 'Takeshi',
        lokasi: 'Ruang Tamu Kediaman Takeshi',
        aktivitas: 'Mendengarkan penjelasan Aiko dengan saksama'
      }
    ];

    const { resolvedState, anomalies } = TopologicalSyncSystem.resolveState(globalState, incoming);

    expect(anomalies.length).toBe(1);
    expect(resolvedState['Aiko'].lokasi).toBe('Ruang Tamu Kediaman Takeshi');
  });

});

