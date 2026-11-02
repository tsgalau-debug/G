# Catatan Audit Teknis: Ketidaktepatan Fitur (Over-Claim) & Batasan Sistem

Dokumen ini mencatat secara terstruktur seluruh temuan ketidaksesuaian antara **klaim fitur pada antarmuka/komentar kode** dengan **bukti implementasi aktual di repositori**, beserta urutan prioritas perbaikannya.

---

## Daftar Ringkas Prioritas (Roadmap Perbaikan)

| ID | Modul | Tingkat Prioritas | Masalah Utama | Lokasi Bukti Kode |
| :--- | :--- | :--- | :--- | :--- |
| **AUD-01** | **Timeline DAG & Multi-World** | **P0 (Kritis) — ✅ SELESAI** | *Fork*, *Switch*, dan *3-Way Merge* kini tersambung penuh dengan *snapshot* `GameStateService` di IndexedDB, mengisolasi slot memori `activeWorldSlot` di Worker, serta menyertakan analisis *What-If* berbasis bukti KG/Lore. | `src/app/game-state.service.ts`<br>`src/app/rag/lore-engine.worker.ts`<br>`src/tests/rag/timeline-multiworld-p0.spec.ts` |
| **AUD-02** | **Embedding Fallback & CSR IDF** | **P1 (Tinggi) — ✅ SELESAI** | *Fallback* `_textToVector` kini menggunakan *Token + Bigram + Char 3-Gram Random Indexing* (`encodeSemanticFallbackVector`); bobot `queryIDFBuf` di CSR kini mengambil nilai IDF BM25 asli dari `BaseIndexer.getTermIDF()`. | `src/app/rag/pipeline-bridge.ts`<br>`src/app/rag/lore-engine.worker.ts`<br>`src/tests/rag/p1-embedding-idf-vsarl.spec.ts` |
| **AUD-03 / AUD-05** | **VSA-RL Decision Router & Warm-Start Bandit** | **P1 (Tinggi) — ✅ SELESAI** | `VSARLPolicyKernel` ditegaskan sebagai *System-to-System Decision Scoring Model* (*Warm-Started Contextual Bandit*) dengan matriks prior *zero-sum* sejak Turn ke-1, sinyal fitur linguistik (`meanIDF`, rasio OOV, kompleksitas relasional) terpusat di `[-1, +1]` yang bebas dari *0x000003FF sign-bit state collapse*, evaluasi *grounding* dinamis di `EngineService`, serta persistensi `rlPolicySnapshot`. | `src/app/rag/vsarl-policy-kernel.ts`<br>`src/app/rag/agentic-chunk-orchestrator.ts`<br>`src/app/engine.service.ts`<br>`src/tests/rag/p1-embedding-idf-vsarl.spec.ts` |
| **AUD-04** | **Topological Homology ($\beta_0, \beta_1$)** | **P2 (Menengah) — ✅ SELESAI** | $\beta_1$ kini dihitung secara eksak melalui reduksi kolom matriks batas $\text{rank}_{\mathbb{F}_2}(\partial_2)$ atas $\mathbb{F}_2$; deteksi *cavity* mendukung siklus tanpa kord panjang $k \ge 4$ ($C_4, C_5, C_6, \dots$) yang bebas linier terhadap $B_1$; *Persistence Barcode* $\beta_1$ dihitung dinamis dari filtrasi Vietoris-Rips nyata. | `src/app/topology/simplicial-complex.ts`<br>`src/tests/p2-simplicial-homology.spec.ts` |
| **AUD-06** | **Chronos Engine (Jadwal NPC Dinamis)** | **P3 (Rendah) — ✅ SELESAI** | Setiap NPC (baik dari *World Genesis* maupun yang lahir dinamis dari narasi LLM lewat `updateNpcStates`) kini otomatis mendapatkan jadwal harian 24-jam berbasis arketipe peran (`guard`, `merchant`, `scholar`, `shadow`, `wanderer`) dan lokasi basis (`npcSchedules`), berpindah lokasi/aktivitas saat `+1j` / `Istirahat`, serta disinkronkan ke topologi dunia. | `src/app/world-genesis.ts`<br>`src/app/chronos-engine.service.ts`<br>`src/app/game-state.service.ts`<br>`src/tests/chronos-engine.service.spec.ts` |

---

## Rincian Temuan & Bukti Kode

### AUD-01 — Timeline DAG, Multi-World Branching & 3-Way Merge [✅ SELESAI & TERVERIFIKASI]
1. **Klaim Fitur**:
   - Mencabangkan realitas cerita (*Fork Timeline*), berpindah antar-garis waktu (*Switch Active Timeline*), mensimulasikan skenario *What-If*, dan menggabungkan kembali cabang (*3-Way Merge*).
