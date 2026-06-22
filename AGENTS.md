# AGENTS.md

Panduan ini wajib diikuti oleh semua AI coding agent yang bekerja di repository ini.

Tujuan utama repository ini adalah membangun produk MVP yang layak untuk kebutuhan hackathon: jelas secara UX, masuk akal secara teknis, mudah dijalankan, mudah direview, dan tidak terlihat seperti template generik.

---

## 1. Core Principles

Saat mengubah kode, agent wajib mengikuti prinsip berikut:

1. Baca struktur repository terlebih dahulu sebelum mengubah file.
2. Pahami stack, package manager, folder structure, naming convention, style komponen, dan pola coding yang sudah ada.
3. Jangan melakukan rewrite total kecuali diminta secara eksplisit.
4. Perubahan harus kecil, modular, konsisten, dan mudah direview.
5. Jangan menghapus fitur lama tanpa alasan jelas.
6. Jangan menambah dependency baru kecuali benar-benar diperlukan.
7. Jangan membuat placeholder palsu yang terlihat seperti fitur aktif.
8. Jangan menambahkan klaim fitur yang belum benar-benar tersedia.
9. Jangan meninggalkan `console.log`, kode mati, komentar debug, atau file eksperimen.
10. Setiap perubahan harus bisa diverifikasi dengan lint, typecheck, test, atau build jika tersedia.

---

## 2. Required Initial Repository Check

Sebelum implementasi, agent wajib memeriksa:

```bash
ls
find . -maxdepth 2 -type f | sort
```

Lalu identifikasi:

* Package manager yang digunakan: `npm`, `pnpm`, `yarn`, atau `bun`.
* Framework utama: Next.js, React, Vite, Express, FastAPI, Laravel, atau lainnya.
* Bahasa utama: TypeScript, JavaScript, Python, PHP, dan sebagainya.
* Struktur folder utama.
* Lokasi komponen UI.
* Lokasi halaman atau route.
* Lokasi helper, config, API client, mock data, dan state management.
* Script yang tersedia di `package.json` atau file konfigurasi lain.
* File dokumentasi yang sudah ada seperti `README.md`, `design.md`, atau dokumentasi API.

Jika repository memiliki `design.md`, agent wajib membacanya dan mengikuti aturan desain di dalamnya.

---

## 3. Scope Control

Agent harus menjaga scope agar tidak melebar.

Boleh dilakukan:

* Mengubah file yang relevan dengan task.
* Membuat komponen baru jika memang diperlukan.
* Memecah file besar menjadi komponen/helper yang lebih jelas.
* Menambahkan validasi, state UI, dan handling error.
* Memperbaiki bug yang langsung berhubungan dengan task.
* Menyesuaikan README jika ada perubahan cara pakai, fitur, script, env, API, database, atau deployment.

Tidak boleh dilakukan tanpa instruksi eksplisit:

* Rewrite total aplikasi.
* Mengganti framework.
* Mengganti desain secara ekstrem.
* Menghapus fitur yang sudah ada.
* Mengubah struktur data/API tanpa alasan dan dokumentasi.
* Menambahkan authentication, payment, AI, database, atau integrasi eksternal jika tidak diminta.
* Menambahkan dependency berat hanya untuk kebutuhan kecil.

---

## 4. UI/UX Quality Rules

Produk harus terlihat intentional, bukan hasil template generik.

Agent wajib memastikan:

* Layout rapi dan konsisten.
* Spacing, typography, warna, border, radius, dan shadow digunakan secara konsisten.
* Setiap section punya fungsi jelas: masalah, solusi, alur kerja, manfaat, bukti, atau aksi pengguna.
* Dashboard menampilkan informasi yang berguna, bukan grafik dekoratif.
* Form memiliki label, validasi, error message, dan feedback yang jelas.
* Navigasi mudah dipahami.
* CTA tidak berlebihan.
* Konten spesifik sesuai domain project.
* Tampilan responsive untuk mobile, tablet, dan desktop.
* Elemen interaktif memiliki hover, focus, active, disabled, dan loading state.
* Empty state, loading state, error state, success state, dan disabled state tersedia pada fitur utama.

Hindari:

* Gradient berlebihan.
* Glassmorphism tanpa fungsi.
* Shadow besar yang membuat tampilan murahan.
* Card terlalu banyak.
* Ikon random.
* Testimonial palsu.
* Statistik palsu.
* CTA berulang.
* Copywriting hiperbolik seperti `revolutionary`, `cutting-edge`, `seamless`, `game changer`, atau `transform the future`.

Gunakan copywriting yang konkret, misalnya:

