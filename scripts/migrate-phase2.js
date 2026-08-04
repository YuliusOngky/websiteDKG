const fs = require('fs');
const path = require('path');

const CONTENT_PATH = path.join(__dirname, '..', 'data', 'content.json');
const c = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
const id = c.i18n.id;
const en = c.i18n.en;

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

c.media.brands = [
  {
    id: 'brand-elementi-domus',
    slug: 'elementi-domus',
    category: { id: id['brands.ed.cat'], en: en['brands.ed.cat'] },
    name: 'Elementi Domus',
    image: 'images/product1.png',
    short: {
      id: 'Furnitur kelas atas dengan desain berkelas dan kualitas produk kelas satu.',
      en: 'High-end furniture with tasteful design and first-class product quality.'
    },
    body: { id: id['brands.ed'], en: en['brands.ed'] }
  },
  {
    id: 'brand-legnotura',
    slug: 'legnotura',
    category: { id: id['brands.lg.cat'], en: en['brands.lg.cat'] },
    name: 'Legnotura',
    image: 'images/product5.png',
    short: {
      id: 'Pabrik kayu terkemuka untuk panel kayu berorientasi ekspor.',
      en: 'Premier wood factory specializing in export-oriented wood panels.'
    },
    body: { id: id['brands.lg'], en: en['brands.lg'] }
  },
  {
    id: 'brand-lenore',
    slug: 'lenore-exquisite-dining',
    category: { id: id['brands.ln.cat'], en: en['brands.ln.cat'] },
    name: 'Lenore Exquisite Dining',
    image: 'images/gallery-02.jpg',
    short: {
      id: 'Filosofi bersantap mewah yang menerangi indera.',
      en: 'A fine-dining philosophy that illuminates the senses.'
    },
    body: { id: id['brands.ln'], en: en['brands.ln'] }
  },
  {
    id: 'brand-terrata',
    slug: 'terrata-social-dining',
    category: { id: id['brands.tr.cat'], en: en['brands.tr.cat'] },
    name: 'Terrata Social Dining',
    image: 'images/gallery-03.jpg',
    short: {
      id: 'Ruang sosial di luar sekadar bersantap — koneksi dan kebersamaan.',
      en: 'A social space beyond dining — connection and togetherness.'
    },
    body: { id: id['brands.tr'], en: en['brands.tr'] }
  },
  {
    id: 'brand-de-dianas-home',
    slug: 'de-dianas-home',
    category: { id: id['brands.dd.cat'], en: en['brands.dd.cat'] },
    name: "De Diana's Home",
    image: 'images/placeholder-brand-dd.svg',
    short: {
      id: 'Hospitality premium dengan kenyamanan dan layanan personal.',
      en: 'Premium hospitality with comfort and personalized service.'
    },
    body: { id: id['brands.dd'], en: en['brands.dd'] }
  }
];

const productBodies = [
  {
    id: 'Temukan seri dapur UMA dari Elementi Domus — desain abadi dengan craftsmanship premium untuk ruang hunian modern.',
    en: 'Discover the UMA kitchen series by Elementi Domus — timeless design with premium craftsmanship for modern living spaces.'
  },
  {
    id: 'Koleksi dapur Elementi Domus menghadirkan solusi interior berkelas dengan material dan finishing berkualitas tinggi.',
    en: 'The Elementi Domus kitchen collection delivers refined interior solutions with high-quality materials and finishes.'
  },
  {
    id: 'Seri interior Elementi Domus menggabungkan estetika dan fungsi untuk menciptakan ruang yang elegan dan nyaman.',
    en: 'The Elementi Domus interior series combines aesthetics and function to create elegant, comfortable spaces.'
  },
  {
    id: 'AVANI Kitchen Series menawarkan sistem dapur premium dengan detail desain yang teliti dan kualitas manufaktur unggul.',
    en: 'The AVANI Kitchen Series offers a premium kitchen system with meticulous design detail and superior manufacturing quality.'
  },
  {
    id: 'Panel kayu Legnotura diproduksi dengan komitmen inovasi dan keberlanjutan untuk aplikasi interior premium.',
    en: 'Legnotura wood panels are produced with a commitment to innovation and sustainability for premium interior applications.'
  }
];

