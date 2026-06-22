# DESIGN.md

## 1. Identitas Produk

**Nama produk:** Pacul  
**Jenis produk:** Web marketplace daur ulang tiga lapis  
**Target MVP:** Aplikasi web responsif yang mempertemukan Rumah Tangga, Pengepul, dan Industri Pengolah dalam satu alur material yang utuh.  
**Arah visual:** Hijau bersih, natural, modern, dan terpercaya. Desain harus terasa seperti produk operasional, bukan landing page template.

Pacul bukan hanya katalog sampah. Pacul harus memperlihatkan rantai nilai daur ulang dari sampah rumah tangga yang dipilah, diambil pengepul, diproses menjadi bahan baku, lalu dibeli oleh industri pengolah.

## 2. Masalah yang Harus Terlihat di Desain

Desain wajib menjawab masalah utama berikut:

1. Rumah tangga tidak tahu ke mana harus menjual sampah terpilah.
2. Pengepul sulit menemukan pasokan sesuai jenis sampah yang ditangani.
3. Industri pengolah sulit memperoleh bahan baku daur ulang yang konsisten.
4. Proses pengambilan dipengaruhi lokasi, rute, dan biaya operasional.
5. Kualitas data sampah sering tidak rapi karena kategori, berat, foto, dan status tidak tercatat konsisten.

Setiap halaman harus membantu salah satu bagian dari masalah tersebut. Jangan membuat section dekoratif yang tidak membantu user mengambil keputusan.

## 3. Prinsip Desain Produk

### 3.1 Operasional lebih penting daripada dekorasi

Pacul harus terasa seperti sistem yang bisa dipakai lapangan. Prioritaskan:

- Status listing yang jelas.
- Kategori sampah yang mudah dibaca.
- Berat, lokasi, harga, dan jarak tampil ringkas.
- Alur pengambilan dan transaksi tidak membingungkan.
- Dashboard menampilkan data yang benar-benar berguna.

### 3.2 Tiga peran harus terasa berbeda

Setiap role punya kebutuhan utama yang berbeda:

- Rumah Tangga ingin input sampah dengan cepat dan melihat status.
- Pengepul ingin menemukan listing sesuai kategori, lokasi, dan rute.
- Industri ingin mencari bahan baku, pesan, negosiasi harga, dan melihat riwayat transaksi.

Jangan memakai dashboard yang sama untuk semua role kecuali hanya layout dasarnya. Konten, CTA, dan prioritas datanya harus berbeda.

### 3.3 Material flow harus selalu terlihat

Alur utama produk:

Rumah Tangga input sampah -> Listing marketplace -> Pengepul ambil dan pilah -> Bahan baku tersedia -> Industri pesan -> Negosiasi -> Transaksi -> Dashboard volume

Desain harus membuat user paham bahwa setiap item punya status dan berpindah tahap. Jangan membuat listing berdiri sendiri tanpa status lanjutan.

### 3.4 AI harus membantu, bukan menjadi gimmick

Klasifikasi foto sampah harus ditempatkan sebagai alat bantu input kategori. User tetap bisa koreksi hasil AI. Tampilkan confidence secara sederhana, bukan grafik rumit.

Contoh microcopy:

> AI menyarankan kategori: Plastik PET. Periksa ulang sebelum listing dipublikasikan.

### 3.5 Tidak boleh AI slop

Hindari pola berikut:

- Gradient berlebihan.
- Glassmorphism tanpa fungsi.
- Shadow besar di semua card.
- Ikon random tanpa makna.
- Testimonial palsu.
- CTA berulang seperti "Mulai Sekarang" di setiap section.
- Copywriting hiperbolik seperti "revolutionary", "cutting-edge", atau "masa depan industri" tanpa bukti.
- Dashboard dengan chart dekoratif yang tidak membantu keputusan.

## 4. Arah Visual

### 4.1 Mood

Desain harus terasa:

- Hijau, bersih, dan natural.
- Rapi seperti platform logistik kecil.
- Tidak terlalu ramai.
- Ramah untuk user non-teknis.
- Cukup profesional untuk dilihat juri hackathon.

### 4.2 Karakter visual

Gunakan kombinasi:

- Background hijau sangat muda.
- Panel putih bersih.
- Border halus.
- Warna hijau tua untuk heading dan navigasi.
- Hijau medium untuk aksi utama.
- Aksen kuning tanah atau amber hanya untuk status peringatan atau harga.
- Hindari warna neon.

### 4.3 Referensi gaya

Arah warna mengikuti permintaan: hijau indah, clean, dan natural. Token warna dibuat agar mudah disesuaikan jika referensi visual eksternal berubah.

## 5. Design Token

### 5.1 Warna utama

| Token | Hex | Penggunaan |
|---|---:|---|
| `--color-forest-950` | `#071F18` | Teks sangat penting, footer, navbar gelap |
| `--color-forest-900` | `#0B2F24` | Heading utama, brand mark, sidebar aktif |
| `--color-forest-800` | `#123F31` | Navbar, badge role, text emphasis |
| `--color-leaf-700` | `#17643F` | Hover button utama |
| `--color-leaf-600` | `#1F7A4D` | Button utama, link aktif, progress |
| `--color-leaf-500` | `#2E9E63` | Accent ringan, icon fungsional, success |
| `--color-mint-200` | `#CDEBDA` | Border aktif, chip selected |
| `--color-mint-100` | `#E8F6EE` | Background section hijau muda |
| `--color-sage-50` | `#F7FBF8` | Background halaman |

### 5.2 Warna pendukung

| Token | Hex | Penggunaan |
|---|---:|---|
| `--color-earth-700` | `#6B4F24` | Label harga, kategori bahan baku |
| `--color-earth-500` | `#A8792A` | Highlight nominal transaksi |
| `--color-amber-100` | `#FFF3CD` | Status menunggu negosiasi |
| `--color-amber-600` | `#B7791F` | Text status menunggu |
| `--color-red-100` | `#FDE8E8` | Error background |
| `--color-red-700` | `#B42318` | Error text |
| `--color-blue-100` | `#E7F0FF` | Informasi route atau AI suggestion |
| `--color-blue-700` | `#1D4ED8` | Link peta atau info aktif |

### 5.3 Warna netral

| Token | Hex | Penggunaan |
|---|---:|---|
| `--color-ink-900` | `#17211B` | Body text utama |
| `--color-ink-700` | `#34463B` | Secondary text |
| `--color-ink-500` | `#6B7C70` | Muted text, hint |
| `--color-line` | `#D9E7DD` | Border card, input, table |
| `--color-surface` | `#FFFFFF` | Card dan panel |
| `--color-page` | `#F7FBF8` | Background app |

### 5.4 Rasio penggunaan warna

Gunakan komposisi:

- 70 persen background netral dan sage.
- 20 persen hijau utama.
- 7 persen earth atau amber untuk data operasional.
- 3 persen merah atau biru untuk status khusus.

Jangan membuat semua elemen hijau. Warna hijau harus menjadi identitas dan penanda aksi, bukan dekorasi berlebihan.

## 6. Tipografi

### 6.1 Font rekomendasi

Gunakan salah satu:

- `Inter` untuk tampilan modern dan aman.
- `Plus Jakarta Sans` untuk tampilan Indonesia yang lebih hangat.
- `Geist Sans` jika project memakai Next.js modern.

Jangan campur lebih dari dua font.

### 6.2 Skala teks

| Elemen | Ukuran Desktop | Ukuran Mobile | Weight |
|---|---:|---:|---:|
| Hero title | 48-56 px | 34-40 px | 700 |
| Page title | 32-40 px | 28-32 px | 700 |
| Section title | 24-28 px | 22-24 px | 700 |
| Card title | 18-20 px | 17-18 px | 600 |
| Body | 15-16 px | 15-16 px | 400 |
| Label | 13-14 px | 13-14 px | 500 |
| Caption | 12-13 px | 12-13 px | 400 |

### 6.3 Aturan keterbacaan

- Line height body: 1.55 sampai 1.7.
- Heading tidak boleh terlalu panjang.
- Maksimal lebar paragraf landing page: 680 px.
- Gunakan angka besar hanya untuk metrik penting, bukan dekorasi.

## 7. Layout System

### 7.1 Container