```txt
Analisis data dalam 3 langkah.
Lihat status terbaru dari setiap laporan.
Bandingkan hasil sebelum dan sesudah perubahan.
Unduh ringkasan untuk kebutuhan presentasi.
```

---

## 5. Accessibility Requirements

Agent wajib memperhatikan aksesibilitas dasar:

* Gunakan semantic HTML.
* Gunakan heading secara berurutan.
* Semua input harus memiliki label.
* Semua gambar informatif harus memiliki `alt text`.
* Button harus bisa diakses dengan keyboard.
* Focus state harus terlihat.
* Jangan menyampaikan status hanya melalui warna.
* Gunakan `aria-label` jika elemen interaktif tidak memiliki teks visual.
* Pastikan kontras teks cukup.
* Jangan membuat elemen klik menggunakan `div` jika seharusnya `button` atau `a`.

---

## 6. Code Quality Rules

Agent wajib menjaga kualitas kode.

Aturan umum:

* Gunakan nama file, variabel, fungsi, dan komponen yang deskriptif.
* Pisahkan UI, logic, config, helper, dan mock data jika memungkinkan.
* Hindari duplikasi logic.
* Jangan membuat file terlalu besar jika bisa dipecah wajar.
* Jangan menggunakan `any` sembarangan di TypeScript.
* Jangan menonaktifkan lint rule hanya untuk menghindari error.
* Jangan membuat magic number tanpa konteks.
* Jangan hardcode data yang seharusnya masuk config atau mock data.
* Jangan membuat fake API response yang terlihat seperti data produksi tanpa penanda jelas.
* Jangan menyimpan secret, token, API key, atau credential di source code.
* Jangan mengubah behavior lama tanpa menjelaskan alasannya.

Jika perlu mock data, letakkan di lokasi yang jelas, misalnya:

```txt
src/data
src/mocks
src/lib/mock-data
```

Gunakan nama yang eksplisit seperti:

```txt
mockReports
mockUsers
mockDashboardMetrics
```

---

## 7. Environment Variable Rules

Jika task membutuhkan environment variable baru:

1. Tambahkan pembacaan env di config yang sesuai.
2. Update `.env.example`.
3. Jelaskan fungsi env tersebut di `README.md`.
4. Jangan menaruh value secret asli.
5. Gunakan value contoh yang aman.

Contoh `.env.example`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/app_db
AI_API_KEY=your_api_key_here
```

---

## 8. README Update Rules

Agent wajib update `README.md` jika ada perubahan pada:

* Fitur.
* Cara menjalankan project.
* Script.
* Dependency.
* Environment variable.
* API endpoint.
* Database.
* Deployment.
* Struktur folder penting.
* Cara menggunakan fitur.
* Batasan fitur.
* Known issues.

Minimal README harus memuat:

```md
## Overview
Penjelasan singkat project.

## Features
Daftar fitur yang benar-benar tersedia.

## Tech Stack
Stack yang digunakan.

## Getting Started
Cara install dan menjalankan project.

## Environment Variables
Daftar env yang diperlukan.

## Available Scripts
Script yang tersedia.

## Project Structure
Struktur folder penting.

## Notes
Batasan, risiko, atau langkah lanjutan.
```

Jangan menulis fitur sebagai selesai jika belum benar-benar diimplementasikan.

---

## 9. Package Manager Rules

Agent wajib mendeteksi package manager dari file lock:

| File                        | Package Manager |
| --------------------------- | --------------- |
| `package-lock.json`         | npm             |
| `pnpm-lock.yaml`            | pnpm            |
| `yarn.lock`                 | yarn            |
| `bun.lockb` atau `bun.lock` | bun             |

Gunakan package manager yang sesuai. Jangan mencampur package manager.

Contoh:

```bash
# npm
npm install
npm run build

# pnpm
pnpm install
pnpm build

# yarn
yarn install
yarn build

# bun
bun install
bun run build
```

Jika tidak ada lock file, cek `package.json`, lalu pilih package manager yang paling masuk akal dan jelaskan di final response.

---

## 10. Verification Rules

Sebelum menyatakan task selesai, agent wajib menjalankan verifikasi sesuai script yang tersedia.

Urutan verifikasi untuk project web:

```bash
# 1. Install dependency jika diperlukan
npm install

# 2. Lint jika tersedia
npm run lint

# 3. Typecheck jika tersedia
npm run typecheck

# 4. Test jika tersedia
npm run test