2. **Perbaikan yang Telah Diterapkan**:
   - **Integrasi Penuh dengan `GameStateService` (`forkTimelineBranch`, `switchTimelineBranch`, `mergeTimelineBranch`, `pruneTimelineBranch`)**: Setiap cabang menyimpan *snapshot* utuh (`chronicle`, `mcState`, `npcStates`, `npcSchedules`, `factions`, `logs`, `knowledgeGraph`, `quests`, `combat`) beserta `ancestorSnapshot` (titik leluhur bersama saat *fork*) di IndexedDB (`StorySessionData`). Saat beralih cabang, state permainan langsung berganti secara nyata; saat *3-Way Merge*, perubahan sejak titik *fork* direkonsiliasi kembali ke `trunk`.
   - **Routing & Isolasi `activeWorldSlot` di Worker & Orchestrator**: `_indexEntry`, `syncKnowledgeGraph`, `syncEpisodicMemory`, `getContextSnippet`, dan `AgenticChunkOrchestrator.verify` kini menggunakan `activeWorldSlot` dan mengisolasi dokumen cabang yang belum di-*merge* agar tidak bocor ke *trunk*.
   - **Persistensi Lintas Sesi**: Struktur `TimelineDAGState` dan `timelineSnapshots` dipulihkan secara otomatis saat `init` / `reinitialize`.
   - **Simulasi *What-If* Berbasis Bukti Lore & KG**: `simulateWhatIf` kini menganalisis kecocokan kosinus & koherensi rekonstruksi terhadap memori dunia aktif dan mengekstrak bukti kanon dari *Knowledge Graph* / *ChunkStore*.

---

### AUD-02 — Degradasi Vektor Embedding (`_textToVector`) & Bobot IDF CSR [✅ SELESAI & TERVERIFIKASI]
1. **Klaim Fitur**:
   - *768-dim Semantic FHRR Retrieval* dengan bukti *Embedding Proof* serta pencarian hibrida BM25 + Vektor.
2. **Perbaikan yang Telah Diterapkan**:
   - **Semantic Token + Bigram + Char 3-Gram Random Indexing (`encodeSemanticFallbackVector`)**: Menggantikan *hash* posisi karakter dengan proyeksi deterministik multi-probe berbasis kata kanonik (bobot TF sublinear + panjang kata), *bigram* frasa berurutan, dan *trigram* karakter untuk ketahanan morfologi bahasa Indonesia/Inggris, dinormalisasi ke satuan $L_2$.
   - **Bobot IDF BM25 Aktual & Deteksi OOV pada Kueri CSR**: `queryIDFBuf[i]` kini diisi menggunakan `indexer.hasTerm(term) ? indexer.getTermIDF(term) : 0.15` sehingga kata kunci entitas langka memiliki bobot pemeringkatan WAND/CSR yang tinggi sementara istilah *Out-of-Vocabulary* (OOV) ditandai secara akurat untuk *routing* semantik.

---

### AUD-03 & AUD-05 — VSA-RL Decision Scoring Model & Warm-Started Contextual Bandit [✅ SELESAI & TERVERIFIKASI]
1. **Klaim & Posisi Arsitektural**:
   - `VSARLPolicyKernel` berfungsi murni sebagai **System-to-System / AI-to-System Decision Scoring Model** (*Warm-Started Contextual Bandit*) yang memilih 1 dari 6 strategi *retrieval* berdasarkan telemetri kueri numerik dan sifat NPC, lalu menyempurnakan bobotnya dari evaluasi *grounding* LLM.
2. **Perbaikan yang Telah Diterapkan**:
   - **Warm-Start Contextual Bandit Priors (`_initializePolicyPriors`)**: Menginisialisasi matriks bobot `policyFHRR` dengan pasangan diferensial *zero-sum* ($\sum_j W_{a,j} = 0$) sehingga kueri pada Turn ke-1 (0 langkah latihan, bahkan tanpa NPC) langsung memilih strategi yang tepat: kata kunci langka ber-IDF tinggi $\rightarrow$ `Bm25Fast`, istilah parafrase/OOV $\rightarrow$ `SemanticFhrr`, kueri panjang multi-entitas $\rightarrow$ `GraphDiffuse`, koherensi memori tinggi $\rightarrow$ `Holographic`, dan pemulihan *requery* $\rightarrow$ `SelfCorrect`.
   - **Eliminasi *Sign-Bit State Collapse* (`0x000003FF`) di `_buildStrategyState`**: Mengisi seluruh 32 dimensi `stateBuf` dengan fitur telemetri terpusat di `[-1, +1]` (`lexicalSpecificity`, `oovOrSynonymSignal`, `relationalComplexity`, `holographicResonancePeak`, `balancedHybridSignal`, `requeryAnomalyRecovery`) beserta kanal cermin diferensial (`-state[10..15]`) dan interaksi silang, sehingga `packState()` menghasilkan *bitmask* 32-bit yang unik untuk setiap profil kueri.
   - **Evaluasi Dinamis `llmAccepted` & `userSatisfied` di `EngineService.handleResponse`**: Sinyal umpan balik dihitung secara objektif dari keberhasilan *parsing* JSON, deteksi *fallback* monolog, rasio opsi cerita yang lolos filtrasi `scoreChoices`, serta *grounding* leksikal terhadap konteks RAG yang diambil.
   - **Persistensi Bobot Kebijakan (`VSARLPolicySnapshot`) & Pemetaan NPC Generik**: Disinkronkan ke `StorySessionData.rlPolicySnapshot` di IndexedDB serta bebas dari bias nama karakter *hardcoded*.

