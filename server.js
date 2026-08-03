require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'admin123').trim();
const SESSION_SECRET = process.env.SESSION_SECRET || 'dkg-dev-secret';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
}

function writeContent(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function isValidPassword(password) {
  return String(password || '').trim() === ADMIN_PASSWORD;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'));
  }
});

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  name: 'dkg.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 8
  }
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

/* API dulu — sebelum static */
app.get('/api/content', (_req, res) => {
  try {
    res.json(readContent());
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
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Gagal membuat session' });
    return res.json({ ok: true });
  });
});

/* Form login cadangan (tanpa JS fetch) */
app.post('/api/auth/login-form', (req, res) => {
  const password = (req.body && req.body.password) != null ? req.body.password : '';
  if (!isValidPassword(password)) {
    return res.redirect('/admin/?error=1');
  }
  req.session.authenticated = true;
  req.session.save((err) => {
    if (err) return res.redirect('/admin/?error=2');
    return res.redirect('/admin/');
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('dkg.sid');
    res.json({ ok: true });
  });
});

app.put('/api/content', requireAuth, (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ error: 'Payload tidak valid' });
    }
    const current = readContent();
    const next = {
      ...current,
      ...incoming,
      i18n: incoming.i18n || current.i18n,
      seo: incoming.seo || current.seo,
      settings: incoming.settings || current.settings,
      media: incoming.media || current.media
    };
    writeContent(next);
    res.json({ ok: true, updatedAt: next.updatedAt });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan', detail: err.message });
  }
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });
  res.json({ ok: true, path: `/uploads/${req.file.filename}` });
});

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/admin', express.static(path.join(ROOT, 'admin'), { index: 'index.html' }));
app.use(express.static(ROOT, {
  index: false,
  extensions: ['html']
}));

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Request error' });
});

app.listen(PORT, () => {
  console.log(`DKG site  -> http://localhost:${PORT}`);
  console.log(`DKG admin -> http://localhost:${PORT}/admin/`);
  console.log(`Password  -> (from .env ADMIN_PASSWORD)`);
});