# 5. Build jika tersedia
npm run build
```

Sesuaikan dengan package manager.

Untuk `pnpm`:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Untuk `yarn`:

```bash
yarn install
yarn lint
yarn typecheck
yarn test
yarn build
```

Untuk `bun`:

```bash
bun install
bun run lint
bun run typecheck
bun test
bun run build
```

Jika script tidak tersedia, jangan mengarang hasil. Tulis dengan jelas:

```txt
Lint: not available, script tidak ditemukan di package.json.
Typecheck: not available, script tidak ditemukan di package.json.
Test: not available, script tidak ditemukan di package.json.
Build: passed.
```

Jika build gagal, agent harus mencoba memperbaiki penyebabnya. Jika masih gagal, jelaskan blocker spesifik, file terkait, dan error utama.

---

## 11. Git and Review Discipline

Agent harus menjaga perubahan agar mudah direview.

Wajib:

* Ubah file seminimal mungkin sesuai task.
* Jangan format ulang file besar tanpa kebutuhan.
* Jangan mengubah import order secara masif jika tidak diperlukan.
* Jangan rename file tanpa alasan jelas.
* Jangan membuat banyak file baru yang tidak dipakai.
* Pastikan tidak ada file temporary seperti `.tmp`, `.bak`, atau hasil eksperimen.
* Pastikan tidak ada secret di diff.

Sebelum selesai, cek perubahan:

```bash
git status
git diff --stat
```

Jika memungkinkan, cek detail diff:

```bash
git diff
```

---


## 12. Semantic Commit Rules

Agent wajib menggunakan semantic commit atau Conventional Commits ketika membuat commit, menulis saran commit message, atau menyiapkan final response yang menyertakan rekomendasi commit.

Format dasar:

```txt
<type>(optional-scope): <subject>
```

Contoh:

```txt
feat(auth): add role based access for waste marketplace
fix(listing): handle empty waste pickup coordinates
refactor(ui): split dashboard metrics into smaller components
docs(readme): update setup and environment guide
chore(deps): align package lock after install
```

### 12.1 Commit Type yang Diizinkan

Gunakan type berikut sesuai tujuan perubahan:

| Type       | Kapan digunakan |
| ---------- | --------------- |
| `feat`     | Menambah fitur baru yang terlihat oleh user atau sistem. |
| `fix`      | Memperbaiki bug, error state, data mismatch, atau behavior yang salah. |
| `docs`     | Mengubah dokumentasi seperti `README.md`, `AGENTS.md`, `DESIGN.md`, atau API docs. |
| `style`    | Perubahan format kode tanpa mengubah behavior, misalnya whitespace atau formatting. Jangan gunakan untuk perubahan desain UI. |
| `refactor` | Merapikan struktur kode tanpa menambah fitur atau mengubah behavior. |
| `perf`     | Meningkatkan performa render, bundle, query, caching, atau loading. |
| `test`     | Menambah atau memperbaiki test. |
| `build`    | Mengubah konfigurasi build, bundler, package manager, lockfile, atau dependency build. |
| `ci`       | Mengubah workflow CI/CD. |
| `chore`    | Perubahan maintenance yang tidak masuk kategori lain. |
| `revert`   | Membatalkan commit sebelumnya. |

Untuk perubahan UI yang memengaruhi tampilan atau UX, gunakan `feat`, `fix`, atau `refactor` sesuai konteks, bukan `style`.

Contoh:

```txt
feat(home): add three-layer marketplace flow section
fix(upload): show validation error for unsupported image type
refactor(dashboard): simplify collector metrics layout
```

### 12.2 Scope Commit

Scope harus singkat, lowercase, dan menggambarkan area yang berubah.

Scope yang disarankan untuk project Pacul:

```txt
auth
rbac
home
landing
dashboard
listing
upload
classification
marketplace
pickup
route
collector
industry
transaction
negotiation
api
db
seed
ui
readme
design
agents
config
deploy
```

Jika perubahan menyentuh banyak area, pilih scope paling dominan. Jika benar-benar lintas area dan sulit dipilih, scope boleh dihilangkan.

Contoh:

```txt
feat(marketplace): add waste listing filters by material type
fix(route): calculate pickup distance with valid coordinates
docs(agents): add semantic commit rules
chore: remove unused temporary assets
```

### 12.3 Subject Commit

Subject commit wajib:

* Menggunakan bahasa Inggris agar umum dipahami di ekosistem Git.
* Ditulis lowercase setelah tanda titik dua.
* Menggunakan imperative mood, misalnya `add`, `fix`, `update`, `remove`, `split`.
* Maksimal 72 karakter jika memungkinkan.
* Spesifik terhadap perubahan yang benar-benar dilakukan.
* Tidak diakhiri titik.
* Tidak memakai emoji.
* Tidak memakai kata hiperbolik seperti `amazing`, `perfect`, `revolutionary`, atau `final fix`.

Contoh baik:

```txt
feat(classification): add image preview and confidence result
fix(transaction): prevent deal action without agreed price
docs(readme): document demo accounts and available scripts
```

Contoh buruk:

```txt
update code
fix bug
final banget
feat: amazing new dashboard
style: make website beautiful
```

### 12.4 Commit Body

Gunakan body commit jika perubahan butuh konteks tambahan. Body commit harus menjelaskan alasan dan dampak, bukan mengulang subject.

Format:

```txt
feat(classification): add waste image classification flow