c.media.products = (c.media.products || []).map((p, i) => ({
  id: p.id || 'prod-' + (i + 1),
  slug: p.slug || slugify(p.caption || 'product-' + (i + 1)),
  image: p.image,
  caption: p.caption || '',
  brand: p.brand || '',
  title: p.title || { id: p.caption || '', en: p.caption || '' },
  body: p.body || productBodies[i] || { id: p.caption || '', en: p.caption || '' }
}));

const galleryTitles = [1, 2, 3, 4, 5].map((n) => ({
  id: id['gallery.' + n],
  en: en['gallery.' + n]
}));

c.media.gallery = (c.media.gallery || []).map((g, i) => ({
  id: g.id || 'gal-' + (i + 1),
  image: g.image,
  title: g.title || galleryTitles[i] || { id: '', en: '' }
}));

c.media.articles = [
  {
    id: 'art-1',
    slug: 'elementi-domus-grand-opening',
    image: 'images/article-01.jpg',
    tag: { id: 'Hospitality', en: 'Hospitality' },
    title: { id: id['articles.a1.t'], en: en['articles.a1.t'] },
    summary: { id: id['articles.a1.d'], en: en['articles.a1.d'] },
    body: {
      id: id['articles.a1.d'] + '\n\nAcara ini menandai langkah penting dalam perjalanan brand menuju keunggulan desain dan inovasi di pasar interior premium Indonesia.',
      en: en['articles.a1.d'] + "\n\nThe event marked an important milestone in the brand's journey toward design excellence and innovation in Indonesia's premium interior market."
    }
  },
  {
    id: 'art-2',
    slug: 'lenore-plaza-indonesia',
    image: 'images/article-02.jpg',
    tag: { id: id['articles.a2.tag'], en: en['articles.a2.tag'] },
    title: { id: id['articles.a2.t'], en: en['articles.a2.t'] },
    summary: { id: id['articles.a2.d'], en: en['articles.a2.d'] },
    body: {
      id: id['articles.a2.d'] + '\n\nLokasi baru ini memperkuat kehadiran Lenore di destinasi lifestyle paling prestisius di Jakarta.',
      en: en['articles.a2.d'] + "\n\nThe new location strengthens Lenore's presence at one of Jakarta's most prestigious lifestyle destinations."
    }
  },
  {
    id: 'art-3',
    slug: 'terrata-sound-session',
    image: 'images/article-03.jpg',
    tag: { id: id['articles.a3.tag'], en: en['articles.a3.tag'] },
    title: { id: id['articles.a3.t'], en: en['articles.a3.t'] },
    summary: { id: id['articles.a3.d'], en: en['articles.a3.d'] },
    body: {
      id: id['articles.a3.d'] + '\n\nSound Session menghadirkan musik live mingguan yang menyatukan makanan istimewa dan koneksi yang bermakna.',
      en: en['articles.a3.d'] + '\n\nSound Session delivers a weekly live music experience that brings together exceptional food and meaningful connections.'
    }
  }
];

id['ui.back'] = 'Kembali';
id['ui.prev'] = 'Sebelumnya';
id['ui.next'] = 'Berikutnya';
id['ui.close'] = 'Tutup';
id['ui.readMore'] = 'Selengkapnya';
id['ui.notFound'] = 'Konten tidak ditemukan.';
id['detail.brand'] = 'Brand';
id['detail.product'] = 'Produk';
id['detail.article'] = 'Artikel';

en['ui.back'] = 'Back';
en['ui.prev'] = 'Previous';
en['ui.next'] = 'Next';
en['ui.close'] = 'Close';
en['ui.readMore'] = 'Read more';
en['ui.notFound'] = 'Content not found.';
en['detail.brand'] = 'Brand';
en['detail.product'] = 'Product';
en['detail.article'] = 'Article';

c.updatedAt = new Date().toISOString();
fs.writeFileSync(CONTENT_PATH, JSON.stringify(c, null, 2));
console.log('Migrated brands=%d products=%d gallery=%d articles=%d',
  c.media.brands.length, c.media.products.length, c.media.gallery.length, c.media.articles.length);
