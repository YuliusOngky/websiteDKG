const fs = require('fs');
const path = require('path');
const { put, head } = require('@vercel/blob');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const CONTENT_BLOB_PATH = 'cms/content.json';

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function readSeedContent() {
  return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
}

async function readContent() {
  if (!useBlob()) {
    return readSeedContent();
  }

  try {
    const meta = await head(CONTENT_BLOB_PATH);
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Blob fetch ${res.status}`);
    return await res.json();
  } catch {
    const seed = readSeedContent();
    await writeContent(seed);
    return seed;
  }
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