Add upload validation, preview state, classification result, and fallback
message when the model cannot detect a supported waste class.
```

Body disarankan ketika:

* Perubahan menyentuh alur bisnis penting.
* Ada migrasi data, perubahan env, atau perubahan API contract.
* Ada trade-off teknis yang perlu dijelaskan.
* Ada batasan fitur yang perlu dicatat.

### 12.5 Breaking Change

Jika perubahan memutus compatibility, agent wajib menulis `BREAKING CHANGE` di body commit dan menjelaskan dampaknya.

Contoh:

```txt
feat(api): change listing payload for material cascade

BREAKING CHANGE: listing payload now separates household waste,
collector material, and industry material fields. Existing mock data must
be migrated to the new cascade format.
```

Breaking change tidak boleh dilakukan tanpa alasan kuat dan dokumentasi di `README.md` atau dokumentasi API.

### 12.6 Commit Granularity

Commit harus kecil dan mudah direview.

Wajib:

* Pisahkan perubahan fitur, refactor, dokumentasi, dan konfigurasi jika memungkinkan.
* Jangan mencampur formatting masif dengan perubahan logic.
* Jangan membuat satu commit besar untuk banyak fitur yang tidak saling bergantung.
* Jangan commit file temporary, debug artifact, atau hasil build yang tidak seharusnya masuk repository.
* Jangan commit `.env`, secret, token, credential, atau file lokal pribadi.

Contoh pemecahan commit yang baik:

```txt
feat(listing): add household waste listing form
feat(classification): connect image classification result to listing form
fix(marketplace): filter collector view by handled waste type
docs(readme): update feature list and demo flow
```

### 12.7 Commit Message untuk Final Response

Jika agent diminta menyiapkan commit message, berikan maksimal 3 opsi yang relevan. Jangan mengarang commit yang tidak sesuai perubahan.

Format yang disarankan di final response:

```md
## Suggested Commit Message
`feat(listing): add waste listing workflow for households`
```

Jika perubahan hanya dokumentasi:

```md
## Suggested Commit Message
`docs(agents): add semantic commit and verification rules`
```

Jika task belum selesai atau build gagal, jangan menyarankan commit yang terdengar final. Gunakan commit yang jujur terhadap status perubahan.

Contoh:

```txt
wip(classification): add initial model integration with known build blocker
```

Gunakan `wip` hanya jika user secara eksplisit bekerja dalam mode draft atau task memang belum siap merge. Untuk pekerjaan siap PR, hindari `wip`.

---
## 13. Feature Implementation Standard

Setiap fitur baru minimal harus memiliki:

* UI yang bisa digunakan.
* Validasi input jika menerima input user.
* Loading state jika ada proses async.
* Empty state jika data bisa kosong.
* Error state jika proses bisa gagal.
* Success state jika aksi berhasil.
* Disabled state untuk aksi yang belum valid atau sedang berjalan.
* Dokumentasi singkat di README jika fitur memengaruhi penggunaan.
* Build berhasil jika script build tersedia.

---

## 14. API and Data Handling Rules

Jika mengubah API atau data flow:

* Jangan mengubah contract API tanpa dokumentasi.
* Gunakan nama field yang konsisten.
* Tangani error response.
* Jangan expose stack trace ke user.
* Jangan hardcode endpoint produksi.
* Gunakan config/env untuk base URL.
* Berikan fallback UI jika data gagal dimuat.
* Pastikan loading dan empty state jelas.

Format error message untuk user harus spesifik:

```txt
Data gagal dimuat. Periksa koneksi internet atau coba lagi.
File terlalu besar. Maksimal ukuran file adalah 5MB.
Form belum lengkap. Periksa kembali bagian yang ditandai.
```

Hindari error message seperti:

```txt
Error.
Failed.
Something went wrong.
```

---

## 15. AI/ML Feature Rules

Jika project menggunakan fitur AI/ML:

* Jelaskan batasan model secara jujur.
* Jangan mengklaim akurasi tanpa evaluasi.
* Jangan menampilkan hasil AI sebagai kebenaran mutlak.
* Tambahkan confidence score jika tersedia.
* Tambahkan disclaimer ringan jika output bersifat rekomendasi.
* Tangani kasus input buruk, kosong, ambigu, atau tidak relevan.
* Jangan mengirim data sensitif ke API eksternal tanpa penjelasan.
* Dokumentasikan env dan biaya API jika relevan.

Output AI sebaiknya punya struktur:

```txt
Ringkasan hasil
Alasan / evidence
Confidence level
Rekomendasi tindakan
Catatan batasan
```

---

## 16. Security and Privacy Rules

Agent wajib menjaga keamanan dasar:

* Jangan commit `.env`.
* Jangan hardcode API key.
* Jangan menampilkan credential di UI.
* Jangan menyimpan data sensitif di localStorage jika tidak perlu.
* Validasi input user.
* Escape atau sanitasi konten yang dirender dari user.
* Jangan menampilkan detail error internal ke user.
* Gunakan environment variable untuk secret.
* Jangan mengaktifkan CORS terlalu terbuka tanpa alasan.
* Jangan membuat endpoint admin tanpa proteksi.

---

## 17. Performance Rules

Agent wajib menjaga performa:

* Hindari dependency besar tanpa alasan.
* Gunakan lazy loading untuk komponen/gambar berat jika relevan.
* Optimalkan image.
* Jangan render list besar tanpa pagination atau virtualization jika datanya banyak.
* Hindari re-render tidak perlu.
* Jangan melakukan fetch berulang tanpa kontrol.
* Pastikan halaman utama tetap ringan untuk demo hackathon.

---

## 18. Documentation Files

Jika tersedia, agent harus mengikuti dokumen berikut:

* `README.md` untuk cara setup dan penjelasan project.
* `design.md` untuk aturan desain dan UX.
* `AGENTS.md` untuk aturan kerja agent.
* `.env.example` untuk daftar environment variable.
* Dokumentasi API jika tersedia.

Prioritas ketika ada konflik:

1. Instruksi user terbaru.
2. `AGENTS.md`.
3. `design.md`.
4. `README.md`.
5. Pola kode yang sudah ada.

---

## 19. Final Response Format

Setelah menyelesaikan task, agent wajib memberi final response dengan format berikut:

```md
## Summary
Ringkasan perubahan yang dilakukan.