| Area | Lebar Maksimal |
|---|---:|
| Landing page | 1120-1200 px |
| Dashboard | 1280-1360 px |
| Form detail | 720-880 px |
| Table-heavy page | 1200-1360 px |

### 7.2 Grid

- Landing desktop: 12 kolom.
- Dashboard desktop: sidebar 260 px + content fleksibel.
- Tablet: 8 kolom.
- Mobile: 1 kolom.

### 7.3 Spacing

Gunakan skala spacing:

| Token | Nilai |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |
| `space-16` | 64 px |
| `space-20` | 80 px |

### 7.4 Radius dan shadow

| Elemen | Radius | Shadow |
|---|---:|---|
| Button | 12 px | Tidak perlu shadow |
| Input | 12 px | Tidak perlu shadow |
| Card | 18 px | Shadow tipis hanya saat perlu |
| Modal | 22 px | Shadow sedang |
| Badge | 999 px | Tidak perlu shadow |

Shadow default:

```css
box-shadow: 0 10px 30px rgba(7, 31, 24, 0.08);
```

Gunakan shadow hanya untuk panel utama, modal, atau hover listing. Jangan semua card diberi shadow.

## 8. Struktur Informasi Produk

### 8.1 Navigasi publik

Untuk user belum login:

1. Beranda
2. Cara Kerja
3. Marketplace
4. Dampak
5. Masuk
6. Daftar

### 8.2 Navigasi Rumah Tangga

1. Ringkasan
2. Input Sampah
3. Listing Saya
4. Status Pengambilan
5. Riwayat
6. Profil

### 8.3 Navigasi Pengepul

1. Ringkasan
2. Ketersediaan Sampah
3. Rute Pengambilan
4. Bahan Baku Saya
5. Penjualan ke Industri
6. Riwayat

### 8.4 Navigasi Industri

1. Ringkasan
2. Marketplace Bahan Baku
3. Pesanan
4. Negosiasi
5. Transaksi
6. Riwayat Bahan Baku

### 8.5 Navigasi Admin jika diperlukan

Admin bukan fokus utama MVP, tetapi boleh disiapkan minimal:

1. Data Master Jenis Sampah
2. Data User
3. Data Transaksi
4. Monitoring Listing

## 9. Halaman Landing Page

Landing page harus menjelaskan produk secara cepat dan spesifik. Jangan membuat copy generik.

### 9.1 Hero

Tujuan: menjelaskan nilai utama Pacul dalam 5 detik.

Konten wajib:

- Headline yang menjelaskan marketplace tiga lapis.
- Subheadline yang menyebut Rumah Tangga, Pengepul, dan Industri.
- CTA utama: `Daftarkan Sampah`
- CTA sekunder: `Lihat Marketplace`
- Preview card berisi contoh listing nyata.

Contoh copy:

> Sampah terpilah dari rumah, tersambung sampai industri daur ulang.

> Pacul membantu rumah tangga menjual sampah terpilah, pengepul mengambil sesuai kategori dan rute, serta industri mendapatkan bahan baku daur ulang yang lebih konsisten.

Jangan pakai klaim hiperbolik seperti "mengubah masa depan daur ulang Indonesia".

### 9.2 Section Masalah

Tampilkan tiga masalah dalam bentuk panel singkat:

| Aktor | Masalah |
|---|---|
| Rumah Tangga | Bingung menjual sampah terpilah ke pihak yang tepat |
| Pengepul | Sulit menemukan pasokan sesuai jenis yang ditangani |
| Industri | Butuh bahan baku daur ulang yang konsisten |

### 9.3 Section Alur 3 Lapis

Buat visual stepper horizontal desktop dan vertical mobile:

1. Rumah Tangga input sampah.
2. Listing muncul di marketplace.
3. Pengepul ambil sesuai kategori dan rute.
4. Pengepul pilah menjadi bahan baku.
5. Industri pesan dan negosiasi harga.
6. Transaksi tercatat di dashboard.

Setiap step harus punya status dan data yang digunakan.

### 9.4 Section AI Classification

Jelaskan AI secara realistis:

- User upload foto sampah.
- Model memberi saran kategori.
- User bisa mengoreksi.
- Hasil dipakai untuk listing dan filter pengepul.

