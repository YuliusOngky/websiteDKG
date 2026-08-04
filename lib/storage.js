const fs = require('fs');
const path = require('path');
const { put, head } = require('@vercel/blob');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const CONTENT_BLOB_PATH = 'cms/content.json';

function useBlob() {
  // Vercel Blob Store modern: BLOB_STORE_ID + OIDC
  // Legacy / manual: BLOB_READ_WRITE_TOKEN
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

function readSeedContent() {
  return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
}

async function readContent() {
  let data;
  if (!useBlob()) {
    data = readSeedContent();
  } else {
    const seed = readSeedContent();
    try {
      const meta = await head(CONTENT_BLOB_PATH);
      const res = await fetch(meta.url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Blob fetch ${res.status}`);
      data = await res.json();

      // If deployed seed is newer than Blob, promote it so git deploys stay in sync.
      const seedTime = Date.parse(seed.updatedAt || 0) || 0;
      const blobTime = Date.parse(data.updatedAt || 0) || 0;
      if (seedTime > blobTime) {
        data = await writeContent(seed);
        return normalizeMedia(data);
      }
    } catch {
      data = await writeContent(seed);
      return normalizeMedia(data);
    }
  }
  return normalizeMedia(data);
}

/** Ensure Phase 2 entity arrays exist (compat with older Blob payloads). */
function normalizeMedia(data) {
  if (!data || typeof data !== 'object') return data;
  if (!data.media || typeof data.media !== 'object') data.media = {};
  const m = data.media;
  if (!Array.isArray(m.brands)) m.brands = [];
  if (!Array.isArray(m.products)) m.products = [];
  if (!Array.isArray(m.gallery)) m.gallery = [];
  if (!Array.isArray(m.articles)) m.articles = [];

  // If Blob still has Phase-1 payload (no brands), fill from local seed once.
  try {
    const seed = readSeedContent();
    if (!m.brands.length && Array.isArray(seed.media?.brands) && seed.media.brands.length) {
      m.brands = seed.media.brands;
    }
    if (m.products.length && seed.media?.products?.length) {
      const seedByCaption = new Map(seed.media.products.map((p) => [p.caption || p.slug, p]));
      m.products = m.products.map((p, i) => {
        const seeded = seed.media.products[i] || seedByCaption.get(p.caption);
        if (!p.slug && seeded?.slug) return { ...seeded, ...p, slug: seeded.slug, title: p.title || seeded.title, body: p.body || seeded.body, id: p.id || seeded.id };
        if (!p.title || !p.body) {
          return {
            ...p,
            id: p.id || seeded?.id || 'prod-' + (i + 1),
            slug: p.slug || seeded?.slug || String(p.caption || 'product-' + (i + 1)).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: p.title || seeded?.title || { id: p.caption || '', en: p.caption || '' },
            body: p.body || seeded?.body || { id: p.caption || '', en: p.caption || '' }
          };
        }
        return p;
      });
    }
    if (m.gallery.length && seed.media?.gallery?.length) {
      m.gallery = m.gallery.map((g, i) => {
        const seeded = seed.media.gallery[i];
        if (g.title && typeof g.title === 'object') return { id: g.id || seeded?.id || 'gal-' + (i + 1), ...g };
        return {
          id: g.id || seeded?.id || 'gal-' + (i + 1),
          image: g.image,
          title: seeded?.title || { id: '', en: '' }
        };
      });
    }
    if (m.articles.length && seed.media?.articles?.length) {
      m.articles = m.articles.map((a, i) => {
        const seeded = seed.media.articles[i];
        if (a.slug && a.title && typeof a.title === 'object' && a.body) {
          return { id: a.id || seeded?.id || 'art-' + (i + 1), ...a };
        }
        return seeded ? { ...seeded, image: a.image || seeded.image } : a;
      });
    }
  } catch (_) {
    // seed optional outside repo context
  }

  m.products = m.products.map((p, i) => {
    if (!p || typeof p !== 'object') return p;
    const next = { ...p };
    if (!next.id) next.id = 'prod-' + (i + 1);
    if (!next.slug) {
      next.slug = String(next.caption || next.id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (!next.title) next.title = { id: next.caption || '', en: next.caption || '' };
    if (!next.body) next.body = { id: next.caption || '', en: next.caption || '' };
    return next;
  });

  m.gallery = m.gallery.map((g, i) => {
    if (!g || typeof g !== 'object') return g;
    const next = { ...g };
    if (!next.id) next.id = 'gal-' + (i + 1);
    if (!next.title || typeof next.title === 'string') {
      const t = typeof next.title === 'string' ? next.title : '';
      next.title = { id: t, en: t };
    }
    return next;
  });

  m.articles = m.articles.map((a, i) => {
    if (!a || typeof a !== 'object') return a;
    const next = { ...a };
    if (!next.id) next.id = 'art-' + (i + 1);
    if (!next.slug) next.slug = 'article-' + (i + 1);
    if (!next.title || typeof next.title === 'string') next.title = { id: next.title || '', en: next.title || '' };
    if (!next.summary || typeof next.summary === 'string') next.summary = { id: next.summary || '', en: next.summary || '' };
    if (!next.body || typeof next.body === 'string') next.body = { id: next.body || '', en: next.body || '' };
    if (!next.tag || typeof next.tag === 'string') next.tag = { id: next.tag || next.tagFixed || '', en: next.tag || next.tagFixed || '' };
    return next;
  });

  return data;
}

async function writeContent(data) {
  data.updatedAt = new Date().toISOString();
  const body = JSON.stringify(data, null, 2);

  if (useBlob()) {
    await put(CONTENT_BLOB_PATH, body, {
      access: 'public',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 60
    });
    return data;
  }

  fs.writeFileSync(CONTENT_PATH, body, 'utf8');
  return data;
}

async function saveUpload(file) {
  const safe = String(file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${safe}`;

  if (useBlob()) {
    const blob = await put(`uploads/${filename}`, file.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.mimetype || 'application/octet-stream'
    });
    return { path: blob.url };
  }

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return { path: `/uploads/${filename}` };
}

module.exports = {
  ROOT,
  UPLOAD_DIR,
  useBlob,
  readContent,
  writeContent,
  saveUpload
};
