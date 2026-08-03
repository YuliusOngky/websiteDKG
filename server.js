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

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    storage: useBlob() ? 'vercel-blob' : 'filesystem',
    env: isProd ? 'production' : 'development'
  });
});

/* Local only: Vercel serves public/ via CDN and ignores express.static */
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(UPLOAD_DIR));
  app.use('/admin', express.static(path.join(PUBLIC_DIR, 'admin'), { index: 'index.html' }));
  app.use(express.static(PUBLIC_DIR, {
    index: false,
    extensions: ['html']
  }));
  app.get('/', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
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