Tampilkan card simulasi:

- Foto sampah.
- Saran kategori: Plastik PET.
- Confidence: 86 persen.
- Tombol: `Gunakan Kategori` dan `Ubah Manual`.

### 9.5 Section Marketplace Preview

Tampilkan listing tiga lapis:

1. Sampah RT.
2. Bahan baku pengepul.
3. Bahan baku untuk industri.

Preview harus memakai data realistis:

- Plastik PET campur, 8.5 kg, Wonokromo, tersedia.
- Kardus kering, 12 kg, Rungkut, menunggu pengambilan.
- Biji plastik PET flakes, 40 kg, siap kirim.

### 9.6 Section Dashboard Ringkas

Tampilkan metrik yang berguna:

- Total listing aktif.
- Berat sampah terkumpul.
- Bahan baku tersedia.
- Transaksi selesai.
- Estimasi rute hari ini.

### 9.7 Section Final CTA

CTA cukup satu blok:

> Mulai dari satu listing sampah terpilah.

Button:

- `Daftar sebagai Rumah Tangga`
- `Masuk sebagai Pengepul`

## 10. Dashboard Rumah Tangga

### 10.1 Prioritas informasi

Rumah Tangga butuh melihat:

1. Sampah yang sedang tersedia.
2. Sampah yang sudah diambil.
3. Sampah yang terjual.
4. Rekomendasi kategori dari AI.
5. Status pengambilan.

### 10.2 Komponen utama

- Summary card: `Listing Aktif`, `Menunggu Diambil`, `Selesai`, `Estimasi Nominal`.
- CTA utama: `Input Sampah Baru`.
- Table listing: foto, jenis, berat, lokasi, status, tanggal.
- Empty state jika belum ada listing.

### 10.3 Empty state

Judul:

> Belum ada sampah yang didaftarkan

Deskripsi:

> Upload foto sampah terpilah pertama Anda. AI akan membantu menyarankan jenis sampah sebelum listing dipublikasikan.

Button:

> Input Sampah Baru

## 11. Form Input Sampah

### 11.1 Field wajib

| Field | Tipe | Validasi |
|---|---|---|
| Foto sampah | Upload image | Wajib, JPG/PNG/WebP, maksimal 5 MB |
| Jenis sampah | Select | Wajib, bisa dari hasil AI |
| Berat | Number | Wajib, lebih dari 0 |
| Satuan | Select | kg atau karung |
| Kondisi | Select | kering, campur, bersih, perlu sortir |
| Lokasi | Map picker atau input alamat | Wajib |
| Catatan | Textarea | Opsional, maksimal 250 karakter |

### 11.2 AI result panel

Setelah upload foto, tampilkan panel:

- Status loading: `Menganalisis foto sampah...`
- Success: `AI menyarankan kategori Plastik PET dengan confidence 86 persen.`
- Low confidence: `Hasil belum yakin. Pilih kategori manual agar listing lebih akurat.`
- Error: `Foto belum bisa dianalisis. Anda tetap bisa memilih kategori manual.`

### 11.3 Tombol

- Button utama: `Publikasikan Listing`
- Button sekunder: `Simpan Draft`
- Button tersier: `Batalkan`

Button utama disabled jika field wajib belum valid.

## 12. Marketplace Sampah untuk Pengepul

### 12.1 Tujuan halaman

Membantu pengepul menemukan sampah yang sesuai jenis ditangani dan masih masuk akal untuk diambil berdasarkan jarak.

### 12.2 Filter wajib

- Jenis sampah.
- Radius lokasi.
- Berat minimum.
- Status listing.
- Kondisi sampah.

### 12.3 Card listing

Informasi card:

- Foto sampah.
- Jenis sampah.
- Berat.
- Lokasi kelurahan/kecamatan.
- Jarak estimasi.
- Status.
- Label confidence AI jika ada.
- CTA: `Ambil Listing` atau `Lihat Detail`.

### 12.4 Status listing

| Status | Warna | Arti |
|---|---|---|
| Tersedia | Hijau | Bisa diambil pengepul |
| Dipesan | Amber | Sedang diklaim atau menunggu konfirmasi |
| Diambil | Biru | Dalam proses pickup |
| Dipilah | Earth | Sudah masuk proses bahan baku |
| Terjual | Hijau tua | Selesai |
| Dibatalkan | Merah | Tidak dilanjutkan |