## Changed Files
- `path/to/file`: penjelasan singkat perubahan.
- `path/to/file`: penjelasan singkat perubahan.

## How to Run
Command untuk menjalankan project secara lokal.

## Verification Result
- Package manager: npm / pnpm / yarn / bun
- Install: passed / failed / not run
- Lint: passed / failed / not available
- Typecheck: passed / failed / not available
- Test: passed / failed / not available
- Build: passed / failed / not available

## Notes
Risiko teknis, batasan implementasi, blocker, atau langkah lanjutan.
```

Jangan menulis “semua berhasil” jika belum menjalankan verifikasi.

---

## 20. Definition of Done

Task dianggap selesai hanya jika:

* Scope sesuai instruksi user.
* Kode relevan sudah diimplementasikan.
* Tidak ada debug log atau kode mati.
* UI responsive jika task menyentuh frontend.
* State utama sudah ditangani.
* README sudah diupdate jika diperlukan.
* `.env.example` sudah diupdate jika ada env baru.
* Lint/typecheck/test/build dijalankan jika tersedia.
* Build berhasil jika script build tersedia.
* Final response memuat ringkasan, file berubah, cara menjalankan, hasil verifikasi, dan catatan risiko.

Jika build gagal dan tidak bisa diselesaikan, task belum sepenuhnya done. Agent harus menjelaskan error spesifik dan langkah perbaikan yang disarankan.

---

## 21. Agent Behavior Rules

Agent harus bekerja seperti developer yang hati-hati, bukan generator kode cepat.

Wajib:

* Jelaskan asumsi penting jika ada.
* Pilih solusi paling sederhana yang memenuhi kebutuhan.
* Prioritaskan MVP yang bisa jalan.
* Jaga technical credibility untuk demo hackathon.
* Jangan overengineering.
* Jangan membuat arsitektur terlalu kompleks.
* Jangan menambah fitur hanya karena terlihat keren.
* Jangan mengubah banyak hal di luar task.
* Jangan membuat UI yang terlihat seperti template AI.
* Jangan mengklaim fitur sudah selesai jika masih mock/prototype.

Jika task ambigu, gunakan asumsi paling aman dan tuliskan di final notes. Jangan berhenti hanya karena ada detail kecil yang belum jelas.
