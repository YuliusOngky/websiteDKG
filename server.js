require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const {
  ROOT,
  UPLOAD_DIR,
  useBlob,
  readContent,
  writeContent,
  saveUpload
} = require('./lib/storage');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(ROOT, 'public');
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'admin123').trim();
const SESSION_SECRET = process.env.SESSION_SECRET || 'dkg-dev-secret';
const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function isValidPassword(password) {
  return String(password || '').trim() === ADMIN_PASSWORD;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'));
  }
});

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'dkg.sid',
  keys: [SESSION_SECRET],
  maxAge: 1000 * 60 * 60 * 8,
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd
}));

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com"
].join('; ');

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', CSP);
  next();
});

app.use((req, res, next) => {
  const blocked = [
    '/.env', '/server.js', '/package.json', '/package-lock.json',
    '/.gitignore', '/.git'
  ];
  if (blocked.some(p => req.path === p || req.path.startsWith('/.git/'))) {
    return res.status(404).end();
  }
  next();
});

app.get('/api/content', async (_req, res) => {
  try {
    res.json(await readContent());
  } catch (err) {
    res.status(500).json({ error: 'Gagal membaca konten', detail: err.message });
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.post('/api/auth/login', (req, res) => {
  const password = (req.body && req.body.password) != null ? req.body.password : '';
  if (!isValidPassword(password)) {
    return res.status(401).json({ error: 'Password salah' });
  }
  req.session.authenticated = true;
  return res.json({ ok: true });
});

app.post('/api/auth/login-form', (req, res) => {
  const password = (req.body && req.body.password) != null ? req.body.password : '';
  if (!isValidPassword(password)) {
    return res.redirect('/admin/?error=1');
  }
  req.session.authenticated = true;
  return res.redirect('/admin/');
});

app.post('/api/auth/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.put('/api/content', requireAuth, async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ error: 'Payload tidak valid' });
    }
    const current = await readContent();
    const next = {
      ...current,
      ...incoming,
      i18n: incoming.i18n || current.i18n,
      seo: incoming.seo || current.seo,
      settings: incoming.settings || current.settings,
      media: incoming.media || current.media
    };
    await writeContent(next);
    res.json({ ok: true, updatedAt: next.updatedAt });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan', detail: err.message });
  }
});

app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });
    const saved = await saveUpload(req.file);
    res.json({ ok: true, path: saved.path });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Upload gagal' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const content = await readContent();
    res.json({
      ok: true,
      storage: useBlob() ? 'vercel-blob' : 'filesystem',
      env: isProd ? 'production' : 'development',
      updatedAt: content.updatedAt || null,
      counts: {
        brands: content.media?.brands?.length || 0,
        products: content.media?.products?.length || 0,
        gallery: content.media?.gallery?.length || 0,
        articles: content.media?.articles?.length || 0
      }
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      storage: useBlob() ? 'vercel-blob' : 'filesystem',
      env: isProd ? 'production' : 'development',
      error: err.message || 'Health check gagal'
    });
  }
});

/* Homepage: local serves the file; on Vercel public/ is CDN-only (not in lambda FS). */
app.get('/', (_req, res) => {
  if (process.env.VERCEL) {
    // Prefer CDN static asset — sendFile('/var/task/public/...') fails with ENOENT.
    return res.redirect(308, '/index.html');
  }
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

/* Local only: Vercel serves public/ via CDN and ignores express.static */
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(UPLOAD_DIR));
  app.use('/admin', express.static(path.join(PUBLIC_DIR, 'admin'), { index: 'index.html' }));
  app.use(express.static(PUBLIC_DIR, {
    index: false,
    extensions: ['html']
  }));
}

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Request error' });
});

module.exports = app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`DKG site  -> http://localhost:${PORT}`);
    console.log(`DKG admin -> http://localhost:${PORT}/admin/`);
    console.log(`Storage   -> ${useBlob() ? 'Vercel Blob' : 'local filesystem'}`);
  });
}