## 13. Rute Pengambilan

### 13.1 Tujuan

Memberi urutan pengambilan yang praktis untuk pengepul. MVP cukup menggunakan nearest-neighbor dan jarak haversine. Tidak perlu TSP penuh.

### 13.2 Tampilan

Halaman dibagi menjadi dua:

- Kiri: daftar titik pengambilan berurutan.
- Kanan: peta interaktif.

Pada mobile:

- Peta di atas.
- Daftar titik di bawah.
- CTA sticky: `Mulai Rute`.

### 13.3 Data yang tampil

- Nama pemilik atau kode listing.
- Alamat ringkas.
- Jenis dan berat sampah.
- Estimasi jarak dari titik sebelumnya.
- Status pickup.
- Tombol: `Tandai Diambil`.

### 13.4 Map styling

- Gunakan Leaflet atau OpenStreetMap.
- Marker hijau untuk titik tersedia.
- Marker amber untuk titik menunggu.
- Marker biru untuk titik sedang diambil.
- Jangan membuat peta terlalu dekoratif.

## 14. Bahan Baku Pengepul

### 14.1 Tujuan

Setelah sampah diambil, pengepul mengubahnya menjadi listing bahan baku untuk industri.

### 14.2 Field bahan baku

| Field | Tipe | Validasi |
|---|---|---|
| Jenis bahan baku | Select | Wajib |
| Sumber sampah | Relasi listing | Wajib jika berasal dari pickup |
| Berat tersedia | Number | Wajib |
| Harga awal | Number | Wajib |
| Kondisi | Select | Bersih, cacah, press, campur |
| Peruntukan | Select | Daur ulang plastik, kertas, logam, kaca, kompos, lainnya |
| Lokasi stok | Text/map | Wajib |

### 14.3 Card bahan baku

Tampilkan:

- Nama bahan baku.
- Berat tersedia.
- Harga awal per kg.
- Lokasi stok.
- Status: tersedia, dipesan, negosiasi, terjual.
- CTA: `Lihat Pesanan`.

## 15. Marketplace Bahan Baku untuk Industri

### 15.1 Tujuan halaman

Industri mencari bahan baku berdasarkan jenis, lokasi, harga, dan ketersediaan.

### 15.2 Filter wajib

- Jenis bahan baku.
- Lokasi.
- Rentang harga.
- Berat minimum.
- Status ketersediaan.

### 15.3 Detail bahan baku

Detail harus menampilkan:

- Jenis bahan baku.
- Berat tersedia.
- Harga awal.
- Lokasi.
- Pengepul penyedia.
- Riwayat sumber jika tersedia.
- Tombol `Pesan`.
- Tombol `Ajukan Harga`.

## 16. Negosiasi Harga

### 16.1 Model MVP

Negosiasi minimal terdiri dari:

1. Industri membuat offer.
2. Pengepul membuat counter-offer.
3. Salah satu pihak menerima deal.
4. Salah satu pihak membatalkan.

Tidak perlu chat real-time untuk MVP. Gunakan riwayat penawaran berurutan.

### 16.2 Tampilan

Gunakan timeline sederhana:

- Penawaran awal.
- Counter-offer.
- Status diterima atau dibatalkan.
- Catatan singkat.

### 16.3 Status

| Status | Arti |
|---|---|
| Menunggu Respon | Offer sudah dibuat |
| Counter Offer | Harga ditawar balik |
| Deal | Harga disepakati |
| Cancelled | Negosiasi batal |
| Paid | Transaksi disimulasikan selesai |

## 17. Dashboard Industri

### 17.1 Prioritas informasi

Industri butuh melihat:

- Bahan baku yang tersedia.
- Pesanan aktif.
- Negosiasi yang menunggu respon.
- Transaksi selesai.
- Total volume bahan baku masuk.

### 17.2 Komponen

- Summary card: `Bahan Baku Tersedia`, `Pesanan Aktif`, `Negosiasi`, `Volume Dibeli`.
- Table pesanan.
- Marketplace shortcut.
- Chart volume per jenis bahan baku.