---

### AUD-04 — Komputasi Topologi Simplicial Complex & Persistent Homology ($\beta_0, \beta_1$) [✅ SELESAI & TERVERIFIKASI]
1. **Klaim Fitur**:
   - Komputasi *Vietoris-Rips Simplicial Complex*, invariansi Betti ($\beta_0, \beta_1$), deteksi *1-Cavity*, dan *Persistence Barcode Diagram*.
2. **Perbaikan yang Telah Diterapkan**:
   - **Reduksi Matriks Batas $\partial_2$ Eksak atas $\mathbb{F}_2$ (`_reduceBoundary2GF2`)**: Menghitung $\text{rank}_{\mathbb{F}_2}(\partial_2)$ menggunakan eliminasi pivot Gaussian atas $\mathbb{Z}/2\mathbb{Z}$ sehingga klik padat seperti $K_4$ (4 segitiga, namun rank batas = 3) tidak mengeliminasi *cavity* independen lainnya pada perhitungan $\beta_1 = \dim(Z_1) - \text{rank}_{\mathbb{F}_2}(\partial_2)$.
   - **Deteksi Siklus Tanpa Kord Umum $C_k$ ($k \ge 4$, `_findIndependentCavities`)**: Menelusuri siklus tanpa kord (*induced/chordless cycles*) untuk panjang $k \ge 4$ ($C_4, C_5, C_6, \dots$) dan menguji kebebasan liniernya terhadap basis ruang batas $B_1 = \text{im}(\partial_2)$ atas $\mathbb{F}_2$.
   - **Persistence Barcode $\beta_1$ Dinamis (`_computeBeta1PersistenceBars` & `_computeCycleDeathEpsilon`)**: Menghapus nilai statis `0.35 / 0.85 / 0.50` dan menghitung $\epsilon_{\text{birth}}$ (ambang saat tepi penutup siklus muncul) serta $\epsilon_{\text{death}}$ (ambang triangulasi kord penutup siklus / pasangan reduksi $\partial_2$) secara langsung dari matriks jarak Vietoris-Rips.

---

### AUD-06 — Chronos Engine untuk NPC Dinamis [✅ SELESAI & TERVERIFIKASI]
1. **Klaim Fitur**:
   - Simulasi jadwal harian otomatis 24-jam untuk seluruh NPC di dunia cerita (baik NPC awal *World Genesis* maupun NPC baru yang lahir dari narasi LLM).
2. **Perbaikan yang Telah Diterapkan**:
   - **Generator Jadwal Harian Berbasis Peran & Lokasi (`generateDynamicNpcSchedule` & `inferNpcRoleArchetype`)**: Menginferensi arketipe peran NPC (`guard`, `merchant`, `scholar`, `shadow`, `wanderer`) dari sinyal faksi, aktivitas, nama, dan lokasi terakhir, lalu menyusun 6 pita waktu harian (`06–08`, `09–11`, `12–14`, `15–17`, `18–21`, `22–05`) yang berpusat pada wilayah lokal NPC tersebut.
   - **Registrasi Otomatis & Pelestarian NPC Latar di `updateNpcStates`**: Setiap NPC baru yang masuk lewat `updateNpcStates` langsung mendapatkan jadwal di `npcSchedules` tanpa menghapus NPC dunia lain yang sedang berada di luar lokasi pemain.
   - **Transisi Lokasi/Aktivitas Antar-Jam & Sinkronisasi Topologi di `ChronosEngineService`**: Saat waktu maju melintasi batas jam (`+1j` / `advanceTime(60)` atau `Istirahat` / `advanceTime(480)`), `simulateWorldEvents` memperbarui lokasi, aktivitas, dan *mood* seluruh NPC terjadwal serta menjalankan `enforceTopologicalSync()` untuk memperbarui Simplicial Complex ($\beta_0, \beta_1$).

