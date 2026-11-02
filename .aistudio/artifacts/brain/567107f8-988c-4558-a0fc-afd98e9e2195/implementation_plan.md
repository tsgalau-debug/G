# Redesign Antarmuka Menuju Minimalist Line UI & Optimalisasi Ruang Layar

Transformasi menyeluruh antarmuka simulasi naratif multi-cerita dari struktur *card-in-card* yang bertumpuk menjadi **Minimalist Line UI** berbasis garis pemisah halus 1px (*hairline dividers*), bar atas tunggal yang terpadu, dan aliran tipografi editorial yang memberikan ruang baca serta eksplorasi maksimal.

### User Review & Critical Decisions

> [!IMPORTANT]
> Rencana ini disusun berdasarkan tiga keputusan desain utama yang telah Anda konfirmasi untuk membebaskan ruang vertikal maupun horizontal layar tanpa mengurangi kelengkapan fitur simulasi:

- **Confirmed Decision 1 — Navigasi & Status Satu Baris Terpadu**: Menggabungkan identitas cerita aktif, indikator waktu/lokasi (`Hari · Jam · Lokasi`), dan tab navigasi utama ke dalam satu bar tipis di bagian atas dengan garis bawah `1px`, menghapus sub-header ganda yang sebelumnya memakan ruang vertikal.
- **Confirmed Decision 2 — Ruang Baca Editorial Bergaris Pemisah 1px**: Menghapus pembungkus kotak kartu tebal pada setiap blok narasi dan menggantinya dengan aliran naratif editorial bersih yang dipisahkan oleh garis horizontal halus `1px` (`border-b border-zinc-800/80`) serta metadata teks tanpa *pill badge* berlebihan.
- **Confirmed Decision 3 — Tata Letak Dua Kolom Lega & Laci Lipat (Collapsible Drawers)**: Mengubah halaman Karakter dari 3 kolom sempit menjadi 2 kolom proporsional dengan sub-tab garis (*Atribut & Radar* vs *Inventaris & Perlengkapan*), serta menjadikan daftar *Active Quests*, kontrol waktu cepat (`+1j`, `Istirahat`), dan filter Peta/Graf sebagai laci lipat (*collapsible strip*) yang hanya terbuka saat dibutuhkan.

---

### 1. Overview & Core Concept

- **What It Does**: Menyederhanakan hierarki visual di seluruh tampilan utama (*Story Chronicle*, *Character Sheet*, *World/NPC Map*, *Timeline*, *Knowledge Graph*, dan *Diagnostics*) dengan menghilangkan bingkai kartu berlapis (*nested cards*), menyatukan informasi status yang redundan, dan memaksimalkan *viewport* untuk pembacaan cerita serta interaksi strategis.
- **Target Audience / Persona**: Pemain dan penulis cerita interaktif yang menginginkan pengalaman membaca imersif layaknya buku/monograf modern sekaligus akses cepat ke instrumen status karakter dan dunia tanpa gangguan visual.
- **Key Value**: Meningkatkan luas ruang baca vertikal hingga **35%** pada halaman *Story* dan memperlebar ruang interaksi horizontal pada halaman *Character* serta *World Map* melalui prinsip *Single-Elevation Depth* dan *Zero-Pill Metadata Discipline*.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Membaca & Menentukan Aksi Cerita**: Pengguna langsung melihat kanvas narasi yang bersih di bawah satu bar tipis terpadu. Indikator *Hari · Jam · Lokasi* serta tombol lipat *Quest Aktif* dan *Kontrol Waktu* berada di jalur tipis yang dapat dibuka/ditutup satu klik tanpa menggeser fokus bacaan.
  2. **Mengelola Karakter dalam Dua Kolom Lega**: Di halaman *Character*, kolom kiri menampilkan identitas protagonis, bar vitalitas (`HP`, `SP`, `EXP`), dan daftar relasi faksi/NPC dengan pemisah garis tipis; kolom kanan yang lebar menyediakan sub-tab garis untuk berpindah mulus antara *Statistik & Radar* dan *Perlengkapan & Tas*.
  3. **Eksplorasi Peta Dunia & Graf Pengetahuan**: Filter lokasi, pencarian entitas, dan metrik topologi diringkas ke dalam satu baris *toolbar* garis tipis di atas kanvas interaktif.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Editorial Minimalist Line UI** — memadukan ketajaman ruang kerja modern dengan keanggunan tipografi monograf gelap.
  - *Color Palette & Mood (60-30-10 Budget)*:
    - **60% Neutral Canvas**: Latar belakang utama hitam pekat tenang (`bg-zinc-950` / `#09090B`) tanpa tumpukan kotak abu-abu tebal.
    - **30% Structural Hairlines**: Garis pembatas tipis 1px (`border-zinc-800/80` / `#27272A`) dan teks sekunder (`text-zinc-400`) untuk memisahkan bagian secara geometris.
    - **10% Focal Accent**: Aksen hijau zamrud tajam (`text-emerald-400`, `border-emerald-500`) khusus untuk indikator tab aktif, fokus input, dan aksi utama.
  - *Typography & Hierarchy*:
    - Teks narasi menggunakan serif editorial yang nyaman dibaca dengan jarak baris lega (`leading-relaxed`), sementara label struktur menggunakan sans-serif bersih dan seluruh angka metrik/waktu menggunakan angka tabular (`font-mono tabular-nums`) agar sejajar sempurna.
    - Metadata (lokasi, waktu, kategori item, status quest) disajikan sebagai teks bersih dengan pemisah titik tengah (`·`) atau garis miring (`/`), menghilangkan *pill enclosures* statis.
  - *Component Styling & Layout*:
    - **Top Bar Contract**: Satu baris tunggal setinggi `48px` (`h-12`) yang memuat pemilih cerita aktif & metrik waktu/lokasi di kiri, navigasi tab bergaris bawah (`border-b-2`) di tengah, serta aksi sistem di kanan.
    - **Single-Elevation Depth**: Tidak ada lagi kartu di dalam kartu; setiap bagian dipisahkan oleh garis `1px` (`divide-y divide-zinc-800/70`) dan *padding* yang konsisten.