Chart harus menjawab pertanyaan operasional, bukan hanya mempercantik dashboard.

## 18. Dashboard Ringkas Multi-Role

Dashboard umum boleh menampilkan agregat:

- Total sampah terdaftar.
- Total sampah diambil.
- Total bahan baku tersedia.
- Total transaksi.
- Estimasi biaya atau jarak rute jika tersedia.

### 18.1 Visualisasi yang disarankan

| Visual | Fungsi |
|---|---|
| Bar chart volume per kategori | Melihat jenis sampah paling banyak |
| Line chart transaksi per hari | Melihat aktivitas marketplace |
| Table top bahan baku | Melihat stok paling relevan |
| Map titik aktif | Melihat distribusi lokasi |

Jangan gunakan pie chart jika kategori terlalu banyak.

## 19. Komponen UI

### 19.1 Button

Variant:

- Primary: hijau leaf, untuk aksi utama.
- Secondary: putih dengan border hijau.
- Ghost: transparan untuk aksi minor.
- Danger: merah untuk cancel/delete.

Aturan:

- Satu area maksimal punya satu primary button.
- Text button harus spesifik, bukan sekadar `Submit`.
- Disabled state harus jelas.

### 19.2 Card

Jenis card:

- ListingCard.
- MaterialCard.
- MetricCard.
- RouteStopCard.
- NegotiationCard.

Card tidak boleh penuh dekorasi. Informasi wajib lebih dominan dari visual.

### 19.3 Badge

Gunakan badge untuk:

- Role.
- Status listing.
- Jenis sampah.
- Confidence AI.
- Kondisi bahan baku.

Badge harus pendek dan mudah dipindai.

### 19.4 Table

Table digunakan untuk:

- Riwayat listing.
- Riwayat transaksi.
- Pesanan industri.
- Data master.

Table harus punya:

- Search.
- Filter.
- Empty state.
- Loading skeleton.
- Pagination jika data banyak.

### 19.5 Form

Form wajib punya:

- Label jelas.
- Placeholder yang membantu, bukan menggantikan label.
- Error message spesifik.
- Helper text untuk input teknis.
- State disabled saat submit.

Contoh error:

- Salah: `Invalid input`
- Benar: `Berat sampah harus lebih dari 0 kg.`

## 20. UX State Wajib

Setiap fitur utama wajib punya state berikut:

### 20.1 Loading state

Gunakan skeleton atau pesan singkat:

- `Memuat listing sampah...`
- `Menganalisis foto sampah...`
- `Menghitung urutan rute...`

### 20.2 Empty state

Empty state harus memberi aksi berikutnya.

Contoh:

> Belum ada bahan baku tersedia untuk kategori ini. Ubah filter atau cek kembali setelah pengepul menambahkan stok baru.

### 20.3 Error state

Error harus menjelaskan tindakan berikutnya.

Contoh:

> Rute belum bisa dihitung karena beberapa listing belum memiliki koordinat. Periksa data lokasi terlebih dahulu.

### 20.4 Success state

Success harus menjelaskan hasil aksi.

Contoh:

> Listing sampah berhasil dipublikasikan dan sudah bisa dilihat pengepul yang menangani kategori terkait.

### 20.5 Disabled state

Gunakan disabled untuk:

- Button submit saat field wajib belum valid.
- Ambil listing jika status bukan tersedia.
- Deal negosiasi jika belum ada offer aktif.

## 21. Responsiveness

### 21.1 Mobile

Prioritas mobile:

- Form input sampah mudah digunakan.
- Upload foto jelas.
- CTA sticky untuk aksi utama.
- Card listing satu kolom.
- Table berubah menjadi card list.
- Map bisa full width.

### 21.2 Tablet

- Dashboard boleh dua kolom.
- Filter marketplace bisa collapsible.
- Sidebar boleh menjadi top navigation.

### 21.3 Desktop

- Dashboard memakai sidebar.
- Marketplace memakai layout filter kiri dan result kanan.
- Detail page bisa dua kolom: informasi utama dan panel aksi.

## 22. Aksesibilitas

Wajib diterapkan:

