# Placeholder assets — review & replace

These files are temporary until final Drive assets are exported/uploaded.

**Note:** DEV gap banners/badges were removed from the public UI. Placeholder image files may still remain until Drive assets are uploaded.

| Placeholder | Used for | Replace with | Notes |
|-------------|----------|--------------|-------------|
| `public/images/placeholder-about.svg` | About section image | PNG/JPG export from Drive About folder | Content placeholder only (no DEV badge) |
| `public/images/placeholder-brand-dd.svg` | Default new brand image in CMS only (De Diana’s Home now uses `brand-de-dianas-home.png`) | — | No card badge |
| `public/images/placeholder-logo.svg` | Not wired (site uses `logo-dkg*.png`; logo gap closed) | — | — |
| `images/product1.png` (temporary stand-in) | Elementi Domus brand carousel image | Dedicated Elementi Domus brand photo | `#brands` / `#produk` |
| `images/product5.png` (temporary stand-in) | Legnotura brand carousel image | Dedicated Legnotura brand photo | `#brands` / `#produk` |
| `images/gallery-02.jpg` / `gallery-03.jpg` (temporary stand-in) | Lenore / Terrata brand carousel images | Dedicated F&B brand photos | `#brands` / `#galeri` |

## Still missing (no dedicated Drive assets yet) — OPEN
- [ ] About image from Drive
- [ ] F&B / Hospitality gallery Drive folder images (current gallery set remains)
- [x] Article images Drive marker removed (badge closed; current article-01/02/03 may remain; **article body text is done**)
- [x] Product Gallery Drive marker removed (badge closed; current product1–5 may still be older assets)
- [x] De Diana’s Home brand photo → `public/images/brand-de-dianas-home.png` (other brands still use temporary stand-ins)
- [x] Logo confirmation vs Drive export

## Fixed in code (not image-related)
- FAQ removed
- Our Product Gallery title
- Full article 1–3 bodies from PDF
- Business Lines eyebrow + cafés spelling
- About stats numbers 3 / 5 / 5

## Phase 2 CMS note
Replace images via Admin → Brand / Produk / Galeri / Artikel → Edit → Ganti gambar → Simpan item.

## Do not commit
- `Diana Karya Group Image 1.ai` (~563 MB) — ignored via `.gitignore`
