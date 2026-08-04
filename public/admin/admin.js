(() => {
  const SECTIONS = {
    nav: ['nav.about', 'nav.values', 'nav.business', 'nav.brands', 'nav.products', 'nav.gallery', 'nav.articles', 'nav.faq', 'nav.contact', 'nav.menu'],
    hero: ['hero.lede', 'hero.cta1', 'hero.cta2', 'hero.scroll'],
    about: ['about.eyebrow', 'about.title', 'about.p1', 'about.p2', 'about.stat1', 'about.stat2', 'about.stat3'],
    vision: ['vision.eyebrow', 'vision.title'],
    mission: ['mission.eyebrow', 'mission.1', 'mission.2', 'mission.3', 'mission.4', 'mission.5'],
    values: ['values.eyebrow', 'values.title', 'values.integrity', 'values.excellence', 'values.innovation', 'values.collaboration', 'values.sustainability'],
    business: ['business.eyebrow', 'business.title', 'business.lede', 'business.m.company', 'business.m.desc', 'business.m.more', 'business.f.company', 'business.f.desc', 'business.f.more', 'business.h.company', 'business.h.desc', 'business.h.more', 'business.more', 'business.less'],
    brands: ['brands.eyebrow', 'brands.title', 'brands.ed.cat', 'brands.ed', 'brands.lg.cat', 'brands.lg', 'brands.ln.cat', 'brands.ln', 'brands.tr.cat', 'brands.tr', 'brands.dd.cat', 'brands.dd'],
    products: ['products.eyebrow', 'products.title'],
    gallery: ['gallery.eyebrow', 'gallery.title', 'gallery.1', 'gallery.2', 'gallery.3', 'gallery.4', 'gallery.5'],
    articles: ['articles.eyebrow', 'articles.title', 'articles.a1.t', 'articles.a1.d', 'articles.a2.tag', 'articles.a2.t', 'articles.a2.d', 'articles.a3.tag', 'articles.a3.t', 'articles.a3.d'],
    faq: ['faq.eyebrow', 'faq.title', 'faq.q1', 'faq.a1', 'faq.q2', 'faq.a2', 'faq.q3', 'faq.a3', 'faq.q4', 'faq.a4'],
    contact: ['contact.eyebrow', 'contact.title', 'contact.lede', 'contact.phoneLabel', 'contact.map', 'contact.mapAria'],
    footer: ['footer.nav', 'footer.contact', 'footer.location', 'footer.tagline', 'footer.rights', 'footer.dev']
  };

  const SEO_FIELDS = [
    'title', 'description', 'keywords', 'canonical',
    'ogTitle', 'ogDescription', 'ogImage',
    'twitterCard', 'robots', 'siteName'
  ];

  const SETTINGS_FIELDS = [
    'phone', 'whatsapp', 'email', 'addressCompany', 'addressLine1', 'addressLine2', 'addressLine3', 'mapsQuery'
  ];

  let content = null;
  let editLang = 'id';
  let seoLang = 'id';
  let currentSection = 'hero';
  let currentView = 'overview';

  const loginView = document.getElementById('loginView');
  const dashView = document.getElementById('dashView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const saveStatus = document.getElementById('saveStatus');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSub');

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

  async function ensureAuth() {
    // Tampilkan error dari redirect form login
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
    } catch (_) {
      // ignore
    }
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
    populateSectionSelect();
    renderOverview();
    renderContentFields();
    renderSeo();
    renderSettings();
    renderMedia();
  }

  function populateSectionSelect() {
    const select = document.getElementById('sectionSelect');
    select.innerHTML = Object.keys(SECTIONS).map(k =>
      `<option value="${k}" ${k === currentSection ? 'selected' : ''}>${k}</option>`
    ).join('');
  }

  function renderOverview() {
    document.getElementById('statArticles').textContent = content.media?.articles?.length || 0;
    document.getElementById('statFaq').textContent = 4;
    document.getElementById('statProducts').textContent = content.media?.products?.length || 0;
    document.getElementById('statUpdated').textContent = content.updatedAt
      ? new Date(content.updatedAt).toLocaleString('id-ID')
      : '—';
  }

  function isLongKey(key) {
    return /lede|desc|more|p1|p2|title$|a\d|\.q|\.a\d|mission\.\d|vision\.title/.test(key);
  }

  function renderContentFields() {
    const box = document.getElementById('fieldsBox');
    const keys = SECTIONS[currentSection] || [];
    box.innerHTML = keys.map(key => {
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
    document.querySelectorAll('#fieldsBox [data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      if (!content.i18n[editLang]) content.i18n[editLang] = {};
      content.i18n[editLang][key] = el.value;
    });
  }

  function renderSeo() {
    const seo = content.seo?.[seoLang] || {};
    const preview = document.getElementById('seoPreview');
    preview.innerHTML = `
      <p class="g-title">${escapeHtml(seo.title || 'Judul SEO')}</p>
      <p class="g-url">${escapeHtml(seo.canonical || 'https://example.com/')}</p>
      <p class="g-desc">${escapeHtml(seo.description || 'Meta description akan tampil di sini.')}</p>
    `;
    const box = document.getElementById('seoFields');
    box.innerHTML = SEO_FIELDS.map(key => {
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
    document.querySelectorAll('#seoFields [data-seo]').forEach(el => {
      content.seo[seoLang][el.getAttribute('data-seo')] = el.value;
    });
  }

  function renderSettings() {
    const s = content.settings || {};
    const box = document.getElementById('settingsFields');
    box.innerHTML = SETTINGS_FIELDS.map(key => `<div class="field">
      <label for="set-${key}">${key}</label>
      <input id="set-${key}" data-set="${key}" value="${escapeAttr(s[key] || '')}">
    </div>`).join('');
  }

  function collectSettings() {
    document.querySelectorAll('#settingsFields [data-set]').forEach(el => {
      content.settings[el.getAttribute('data-set')] = el.value;
    });
  }

  function mediaCard({ type, index, title, hint, image, extraFieldsHtml, wide }) {
    const src = image || '';
    return `<div class="media-card" data-media-card="${type}-${index}">
      <img class="media-thumb ${wide ? 'wide' : ''}" src="${escapeAttr(src)}" alt="${escapeAttr(title)}" onerror="this.style.opacity=.3">
      <div class="media-meta">
        <div>
          <label>${escapeHtml(title)}</label>
          <p class="media-hint">${escapeHtml(hint)}</p>
        </div>
        <div class="media-actions">
          <input type="file" accept="image/*" hidden data-replace-input="${type}" data-index="${index}">
          <button type="button" class="btn-primary" data-replace-btn="${type}" data-index="${index}">Ganti gambar</button>
          <p class="media-status" data-replace-status="${type}-${index}"></p>
        </div>
        <input data-media="${type}" data-index="${index}" data-field="image" value="${escapeAttr(src)}" placeholder="Path gambar">
        ${extraFieldsHtml || ''}
      </div>
    </div>`;
  }

  function renderMedia() {
    const box = document.getElementById('mediaList');
    const products = (content.media?.products || []).map((p, i) =>
      mediaCard({
        type: 'products',
        index: i,
        title: `Product ${i + 1}`,
        hint: 'Disarankan 1000 × 1000 px (persegi)',
        image: p.image,
        extraFieldsHtml: `
          <label>caption</label>
          <input data-media="products" data-index="${i}" data-field="caption" value="${escapeAttr(p.caption || '')}">
          <label>brand</label>
          <input data-media="products" data-index="${i}" data-field="brand" value="${escapeAttr(p.brand || '')}">
        `
      })
    ).join('');
    const gallery = (content.media?.gallery || []).map((g, i) =>
      mediaCard({
        type: 'gallery',
        index: i,
        title: `Gallery ${i + 1}`,
        hint: 'Disarankan 1600 × 1000 px (landscape)',
        image: g.image,
        wide: true
      })
    ).join('');
    const articles = (content.media?.articles || []).map((a, i) =>
      mediaCard({
        type: 'articles',
        index: i,
        title: `Article ${i + 1}`,
        hint: 'Disarankan 1200 × 750 px (16:10)',
        image: a.image,
        wide: true
      })
    ).join('');
    box.innerHTML = `<h3>Produk</h3>${products}<h3>Galeri</h3>${gallery}<h3>Artikel</h3>${articles}`;
    bindMediaReplaceButtons();
  }

  function bindMediaReplaceButtons() {
    document.querySelectorAll('[data-replace-btn]').forEach(btn => {
      btn.onclick = () => {
        const type = btn.getAttribute('data-replace-btn');
        const index = btn.getAttribute('data-index');
        const input = document.querySelector(`input[data-replace-input="${type}"][data-index="${index}"]`);
        if (input) input.click();
      };
    });

    document.querySelectorAll('[data-replace-input]').forEach(input => {
      input.onchange = async () => {
        const type = input.getAttribute('data-replace-input');
        const index = Number(input.getAttribute('data-index'));
        const file = input.files?.[0];
        const status = document.querySelector(`[data-replace-status="${type}-${index}"]`);
        const card = document.querySelector(`[data-media-card="${type}-${index}"]`);
        if (!file) return;

        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        status.className = 'media-status';
        status.textContent = `Memeriksa ${file.name} (${sizeMb} MB)...`;

        // Baca dimensi dulu
        const dims = await readImageDims(file).catch(() => null);
        if (dims) {
          status.textContent = `${dims.w} × ${dims.h} px · ${sizeMb} MB — mengunggah...`;
        }

        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload gagal');

          // Update path di content + UI
          if (!content.media[type][index]) content.media[type][index] = {};
          content.media[type][index].image = data.path;

          const pathInput = card.querySelector(`input[data-media="${type}"][data-index="${index}"][data-field="image"]`);
          if (pathInput) pathInput.value = data.path;
          const thumb = card.querySelector('.media-thumb');
          if (thumb) thumb.src = data.path + '?t=' + Date.now();

          status.className = 'media-status ok';
          status.textContent = dims
            ? `Berhasil diganti · ${dims.w} × ${dims.h} px · ${sizeMb} MB. Klik Simpan Perubahan.`
            : `Berhasil diganti · ${sizeMb} MB. Klik Simpan Perubahan.`;

          // Auto-save agar langsung terpakai
          await saveAll();
          status.textContent = (dims ? `${dims.w} × ${dims.h} px · ` : '') + 'Tersimpan. Refresh website untuk melihat.';
        } catch (err) {
          status.className = 'media-status err';
          status.textContent = err.message;
        } finally {
          input.value = '';
        }
      };
    });
  }

  function readImageDims(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ w: img.width, h: img.height });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Gagal baca gambar'));
      };
      img.src = url;
    });
  }

  function collectMedia() {
    document.querySelectorAll('#mediaList [data-media]').forEach(el => {
      const type = el.getAttribute('data-media');
      const index = Number(el.getAttribute('data-index'));
      const field = el.getAttribute('data-field');
      if (content.media?.[type]?.[index]) content.media[type][index][field] = el.value;
    });
  }

  function collectAll() {
    collectContentFields();
    collectSeo();
    collectSettings();
    collectMedia();
  }

  async function saveAll() {
    try {
      collectAll();
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
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.panel').forEach(p => { p.hidden = true; });
    document.getElementById('view-' + view).hidden = false;
    const titles = {
      overview: ['Overview', 'Ringkasan konten website'],
      content: ['Konten', 'Edit teks bilingual per section'],
      seo: ['SEO', 'Title, description, Open Graph, robots'],
      settings: ['Kontak & Settings', 'WhatsApp, email, alamat, maps'],
      media: ['Media', 'Ganti gambar produk, galeri & artikel']
    };
    pageTitle.textContent = titles[view][0];
    pageSub.textContent = titles[view][1];
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

  loginForm.addEventListener('submit', () => {
    // Biarkan form POST klasik ke /api/auth/login-form (paling andal)
    loginError.hidden = true;
  });

  // Tidak preventDefault — server yang set session lalu redirect

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
    showLogin();
  });

  document.getElementById('saveBtn').addEventListener('click', saveAll);

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      collectAll();
      switchView(btn.dataset.view);
    });
  });

  document.getElementById('sectionSelect').addEventListener('change', (e) => {
    collectContentFields();
    currentSection = e.target.value;
    renderContentFields();
  });

  document.querySelectorAll('.lang-tab:not(.seo-lang)').forEach(btn => {
    btn.addEventListener('click', () => {
      collectContentFields();
      editLang = btn.dataset.lang;
      document.querySelectorAll('#view-content .lang-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === editLang);
      });
      renderContentFields();
    });
  });

  document.querySelectorAll('.seo-lang').forEach(btn => {
    btn.addEventListener('click', () => {
      collectSeo();
      seoLang = btn.dataset.lang;
      document.querySelectorAll('.seo-lang').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === seoLang);
      });
      renderSeo();
    });
  });

  ensureAuth().catch(() => showLogin());
})();
