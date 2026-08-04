(() => {
  const LIMITS = { brands: 10, products: 10, gallery: 10, articles: 15 };

  const SECTIONS = {
    nav: ['nav.about', 'nav.values', 'nav.business', 'nav.brands', 'nav.products', 'nav.gallery', 'nav.articles', 'nav.contact', 'nav.menu'],
    hero: ['hero.lede', 'hero.cta1', 'hero.cta2', 'hero.scroll'],
    about: ['about.eyebrow', 'about.title', 'about.p1', 'about.p2', 'about.stat1', 'about.stat2', 'about.stat3'],
    vision: ['vision.eyebrow', 'vision.title'],
    mission: ['mission.eyebrow', 'mission.1', 'mission.2', 'mission.3', 'mission.4', 'mission.5'],
    values: ['values.eyebrow', 'values.title', 'values.integrity', 'values.excellence', 'values.innovation', 'values.collaboration', 'values.sustainability'],
    business: ['business.eyebrow', 'business.title', 'business.lede', 'business.m.company', 'business.m.desc', 'business.m.more', 'business.f.company', 'business.f.desc', 'business.f.more', 'business.h.company', 'business.h.desc', 'business.h.more', 'business.more', 'business.less'],
    brands: ['brands.eyebrow', 'brands.title'],
    products: ['products.eyebrow', 'products.title'],
    gallery: ['gallery.eyebrow', 'gallery.title'],
    articles: ['articles.eyebrow', 'articles.title'],
    contact: ['contact.eyebrow', 'contact.title', 'contact.lede', 'contact.phoneLabel', 'contact.call', 'contact.whatsapp', 'contact.map', 'contact.mapAria'],
    footer: ['footer.nav', 'footer.contact', 'footer.location', 'footer.tagline', 'footer.rights']
  };

  const SEO_FIELDS = [
    'title', 'description', 'keywords', 'canonical',
    'ogTitle', 'ogDescription', 'ogImage',
    'twitterCard', 'robots', 'siteName'
  ];

  const SETTINGS_FIELDS = [
    'phone', 'whatsapp', 'email', 'addressCompany', 'addressLine1', 'addressLine2', 'addressLine3', 'mapsQuery'
  ];

  const ENTITY_META = {
    brands: {
      label: 'Brand',
      max: LIMITS.brands,
      hint: 'Gambar brand · disarankan 1600×1000. Klik item di website membuka halaman detail.',
      blank: () => ({
        id: uid('brand'),
        slug: '',
        category: { id: '', en: '' },
        name: '',
        image: 'images/placeholder-brand-dd.svg',
        short: { id: '', en: '' },
        body: { id: '', en: '' }
      })
    },
    products: {
      label: 'Produk',
      max: LIMITS.products,
      hint: 'Gambar produk · 1000×1000. caption/brand tetap untuk kompatibilitas carousel.',
      blank: () => ({
        id: uid('prod'),
        slug: '',
        image: '',
        caption: '',
        brand: '',
        title: { id: '', en: '' },
        body: { id: '', en: '' }
      })
    },
    gallery: {
      label: 'Galeri',
      max: LIMITS.gallery,
      hint: 'Gambar galeri · 1600×1000. Klik di website membuka lightbox.',
      blank: () => ({
        id: uid('gal'),
        image: '',
        title: { id: '', en: '' }
      })
    },
    articles: {
      label: 'Artikel',
      max: LIMITS.articles,
      hint: 'Gambar artikel · 1200×750. Title/summary/body bilingual.',
      blank: () => ({
        id: uid('art'),
        slug: '',
        image: '',
        tag: { id: '', en: '' },
        title: { id: '', en: '' },
        summary: { id: '', en: '' },
        body: { id: '', en: '' }
      })
    }
  };

  let content = null;
  let editLang = 'id';
  let seoLang = 'id';
  let currentSection = 'hero';
  let currentView = 'overview';
  let entityEdit = { type: null, index: -1 };

  const loginView = document.getElementById('loginView');
  const dashView = document.getElementById('dashView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const saveStatus = document.getElementById('saveStatus');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSub');

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request gagal');
    return data;
  }

  function setStatus(msg, ok = true) {
    saveStatus.textContent = msg;
    saveStatus.className = ok ? 'muted status-ok' : 'muted status-err';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  function ensureMediaArrays() {
    if (!content.media) content.media = {};
    ['brands', 'products', 'gallery', 'articles'].forEach((k) => {
      if (!Array.isArray(content.media[k])) content.media[k] = [];
    });
  }

  async function ensureAuth() {
    const params = new URLSearchParams(location.search);
    if (params.get('error')) {
      loginError.hidden = false;
      history.replaceState({}, '', '/admin/');
    }
    try {
      const status = await api('/api/auth/status');
      if (status.authenticated) {
        showDash();
        await loadContent();
        return;
      }
    } catch (_) { /* ignore */ }
    showLogin();
  }

  function showLogin() {
    loginView.hidden = false;
    dashView.hidden = true;
    loginView.style.setProperty('display', 'grid', 'important');
    dashView.style.setProperty('display', 'none', 'important');
  }

  function showDash() {
    loginView.hidden = true;
    dashView.hidden = false;
    loginView.style.setProperty('display', 'none', 'important');
    dashView.style.setProperty('display', 'grid', 'important');
  }

  async function loadContent() {
    content = await api('/api/content');
    ensureMediaArrays();
    populateSectionSelect();
    renderOverview();
    renderContentFields();
    renderSeo();
    renderSettings();
    ['brands', 'products', 'gallery', 'articles'].forEach(renderEntityPanel);
  }

  function populateSectionSelect() {
    const select = document.getElementById('sectionSelect');
    select.innerHTML = Object.keys(SECTIONS).map((k) =>
      `<option value="${k}" ${k === currentSection ? 'selected' : ''}>${k}</option>`
    ).join('');
  }

  function renderOverview() {
    document.getElementById('statBrands').textContent = content.media?.brands?.length || 0;
    document.getElementById('statProducts').textContent = content.media?.products?.length || 0;
    document.getElementById('statGallery').textContent = content.media?.gallery?.length || 0;
    document.getElementById('statArticles').textContent = content.media?.articles?.length || 0;
    document.getElementById('statUpdatedLine').textContent = content.updatedAt
      ? 'Terakhir disimpan: ' + new Date(content.updatedAt).toLocaleString('id-ID')
      : 'Terakhir disimpan: —';
  }

  function isLongKey(key) {
    return /lede|desc|more|p1|p2|title$|a\d|\.q|\.a\d|mission\.\d|vision\.title/.test(key);
  }

  function renderContentFields() {
    const box = document.getElementById('fieldsBox');
    const keys = SECTIONS[currentSection] || [];
    box.innerHTML = keys.map((key) => {
      const val = content.i18n?.[editLang]?.[key] || '';
      const long = isLongKey(key) || String(val).length > 90;
      return `<div class="field">
        <label for="f-${key}">${key}</label>
        ${long
          ? `<textarea id="f-${key}" data-key="${key}">${escapeHtml(val)}</textarea>`
          : `<input id="f-${key}" data-key="${key}" value="${escapeAttr(val)}">`}
      </div>`;
    }).join('');
  }

  function collectContentFields() {
    document.querySelectorAll('#fieldsBox [data-key]').forEach((el) => {
      const key = el.getAttribute('data-key');
      if (!content.i18n[editLang]) content.i18n[editLang] = {};
      content.i18n[editLang][key] = el.value;
    });
  }

  function renderSeo() {
    const seo = content.seo?.[seoLang] || {};
    document.getElementById('seoPreview').innerHTML = `
      <p class="g-title">${escapeHtml(seo.title || 'Judul SEO')}</p>
      <p class="g-url">${escapeHtml(seo.canonical || 'https://example.com/')}</p>
      <p class="g-desc">${escapeHtml(seo.description || 'Meta description akan tampil di sini.')}</p>
    `;
    document.getElementById('seoFields').innerHTML = SEO_FIELDS.map((key) => {
      const val = seo[key] || '';
      const long = key.includes('description') || key === 'keywords';
      return `<div class="field">
        <label for="seo-${key}">${key}</label>
        ${long
          ? `<textarea id="seo-${key}" data-seo="${key}">${escapeHtml(val)}</textarea>`
          : `<input id="seo-${key}" data-seo="${key}" value="${escapeAttr(val)}">`}
      </div>`;
    }).join('');
  }

  function collectSeo() {
    if (!content.seo[seoLang]) content.seo[seoLang] = {};
    document.querySelectorAll('#seoFields [data-seo]').forEach((el) => {
      content.seo[seoLang][el.getAttribute('data-seo')] = el.value;
    });
  }

  function renderSettings() {
    const s = content.settings || {};
    document.getElementById('settingsFields').innerHTML = SETTINGS_FIELDS.map((key) => `<div class="field">
      <label for="set-${key}">${key}</label>
      <input id="set-${key}" data-set="${key}" value="${escapeAttr(s[key] || '')}">
    </div>`).join('');
  }

  function collectSettings() {
    document.querySelectorAll('#settingsFields [data-set]').forEach((el) => {
      content.settings[el.getAttribute('data-set')] = el.value;
    });
  }

  function biVal(field, lang) {
    if (!field || typeof field === 'string') return field || '';
    return field[lang] || '';
  }

  function itemLabel(type, item) {
    if (type === 'brands') return item.name || '(tanpa nama)';
    if (type === 'products') return biVal(item.title, 'id') || item.caption || '(produk)';
    if (type === 'gallery') return biVal(item.title, 'id') || '(galeri)';
    return biVal(item.title, 'id') || '(artikel)';
  }

  function renderEntityPanel(type) {
    const root = document.getElementById('entity-' + type);
    if (!root) return;
    ensureMediaArrays();
    const meta = ENTITY_META[type];
    const list = content.media[type];
    const editing = entityEdit.type === type ? entityEdit.index : -1;

    if (editing >= 0 && list[editing]) {
      root.innerHTML = renderEntityEditor(type, list[editing], editing);
      bindEntityEditor(type, editing);
      return;
    }

    const rows = list.map((item, i) => `
      <div class="entity-row">
        <img class="entity-thumb" src="${escapeAttr(item.image || '')}" alt="" onerror="this.style.opacity=.25">
        <div class="entity-meta">
          <strong>${escapeHtml(itemLabel(type, item))}</strong>
          <span class="muted">${escapeHtml(item.slug || item.id || '')}</span>
        </div>
        <div class="entity-actions">
          <button type="button" data-edit="${type}" data-index="${i}">Edit</button>
          <button type="button" class="btn-danger" data-del="${type}" data-index="${i}">Hapus</button>
        </div>
      </div>`).join('') || '<p class="muted">Belum ada item.</p>';

    root.innerHTML = `
      <div class="entity-toolbar">
        <p class="muted" style="margin:0">${escapeHtml(meta.hint)} · ${list.length}/${meta.max}</p>
        <button type="button" class="btn-primary" data-add="${type}" ${list.length >= meta.max ? 'disabled' : ''}>+ Tambah ${escapeHtml(meta.label)}</button>
      </div>
      <div class="entity-list">${rows}</div>
    `;

    root.querySelector(`[data-add="${type}"]`)?.addEventListener('click', () => {
      if (list.length >= meta.max) {
        setStatus('Maksimal ' + meta.max + ' item', false);
        return;
      }
      list.push(meta.blank());
      entityEdit = { type, index: list.length - 1 };
      renderEntityPanel(type);
      renderOverview();
    });

    root.querySelectorAll(`[data-edit="${type}"]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        entityEdit = { type, index: Number(btn.dataset.index) };
        renderEntityPanel(type);
      });
    });

    root.querySelectorAll(`[data-del="${type}"]`).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const i = Number(btn.dataset.index);
        if (!confirm('Hapus item ini?')) return;
        list.splice(i, 1);
        entityEdit = { type: null, index: -1 };
        renderEntityPanel(type);
        renderOverview();
        await saveAll();
      });
    });
  }

  function fieldBi(name, label, value, rows) {
    return `<div class="field">
      <label>${label}</label>
      <textarea data-bi="${name}" rows="${rows || 3}">${escapeHtml(value || '')}</textarea>
    </div>`;
  }

  function renderEntityEditor(type, item, index) {
    const meta = ENTITY_META[type];
    let extra = '';

    if (type === 'brands') {
      extra = `
        <div class="field"><label>Nama brand</label><input data-plain="name" value="${escapeAttr(item.name || '')}"></div>
        <div class="field"><label>Slug (URL)</label><input data-plain="slug" value="${escapeAttr(item.slug || '')}" placeholder="elementi-domus"></div>
        ${fieldBi('category', 'Kategori (ID/EN — ganti tab bahasa)', biVal(item.category, editLang))}
        ${fieldBi('short', 'Ringkasan singkat', biVal(item.short, editLang), 2)}
        ${fieldBi('body', 'Deskripsi lengkap (halaman detail)', biVal(item.body, editLang), 8)}
      `;
    } else if (type === 'products') {
      extra = `
        <div class="field"><label>Slug (URL)</label><input data-plain="slug" value="${escapeAttr(item.slug || '')}"></div>
        <div class="field"><label>Brand (label carousel)</label><input data-plain="brand" value="${escapeAttr(item.brand || '')}"></div>
        <div class="field"><label>Caption (compat)</label><input data-plain="caption" value="${escapeAttr(item.caption || '')}"></div>
        ${fieldBi('title', 'Judul produk', biVal(item.title, editLang))}
        ${fieldBi('body', 'Deskripsi lengkap', biVal(item.body, editLang), 8)}
      `;
    } else if (type === 'gallery') {
      extra = `${fieldBi('title', 'Judul / caption', biVal(item.title, editLang))}`;
    } else if (type === 'articles') {
      extra = `
        <div class="field"><label>Slug (URL)</label><input data-plain="slug" value="${escapeAttr(item.slug || '')}"></div>
        ${fieldBi('tag', 'Tag', biVal(item.tag, editLang), 1)}
        ${fieldBi('title', 'Judul', biVal(item.title, editLang))}
        ${fieldBi('summary', 'Ringkasan', biVal(item.summary, editLang), 3)}
        ${fieldBi('body', 'Isi artikel', biVal(item.body, editLang), 10)}
      `;
    }

    return `
      <div class="entity-toolbar">
        <div>
          <strong>Edit ${escapeHtml(meta.label)} #${index + 1}</strong>
          <p class="muted" style="margin:4px 0 0">Bahasa field bilingual mengikuti tab di bawah.</p>
        </div>
        <div class="lang-tabs entity-lang">
          <button type="button" class="lang-tab ${editLang === 'id' ? 'active' : ''}" data-elang="id">ID</button>
          <button type="button" class="lang-tab ${editLang === 'en' ? 'active' : ''}" data-elang="en">EN</button>
        </div>
      </div>
      <div class="entity-editor">
        <div class="media-card">
          <img class="media-thumb wide" src="${escapeAttr(item.image || '')}" alt="" onerror="this.style.opacity=.3">
          <div class="media-meta">
            <label>Gambar</label>
            <p class="media-hint">${escapeHtml(meta.hint)}</p>
            <div class="media-actions">
              <input type="file" accept="image/*" hidden id="entityFile">
              <button type="button" class="btn-primary" id="entityUploadBtn">Ganti gambar</button>
              <p class="media-status" id="entityUploadStatus"></p>
            </div>
            <input data-plain="image" value="${escapeAttr(item.image || '')}" placeholder="Path / URL gambar">
          </div>
        </div>
        ${extra}
        <div class="entity-actions" style="justify-content:flex-start;margin-top:8px">
          <button type="button" class="btn-primary" id="entitySaveBtn">Simpan item</button>
          <button type="button" id="entityCancelBtn">Batal</button>
        </div>
      </div>
    `;
  }

  function collectEntityEditor(type, index) {
    const item = content.media[type][index];
    if (!item) return;
    document.querySelectorAll('#entity-' + type + ' [data-plain]').forEach((el) => {
      item[el.getAttribute('data-plain')] = el.value;
    });
    document.querySelectorAll('#entity-' + type + ' [data-bi]').forEach((el) => {
      const key = el.getAttribute('data-bi');
      if (!item[key] || typeof item[key] !== 'object') item[key] = { id: '', en: '' };
      item[key][editLang] = el.value;
    });
    if (type === 'products') {
      if (!item.caption && item.title) item.caption = item.title.id || item.title.en || '';
      if (!item.slug) item.slug = slugify(item.caption || item.title?.id || item.id);
    }
    if (type === 'brands' && !item.slug) item.slug = slugify(item.name || item.id);
    if (type === 'articles' && !item.slug) item.slug = slugify(item.title?.id || item.id);
  }

  function bindEntityEditor(type, index) {
    const root = document.getElementById('entity-' + type);

    root.querySelectorAll('[data-elang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        collectEntityEditor(type, index);
        editLang = btn.dataset.elang;
        renderEntityPanel(type);
      });
    });

    document.getElementById('entityCancelBtn')?.addEventListener('click', () => {
      entityEdit = { type: null, index: -1 };
      renderEntityPanel(type);
    });

    document.getElementById('entitySaveBtn')?.addEventListener('click', async () => {
      collectEntityEditor(type, index);
      entityEdit = { type: null, index: -1 };
      renderEntityPanel(type);
      renderOverview();
      await saveAll();
    });

    const fileInput = document.getElementById('entityFile');
    document.getElementById('entityUploadBtn')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      const status = document.getElementById('entityUploadStatus');
      if (!file) return;
      status.textContent = 'Mengunggah...';
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload gagal');
        content.media[type][index].image = data.path;
        const imgInput = root.querySelector('[data-plain="image"]');
        if (imgInput) imgInput.value = data.path;
        const thumb = root.querySelector('.media-thumb');
        if (thumb) thumb.src = data.path + '?t=' + Date.now();
        status.className = 'media-status ok';
        status.textContent = 'Gambar diganti. Klik Simpan item.';
      } catch (err) {
        status.className = 'media-status err';
        status.textContent = err.message;
      } finally {
        fileInput.value = '';
      }
    });
  }

  function collectAll() {
    collectContentFields();
    collectSeo();
    collectSettings();
    if (entityEdit.type != null && entityEdit.index >= 0) {
      collectEntityEditor(entityEdit.type, entityEdit.index);
    }
  }

  async function saveAll() {
    try {
      collectAll();
      ensureMediaArrays();
      const result = await api('/api/content', {
        method: 'PUT',
        body: JSON.stringify(content)
      });
      content.updatedAt = result.updatedAt;
      renderOverview();
      renderSeo();
      setStatus('Tersimpan ' + new Date().toLocaleTimeString('id-ID'), true);
    } catch (err) {
      setStatus(err.message, false);
    }
  }

  function switchView(view) {
    if (entityEdit.type && ['brands', 'products', 'gallery', 'articles'].includes(currentView)) {
      collectEntityEditor(entityEdit.type, entityEdit.index);
    }
    collectAll();
    currentView = view;
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.panel').forEach((p) => { p.hidden = true; });
    document.getElementById('view-' + view).hidden = false;

    const titles = {
      overview: ['Overview', 'Ringkasan konten website'],
      content: ['Konten', 'Edit teks bilingual per section (header section)'],
      brands: ['Brand Kami / Our Brand', 'CRUD brand — maks 10, klik → halaman detail'],
      products: ['Our Product Gallery', 'CRUD produk — maks 10, klik → halaman detail'],
      gallery: ['Galeri', 'CRUD galeri — maks 10, klik → lightbox'],
      articles: ['Artikel', 'CRUD artikel — maks 15, klik → halaman detail'],
      seo: ['SEO', 'Title, description, Open Graph, robots'],
      settings: ['Kontak & Settings', 'Telepon, email, alamat, maps']
    };
    pageTitle.textContent = titles[view][0];
    pageSub.textContent = titles[view][1];

    if (ENTITY_META[view]) renderEntityPanel(view);
  }

  loginForm.addEventListener('submit', () => {
    loginError.hidden = true;
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
    showLogin();
  });

  document.getElementById('saveBtn').addEventListener('click', saveAll);

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('sectionSelect').addEventListener('change', (e) => {
    collectContentFields();
    currentSection = e.target.value;
    renderContentFields();
  });

  document.querySelectorAll('#view-content .lang-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      collectContentFields();
      editLang = btn.dataset.lang;
      document.querySelectorAll('#view-content .lang-tab').forEach((b) => {
        b.classList.toggle('active', b.dataset.lang === editLang);
      });
      renderContentFields();
    });
  });

  document.querySelectorAll('.seo-lang').forEach((btn) => {
    btn.addEventListener('click', () => {
      collectSeo();
      seoLang = btn.dataset.lang;
      document.querySelectorAll('.seo-lang').forEach((b) => {
        b.classList.toggle('active', b.dataset.lang === seoLang);
      });
      renderSeo();
    });
  });

  ensureAuth().catch(() => showLogin());
})();
