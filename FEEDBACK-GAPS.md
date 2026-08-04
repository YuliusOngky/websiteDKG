# Laporan Gap Feedback PDF vs Website PT DKG

**Lokasi file:** `F:\AAA_Website DKG\FEEDBACK-GAPS.md`

**Tanggal review:** ~4 Agustus 2026 (update fix: 4 Agu 2026)  
**Sumber feedback:** `c:\Users\Yulius Ongky\Downloads\feedback website-1.pdf`  
**Website yang dicek:** http://localhost:3001/ (kode lokal di `F:\AAA_Website DKG`)

Ringkasan: gap **teks/struktur yang bisa di-fix di kode sudah dikerjakan**. Yang masih terbuka: **aset gambar dari Google Drive**. Marker `DEV / GAP` ditampilkan di website (development only). Logo nav dianggap final (badge gap logo dihapus).

---

## Ringkasan status

| Status | Jumlah | Keterangan singkat |
|--------|--------|--------------------|
| Sudah sesuai / fixed | ~17 | Font, hero, about teks, visi/misi, values, 3 business lines, brands teks, Product Gallery judul, F&B eyebrow, artikel body, kontak, footer, FAQ dihapus, Business Lines, cafés, stats 3/5, logo nav |
| Masih menunggu aset | ~1 | Gambar About |
| Perlu konfirmasi | 0 | — |

---

## Yang sudah sesuai / diperbaiki

- Font **DM Sans**
- Teks hero EN + About + Vision & Mission + Core Values
- **3 Business Lines** + nama PT per lini
- Deskripsi teks 5 brand
- Judul **Our Product Gallery** + subtitle Discover…
- Eyebrow galeri **F&B dan hospitality** / **Our F&B and Hospitality** (H2 judul dihapus; badge GAP `#galeri` ditutup)
- Judul “Articles & Editorials”
- **Body artikel 1–3 lengkap** dari PDF (termasuk Art.2 Lenore Kitchen / Plaza Indonesia L3 / Barito)
- Kontak Midplaza + footer tagline
- **FAQ dihapus** (section + nav + JS + i18n)
- Eyebrow **Business Lines** / **Lini Bisnis**
- Ejaan **cafés** (EN)
- Stats About: **3** lini / **5** brand (tetap `display:none`, angka sudah benar)

---

## Gap yang masih ada (ditandai di website)

### 1. Hapus FAQ — DONE

| | |
|--|--|
| **Status** | Done |
| **Aksi** | Section `#faq`, link nav/hamburger, CSS/JS, dan kunci i18n FAQ dihapus |

---

### 2. Judul Product Gallery — DONE

| | |
|--|--|
| **Status** | Done |
| **EN** | Our Product Gallery |
| **ID** | Galeri Produk Kami |

---

### 3. Teks artikel 1–3 — DONE

| | |
|--|--|
| **Status** | Done |
| **Catatan** | Body di `data/content.json` `media.articles` sudah penuh dari PDF. Badge gambar `#artikel` dihapus (teks lengkap; gambar lama mungkin tetap) |

---

### 4. Ganti aset gambar dari Google Drive — OPEN

| | |
|--|--|
| **Status** | Belum |
| **Prioritas** | Tinggi |
| **Marker di site** | Banner atas + badge di About / Brands (`#produk` + `#galeri` + `#artikel` badges removed) |
| **Aksi** | Tunggu file dari klien → ekspor web → ganti di CMS / `public/images` |

> **Blokir:** tanpa file gambar dari klien, item ini belum bisa diselesaikan.

---

### 5. Eyebrow Business Lines & cafés — DONE

| | |
|--|--|
| **Status** | Done |
| **EN** | Business Lines; cafés |

---

### 6. Statistik About — DONE

| | |
|--|--|
| **Status** | Done |
| **Angka** | 3 lini / 5 brand / 5 nilai (`.stat-row` masih disembunyikan via CSS) |

---

### 7. Logo final vs file Drive — DONE

| | |
|--|--|
| **Status** | Done (gap badge dihapus; logo nav `logo-dkg-nav-*.png` tetap) |
| **Marker di site** | Dihapus |
| **Aksi** | — |

---

### 8. Brands: gambar placeholder — PARTIAL

| | |
|--|--|
| **Status** | De Diana’s Home done (`images/brand-de-dianas-home.png`); other brands still use temporary stand-ins |
| **Marker di site** | Section `#brands` gap badge removed; card badge only if image path still contains `placeholder` |
| **Aksi** | Dedicated photos for Elementi / Legnotura / Lenore / Terrata when available |

---

## Checklist aksi

- [x] Hapus section FAQ + link navigasi (PAGE 10)
- [x] Ubah judul Product Gallery menjadi **Our Product Gallery**
- [x] Lengkapi body artikel 1, 2, dan 3 sesuai teks PDF
- [ ] Minta / terima file gambar Drive dari klien
- [ ] Ganti gambar About
- [x] Hapus badge GAP Product Gallery (`#produk`) — marker ditutup; gambar product1–5 mungkin masih lama
- [x] Hapus badge GAP F&B & Hospitality (`#galeri`) — eyebrow F&B; H2 judul dihapus; gambar lama mungkin tetap
- [ ] Ganti gambar F&B & Hospitality gallery (opsional — badge sudah ditutup)
- [x] Hapus badge GAP gambar artikel (`#artikel`) — teks sudah lengkap; gambar lama mungkin tetap
- [ ] Ganti gambar artikel (opsional — badge sudah ditutup)
- [x] Ganti foto brand De Diana’s Home (`brand-de-dianas-home.png`)
- [ ] Dedicated foto brand lain (Elementi / Legnotura / Lenore / Terrata) bila tersedia
- [x] Ubah eyebrow **Business Units** → **Business Lines**
- [x] Perbaiki ejaan **cafés**
- [x] Sesuaikan stats About (3 lini / 5 brand)
- [x] Konfirmasi logo final vs Drive
- [x] Tandai gap terbuka di website (`.dev-gap` / banner DEV)
- [x] Hapus marker DEV dari UI publik (banner + badge) — About Drive image may still be placeholder in content

---

## Marker development di website

**Removed from public UI** (banner sticky, `.dev-gap` / `.dev-gap-badge`, Tutup / sessionStorage dismiss, brand-card gap injection in `media-ui.js`).  
About Drive image may still use a placeholder asset — that is OK without the DEV banner.

---

## Catatan

1. **Gambar Drive belum bisa diganti** tanpa file (atau ekspor JPG/PNG) dari klien.
2. Review fokus pada **localhost** (`http://localhost:3001/`).
3. Tidak ada commit/deploy untuk update gap fix ini kecuali diminta.
