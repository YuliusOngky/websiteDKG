# Laporan Gap Feedback PDF vs Website PT DKG

**Lokasi file:** `F:\AAA_Website DKG\FEEDBACK-GAPS.md`

**Tanggal review:** ~4 Agustus 2026 (update fix: 4 Agu 2026)  
**Sumber feedback:** `c:\Users\Yulius Ongky\Downloads\feedback website-1.pdf`  
**Website yang dicek:** http://localhost:3001/ (kode lokal di `F:\AAA_Website DKG`)

Ringkasan: gap **teks/struktur yang bisa di-fix di kode sudah dikerjakan**. Yang masih terbuka: **aset gambar dari Google Drive** + **konfirmasi logo**. Marker `DEV / GAP` ditampilkan di website (development only).

---

## Ringkasan status

| Status | Jumlah | Keterangan singkat |
|--------|--------|--------------------|
| Sudah sesuai / fixed | ~15 | Font, hero, about teks, visi/misi, values, 3 business lines, brands teks, Product Gallery judul, artikel body, kontak, footer, FAQ dihapus, Business Lines, cafés, stats 3/5 |
| Masih menunggu aset | ~5 | Gambar About, Product Gallery, F&B gallery, artikel, brand (De Diana’s Home) |
| Perlu konfirmasi | 1 | Logo final vs file Drive klien |

---

## Yang sudah sesuai / diperbaiki

- Font **DM Sans**
- Teks hero EN + About + Vision & Mission + Core Values
- **3 Business Lines** + nama PT per lini
- Deskripsi teks 5 brand
- Judul **Our Product Gallery** + subtitle Discover…
- Judul galeri “Our F&B and Hospitality”
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
| **Catatan** | Body di `data/content.json` `media.articles` sudah penuh dari PDF. **Gambar artikel** masih menunggu Drive → badge di section `#artikel` |

---

### 4. Ganti aset gambar dari Google Drive — OPEN

| | |
|--|--|
| **Status** | Belum |
| **Prioritas** | Tinggi |
| **Marker di site** | Banner atas + badge di About / Brands / Produk / Galeri / Artikel |
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

### 7. Logo final vs file Drive — OPEN

| | |
|--|--|
| **Status** | Perlu konfirmasi |
| **Marker di site** | Badge kecil di nav logo: `GAP: logo Drive?` |
| **Aksi** | Bandingkan dengan file Drive; ganti jika beda |

---

### 8. Brands: gambar placeholder — OPEN

| | |
|--|--|
| **Status** | Sebagian (teks OK) |
| **Marker di site** | Badge section Brands + badge kartu De Diana’s Home (`placeholder-brand-dd.svg`) |
| **Aksi** | Ganti foto setelah file Drive diterima |

---

## Checklist aksi

- [x] Hapus section FAQ + link navigasi (PAGE 10)
- [x] Ubah judul Product Gallery menjadi **Our Product Gallery**
- [x] Lengkapi body artikel 1, 2, dan 3 sesuai teks PDF
- [ ] Minta / terima file gambar Drive dari klien
- [ ] Ganti gambar About
- [ ] Ganti gambar Product Gallery
- [ ] Ganti gambar F&B & Hospitality gallery
- [ ] Ganti gambar artikel
- [ ] Ganti foto brand (khususnya De Diana’s Home)
- [x] Ubah eyebrow **Business Units** → **Business Lines**
- [x] Perbaiki ejaan **cafés**
- [x] Sesuaikan stats About (3 lini / 5 brand)
- [ ] Konfirmasi logo final vs Drive
- [x] Tandai gap terbuka di website (`.dev-gap` / banner DEV)

---

## Marker development di website

Kelas CSS: `.dev-gap`, `.dev-gap-badge`, `.dev-gap-banner` di `public/index.html`.  
Hapus sebelum production.

| Lokasi | Label |
|--------|--------|
| Banner sticky atas | DEV — gap masih terbuka (daftar gambar + logo) |
| Nav logo | GAP: logo Drive? |
| `#tentang` About figure | GAP: gambar About (Drive) |
| `#brands` | GAP: foto brand (Drive)… |
| Kartu brand placeholder | GAP: foto brand (Drive) |
| `#produk` | GAP: gambar Product Gallery (Drive) |
| `#galeri` | GAP: gambar F&B & Hospitality (Drive) |
| `#artikel` | GAP: gambar artikel (Drive) — teks sudah lengkap |

Banner bisa ditutup (sessionStorage `dkg-dev-gap-dismissed`).

---

## Catatan

1. **Gambar Drive belum bisa diganti** tanpa file (atau ekspor JPG/PNG) dari klien.
2. Review fokus pada **localhost** (`http://localhost:3001/`).
3. Tidak ada commit/deploy untuk update gap fix ini kecuali diminta.
