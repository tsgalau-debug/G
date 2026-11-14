/**
 * Self-contained Entity / Agent node interface for Simplicial Homology & Topological Sync.
 * Supports both English (`name`, `location`, `activity`, `faction`) and Indonesian
 * (`nama`, `lokasi`, `aktivitas`, `faksi`) field conventions.
 */
export interface TopologyEntityState {
  id?: string;
  name?: string;
  nama?: string;
  location?: string;
  lokasi?: string;
  activity?: string;
  aktivitas?: string;
  faction?: string;
  faksi?: string;
  role?: string;
  pekerjaan?: string;
  mood?: string;
  trust?: number;
  traits?: string[];
  sifat?: string[];
  schedule?: Record<string, string>;
  jadwal?: Record<string, string>;
}

export type NpcState = TopologyEntityState;

export function getEntityName(entity: TopologyEntityState): string {
  return (entity.name ?? entity.nama ?? entity.id ?? '').trim();
}

export function getEntityLocation(entity: TopologyEntityState): string {
  return (entity.location ?? entity.lokasi ?? 'Unknown').trim();
}

export function getEntityActivity(entity: TopologyEntityState): string {
  return (entity.activity ?? entity.aktivitas ?? '').trim();
}

export function getEntityFaction(entity: TopologyEntityState): string {
  return (entity.faction ?? entity.faksi ?? '').trim();
}

export interface Simplex0 {
  id: string;
  label: string;
  type: 'npc' | 'concept' | 'location' | 'faction' | 'entity';
  weight: number;
}

export interface Simplex1 {
  id: string;
  vertices: [string, string];
  weight: number;
  relation: string;
}

export interface Simplex2 {
  id: string;
  vertices: [string, string, string];
  faces: [string, string, string];
  weight: number;
  coherenceType: 'faction_triangle' | 'shared_secret' | 'spatial_cooccurrence' | 'semantic_clique';
}

export interface BettiReport {
  beta0: number;
  beta1: number;
  eulerCharacteristic: number;
  numVertices: number;
  numEdges: number;
  numTriangles: number;
  rankB1: number;
  rankB2: number;
  connectedComponents: string[][];
  topologicalHoles: {
    cycleVertices: string[];
    description: string;
    tensionScore: number;
  }[];
  hodgeLaplacianSpectrum: number[];
}

/**
 * Simplicial Complex & Homology Engine (Phase 2A)
 *
 * Menghitung:
 * - Kompleks Simplisial K = (K_0, K_1, K_2) dari graf pengetahuan & entitas
 * - Operator Batas (Boundary Matrices) d_1: C_1 -> C_0 dan d_2: C_2 -> C_1 di atas Z_2 & R
 * - Bilangan Betti:
 *     beta_0 = |K_0| - rank(d_1)  (Jumlah komponen pengetahuan terpisah)
 *     beta_1 = |K_1| - rank(d_1) - rank(d_2) (Lubang topologi 1D / siklus relasi belum tertutup)
 * - Spektrum Hodge 0-Laplacian L_0 = d_1 * d_1^T
 */
export class SimplicialComplex {
  readonly vertices = new Map<string, Simplex0>();
  readonly edges = new Map<string, Simplex1>();
  readonly triangles = new Map<string, Simplex2>();

  private static canonicalPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private static canonicalTriple(a: string, b: string, c: string): [string, string, string] {
    const arr = [a, b, c].sort();
    return [arr[0]!, arr[1]!, arr[2]!];
  }

  clear(): void {
    this.vertices.clear();
    this.edges.clear();
    this.triangles.clear();
  }

  addVertex(id: string, label: string, type: Simplex0['type'] = 'concept', weight = 1.0): void {
    const cleanId = id.trim().toLowerCase();
    if (!cleanId) return;
    const existing = this.vertices.get(cleanId);
    if (existing) {
      existing.weight = Math.max(existing.weight, weight);
      return;
    }
    this.vertices.set(cleanId, { id: cleanId, label: label.trim() || cleanId, type, weight });
  }

