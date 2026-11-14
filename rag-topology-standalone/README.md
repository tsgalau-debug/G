# Standalone Embedding-Free RAG & Simplicial Topology Engine

Paket riset mandiri (*framework-agnostic*, tanpa ketergantungan Angular maupun API model *embedding* eksternal) yang menggabungkan **Vector Symbolic Architecture (VSA / Continuous HRR)**, **Random Indexing N-Gram Projection**, **WAND BM25 + SimHash LSH**, **Holographic Associative Memory**, **Multi-World Timeline DAG**, **VSA-RL Contextual Bandit**, serta **Simplicial Homology ($\beta_0, \beta_1$)**.

---

## Pembersihan dari Hardcode Projek Asal

Folder `/rag-topology-standalone` ini telah dibersihkan dari seluruh *coupling* dan *hardcode* spesifik aplikasi RPG/Angular:

1. **100% Tanpa Model Embedding Eksternal (`/api/embed` dihapus):**
   - `rag/worker-tokenizer-embedder.ts` kini menggunakan `encodeSemanticFallbackVector` dari `rag/pipeline-bridge.ts` secara langsung (proyeksi ortogonal FNV-1a atas *Unigram* + *Contextual Word Bigram* + *Character 3-Gram* di $\mathbb{R}^{768}$).
   - Disediakan hook opsional `setCustomVectorEncoder(fn)` apabila Anda ingin melakukan *benchmarking* komparatif antara *Random Indexing* tanpa model vs model *embedding* eksternal.
2. **Bebas Ketergantungan Angular & RPG (`SYSTEM_RULES`, `GameStateService`, `Guardian_Engine_`):**
   - Digantikan oleh kelas murni TypeScript `EmbeddingFreeRagEngine` di `rag/rag-engine.ts` yang dapat dijalankan langsung di Node.js, Bun, Deno, maupun Browser (mendukung mode `memoryOnly: true` atau IndexedDB).
3. **Pembersihan Nama Karakter & Kata Kunci Hardcode (`vsarl-policy-kernel.ts`):**
   - Seed karakter hardcode (`Selene`, `Aldric`) pada konstruktor `VSARLPolicyKernel` telah dihapus.
   - Tipe dipindahkan ke terminologi generik `AgentArchetype` dan `AgentPersonalityProfile` (`AgentPersonalityFactory`), dengan tetap mempertahankan alias kompatibilitas `NpcArchetype` / `NpcPersonalityProfile`.
4. **Dekopel Modul Topologi (`simplicial-complex.ts` & `topological-sync.ts`):**
   - Seluruh impor ke `../game-state.types` dan `../world-genesis/npc-schedule-synthesizer` telah dihapus.
   - `TopologyEntityState` kini mendukung properti bahasa Inggris (`name`, `location`, `activity`, `faction`, `schedule`) maupun bahasa Indonesia (`nama`, `lokasi`, `aktivitas`, `faksi`, `jadwal`).

---

## Struktur Direktori