- Kontras text memenuhi standar dasar.
- Semua input memiliki label.
- Foto sampah punya alt text deskriptif.
- Button bisa diakses keyboard.
- Focus state terlihat.
- Jangan hanya mengandalkan warna untuk status. Tambahkan teks status.
- Gunakan semantic HTML: header, nav, main, section, form, button, table.

Contoh alt text:

> Foto sampah plastik PET dalam karung putih.

## 23. Copywriting dan Bahasa

### 23.1 Tone

Gunakan bahasa Indonesia yang:

- Jelas.
- Operasional.
- Tidak hiperbolik.
- Ramah untuk user non-teknis.
- Tetap profesional untuk juri.

### 23.2 Kata yang disarankan

Gunakan:

- Sampah terpilah.
- Bahan baku daur ulang.
- Pengepul.
- Industri pengolah.
- Listing.
- Pengambilan.
- Negosiasi.
- Transaksi.
- Status.

### 23.3 Kata yang dihindari

Hindari:

- Revolutionary.
- Cutting-edge.
- Seamless.
- Transformasi masa depan.
- Solusi nomor satu.
- Mengubah dunia.

### 23.4 Contoh microcopy

Input sampah:

> Upload foto sampah terpilah agar sistem dapat menyarankan kategori awal.

Marketplace pengepul:

> Hanya listing yang sesuai jenis sampah yang Anda tangani yang ditampilkan di halaman ini.

Negosiasi:

> Ajukan harga yang masih memungkinkan untuk diproses. Riwayat penawaran akan tercatat sampai deal atau batal.

Dashboard:

> Data dihitung dari listing dan transaksi yang sudah tercatat di sistem.

## 24. Data Dummy yang Realistis

Gunakan data dummy yang konsisten dan tidak asal.

### 24.1 Jenis sampah rumah tangga

- Plastik PET.
- Plastik HDPE.
- Kardus.
- Kertas campur.
- Logam kaleng.
- Kaca botol.
- Elektronik kecil.
- Organik.

### 24.2 Contoh listing sampah

| Jenis | Berat | Lokasi | Status |
|---|---:|---|---|
| Plastik PET | 8.5 kg | Wonokromo, Surabaya | Tersedia |
| Kardus kering | 12 kg | Rungkut, Surabaya | Menunggu diambil |
| Kaleng aluminium | 4 kg | Sukolilo, Surabaya | Diambil |
| Botol kaca | 9 kg | Gubeng, Surabaya | Tersedia |

### 24.3 Contoh bahan baku pengepul

| Bahan baku | Berat | Harga awal | Status |
|---|---:|---:|---|
| PET flakes | 40 kg | Rp4.200/kg | Tersedia |
| Kardus press | 75 kg | Rp2.100/kg | Negosiasi |
| Aluminium campur | 20 kg | Rp11.500/kg | Tersedia |

## 25. Struktur Halaman MVP

MVP wajib memiliki halaman berikut:

1. Landing page.
2. Login dan register.
3. Dashboard berdasarkan role.
4. Form input sampah rumah tangga.
5. Listing sampah rumah tangga.
6. Marketplace sampah untuk pengepul.
7. Detail listing sampah.
8. Rute pengambilan sederhana.
9. Form bahan baku pengepul.
10. Marketplace bahan baku untuk industri.
11. Detail bahan baku.
12. Negosiasi harga.
13. Riwayat transaksi.
14. Dashboard ringkas.

## 26. Struktur Komponen Frontend yang Disarankan

Contoh struktur jika memakai Next.js atau React:

```txt
src/
  app/
    page.tsx
    login/
    register/
    dashboard/
    household/
    collector/
    industry/
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      Select.tsx
      Table.tsx
      EmptyState.tsx
      LoadingState.tsx
    marketplace/
      ListingCard.tsx
      MaterialCard.tsx
      ListingFilters.tsx
    route/
      RouteMap.tsx
      RouteStopList.tsx
    ai/
      ImageUploadClassifier.tsx
      ClassificationResult.tsx
    negotiation/
      OfferTimeline.tsx
      OfferForm.tsx
  data/
    mockListings.ts
    mockMaterials.ts
    mockTransactions.ts
  lib/
    formatCurrency.ts
    formatWeight.ts
    statusMap.ts
    routeDistance.ts
  styles/
    tokens.css
```