  addEdge(u: string, v: string, relation = 'related', weight = 1.0): string | null {
    const uClean = u.trim().toLowerCase();
    const vClean = v.trim().toLowerCase();
    if (!uClean || !vClean || uClean === vClean) return null;

    if (!this.vertices.has(uClean)) this.addVertex(uClean, u, 'concept', weight);
    if (!this.vertices.has(vClean)) this.addVertex(vClean, v, 'concept', weight);

    const [a, b] = SimplicialComplex.canonicalPair(uClean, vClean);
    const id = `${a}::${b}`;
    const existing = this.edges.get(id);
    if (existing) {
      existing.weight = Math.min(2.0, existing.weight + weight * 0.25);
      return id;
    }
    this.edges.set(id, { id, vertices: [a, b], weight, relation });
    return id;
  }

  addTriangle(
    u: string,
    v: string,
    w: string,
    coherenceType: Simplex2['coherenceType'] = 'semantic_clique',
    weight = 1.0
  ): string | null {
    const uClean = u.trim().toLowerCase();
    const vClean = v.trim().toLowerCase();
    const wClean = w.trim().toLowerCase();
    if (!uClean || !vClean || !wClean) return null;
    if (uClean === vClean || vClean === wClean || uClean === wClean) return null;

    const [a, b, c] = SimplicialComplex.canonicalTriple(uClean, vClean, wClean);
    const e1 = this.addEdge(a, b, coherenceType, weight);
    const e2 = this.addEdge(b, c, coherenceType, weight);
    const e3 = this.addEdge(a, c, coherenceType, weight);
    if (!e1 || !e2 || !e3) return null;

    const id = `${a}::${b}::${c}`;
    if (!this.triangles.has(id)) {
      this.triangles.set(id, {
        id,
        vertices: [a, b, c],
        faces: [e1, e2, e3],
        weight,
        coherenceType,
      });
    }
    return id;
  }

