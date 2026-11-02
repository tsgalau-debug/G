/* eslint-disable */
import { NpcState } from '../game-state.types';

/**
 * Representasi Simplex dalam Simplicial Complex
 */
export interface Simplex0 {
  dimension: 0;
  id: string;          // NPC key/id
  name: string;
  location: string;
  faction?: string | undefined;
  trustScore: number;
}

export interface Simplex1 {
  dimension: 1;
  id: string;          // e.g. "npcA::npcB"
  u: string;
  v: string;
  distance: number;    // metric social/spatial distance
  birth: number;       // filtration epsilon
}

export interface Simplex2 {
  dimension: 2;
  id: string;          // e.g. "npcA::npcB::npcC"
  vertices: [string, string, string];
  maxEdgeDistance: number;
  birth: number;
}

export interface TopologicalFormation {
  type: 'social_clique' | 'patrol_loop' | 'faction_split' | 'isolated_agent' | 'topological_cavity';
  title: string;
  description: string;
  members: string[];
  severity: 'info' | 'warning' | 'critical';
  dimension: number;
}

export interface PersistenceBar {
  dimension: number;
  featureName: string;
  birth: number;
  death: number;
  persistence: number;
  activeAtThreshold: boolean;
}

export interface HomologyAnalysisResult {
  timestamp: number;
  betti0: number; // Jumlah klaster sosial / connected components
  betti1: number; // Jumlah 1-dimensional cavities / patrol loops
  totalVertices: number;
  totalEdges: number;
  totalTriangles: number;
  simplices0: Simplex0[];
  simplices1: Simplex1[];
  simplices2: Simplex2[];
  cliques: string[][];
  cavities: { loop: string[]; description: string; perimeter: number }[];
  formations: TopologicalFormation[];
  persistenceDiagram: PersistenceBar[];
  filtrationEpsilon: number;
}

/**
 * Disjoint Set (Union-Find) untuk komputasi Connected Components & beta_0
 */
class UnionFind {
  private parent = new Map<string, string>();
  private rank = new Map<string, number>();

  constructor(elements: string[]) {
    for (const el of elements) {
      this.parent.set(el, el);
      this.rank.set(el, 0);
    }
  }

  find(i: string): string {
    const p = this.parent.get(i);
    if (!p) {
      this.parent.set(i, i);
      this.rank.set(i, 0);
      return i;
    }
    if (p === i) return i;
    const root = this.find(p);
    this.parent.set(i, root);
    return root;
  }

  union(i: string, j: string): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return false;

    const rankI = this.rank.get(rootI) ?? 0;
    const rankJ = this.rank.get(rootJ) ?? 0;

    if (rankI < rankJ) {
      this.parent.set(rootI, rootJ);
    } else if (rankI > rankJ) {
      this.parent.set(rootJ, rootI);
    } else {
      this.parent.set(rootJ, rootI);
      this.rank.set(rootI, rankI + 1);
    }
    return true;
  }

  getComponentCount(elements: string[]): number {
    const roots = new Set<string>();
    for (const el of elements) {
      roots.add(this.find(el));
    }
    return roots.size;
  }

  getComponents(elements: string[]): Map<string, string[]> {
    const comp = new Map<string, string[]>();
    for (const el of elements) {
      const root = this.find(el);
      if (!comp.has(root)) comp.set(root, []);
      comp.get(root)!.push(el);
    }
    return comp;
  }
}

/**
 * Simplicial Complex & Persistent Homology Tracker
 * Menghitung Betti Numbers (β0, β1) pada graf jarak sosial & spasial NPC.
 */
