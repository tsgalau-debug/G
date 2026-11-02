import { describe, it, expect } from 'vitest';
import { SimplicialComplexTracker } from '../app/topology/simplicial-complex';
import { NpcState } from '../app/game-state.types';

describe('P2 Regression Suite — Simplicial Complex Homology & GF(2) Boundary Reduction (AUD-04)', () => {
  it('computes exact Betti-1 via GF(2) rank(∂_2) on K_4 ⊔ C_4 without over-subtracting redundant clique triangles', () => {
    // Component 1: K_4 Clique (4 NPCs at the same location & faction -> 6 edges, 4 triangles, cycle rank = 3, rank_GF2(∂_2) = 3)
    // Component 2: C_4 Unfilled Patrol Loop (4 NPCs in distinct locations, each interacting with 2 neighbors -> 4 edges, 0 triangles, cycle rank = 1)
    // Naive old formula: rawCycleRank (4) - totalTriangles (4) = 0 (WRONG: erases the C_4 cavity!)
    // Exact GF(2) formula: rawCycleRank (4) - rank_GF2(∂_2) (3) = 1 (CORRECT!)
    const npcStates: Record<string, NpcState> = {
      // K_4 Clique
      K1: { nama: 'Kapten Vane', lokasi: 'Aula Benteng', faksi: 'Garda', aktivitas: 'Berjaga' },
      K2: { nama: 'Letnan Sera', lokasi: 'Aula Benteng', faksi: 'Garda', aktivitas: 'Berjaga' },
      K3: { nama: 'Sersan Dorn', lokasi: 'Aula Benteng', faksi: 'Garda', aktivitas: 'Berjaga' },
      K4: { nama: 'Kopral Lyra', lokasi: 'Aula Benteng', faksi: 'Garda', aktivitas: 'Berjaga' },

      // C_4 Chordless Cycle: P1 - P2 - P3 - P4 - P1
      // Different locations (spatial = 0.85), same faction (-0.15), co-activity with cyclic neighbors (-0.30) -> adjacent dist = 0.35 <= 0.55
      // Diagonal pairs have no co-activity -> diagonal dist = 0.65 > 0.55
      P1: { nama: 'Penjaga Utara', lokasi: 'Menara Utara', faksi: 'Patroli', aktivitas: 'Berkoordinasi dengan Penjaga Timur dan Penjaga Barat' },
      P2: { nama: 'Penjaga Timur', lokasi: 'Menara Timur', faksi: 'Patroli', aktivitas: 'Berkoordinasi dengan Penjaga Utara dan Penjaga Selatan' },
      P3: { nama: 'Penjaga Selatan', lokasi: 'Menara Selatan', faksi: 'Patroli', aktivitas: 'Berkoordinasi dengan Penjaga Timur dan Penjaga Barat' },
      P4: { nama: 'Penjaga Barat', lokasi: 'Menara Barat', faksi: 'Patroli', aktivitas: 'Berkoordinasi dengan Penjaga Selatan dan Penjaga Utara' },
    };

    const result = SimplicialComplexTracker.analyzeHomology(npcStates, {}, {}, 0.55);

    expect(result.totalVertices).toBe(8);
    expect(result.betti0).toBe(2);
    expect(result.totalEdges).toBe(10);      // 6 in K_4 + 4 in C_4
    expect(result.totalTriangles).toBe(4);   // 4 triangles in K_4
    expect(result.betti1).toBe(1);           // Exact GF(2) Betti-1 must be 1, NOT 0!
    expect(result.cavities.length).toBe(1);
    expect(result.cavities[0]!.loop.length).toBe(4);
  });

  it('detects 5-vertex chordless pentagon cavities (C_5) beyond 4-cycles and computes true Vietoris-Rips persistence bars', () => {
    // 5 NPCs forming an unfilled pentagon cycle C_5: A - B - C - D - E - A
    const npcStates: Record<string, NpcState> = {
      N1: { nama: 'Pengintai Alpha', lokasi: 'Pos 1', faksi: 'Ranger', aktivitas: 'Mengirim sinyal ke Pengintai Beta dan Pengintai Epsilon' },
      N2: { nama: 'Pengintai Beta', lokasi: 'Pos 2', faksi: 'Ranger', aktivitas: 'Mengirim sinyal ke Pengintai Alpha dan Pengintai Gamma' },
      N3: { nama: 'Pengintai Gamma', lokasi: 'Pos 3', faksi: 'Ranger', aktivitas: 'Mengirim sinyal ke Pengintai Beta dan Pengintai Delta' },
      N4: { nama: 'Pengintai Delta', lokasi: 'Pos 4', faksi: 'Ranger', aktivitas: 'Mengirim sinyal ke Pengintai Gamma dan Pengintai Epsilon' },
      N5: { nama: 'Pengintai Epsilon', lokasi: 'Pos 5', faksi: 'Ranger', aktivitas: 'Mengirim sinyal ke Pengintai Delta dan Pengintai Alpha' },
    };

    const mcTrust = {
      'Pengintai Alpha': 80,
      'Pengintai Beta': 65,
      'Pengintai Gamma': 50,
      'Pengintai Delta': 35,
      'Pengintai Epsilon': 20,
    };

    const result = SimplicialComplexTracker.analyzeHomology(npcStates, mcTrust, {}, 0.55);

    expect(result.totalVertices).toBe(5);
    expect(result.betti0).toBe(1);
    expect(result.totalEdges).toBe(5);
    expect(result.totalTriangles).toBe(0);
    expect(result.betti1).toBe(1);

    // Must detect the 5-vertex cycle cavity (previously missed by C_4-only loop)
    expect(result.cavities.length).toBe(1);
    expect(result.cavities[0]!.loop.length).toBe(5);

    // Verify beta-1 persistence bar is dynamically computed from actual filtration distances, not hardcoded 0.35 / 0.85 / 0.50
    const beta1Bars = result.persistenceDiagram.filter(b => b.dimension === 1);
    expect(beta1Bars.length).toBeGreaterThanOrEqual(1);
    const bar = beta1Bars[0]!;
    expect(bar.birth).not.toBe(0.35);
    expect(bar.death).not.toBe(0.85);
    expect(bar.persistence).toBeCloseTo(bar.death - bar.birth, 4);
    expect(bar.activeAtThreshold).toBe(true);
  });
});
