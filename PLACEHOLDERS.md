# Placeholder assets — review & replace

These files are temporary until final Drive assets are exported/uploaded.

**Development:** remaining image/logo gaps are visually marked on the site with `.dev-gap` / `.dev-gap-badge` and a top `DEV` banner (see `FEEDBACK-GAPS.md`). Remove those markers before production.

| Placeholder | Used for | Replace with | Site marker |
|-------------|----------|--------------|-------------|
| `public/images/placeholder-about.svg` | About section image | PNG/JPG export from Drive About folder | `#tentang` badge |
| `public/images/placeholder-brand-dd.svg` | De Diana's Home brand card + default new brand image in CMS | Brand/hospitality photo | Brand card + `#brands` badge |
| `public/images/placeholder-logo.svg` | Not wired yet (current site still uses `logo-dkg*.png`) | New logo from Drive if different | Nav logo badge |
| `images/product1.png` (temporary stand-in) | Elementi Domus brand carousel image | Dedicated Elementi Domus brand photo | `#brands` / `#produk` |
| `images/product5.png` (temporary stand-in) | Legnotura brand carousel image | Dedicated Legnotura brand photo | `#brands` / `#produk` |
| `images/gallery-02.jpg` / `gallery-03.jpg` (temporary stand-in) | Lenore / Terrata brand carousel images | Dedicated F&B brand photos | `#brands` / `#galeri` |

## Still missing (no dedicated Drive assets yet) — OPEN
- [ ] About image from Drive
- [ ] Product Gallery Drive folder images (current product1–5 remain)
- [ ] F&B / Hospitality gallery Drive folder images (current gallery set remains)
- [ ] Article images from Drive folders (current article-01/02/03 remain; **article body text is done**)
- [ ] Dedicated brand photography for all five brands (De Diana’s Home still SVG placeholder)
- [ ] Logo confirmation vs Drive export

## Fixed in code (not image-related)
- FAQ removed
- Our Product Gallery title
- Full article 1–3 bodies from PDF
- Business Lines eyebrow + cafés spelling
- About stats numbers 3 / 5 / 5

## Phase 2 CMS note
Replace images via Admin → Brand / Produk / Galeri / Artikel → Edit → Ganti gambar → Simpan item. Then remove matching `.dev-gap-badge` from `public/index.html` (and brand badge logic in `media-ui.js` once no placeholders remain).

## Do not commit
- `Diana Karya Group Image 1.ai` (~563 MB) — ignored via `.gitignore`