export class SimplicialComplexTracker {
  /**
   * Menghitung jarak metriks sosial-spasial antara dua NPC (0.0 = identik/berdampingan, 1.0+ = terisolasi/bermusuhan)
   */
  static calculateDistance(
    a: NpcState,
    b: NpcState,
    mcTrust: Record<string, number> = {},
    factions: Record<string, { reputation: number }> = {}
  ): number {
    const locA = (a.lokasi || a.location || '').toLowerCase().trim();
    const locB = (b.lokasi || b.location || '').toLowerCase().trim();

    // 1. Spasial base distance
    let spatialDist = 0.5;
    if (locA && locB && locA === locB) {
      spatialDist = 0.15; // Sama lokasi = dekat secara spasial
    } else if (locA && locB && (locA.includes(locB) || locB.includes(locA))) {
      spatialDist = 0.25;
    } else if (!locA || !locB || locA === 'unknown' || locB === 'unknown') {
      spatialDist = 0.6;
    } else {
      spatialDist = 0.85; // Beda lokasi jauh
    }

    // 2. Interaksi langsung / Co-activity
    const actA = (a.aktivitas || a.activity || '').toLowerCase();
    const actB = (b.aktivitas || b.activity || '').toLowerCase();
    const nameA = a.nama.toLowerCase();
    const nameB = b.nama.toLowerCase();

    let coactivityBonus = 0;
    if (actA.includes(nameB) || actB.includes(nameA)) {
      coactivityBonus = -0.3; // Saling berinteraksi
    }

    // 3. Faction alignment
    let factionAlignment = 0;
    const facA = a.faksi || a.faction;
    const facB = b.faksi || b.faction;
    if (facA && facB) {
      if (facA === facB) {
        factionAlignment = -0.15; // Faksi sama
      } else {
        const repA = factions[facA]?.reputation ?? 0;
        const repB = factions[facB]?.reputation ?? 0;
        if ((repA > 20 && repB < -20) || (repA < -20 && repB > 20)) {
          factionAlignment = 0.35; // Faksi bermusuhan
        }
      }
    }

    // 4. Mood alignment
    let moodPenalty = 0;
    const moodA = (a.mood || '').toLowerCase();
    const moodB = (b.mood || '').toLowerCase();
    if ((moodA.includes('marah') || moodA.includes('curiga') || moodA.includes('waspada')) &&
        (moodB.includes('marah') || moodB.includes('curiga') || moodB.includes('waspada'))) {
      moodPenalty = 0.15;
    }

    // 5. MC Trust alignment
    const trustA = mcTrust[a.nama] ?? 50;
    const trustB = mcTrust[b.nama] ?? 50;
    const trustDiff = Math.abs(trustA - trustB) / 100;
    const trustInfluence = (trustDiff - 0.5) * 0.1;

    const rawDist = spatialDist + coactivityBonus + factionAlignment + moodPenalty + trustInfluence;
    return Math.max(0.05, Math.min(1.0, rawDist));
  }