## 27. CSS Token Contoh

```css
:root {
  --color-forest-950: #071f18;
  --color-forest-900: #0b2f24;
  --color-forest-800: #123f31;
  --color-leaf-700: #17643f;
  --color-leaf-600: #1f7a4d;
  --color-leaf-500: #2e9e63;
  --color-mint-200: #cdebda;
  --color-mint-100: #e8f6ee;
  --color-sage-50: #f7fbf8;
  --color-earth-700: #6b4f24;
  --color-earth-500: #a8792a;
  --color-amber-100: #fff3cd;
  --color-amber-600: #b7791f;
  --color-red-100: #fde8e8;
  --color-red-700: #b42318;
  --color-blue-100: #e7f0ff;
  --color-blue-700: #1d4ed8;
  --color-ink-900: #17211b;
  --color-ink-700: #34463b;
  --color-ink-500: #6b7c70;
  --color-line: #d9e7dd;
  --color-surface: #ffffff;
  --color-page: #f7fbf8;

  --radius-button: 12px;
  --radius-card: 18px;
  --radius-modal: 22px;

  --shadow-panel: 0 10px 30px rgba(7, 31, 24, 0.08);
}
```

## 28. Acceptance Criteria Desain

Desain dianggap sesuai jika memenuhi kriteria berikut:

1. Tidak menggunakan emoji di UI, dokumentasi desain, dan copy utama.
2. Warna utama konsisten hijau natural, bukan neon.
3. Landing page menjelaskan alur Rumah Tangga, Pengepul, dan Industri secara konkret.
4. Role dashboard memiliki informasi berbeda sesuai kebutuhan masing-masing aktor.
5. Form input sampah memiliki upload foto, hasil klasifikasi AI, dan koreksi manual.
6. Marketplace pengepul bisa difilter berdasarkan jenis sampah dan lokasi.
7. Industri bisa melihat bahan baku, pesan, dan melakukan negosiasi harga.
8. Rute pengambilan tampil sebagai daftar urutan dan peta sederhana.
9. Semua fitur utama punya loading, empty, error, success, dan disabled state.
10. Desain responsif untuk mobile, tablet, dan desktop.
11. Dashboard menampilkan metrik operasional, bukan grafik dekoratif.
12. Copywriting tidak hiperbolik dan tidak terasa seperti template generik.
13. Komponen reusable dan konsisten dalam spacing, border, radius, dan typography.
14. Aksesibilitas dasar diterapkan pada form, button, navigasi, table, dan map.
15. Dummy data realistis dan sesuai konteks daur ulang.

## 29. Catatan Implementasi untuk Developer

Saat mengimplementasikan desain ini:

1. Jangan rewrite total struktur project tanpa alasan.
2. Baca struktur repository, package.json, stack, folder, dan pola komponen yang sudah ada.
3. Gunakan komponen kecil dan modular.
4. Pisahkan data mock, helper format, status map, dan UI component.
5. Jangan menambahkan dependency baru jika tidak perlu.
6. Jangan memakai console log debug di production code.
7. Jangan membuat placeholder palsu seperti data testimonial yang tidak ada sumbernya.
8. Update README jika ada perubahan fitur, setup, script, env, route, deployment, atau cara penggunaan.
9. Update .env.example jika ada environment variable baru.
10. Jalankan lint, typecheck, test, dan build jika script tersedia.
11. Minimal jalankan build sebelum menyatakan selesai.

## 30. Ringkasan Prioritas MVP

Prioritas utama:

1. Alur role jelas.
2. Input sampah dengan AI classification.
3. Marketplace sampah untuk pengepul.
4. Route pickup sederhana.
5. Konversi sampah menjadi bahan baku.
6. Marketplace bahan baku untuk industri.
7. Negosiasi offer dan counter-offer.
8. Dashboard ringkas.
9. Deploy public.

Bonus setelah MVP stabil:

1. Optimasi rute lebih lengkap.
2. Chat negosiasi real-time.
3. Riwayat traceability material.
4. Rating dan ulasan.
5. Dashboard dampak.
6. Ekspor laporan PDF atau Excel.