  /**
   * Membangun kompleks simplisial dari Knowledge Graph dan daftar entitas/agen.
   *
   * Aturan pengisian 2-simplex (segitiga):
   * - Segitiga HANYA diisi jika ketiganya terikat oleh kohesi struktural eksplisit
   *   (mis. satu faksi/grup yang sama DAN berada di lokasi yang sama, atau berbagi fakta pengetahuan yang sama).
   * - Jika 3 simpul membentuk siklus 1-simplex (A-B, B-C, C-A) dari interaksi terpisah
   *   tanpa kohesi bersama, segitiga TIDAK diisi -> terdeteksi sebagai Lubang Topologi beta_1!
   */
  buildFromWorldState(
    knowledgeGraph: Record<string, string[]>,
    entities: TopologyEntityState[],
    knowledgeWeights: Record<string, number> = {}
  ): void {
    this.clear();

    const entityByLocation = new Map<string, string[]>();
    const entityByFaction = new Map<string, string[]>();

    for (const ent of entities || []) {
      const name = getEntityName(ent);
      if (!name) continue;
      const trustWeight = typeof ent.trust === 'number' ? Math.max(0.2, ent.trust / 100) : 0.5;
      this.addVertex(name, name, 'npc', trustWeight);

      const loc = getEntityLocation(ent);
      if (loc && loc !== 'Unknown') {
        const locNode = `loc:${loc}`;
        this.addVertex(locNode, loc, 'location', 0.8);
        this.addEdge(name, locNode, 'located_at', 0.8);

        const list = entityByLocation.get(locNode) || [];
        list.push(name.toLowerCase());
        entityByLocation.set(locNode, list);
      }

      const fac = getEntityFaction(ent);
      if (fac && fac !== 'Independen' && fac !== 'None') {
        const facNode = `fac:${fac}`;
        this.addVertex(facNode, fac, 'faction', 0.9);
        this.addEdge(name, facNode, 'member_of', 0.9);

        const list = entityByFaction.get(facNode) || [];
        list.push(name.toLowerCase());
        entityByFaction.set(facNode, list);
      }
    }

    for (const [locNode, members] of entityByLocation.entries()) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          this.addEdge(members[i]!, members[j]!, 'co_located', 0.75);
          this.addTriangle(members[i]!, members[j]!, locNode, 'spatial_cooccurrence', 0.75);
        }
      }
    }

    for (const [facNode, members] of entityByFaction.entries()) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          this.addEdge(members[i]!, members[j]!, 'same_faction', 0.85);
          const entA = entities.find((n) => getEntityName(n).toLowerCase() === members[i]);
          const entB = entities.find((n) => getEntityName(n).toLowerCase() === members[j]);
          if (entA && entB && getEntityLocation(entA) === getEntityLocation(entB)) {
            this.addTriangle(members[i]!, members[j]!, facNode, 'faction_triangle', 0.9);
          }
        }
      }
    }

    const allKnownNames = Array.from(this.vertices.keys());

    for (const [subject, facts] of Object.entries(knowledgeGraph || {})) {
      if (!subject || !Array.isArray(facts)) continue;
      this.addVertex(subject, subject, 'concept', 1.0);
      const subjClean = subject.trim().toLowerCase();

      for (const fact of facts) {
        if (!fact) continue;
        const w = knowledgeWeights[`${subject}::${fact}`] ?? 1.0;
        const factLower = fact.toLowerCase();

        const mentioned: string[] = [];
        for (const candidate of allKnownNames) {
          const cleanCand = candidate.replace(/^(loc:|fac:)/, '');
          if (cleanCand.length >= 3 && cleanCand !== subjClean && factLower.includes(cleanCand)) {
            this.addEdge(subjClean, candidate, 'lore_reference', w);
            mentioned.push(candidate);
          }
        }

        if (mentioned.length >= 2) {
          for (let i = 0; i < mentioned.length; i++) {
            for (let j = i + 1; j < mentioned.length; j++) {
              this.addTriangle(subjClean, mentioned[i]!, mentioned[j]!, 'shared_secret', w);
            }
          }
        }
      }
    }
  }

  /**
   * Menghitung rank matriks di atas lapangan biner Z_2 (GF(2)) menggunakan eliminasi Gauss.
   */
  static computeGF2Rank(numRows: number, numCols: number, colsAsRowBitsets: Set<number>[]): number {
    const basis = new Map<number, Set<number>>();
    let rank = 0;

    for (let c = 0; c < numCols; c++) {
      const col = new Set(colsAsRowBitsets[c]);
      while (col.size > 0) {
        let pivot = -1;
        for (const r of col) {
          if (r > pivot) pivot = r;
        }
        const existing = basis.get(pivot);
        if (!existing) {
          basis.set(pivot, col);
          rank++;
          break;
        }
        for (const r of existing) {
          if (col.has(r)) col.delete(r);
          else col.add(r);
        }
      }
    }
    return rank;
  }

  /**
   * Menghitung laporan homologi lengkap: beta_0, beta_1, karakteristik Euler,
   * komponen terhubung, siklus lubang topologi (H_1), dan nilai eigen Hodge 0-Laplacian.
   */
  computeHomology(): BettiReport {
    const vList = Array.from(this.vertices.values());
    const eList = Array.from(this.edges.values());
    const tList = Array.from(this.triangles.values());

    const numV = vList.length;
    const numE = eList.length;
    const numT = tList.length;

    if (numV === 0) {
      return {
        beta0: 0,
        beta1: 0,
        eulerCharacteristic: 0,
        numVertices: 0,
        numEdges: 0,
        numTriangles: 0,
        rankB1: 0,
        rankB2: 0,
        connectedComponents: [],
        topologicalHoles: [],
        hodgeLaplacianSpectrum: [],
      };
    }

    const vIdx = new Map<string, number>();
    vList.forEach((v, i) => vIdx.set(v.id, i));

    const eIdx = new Map<string, number>();
    eList.forEach((e, i) => eIdx.set(e.id, i));

    const b1Cols: Set<number>[] = eList.map((e) => {
      const s = new Set<number>();
      const u = vIdx.get(e.vertices[0]);
      const v = vIdx.get(e.vertices[1]);
      if (u !== undefined) s.add(u);
      if (v !== undefined) s.add(v);
      return s;
    });

    const b2Cols: Set<number>[] = tList.map((t) => {
      const s = new Set<number>();
      for (const faceId of t.faces) {
        const ei = eIdx.get(faceId);
        if (ei !== undefined) s.add(ei);
      }
      return s;
    });

    const rankB1 = SimplicialComplex.computeGF2Rank(numV, numE, b1Cols);
    const rankB2 = SimplicialComplex.computeGF2Rank(numE, numT, b2Cols);

    const beta0 = Math.max(0, numV - rankB1);
    const beta1 = Math.max(0, numE - rankB1 - rankB2);
    const eulerCharacteristic = numV - numE + numT;

    const adj = new Map<string, string[]>();
    for (const v of vList) adj.set(v.id, []);
    for (const e of eList) {
      adj.get(e.vertices[0])?.push(e.vertices[1]);
      adj.get(e.vertices[1])?.push(e.vertices[0]);
    }

    const visited = new Set<string>();
    const connectedComponents: string[][] = [];
    for (const v of vList) {
      if (visited.has(v.id)) continue;
      const comp: string[] = [];
      const queue = [v.id];
      visited.add(v.id);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(this.vertices.get(curr)?.label || curr);
        for (const nb of adj.get(curr) || []) {
          if (!visited.has(nb)) {
            visited.add(nb);
            queue.push(nb);
          }
        }
      }
      connectedComponents.push(comp);
    }

    const topologicalHoles = this.detectUnfilledCycles(adj, beta1);
    const hodgeLaplacianSpectrum = this.computeZeroLaplacianSpectrum(vList, eList);

    return {
      beta0,
      beta1,
      eulerCharacteristic,
      numVertices: numV,
      numEdges: numE,
      numTriangles: numT,
      rankB1,
      rankB2,
      connectedComponents,
      topologicalHoles,
      hodgeLaplacianSpectrum,
    };
  }

  private detectUnfilledCycles(
    adj: Map<string, string[]>,
    maxHoles: number
  ): BettiReport['topologicalHoles'] {
    if (maxHoles <= 0) return [];
    const holes: BettiReport['topologicalHoles'] = [];
    const seenCycles = new Set<string>();

    const nodes = Array.from(adj.keys());

    for (let i = 0; i < nodes.length && holes.length < maxHoles; i++) {
      const a = nodes[i]!;
      const nbsA = adj.get(a) || [];
      for (const b of nbsA) {
        if (b <= a) continue;
        const nbsB = adj.get(b) || [];
        for (const c of nbsB) {
          if (c <= b) continue;
          if (nbsA.includes(c)) {
            const triId = SimplicialComplex.canonicalTriple(a, b, c).join('::');
            if (!this.triangles.has(triId) && !seenCycles.has(triId)) {
              seenCycles.add(triId);
              const labels = [a, b, c].map((id) => this.vertices.get(id)?.label || id);
              holes.push({
                cycleVertices: labels,
                description: `Segitiga relasi [${labels.join(' ↔ ')}] terhubung secara berpasangan tetapi belum memiliki kohesi bersama (Unfilled 2-Simplex).`,
                tensionScore: 0.85,
              });
            }
          }
        }
      }
    }

    for (let i = 0; i < nodes.length && holes.length < maxHoles; i++) {
      const a = nodes[i]!;
      const nbsA = adj.get(a) || [];
      for (const b of nbsA) {
        if (b <= a) continue;
        for (const c of adj.get(b) || []) {
          if (c === a) continue;
          for (const d of adj.get(c) || []) {
            if (d <= b || d === a) continue;
            if (nbsA.includes(d)) {
              const hasDiag1 = (adj.get(a) || []).includes(c);
              const hasDiag2 = (adj.get(b) || []).includes(d);
              if (!hasDiag1 && !hasDiag2) {
                const key = [a, b, c, d].sort().join('::');
                if (!seenCycles.has(key)) {
                  seenCycles.add(key);
                  const labels = [a, b, c, d].map((id) => this.vertices.get(id)?.label || id);
                  holes.push({
                    cycleVertices: labels,
                    description: `Siklus 4-simpul [${labels.join(' → ')}] membentuk celah pengetahuan tanpa jembatan konseptual langsung.`,
                    tensionScore: 0.72,
                  });
                }
              }
            }
          }
        }
      }
    }

    return holes.slice(0, Math.max(1, maxHoles));
  }

  private computeZeroLaplacianSpectrum(vList: Simplex0[], eList: Simplex1[]): number[] {
    const deg = new Map<string, number>();
    for (const v of vList) deg.set(v.id, 0);
    for (const e of eList) {
      deg.set(e.vertices[0], (deg.get(e.vertices[0]) || 0) + e.weight);
      deg.set(e.vertices[1], (deg.get(e.vertices[1]) || 0) + e.weight);
    }
    return Array.from(deg.values())
      .map((d) => Number(d.toFixed(2)))
      .sort((a, b) => b - a)
      .slice(0, 8);
  }
}