  /**
   * Bangun Vietoris-Rips filtration & hitung Persistent Homology (Betti β0, β1)
   */
  static analyzeHomology(
    npcStates: Record<string, NpcState>,
    mcTrust: Record<string, number> = {},
    factions: Record<string, { reputation: number }> = {},
    filtrationEpsilon = 0.55
  ): HomologyAnalysisResult {
    const npcKeys = Object.keys(npcStates).filter(k => npcStates[k]?.nama);
    const n = npcKeys.length;

    // 0-Simplex (Vertices)
    const simplices0: Simplex0[] = npcKeys.map(k => {
      const npc = npcStates[k]!;
      return {
        dimension: 0,
        id: k,
        name: npc.nama,
        location: npc.lokasi || npc.location || 'Unknown',
        faction: npc.faksi || npc.faction,
        trustScore: mcTrust[npc.nama] ?? 50
      };
    });

    if (n === 0) {
      return {
        timestamp: Date.now(),
        betti0: 0,
        betti1: 0,
        totalVertices: 0,
        totalEdges: 0,
        totalTriangles: 0,
        simplices0: [],
        simplices1: [],
        simplices2: [],
        cliques: [],
        cavities: [],
        formations: [],
        persistenceDiagram: [],
        filtrationEpsilon
      };
    }

    // Matrix jarak
    const distMatrix = new Map<string, number>();
    const getEdgeKey = (u: string, v: string) => u < v ? `${u}::${v}` : `${v}::${u}`;

    const allCandidateEdges: Simplex1[] = [];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const u = npcKeys[i]!;
        const v = npcKeys[j]!;
        const d = this.calculateDistance(npcStates[u]!, npcStates[v]!, mcTrust, factions);
        const k = getEdgeKey(u, v);
        distMatrix.set(k, d);

        allCandidateEdges.push({
          dimension: 1,
          id: k,
          u,
          v,
          distance: d,
          birth: d
        });
      }
    }

    // Filter 1-simplices pada threshold aktif
    const activeEdges = allCandidateEdges.filter(e => e.distance <= filtrationEpsilon);

    // Bangun Adjacency untuk clique detection
    const adj = new Map<string, Set<string>>();
    for (const k of npcKeys) adj.set(k, new Set<string>());
    for (const e of activeEdges) {
      adj.get(e.u)?.add(e.v);
      adj.get(e.v)?.add(e.u);
    }

    // 2-Simplices (Triangles / 3-cliques: u < v < w)
    const activeTriangles: Simplex2[] = [];
    for (let i = 0; i < n; i++) {
      const u = npcKeys[i]!;
      const neighborsU = adj.get(u) || new Set();
      for (let j = i + 1; j < n; j++) {
        const v = npcKeys[j]!;
        if (!neighborsU.has(v)) continue;
        const neighborsV = adj.get(v) || new Set();

        for (let k = j + 1; k < n; k++) {
          const w = npcKeys[k]!;
          if (neighborsU.has(w) && neighborsV.has(w)) {
            const dUV = distMatrix.get(getEdgeKey(u, v)) ?? 1;
            const dVW = distMatrix.get(getEdgeKey(v, w)) ?? 1;
            const dUW = distMatrix.get(getEdgeKey(u, w)) ?? 1;
            const maxD = Math.max(dUV, dVW, dUW);

            activeTriangles.push({
              dimension: 2,
              id: `${u}::${v}::${w}`,
              vertices: [u, v, w],
              maxEdgeDistance: maxD,
              birth: maxD
            });
          }
        }
      }
    }

    // Komputasi Betti 0 (Connected components via Union-Find)
    const uf = new UnionFind(npcKeys);
    for (const e of activeEdges) {
      uf.union(e.u, e.v);
    }
    const betti0 = uf.getComponentCount(npcKeys);
    const componentsMap = uf.getComponents(npcKeys);

    // Komputasi Betti 1 Eksak via Aljabar Homologi Simplicial atas GF(2) (AUD-04 P2)
    // dim(Z_1) = |E| - |V| + β0
    const rawCycleRank = Math.max(0, activeEdges.length - npcKeys.length + betti0);
    // rank(B_1) = rank_GF2(∂_2), dihitung melalui reduksi kolom Gaussian atas GF(2)
    const edgeIndexMap = new Map<string, number>();
    activeEdges.forEach((e, idx) => edgeIndexMap.set(e.id, idx));

    const boundary2Basis = this._reduceBoundary2GF2(activeTriangles, edgeIndexMap, getEdgeKey);
    const rankBoundary2 = boundary2Basis.size;
    const betti1 = Math.max(0, rawCycleRank - rankBoundary2);

    // Temukan Clique sosial (Komponen yang merupakan complete graph / density tinggi)
    const cliques: string[][] = [];
    for (const [_root, members] of componentsMap.entries()) {
      if (members.length >= 3) {
        let internalEdges = 0;
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            if (adj.get(members[i]!)?.has(members[j]!)) {
              internalEdges++;
            }
          }
        }
        const maxPossible = (members.length * (members.length - 1)) / 2;
        if (internalEdges >= maxPossible * 0.75) {
          cliques.push(members.map(m => npcStates[m]?.nama || m));
        }
      }
    }

    // Temukan Topologis Cavities (Siklus tanpa kord / 1-cavities untuk panjang k >= 4 yang bebas linier terhadap B_1)
    const detectedCavities = this._findIndependentCavities(
      npcKeys,
      npcStates,
      adj,
      distMatrix,
      edgeIndexMap,
      boundary2Basis,
      getEdgeKey,
      betti1
    );

    const cavities: { loop: string[]; description: string; perimeter: number }[] = detectedCavities.map(c => ({
      loop: c.loop,
      description: c.description,
      perimeter: c.perimeter
    }));

    // Klasifikasi Formasi Topologis
    const formations: TopologicalFormation[] = [];

    // 1. Social Cliques
    for (const clq of cliques) {
      formations.push({
        type: 'social_clique',
        title: `Komplotan / Squad (${clq.length} Anggota)`,
        description: `Kelompok terikat erat dalam 2-simplices padat: ${clq.join(', ')}`,
        members: clq,
        severity: 'info',
        dimension: 2
      });
    }

    // 2. Patrol Loops / Cavities
    for (const cav of cavities) {
      formations.push({
        type: 'patrol_loop',
        title: `Rute Patroli / Formasi Perimeter (1-Cavity)`,
        description: cav.description,
        members: cav.loop,
        severity: 'warning',
        dimension: 1
      });
    }

    // 3. Faction Split / Fragmentation Anomaly
    if (betti0 >= 3 && n >= 4) {
      formations.push({
        type: 'faction_split',
        title: `Fragmentasi Sosial Ekstrem (β0 = ${betti0})`,
        description: `Dunia terbelah menjadi ${betti0} faksi/klaster terpisah yang tidak saling berinteraksi secara spasial.`,
        members: npcKeys.map(k => npcStates[k]?.nama || k),
        severity: 'critical',
        dimension: 0
      });
    }

    // 4. Isolated Agents
    for (const [_root, members] of componentsMap.entries()) {
      if (members.length === 1) {
        const isolatedKey = members[0]!;
        const isoName = npcStates[isolatedKey]?.nama || isolatedKey;
        formations.push({
          type: 'isolated_agent',
          title: `Agen Terisolasi (${isoName})`,
          description: `${isoName} tidak terhubung ke agen manapun dalam radius interaksi saat ini.`,
          members: [isoName],
          severity: 'info',
          dimension: 0
        });
      }
    }

    // Persistent Homology Diagram (Filtration scan across epsilon 0.0 -> 1.0)
    const persistenceDiagram: PersistenceBar[] = [];

    // β0 bars: Dimulai dari epsilon = 0 (setiap vertex lahir di eps=0), mati saat dimerge oleh edge
    const sortedEdges = [...allCandidateEdges].sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
    const persUF = new UnionFind(npcKeys);
    const componentBirth = new Map<string, number>();
    for (const k of npcKeys) componentBirth.set(k, 0);

    const cycleCreatingEdges: { edge: Simplex1; edgeIdx: number }[] = [];
    const fullEdgeIndexMap = new Map<string, number>();
    sortedEdges.forEach((e, idx) => fullEdgeIndexMap.set(e.id, idx));

    for (let idx = 0; idx < sortedEdges.length; idx++) {
      const e = sortedEdges[idx]!;
      const rootU = persUF.find(e.u);
      const rootV = persUF.find(e.v);
      if (rootU !== rootV) {
        const deadRoot = rootV;
        const birth = componentBirth.get(deadRoot) ?? 0;
        persistenceDiagram.push({
          dimension: 0,
          featureName: `Klaster [${npcStates[e.u]?.nama || e.u} + ${npcStates[e.v]?.nama || e.v}]`,
          birth,
          death: e.distance,
          persistence: Number((e.distance - birth).toFixed(4)),
          activeAtThreshold: filtrationEpsilon >= birth && filtrationEpsilon <= e.distance
        });
        persUF.union(e.u, e.v);
      } else {
        // Edge menghubungkan dua vertex yang sudah berada di komponen yang sama -> melahirkan 1-cycle baru
        cycleCreatingEdges.push({ edge: e, edgeIdx: idx });
      }
    }

    // Sisa komponen tak hingga (death = 1.0)
    for (const k of npcKeys) {
      if (persUF.find(k) === k) {
        persistenceDiagram.push({
          dimension: 0,
          featureName: `Essential Macro Component (${npcStates[k]?.nama || k})`,
          birth: 0,
          death: 1.0,
          persistence: 1.0,
          activeAtThreshold: true
        });
      }
    }

    // β1 bars (Eksak via filtrasi Vietoris-Rips & reduksi matriks batas ∂_2 atas GF(2))
    const beta1Bars = this._computeBeta1PersistenceBars(
      npcKeys,
      npcStates,
      sortedEdges,
      fullEdgeIndexMap,
      distMatrix,
      getEdgeKey,
      detectedCavities,
      filtrationEpsilon
    );
    persistenceDiagram.push(...beta1Bars);

    return {
      timestamp: Date.now(),
      betti0,
      betti1,
      totalVertices: simplices0.length,
      totalEdges: activeEdges.length,
      totalTriangles: activeTriangles.length,
      simplices0,
      simplices1: activeEdges,
      simplices2: activeTriangles,
      cliques,
      cavities,
      formations,
      persistenceDiagram,
      filtrationEpsilon
    };
  }

  /**
   * Mereduksi kolom-kolom matriks batas ∂_2 atas GF(2) (Z/2Z).
   * Mengembalikan Map dari pivot (indeks edge tertinggi) ke himpunan indeks edge pembentuk kolom tereduksi.
   * Jumlah entri pada Map adalah nilai eksak rank_GF2(∂_2).
   */
  private static _reduceBoundary2GF2(
    triangles: Simplex2[],
    edgeIndexMap: Map<string, number>,
    getEdgeKey: (u: string, v: string) => string
  ): Map<number, Set<number>> {
    const pivotToColumn = new Map<number, Set<number>>();

    for (const tri of triangles) {
      const [u, v, w] = tri.vertices;
      const e1 = edgeIndexMap.get(getEdgeKey(u, v));
      const e2 = edgeIndexMap.get(getEdgeKey(v, w));
      const e3 = edgeIndexMap.get(getEdgeKey(u, w));
      if (e1 === undefined || e2 === undefined || e3 === undefined) continue;

      const col = new Set<number>([e1, e2, e3]);
      this._reduceColumnGF2(col, pivotToColumn);

      if (col.size > 0) {
        const pivot = Math.max(...col);
        pivotToColumn.set(pivot, col);
      }
    }

    return pivotToColumn;
  }

  /**
   * Reduksi satu vektor/kolom 1-chain atas GF(2) terhadap basis pivot yang sudah ada.
   */
  private static _reduceColumnGF2(col: Set<number>, basis: Map<number, Set<number>>): void {
    while (col.size > 0) {
      const pivot = Math.max(...col);
      const basisCol = basis.get(pivot);
      if (!basisCol) break;
      // Operasi XOR (symmetric difference) atas GF(2)
      for (const idx of basisCol) {
        if (col.has(idx)) {
          col.delete(idx);
        } else {
          col.add(idx);
        }
      }
    }
  }

  /**
   * Mencari siklus kordal (chordless cycles) dengan panjang k >= 4 (C_4, C_5, C_6, dst.)
   * yang bebas linier terhadap ruang batas B_1 = im(∂_2) atas GF(2).
   */
  private static _findIndependentCavities(
    npcKeys: string[],
    npcStates: Record<string, NpcState>,
    adj: Map<string, Set<string>>,
    distMatrix: Map<string, number>,
    edgeIndexMap: Map<string, number>,
    boundary2Basis: Map<number, Set<number>>,
    getEdgeKey: (u: string, v: string) => string,
    targetBetti1: number
  ): {
    loopKeys: string[];
    loop: string[];
    description: string;
    perimeter: number;
    birth: number;
    death: number;
  }[] {
    if (targetBetti1 <= 0) return [];

    const keyOrder = new Map<string, number>();
    npcKeys.forEach((k, idx) => keyOrder.set(k, idx));

    const candidates: {
      loopKeys: string[];
      edgeSet: Set<number>;
      perimeter: number;
      birth: number;
      death: number;
    }[] = [];
    const seenCanonical = new Set<string>();

    // Telusuri siklus sederhana tanpa kord (induced cycles) dengan panjang k >= 4
    const maxCycleLen = Math.min(npcKeys.length, 8);

    const dfs = (startKey: string, currentKey: string, path: string[], visited: Set<string>): void => {
      const startIdx = keyOrder.get(startKey) ?? 0;
      const neighbors = adj.get(currentKey) || new Set<string>();

      for (const nextKey of neighbors) {
        const nextIdx = keyOrder.get(nextKey) ?? 0;
        if (nextIdx < startIdx) continue; // Hanya telusuri vertex dengan indeks >= startIdx

        if (nextKey === startKey && path.length >= 4) {
          // Pastikan tidak ada kord (diagonal aktif) di dalam graf saat ini
          let hasActiveChord = false;
          const kLen = path.length;
          for (let a = 0; a < kLen && !hasActiveChord; a++) {
            for (let b = a + 2; b < kLen; b++) {
              if (a === 0 && b === kLen - 1) continue; // Tepi penutup siklus
              if (adj.get(path[a]!)?.has(path[b]!)) {
                hasActiveChord = true;
                break;
              }
            }
          }

          if (!hasActiveChord) {
            const sortedKeySig = [...path].sort().join('::');
            if (!seenCanonical.has(sortedKeySig)) {
              seenCanonical.add(sortedKeySig);

              const edgeSet = new Set<number>();
              let perimeter = 0;
              let birth = 0;

              for (let i = 0; i < kLen; i++) {
                const u = path[i]!;
                const v = path[(i + 1) % kLen]!;
                const eKey = getEdgeKey(u, v);
                const eIdx = edgeIndexMap.get(eKey);
                if (eIdx !== undefined) edgeSet.add(eIdx);
                const d = distMatrix.get(eKey) ?? 0.5;
                perimeter += d;
                if (d > birth) birth = d;
              }

              // Hitung ambang kematian (death epsilon) saat diagonal segitiga menutup siklus ini
              const death = this._computeCycleDeathEpsilon(path, distMatrix, getEdgeKey, birth);

              candidates.push({
                loopKeys: [...path],
                edgeSet,
                perimeter,
                birth,
                death
              });
            }
          }
          continue;
        }

        if (!visited.has(nextKey) && path.length < maxCycleLen) {
          visited.add(nextKey);
          path.push(nextKey);
          dfs(startKey, nextKey, path, visited);
          path.pop();
          visited.delete(nextKey);
        }
      }
    };

    for (const startKey of npcKeys) {
      const visited = new Set<string>([startKey]);
      dfs(startKey, startKey, [startKey], visited);
    }

    // Urutkan kandidat berdasarkan panjang siklus terpendek, lalu perimeter terkecil
    candidates.sort((a, b) => a.loopKeys.length - b.loopKeys.length || a.perimeter - b.perimeter);

    // Salin basis B_1 untuk memilih siklus yang bebas linier di H_1 = Z_1 / B_1
    const combinedBasis = new Map<number, Set<number>>();
    for (const [piv, col] of boundary2Basis.entries()) {
      combinedBasis.set(piv, new Set(col));
    }

    const accepted: {
      loopKeys: string[];
      loop: string[];
      description: string;
      perimeter: number;
      birth: number;
      death: number;
    }[] = [];

    for (const cand of candidates) {
      if (accepted.length >= Math.max(targetBetti1, 4)) break;
      const testCol = new Set<number>(cand.edgeSet);
      this._reduceColumnGF2(testCol, combinedBasis);

      if (testCol.size > 0) {
        const piv = Math.max(...testCol);
        combinedBasis.set(piv, testCol);

        const loopNames = cand.loopKeys.map(k => npcStates[k]?.nama || k);
        accepted.push({
          loopKeys: cand.loopKeys,
          loop: loopNames,
          description: `Formasi perimeter terbuka (${cand.loopKeys.length}-siklus tanpa kord diagonal) antar ${loopNames.join(' ↔ ')}`,
          perimeter: Number(cand.perimeter.toFixed(4)),
          birth: Number(cand.birth.toFixed(4)),
          death: Number(cand.death.toFixed(4))
        });
      }
    }

    return accepted;
  }

  /**
   * Menghitung ambang filtrasi (epsilon death) ketika sebuah siklus k-simpul (k >= 4)
   * tertutup seluruhnya oleh triangulasi kord diagonal dalam kompleks Vietoris-Rips.
   */
  private static _computeCycleDeathEpsilon(
    cycleKeys: string[],
    distMatrix: Map<string, number>,
    getEdgeKey: (u: string, v: string) => string,
    birth: number
  ): number {
    const k = cycleKeys.length;
    if (k < 4) return birth;

    // Untuk setiap vertex kipas (fan triangulation dari simpul i),
    // siklus tertutup jika seluruh kord diagonal dari cycleKeys[i] ke simpul lainnya muncul.
    let minFanMaxChord = 1.0;
    for (let i = 0; i < k; i++) {
      let fanMaxChord = birth;
      const u = cycleKeys[i]!;
      for (let step = 2; step <= k - 2; step++) {
        const v = cycleKeys[(i + step) % k]!;
        const dChord = distMatrix.get(getEdgeKey(u, v)) ?? 1.0;
        if (dChord > fanMaxChord) {
          fanMaxChord = dChord;
        }
      }
      if (fanMaxChord < minFanMaxChord) {
        minFanMaxChord = fanMaxChord;
      }
    }

    return Math.max(birth, Math.min(1.0, minFanMaxChord));
  }

  /**
   * Menghitung Persistence Barcodes dimensi 1 (β1) secara dinamis dari filtrasi Vietoris-Rips
   * dan pasangan kelahiran-kematian homologi persisten atas GF(2).
   */
  private static _computeBeta1PersistenceBars(
    npcKeys: string[],
    npcStates: Record<string, NpcState>,
    sortedEdges: Simplex1[],
    fullEdgeIndexMap: Map<string, number>,
    distMatrix: Map<string, number>,
    getEdgeKey: (u: string, v: string) => string,
    detectedCavities: {
      loopKeys: string[];
      loop: string[];
      birth: number;
      death: number;
    }[],
    filtrationEpsilon: number
  ): PersistenceBar[] {
    const bars: PersistenceBar[] = [];
    const addedSignatures = new Set<string>();

    // 1. Masukkan bar dari setiap cavity aktif yang terdeteksi dengan nilai birth & death nyata
    for (const cav of detectedCavities) {
      const birth = cav.birth;
      const death = Math.max(birth, cav.death);
      const persistence = Number((death - birth).toFixed(4));
      if (persistence <= 1e-5) continue;

      const sig = `${birth.toFixed(3)}::${death.toFixed(3)}::${[...cav.loopKeys].sort().join(',')}`;
      addedSignatures.add(sig);

      bars.push({
        dimension: 1,
        featureName: `Perimeter Void [${cav.loop.slice(0, 3).join('–')}${cav.loop.length > 3 ? '…' : ''}]`,
        birth,
        death,
        persistence,
        activeAtThreshold: filtrationEpsilon >= birth && filtrationEpsilon < death
      });
    }

    // 2. Lakukan reduksi ∂_2 penuh pada seluruh segitiga kandidat untuk menangkap siklus historis
    // yang lahir dan mati di luar ambang filtrationEpsilon saat ini
    const n = npcKeys.length;
    const allTriangles: Simplex2[] = [];
    for (let i = 0; i < n; i++) {
      const u = npcKeys[i]!;
      for (let j = i + 1; j < n; j++) {
        const v = npcKeys[j]!;
        const dUV = distMatrix.get(getEdgeKey(u, v)) ?? 1.0;
        for (let k = j + 1; k < n; k++) {
          const w = npcKeys[k]!;
          const dVW = distMatrix.get(getEdgeKey(v, w)) ?? 1.0;
          const dUW = distMatrix.get(getEdgeKey(u, w)) ?? 1.0;
          const maxD = Math.max(dUV, dVW, dUW);
          allTriangles.push({
            dimension: 2,
            id: `${u}::${v}::${w}`,
            vertices: [u, v, w],
            maxEdgeDistance: maxD,
            birth: maxD
          });
        }
      }
    }

    allTriangles.sort((a, b) => a.birth - b.birth || a.id.localeCompare(b.id));

    const pivotToCol = new Map<number, Set<number>>();
    for (const tri of allTriangles) {
      const [u, v, w] = tri.vertices;
      const e1 = fullEdgeIndexMap.get(getEdgeKey(u, v));
      const e2 = fullEdgeIndexMap.get(getEdgeKey(v, w));
      const e3 = fullEdgeIndexMap.get(getEdgeKey(u, w));
      if (e1 === undefined || e2 === undefined || e3 === undefined) continue;

      const col = new Set<number>([e1, e2, e3]);
      this._reduceColumnGF2(col, pivotToCol);

      if (col.size > 0) {
        const pivotEdgeIdx = Math.max(...col);
        pivotToCol.set(pivotEdgeIdx, col);

        const creatorEdge = sortedEdges[pivotEdgeIdx];
        if (creatorEdge) {
          const birth = Number(creatorEdge.birth.toFixed(4));
          const death = Number(tri.birth.toFixed(4));
          const persistence = Number((death - birth).toFixed(4));

          // Hanya catat fitur homologi 1D yang benar-benar memiliki rentang hidup (death > birth)
          if (persistence > 1e-4) {
            const uName = npcStates[creatorEdge.u]?.nama || creatorEdge.u;
            const vName = npcStates[creatorEdge.v]?.nama || creatorEdge.v;
            const overlapsExisting = bars.some(
              b => Math.abs(b.birth - birth) < 1e-3 && Math.abs(b.death - death) < 1e-3
            );
            if (!overlapsExisting) {
              bars.push({
                dimension: 1,
                featureName: `Cycle [${uName} ↔ ${vName}]`,
                birth,
                death,
                persistence,
                activeAtThreshold: filtrationEpsilon >= birth && filtrationEpsilon < death
              });
            }
          }
        }
      }
    }

    return bars;
  }
}