- **Interactive Feedback & Motion**:
  - Transisi buka/tutup laci *Quest* dan *Filter* berjalan instan dan halus (`<= 150ms`), dengan garis indikator aktif yang bergeser tegas saat berpindah tab maupun sub-tab.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Penggabungan Header Utama dan Status Bar Cerita**
  - *Chosen Approach*: Menarik informasi *Hari, Jam, dan Lokasi* serta pemicu laci *Quest / Waktu* ke dalam satu bar tipis terpadu, lalu menghapus kotak header kedua di halaman *Story*.
  - *Why*: Menghilangkan duplikasi informasi dan langsung membuka ruang baca vertikal yang jauh lebih luas sejak pandangan pertama.
  - *Alternatives Considered*: Mempertahankan sub-header terpisah di tiap tab, namun cara tersebut tetap memakan dua lapis ruang vertikal di layar laptop maupun ponsel.
- **Decision 2: Tata Letak Dua Kolom dengan Sub-Tab Garis pada Halaman Karakter**
  - *Chosen Approach*: Mengubah grid 3 kolom sempit menjadi 2 kolom lega (`5:7` pada desktop) di mana kolom kiri memuat *Profil, Vitalitas & Relasi*, sedangkan kolom kanan menggunakan sub-tab garis (*Inventaris & Perlengkapan* | *Atribut & Analisis Radar*).
  - *Why*: Mencegah daftar inventaris dan grafik radar saling berdesakan di kolom sempit 300px, sehingga setiap item dan statistik terbaca jelas tanpa banyak *wrapping*.
  - *Alternatives Considered*: Menumpuk semuanya dalam 1 kolom panjang, namun pengguna harus melakukan *scroll* terlalu jauh untuk mengganti senjata sambil melihat status karakter.
- **Decision 3: Pilihan Tindakan (Choices) Bergaya Baris Editorial**
  - *Chosen Approach*: Menyajikan opsi tindakan pemain dan input aksi kustom dalam panel bawah yang ramping dengan pemisah garis tipis dan penomoran indeks (`01`, `02`, `03`) tanpa bingkai kartu tebal.
  - *Why*: Menjaga proporsi area kontrol bawah tetap ringkas sehingga tidak menutupi bagian bawah kronik cerita.
  - *Alternatives Considered*: Menampilkan tombol kotak besar bertumpuk, yang sering menutupi hingga sepertiga bawah layar saat ada 3 pilihan panjang.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED TOP LINE BAR (h-12, border-b 1px)                                    │
│ [Cerita Aktif ▾ · Hari 1 · 08:00 · Lokasi]   [Story | Character | World ...] │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌──────────────────┐
│ STORY CHRONICLE VIEW    │   │ CHARACTER 2-COL VIEW    │   │ WORLD & GRAPH    │
│ ├─ Collapsible Strip:   │   │ ├─ Left Column (5/12):  │   │ ├─ Inline Filter │
│ │  [Quests (1)] [+1h]   │   │ │  Identity, HP/SP Bars │   │ │  & Search Bar  │
│ ├─ Editorial Stream:    │   │ │  & Faction/NPC Lines  │   │ ├─ Full-Height   │
│ │  1px Hairline Blocks  │   │ └─ Right Column (7/12): │   │ │  Canvas / Grid │
│ └─ Compact Action Dock: │   │    Sub-Tab [Tas | Stat] │   │ └─ Slide-Over    │
│    Indexed Line Choices │   │    1px Divided Rows     │   │    Detail Drawer │
└─────────────────────────┘   └─────────────────────────┘   └──────────────────┘
```

- **Data Model & State**:
  - Seluruh state permainan (`mcState`, `npcStates`, `factions`, `quests`, `combat`, `chronicle`, dan `availableStories`) tetap dikelola secara terpusat oleh `GameStateService` tanpa perubahan skema database IndexedDB.
  - Penambahan sinyal UI lokal yang ringan pada tampilan *Story* (`showQuestDrawer`, `showTimeControls`) dan tampilan *Character* (`activeRightSubTab: 'inventory' | 'stats'`) untuk mengatur visibilitas laci lipat serta sub-tab garis.
- **Interactive Component & State Mapping**:
  - **Unified Top Bar**: Klik judul cerita membuka `StoryManagerComponent`; klik tab navigasi memperbarui `gameState.activeTab`; indikator lokasi dan waktu bereaksi langsung terhadap perubahan `mcState.locationName`, `mcState.day`, dan `mcState.time`.
  - **Collapsible Quest & Time Strip (Story View)**: Tombol tipis di atas aliran cerita membuka/menutup rincian *Active Quests* atau mengeksekusi `advanceManualTime(60)` dan `restCharacter()` tanpa memakan ruang permanen.
  - **Editorial Chronicle Stream & Compact Action Dock**: Setiap entri narasi merender blok dialog/aksi dengan garis pembatas `1px`, diikuti baris pilihan tindakan bernomor (`01`, `02`, `03`) dan baris input teks kustom yang langsung memanggil `engine.processTurn()`.
  - **Character Two-Column Workspace**: Sub-tab garis di kolom kanan mengatur tampilan instan antara komponen inventaris (pasang/lepas/gunakan item dengan baris tipis) dan komponen statistik (grafik radar serta rincian atribut) tanpa perpindahan halaman.