```text
rag-topology-standalone/
├── index.ts                              # Barrel export seluruh modul RAG & Topology
├── README.md                             # Dokumentasi arsitektur & penggunaan riset
├── rag/
│   ├── rag-engine.ts                     # Orchestrator utama (EmbeddingFreeRagEngine)
│   ├── pipeline-bridge.ts                # Vectorizer tanpa model embedding (Random Indexing + CSR builder)
│   ├── worker-tokenizer-embedder.ts      # Tokenizer kanonik, chunker, & cache vektor
│   ├── base-indexer.ts                   # Inverted Index BM25 + Field Convolution Index
│   ├── chunk-store.ts                    # Penyimpanan chunk (Memory LRU + opsional IndexedDB)
│   ├── hybrid-pipeline.ts                # WAND BM25 + SimHash 1024-bit LSH + Co-occurrence Random Walk
│   ├── continuous-hrr.ts                 # Aljabar VSA/HRR (Circular Convolution bind/unbind)
│   ├── holographic-memory.ts             # Memori Asosiatif Momen ke-1 & ke-2 (Covariance Field)
│   ├── epistemic-retrieval-kernel.ts     # Pengukur entropi Shannon, koherensi, & deteksi anomali
│   ├── multi-world.ts                    # Superposisi multi-cabang & deteksi interferensi pengetahuan
│   ├── world-merge-resolver.ts           # Rekonsiliasi konflik 3-arah (3-Way Merge) antar cabang
│   ├── timeline-dag.ts                   # Manajer graf berarah asiklik (DAG) garis waktu
│   ├── vsarl-policy-kernel.ts            # Contextual Bandit VSA-RL berbasis profil agen
│   ├── agentic-chunk-orchestrator.ts     # Pemilih strategi retrieval adaptif (6 strategi)
│   ├── vector-retriever.ts               # Exact & Random Projection LSH Retriever
│   ├── wasm-math-v9-scorer.ts            # Akselerator batch tensor WASM opsional (fallback murni JS)
│   └── worker-whatif-simulator.ts        # Simulator hipotesis "What-If" berbasis koherensi holografik
└── topology/
    ├── csr-matrix.ts                     # Struktur matriks jarang CSR
    ├── topological-simulation.ts         # Primitif graf pengetahuan
    ├── simplicial-complex.ts             # Kalkulator Homologi Simplisial (GF(2) Rank, Betti β₀ & β₁)
    └── topological-sync.ts               # Validator koherensi spasial & perbaikan otomatis
```

---

## Contoh Penggunaan Cepat (Node.js / Bun / TypeScript)

### 1. Retrieval Tanpa Model Embedding (`EmbeddingFreeRagEngine`)

```ts
import { EmbeddingFreeRagEngine, AgentPersonalityFactory } from './rag-topology-standalone';

async function runExperiment() {
  const engine = new EmbeddingFreeRagEngine({
    sessionId: 'exp_01',
    memoryOnly: true, // Murni in-memory (cocok untuk benchmark di Node.js/Bun)
    dim: 768,
    maxDocs: 4096,
  });

  await engine.init({
    staticCorpus: {
      quantum_gravity: 'Loop quantum gravity quantizes spacetime into spin networks at the Planck scale.',
      thermodynamics: 'Black hole entropy is proportional to the area of its event horizon.',
    },
  });

  // Indeks Knowledge Graph secara dinamis
  await engine.syncKnowledgeGraph({
    'Spin Network': [
      'Representasi keadaan kuantum medan gravitasi pada skala Planck.',
      'Terhubung erat dengan struktur kompleks simplisial dan busa spin (spin foam).',
    ],
  });

  // Query dengan profil agen Scholar
  const scholar = AgentPersonalityFactory.createScholar('researcher_1', 'Dr. Aria');
  const res = await engine.retrieve({
    query: 'Bagaimana hubungan spin network dengan gravitasi kuantum skala Planck?',
    entities: ['Spin Network'],
    agent: scholar,
  });

  console.log(res.snippet);
  console.log('Strategi terpilih:', res.decision);

  // Umpan balik Reinforcement Learning (VSA-RL)
  engine.reportOutcome({
    decision: res.decision,
    userSatisfied: true,
    latencyMs: res.elapsedMs,
  });
}
```

### 2. Analisis Lubang Topologi Pengetahuan ($\beta_0, \beta_1$)

```ts
import { SimplicialComplex } from './rag-topology-standalone';

const complex = new SimplicialComplex();

// 3 konsep yang saling terhubung berpasangan (siklus A-B, B-C, C-A) tanpa 2-simplex penutup
complex.addEdge('hipotesis_a', 'observasi_b', 'supports');
complex.addEdge('observasi_b', 'model_c', 'consistent_with');
complex.addEdge('model_c', 'hipotesis_a', 'predicts');

const report = complex.computeHomology();
console.log('Komponen terhubung (β₀):', report.beta0); // 1
console.log('Lubang topologi / siklus belum tertutup (β₁):', report.beta1); // 1
console.log('Detail celah pengetahuan:', report.topologicalHoles);
```
