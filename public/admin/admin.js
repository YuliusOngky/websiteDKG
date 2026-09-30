(() => {
  const LIMITS = { brands: 10, products: 10, gallery: 10, articles: 15 };

  const SECTIONS = {
    nav: ['nav.about', 'nav.values', 'nav.business', 'nav.brands', 'nav.products', 'nav.gallery', 'nav.articles', 'nav.contact', 'nav.menu'],
    hero: ['hero.lede', 'hero.cta1', 'hero.cta2', 'hero.scroll'],
    about: ['about.eyebrow', 'about.title', 'about.p1', 'about.p2'],
    vision: ['vision.eyebrow', 'vision.title'],
    mission: ['mission.eyebrow', 'mission.1', 'mission.2', 'mission.3', 'mission.4', 'mission.5'],
    values: ['values.eyebrow', 'values.title', 'values.integrity', 'values.excellence', 'values.innovation', 'values.collaboration', 'values.sustainability'],
    business: ['business.eyebrow', 'business.title', 'business.lede', 'business.m.company', 'business.m.desc', 'business.m.more', 'business.f.company', 'business.f.desc', 'business.f.more', 'business.h.company', 'business.h.desc', 'business.h.more', 'business.more', 'business.less'],
    brands: ['brands.eyebrow', 'brands.title'],
    products: ['products.eyebrow'],
    gallery: ['gallery.eyebrow', 'gallery.title'],
    articles: ['articles.eyebrow', 'articles.title'],
    contact: ['contact.eyebrow', 'contact.title', 'contact.phoneLabel', 'contact.call', 'contact.map', 'contact.mapAria'],
    footer: ['footer.nav', 'footer.businessLine', 'footer.contact', 'footer.location', 'footer.tagline', 'footer.rights']
  };

  const SEO_FIELDS = [
    'title', 'description', 'keywords', 'canonical',
    'ogTitle', 'ogDescription', 'ogImage',
    'twitterCard', 'robots', 'siteName'
  ];

  const SETTINGS_FIELDS = [
    { key: 'phone', label: 'Telepon (PSTN)' },
    { key: 'email', label: 'Email' },
    { key: 'addressCompany', label: 'Nama perusahaan (alamat)' },
    { key: 'addressLine1', label: 'Alamat baris 1' },
    { key: 'addressLine2', label: 'Alamat baris 2' },
    { key: 'addressLine3', label: 'Alamat baris 3' },
    { key: 'addressLine4', label: 'Alamat baris 4' },
    { key: 'mapsQuery', label: 'Query Google Maps' },
    { key: 'siteUrl', label: 'Site URL (produksi)' },
    { key: 'gaMeasurementId', label: 'GA4 Measurement ID (G-XXXX)' },
    { key: 'gscVerification', label: 'Google Search Console verification code' }
  ];

  const SEO_FIELD_META = {
    title: { hint: 'Ideal 50–60 karakter' },
    description: { hint: 'Ideal 150–160 karakter', long: true },
    keywords: { hint: 'Pisahkan dengan koma', long: true },
    canonical: { hint: 'URL absolut, contoh https://testingwebsite.web.id/' },
    ogTitle: { hint: 'Judul Open Graph (sosial media)' },
    ogDescription: { hint: 'Deskripsi Open Graph', long: true },
    ogImage: { hint: 'URL absolut gambar share (https://…)' },
    twitterCard: { hint: 'Biasanya summary_large_image' },
    robots: { hint: 'Contoh: index,follow' },
    siteName: { hint: 'Nama situs untuk og:site_name' }
  };

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
        websiteUrl: '',
        websiteLogo: '',
        instagramUrl: '',
        instagramLogo: '',
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

  /** Resolve CMS image paths for <img> under /admin/ (relative paths would break). */
  function mediaUrl(path) {
    const p = String(path || '').trim();
    if (!p) return '';
    if (/^(https?:|data:|blob:)/i.test(p)) return p;
    if (p.startsWith('/')) return p;
    return '/' + p.replace(/^\.\//, '');
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
      const status = await api('/api/session');
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
    renderTypographyFields();
    renderColorPalette();
    renderSettings();
    renderAboutImage();
    ['brands', 'products', 'gallery', 'articles'].forEach(renderEntityPanel);
  }

  function populateSectionSelect() {
    const select = document.getElementById('sectionSelect');
    select.innerHTML = Object.keys(SECTIONS).map((k) =>
      `<option value="${k}" ${k === currentSection ? 'selected' : ''}>${k}</option>`
    ).join('');
  }

  function siteUrl() {
    return String(content?.settings?.siteUrl || 'https://testingwebsite.web.id').replace(/\/$/, '');
  }

  function renderOverview() {
    document.getElementById('statBrands').textContent = content.media?.brands?.length || 0;
    document.getElementById('statProducts').textContent = content.media?.products?.length || 0;
    document.getElementById('statGallery').textContent = content.media?.gallery?.length || 0;
    document.getElementById('statArticles').textContent = content.media?.articles?.length || 0;
    document.getElementById('statUpdatedLine').textContent = content.updatedAt
      ? 'Terakhir disimpan: ' + new Date(content.updatedAt).toLocaleString('id-ID')
      : 'Terakhir disimpan: —';

    const base = siteUrl();
    const siteEl = document.getElementById('healthSiteUrl');
    if (siteEl) siteEl.textContent = base;
    const linkSite = document.getElementById('linkSite');
    const linkPsi = document.getElementById('linkPsi');
    if (linkSite) linkSite.href = base + '/';
    if (linkPsi) {
      linkPsi.href = 'https://pagespeed.web.dev/analysis?url=' + encodeURIComponent(base + '/');
    }
    renderSeoChecklist();
    loadHealthStatus();
  }

  async function loadHealthStatus() {
    const okEl = document.getElementById('healthOk');
    const storageEl = document.getElementById('healthStorage');
    const envEl = document.getElementById('healthEnv');
    if (!okEl) return;
    try {
      const health = await api('/api/health');
      okEl.textContent = health.ok ? 'OK' : 'ERROR';
      okEl.classList.toggle('ok', !!health.ok);
      okEl.classList.toggle('bad', !health.ok);
      if (storageEl) storageEl.textContent = health.storage || '—';
      if (envEl) envEl.textContent = health.env || '—';
    } catch (err) {
      okEl.textContent = 'Gagal';
      okEl.classList.add('bad');
      if (storageEl) storageEl.textContent = '—';
      if (envEl) envEl.textContent = '—';
    }
  }

  function checklistItem(ok, label, detail) {
    return `<li class="${ok ? 'ok' : 'warn'}">
      <span class="check-mark">${ok ? '✓' : '!'}</span>
      <span><strong>${escapeHtml(label)}</strong>${detail ? ` — ${escapeHtml(detail)}` : ''}</span>
    </li>`;
  }

  function renderSeoChecklist() {
    const list = document.getElementById('seoChecklist');
    if (!list || !content) return;
    const seo = content.seo?.id || {};
    const s = content.settings || {};
    const titleLen = String(seo.title || '').length;
    const descLen = String(seo.description || '').length;
    const canonicalOk = /^https?:\/\//i.test(seo.canonical || '');
    const ogAbs = /^https?:\/\//i.test(seo.ogImage || '');
    const titleOk = titleLen >= 30 && titleLen <= 65;
    const descOk = descLen >= 120 && descLen <= 170;
    const gaOk = !s.gaMeasurementId || /^G-[A-Z0-9]+$/i.test(String(s.gaMeasurementId).trim());
    const items = [
      checklistItem(canonicalOk, 'Canonical URL', canonicalOk ? seo.canonical : 'Belum diisi / belum absolut'),
      checklistItem(titleOk, 'Title panjang wajar', `${titleLen} karakter (ideal 50–60)`),
      checklistItem(descOk, 'Description panjang wajar', `${descLen} karakter (ideal 150–160)`),
      checklistItem(!!seo.ogImage, 'OG image terisi', seo.ogImage || 'Kosong'),
      checklistItem(ogAbs, 'OG image absolut (https)', ogAbs ? 'OK' : 'Pakai URL penuh agar share sosial benar'),
      checklistItem(!!s.siteUrl, 'Site URL di Settings', s.siteUrl || 'Kosong'),
      checklistItem(!!s.gscVerification, 'Search Console verification', s.gscVerification ? 'Terisi' : 'Opsional — isi kode dari GSC'),
      checklistItem(!!s.gaMeasurementId, 'GA4 Measurement ID', s.gaMeasurementId ? s.gaMeasurementId : 'Opsional — isi G-XXXX'),
      checklistItem(gaOk, 'Format GA4 valid', gaOk ? 'OK' : 'Harus diawali G-')
    ];
    list.innerHTML = items.join('');

    // Async reachability for robots/sitemap/favicon
    Promise.all([
      fetch('/robots.txt', { method: 'GET' }).then((r) => r.ok),
      fetch('/sitemap.xml', { method: 'GET' }).then((r) => r.ok),
      fetch('/favicon.ico', { method: 'GET' }).then((r) => r.ok)
    ]).then(([robots, sitemap, favicon]) => {
      list.insertAdjacentHTML('beforeend', [
        checklistItem(robots, 'robots.txt reachable', robots ? '/robots.txt' : '404'),
        checklistItem(sitemap, 'sitemap.xml reachable', sitemap ? '/sitemap.xml' : '404'),
        checklistItem(favicon, 'favicon reachable', favicon ? '/favicon.ico' : '404')
      ].join(''));
    }).catch(() => {});
  }

  function isLongKey(key) {
    return /lede|desc|more|p1|p2|title$|a\d|\.q|\.a\d|mission\.\d|vision\.title/.test(key);
  }

  function looksLikeRichHtml(str) {
    return /<\/?(?:b|strong|i|em|br|span)\b/i.test(String(str || ''));
  }

  function sanitizeRichHtml(html) {
    const input = String(html || '');
    if (!input) return '';
    const template = document.createElement('template');
    template.innerHTML = input;

    function cleanStyle(styleText) {
      if (!styleText) return '';
      const kept = [];
      String(styleText).split(';').forEach((part) => {
        const idx = part.indexOf(':');
        if (idx < 0) return;
        const prop = part.slice(0, idx).trim().toLowerCase();
        const val = part.slice(idx + 1).trim();
        if (!val) return;
        if (prop === 'color' && /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)|hsla?\([^)]+\)|[a-z]+)$/i.test(val)) {
          kept.push('color:' + val);
        } else if (prop === 'font-size' && /^\d+(\.\d+)?(px|rem|em|%)$/i.test(val)) {
          kept.push('font-size:' + val);
        } else if (prop === 'font-family' && !/url\s*\(|expression|javascript/i.test(val)) {
          kept.push('font-family:' + val.replace(/["<>]/g, ''));
        } else if (prop === 'font-weight' && /^(bold|bolder|normal|[1-9]00)$/i.test(val)) {
          kept.push('font-weight:' + val);
        } else if (prop === 'font-style' && /^(italic|oblique|normal)$/i.test(val)) {
          kept.push('font-style:' + val);
        }
      });
      return kept.join(';');
    }

    function walk(parent) {
      [...parent.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) return;
        if (child.nodeType !== Node.ELEMENT_NODE) {
          child.remove();
          return;
        }
        const tag = child.tagName;
        if (tag === 'BR') {
          [...child.attributes].forEach((a) => child.removeAttribute(a.name));
          return;
        }
        if (tag === 'B' || tag === 'STRONG' || tag === 'I' || tag === 'EM' || tag === 'SPAN') {
          const style = cleanStyle(child.getAttribute('style'));
          [...child.attributes].forEach((a) => child.removeAttribute(a.name));
          if (style) child.setAttribute('style', style);
          walk(child);
          return;
        }
        if (tag === 'FONT') {
          const color = child.getAttribute('color');
          const face = child.getAttribute('face');
          const size = child.getAttribute('size');
          const span = document.createElement('span');
          const styles = [];
          if (color && /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|[a-z]+)$/i.test(color.trim())) {
            styles.push('color:' + color.trim());
          }
          if (face && !/url\s*\(|expression|javascript/i.test(face)) {
            styles.push('font-family:' + face.replace(/["<>]/g, ''));
          }
          if (size) {
            const pxMap = { 1: '10px', 2: '13px', 3: '16px', 4: '18px', 5: '24px', 6: '32px', 7: '48px' };
            if (pxMap[size]) styles.push('font-size:' + pxMap[size]);
          }
          walk(child);
          while (child.firstChild) span.appendChild(child.firstChild);
          if (styles.length) span.setAttribute('style', styles.join(';'));
          parent.insertBefore(span, child);
          child.remove();
          return;
        }
        if (tag === 'DIV' || tag === 'P') {
          walk(child);
          parent.insertBefore(document.createElement('br'), child);
          while (child.firstChild) parent.insertBefore(child.firstChild, child);
          child.remove();
          return;
        }
        walk(child);
        while (child.firstChild) parent.insertBefore(child.firstChild, child);
        child.remove();
      });
    }

    walk(template.content);
    return template.innerHTML
      .replace(/(?:<br\s*\/?>\s*)+$/i, '')
      .replace(/^(\s*<br\s*\/?>)+/i, '');
  }

  function valueToEditorHtml(val) {
    const s = String(val || '');
    if (!s) return '';
    if (looksLikeRichHtml(s)) return sanitizeRichHtml(s);
    return escapeHtml(s).replace(/\n/g, '<br>');
  }

  function normalizeEditorHtml(el) {
    return sanitizeRichHtml(el.innerHTML || '');
  }

  function fieldStyle(key) {
    ensureThemeSettings();
    return content.settings.fieldStyles[key] || {};
  }

  function setFieldStyle(key, prop, value) {
    ensureThemeSettings();
    if (!content.settings.fieldStyles[key]) content.settings.fieldStyles[key] = {};
    if (!value) {
      delete content.settings.fieldStyles[key][prop];
      if (!Object.keys(content.settings.fieldStyles[key]).length) {
        delete content.settings.fieldStyles[key];
      }
      return;
    }
    content.settings.fieldStyles[key][prop] = value;
  }

  function ensureAdminFontLink(fontId) {
    const font = FONT_OPTIONS.find((f) => f.id === fontId);
    if (!font?.href) return font;
    const id = 'admin-font-' + fontId;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = font.href;
      document.head.appendChild(link);
    }
    return font;
  }

  function applyFieldPreview(key) {
    const input = document.getElementById('f-' + key);
    if (!input) return;
    const st = fieldStyle(key);
    if (st.color) input.style.color = st.color;
    else input.style.removeProperty('color');
    if (st.fontSize) input.style.fontSize = st.fontSize;
    else input.style.removeProperty('font-size');
    if (st.fontFamily) {
      const font = ensureAdminFontLink(st.fontFamily);
      input.style.fontFamily = font ? font.stack : '';
    } else {
      input.style.removeProperty('font-family');
    }
  }

  function wrapSelectionWithSpan(styleProp, styleValue, range) {
    const sel = window.getSelection();
    if (!sel) return false;
    let useRange = range;
    if (!useRange) {
      if (!sel.rangeCount || sel.isCollapsed) return false;
      useRange = sel.getRangeAt(0);
    }
    if (!useRange || useRange.collapsed) return false;
    const editor = useRange.commonAncestorContainer.nodeType === 1
      ? useRange.commonAncestorContainer.closest('.rte-editor')
      : useRange.commonAncestorContainer.parentElement?.closest('.rte-editor');
    if (!editor) return false;

    // Strip the same style inside the selection so the new value always wins
    // (nested old color/size/font otherwise overrides the outer wrap).
    if (styleProp === 'color' || styleProp === 'fontSize' || styleProp === 'fontFamily') {
      const frag = useRange.extractContents();
      const clearProp = styleProp === 'color' ? 'color'
        : styleProp === 'fontSize' ? 'font-size' : 'font-family';
      const walkClear = (node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.style) node.style.removeProperty(clearProp);
        if (node.tagName === 'FONT' && styleProp === 'color') node.removeAttribute('color');
        [...node.childNodes].forEach(walkClear);
        if (node.tagName === 'SPAN' && !(node.getAttribute('style') || '').trim()) {
          const parent = node.parentNode;
          if (!parent) return;
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          node.remove();
        }
      };
      [...frag.childNodes].forEach(walkClear);
      const span = document.createElement('span');
      span.style[styleProp] = styleValue;
      span.appendChild(frag);
      useRange.insertNode(span);
      sel.removeAllRanges();
      const next = document.createRange();
      next.selectNodeContents(span);
      sel.addRange(next);
      return true;
    }

    const span = document.createElement('span');
    span.style[styleProp] = styleValue;
    try {
      useRange.surroundContents(span);
    } catch {
      const frag = useRange.extractContents();
      span.appendChild(frag);
      useRange.insertNode(span);
    }
    sel.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(span);
    sel.addRange(next);
    return true;
  }

  function restoreRteSelection(editor, range) {
    if (!editor || !range) return false;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return false;
    try {
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    } catch {
      return false;
    }
  }

  function runRteCommand(editor, cmd, value, savedRange) {
    if (savedRange) restoreRteSelection(editor, savedRange);
    else editor.focus();
    const activeRange = (() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) return sel.getRangeAt(0).cloneRange();
      return savedRange || null;
    })();

    if (cmd === 'bold' || cmd === 'italic') {
      document.execCommand(cmd, false, null);
      return;
    }
    if (cmd === 'removeFormat') {
      document.execCommand('removeFormat', false, null);
      return;
    }
    if (cmd === 'color') {
      wrapSelectionWithSpan('color', value, activeRange);
      return;
    }
    if (cmd === 'size') {
      wrapSelectionWithSpan('fontSize', value, activeRange);
      return;
    }
    if (cmd === 'font') {
      const font = ensureAdminFontLink(value);
      if (font) wrapSelectionWithSpan('fontFamily', font.stack, activeRange);
    }
  }

  function bindRteToolbar(box) {
    box.querySelectorAll('.rte-toolbar').forEach((bar) => {
      let savedRange = null;
      const key = bar.getAttribute('data-rte-key');
      const editor = document.getElementById('f-' + key);
      if (!editor) return;

      const rememberSelection = () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const inEditor = range.commonAncestorContainer.nodeType === 1
          ? range.commonAncestorContainer.closest('.rte-editor')
          : range.commonAncestorContainer.parentElement?.closest('.rte-editor');
        if (inEditor === editor && !range.collapsed) {
          savedRange = range.cloneRange();
        }
      };

      // Keep text selection when clicking B/I/Clear; allow native select/color UI to open.
      bar.addEventListener('mousedown', (e) => {
        rememberSelection();
        if (e.target.closest('button')) e.preventDefault();
      });
      editor.addEventListener('mouseup', rememberSelection);
      editor.addEventListener('keyup', rememberSelection);

      bar.querySelectorAll('[data-rte-cmd]').forEach((el) => {
        const cmd = el.getAttribute('data-rte-cmd');
        const fire = () => {
          const val = el.value;
          if ((cmd === 'size' || cmd === 'font') && !val) return;
          runRteCommand(editor, cmd, val, savedRange);
        };
        if (el.tagName === 'BUTTON') el.addEventListener('click', fire);
        else {
          el.addEventListener('change', fire);
          if (cmd === 'color') el.addEventListener('input', fire);
        }
      });

      editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
    });
  }

  function renderContentFields() {
    ensureThemeSettings();
    const box = document.getElementById('fieldsBox');
    const keys = SECTIONS[currentSection] || [];
    box.innerHTML = keys.map((key) => {
      const val = content.i18n?.[editLang]?.[key] || '';
      const long = isLongKey(key) || String(val).length > 90 || looksLikeRichHtml(val);
      const st = fieldStyle(key);
      const colorVal = st.color || '#000000';
      const hasColor = !!st.color;
      const editorHtml = valueToEditorHtml(val);
      return `<div class="field field-with-style">
        <label for="f-${key}">${key}</label>
        <div class="rte-wrap">
          <div class="rte-toolbar" data-rte-key="${escapeAttr(key)}">
            <button type="button" class="rte-btn" data-rte-cmd="bold" title="Bold (per kata)"><b>B</b></button>
            <button type="button" class="rte-btn" data-rte-cmd="italic" title="Italic (per kata)"><i>I</i></button>
            <label class="rte-tool" title="Warna kata">
              <span>Warna</span>
              <input type="color" data-rte-cmd="color" value="#b48040">
            </label>
            <label class="rte-tool" title="Ukuran kata">
              <span>Ukuran</span>
              <select data-rte-cmd="size">
                <option value="">—</option>
                ${['12px','14px','16px','18px','20px','24px','28px','32px','40px','48px'].map((n) =>
                  `<option value="${n}">${n}</option>`).join('')}
              </select>
            </label>
            <label class="rte-tool" title="Jenis huruf kata">
              <span>Huruf</span>
              <select data-rte-cmd="font">
                <option value="">—</option>
                ${FONT_OPTIONS.map((f) =>
                  `<option value="${f.id}">${escapeHtml(f.label)}</option>`).join('')}
              </select>
            </label>
            <button type="button" class="rte-btn rte-btn-clear" data-rte-cmd="removeFormat" title="Hapus format seleksi">Clear</button>
          </div>
          <div id="f-${key}" data-key="${key}" class="rte-editor field-preview${long ? ' is-long' : ''}" contenteditable="true" role="textbox" aria-multiline="true">${editorHtml}</div>
        </div>
        <p class="rte-hint muted">Seleksi kata lalu pakai toolbar (B / I / warna / ukuran / huruf). Baris “Default field” di bawah = warna dasar seluruh teks tanpa format per kata.</p>
        <div class="field-style-row">
          <label class="field-style-item">
            <span>Default field — Warna</span>
            <span class="color-row compact">
              <input type="color" data-style-key="${key}" data-style-prop="color" value="${escapeAttr(colorVal)}" ${hasColor ? '' : 'data-unset="1"'}>
              <button type="button" class="btn-reset-style" data-reset-key="${key}" data-reset-prop="color" title="Reset warna">Reset</button>
            </span>
          </label>
          <label class="field-style-item">
            <span>Default field — Ukuran</span>
            <select data-style-key="${key}" data-style-prop="fontSize">
              <option value="">Default</option>
              ${['12px','14px','16px','18px','20px','24px','28px','32px','40px','48px'].map((n) =>
                `<option value="${n}" ${st.fontSize === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </label>
          <label class="field-style-item">
            <span>Default field — Huruf</span>
            <select data-style-key="${key}" data-style-prop="fontFamily">
              <option value="">Default</option>
              ${FONT_OPTIONS.map((f) =>
                `<option value="${f.id}" ${st.fontFamily === f.id ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>`;
    }).join('');

    keys.forEach((key) => applyFieldPreview(key));
    bindRteToolbar(box);

    box.querySelectorAll('[data-style-key]').forEach((el) => {
      const handler = () => {
        const key = el.getAttribute('data-style-key');
        const prop = el.getAttribute('data-style-prop');
        setFieldStyle(key, prop, el.value);
        if (prop === 'color') el.removeAttribute('data-unset');
        applyFieldPreview(key);
      };
      el.addEventListener('change', handler);
      el.addEventListener('input', handler);
    });
    box.querySelectorAll('[data-reset-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-reset-key');
        const prop = btn.getAttribute('data-reset-prop');
        setFieldStyle(key, prop, '');
        const colorInput = box.querySelector(`[data-style-key="${key}"][data-style-prop="${prop}"]`);
        if (colorInput) {
          colorInput.value = '#000000';
          colorInput.setAttribute('data-unset', '1');
        }
        applyFieldPreview(key);
      });
    });
  }

  function collectContentFields() {
    document.querySelectorAll('#fieldsBox [data-key]').forEach((el) => {
      const key = el.getAttribute('data-key');
      if (!content.i18n[editLang]) content.i18n[editLang] = {};
      content.i18n[editLang][key] = el.isContentEditable ? normalizeEditorHtml(el) : el.value;
    });
    document.querySelectorAll('#fieldsBox [data-style-key]').forEach((el) => {
      const key = el.getAttribute('data-style-key');
      const prop = el.getAttribute('data-style-prop');
      if (prop === 'color' && el.getAttribute('data-unset') === '1') {
        setFieldStyle(key, prop, '');
        return;
      }
      setFieldStyle(key, prop, el.value);
    });
  }

  function renderSeo() {
    const seo = content.seo?.[seoLang] || {};
    document.getElementById('seoPreview').innerHTML = `
      <p class="g-title">${escapeHtml(seo.title || 'Judul SEO')}</p>
      <p class="g-url">${escapeHtml(seo.canonical || (siteUrl() + '/'))}</p>
      <p class="g-desc">${escapeHtml(seo.description || 'Meta description akan tampil di sini.')}</p>
    `;
    document.getElementById('seoFields').innerHTML = SEO_FIELDS.map((key) => {
      const val = seo[key] || '';
      const meta = SEO_FIELD_META[key] || {};
      const long = meta.long || key.includes('description') || key === 'keywords';
      const len = String(val).length;
      const showCount = key === 'title' || key === 'description' || key === 'ogTitle' || key === 'ogDescription';
      return `<div class="field">
        <label for="seo-${key}">${key}${showCount ? ` <span class="char-count">(${len})</span>` : ''}</label>
        ${meta.hint ? `<p class="field-hint muted">${escapeHtml(meta.hint)}</p>` : ''}
        ${long
          ? `<textarea id="seo-${key}" data-seo="${key}">${escapeHtml(val)}</textarea>`
          : `<input id="seo-${key}" data-seo="${key}" value="${escapeAttr(val)}">`}
      </div>`;
    }).join('');

    document.querySelectorAll('#seoFields [data-seo]').forEach((el) => {
      el.addEventListener('input', () => {
        const key = el.getAttribute('data-seo');
        if (!content.seo[seoLang]) content.seo[seoLang] = {};
        content.seo[seoLang][key] = el.value;
        const label = el.previousElementSibling?.previousElementSibling || el.closest('.field')?.querySelector('label');
        const countEl = label?.querySelector('.char-count');
        if (countEl) countEl.textContent = `(${el.value.length})`;
        const previewTitle = document.querySelector('#seoPreview .g-title');
        const previewUrl = document.querySelector('#seoPreview .g-url');
        const previewDesc = document.querySelector('#seoPreview .g-desc');
        const cur = content.seo[seoLang];
        if (previewTitle) previewTitle.textContent = cur.title || 'Judul SEO';
        if (previewUrl) previewUrl.textContent = cur.canonical || (siteUrl() + '/');
        if (previewDesc) previewDesc.textContent = cur.description || 'Meta description akan tampil di sini.';
      });
    });
  }

  function collectSeo() {
    if (!content.seo[seoLang]) content.seo[seoLang] = {};
    document.querySelectorAll('#seoFields [data-seo]').forEach((el) => {
      content.seo[seoLang][el.getAttribute('data-seo')] = el.value;
    });
  }

  function renderSettings() {
    const s = content.settings || {};
    document.getElementById('settingsFields').innerHTML = SETTINGS_FIELDS.map(({ key, label }) => `<div class="field">
      <label for="set-${key}">${escapeHtml(label)}</label>
      <input id="set-${key}" data-set="${key}" value="${escapeAttr(s[key] || '')}" placeholder="${key === 'gaMeasurementId' ? 'G-XXXXXXXX' : ''}">
      ${key === 'gaMeasurementId' ? '<p class="field-hint muted">Kosongkan jika belum pakai Google Analytics. Aktif otomatis di website publik setelah disimpan.</p>' : ''}
      ${key === 'gscVerification' ? '<p class="field-hint muted">Tempel kode verifikasi dari Google Search Console (meta content saja).</p>' : ''}
      ${key === 'siteUrl' ? '<p class="field-hint muted">Dipakai untuk canonical, OG, dan link Health.</p>' : ''}
    </div>`).join('');
  }

  const FONT_OPTIONS = [
    // Sans
    { id: 'dm-sans', label: 'DM Sans', stack: "'DM Sans', sans-serif", href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,700&display=swap' },
    { id: 'plus-jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'inter', label: 'Inter', stack: "'Inter', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'manrope', label: 'Manrope', stack: "'Manrope', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap' },
    { id: 'outfit', label: 'Outfit', stack: "'Outfit', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap' },
    { id: 'figtree', label: 'Figtree', stack: "'Figtree', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'sora', label: 'Sora', stack: "'Sora', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap' },
    { id: 'space-grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' },
    { id: 'montserrat', label: 'Montserrat', stack: "'Montserrat', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'poppins', label: 'Poppins', stack: "'Poppins', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'nunito-sans', label: 'Nunito Sans', stack: "'Nunito Sans', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;1,6..12,400;1,6..12,700&display=swap' },
    { id: 'work-sans', label: 'Work Sans', stack: "'Work Sans', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'source-sans-3', label: 'Source Sans 3', stack: "'Source Sans 3', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'lato', label: 'Lato', stack: "'Lato', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap' },
    // Serif
    { id: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', serif", href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'libre-baskerville', label: 'Libre Baskerville', stack: "'Libre Baskerville', serif", href: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap' },
    { id: 'cormorant', label: 'Cormorant Garamond', stack: "'Cormorant Garamond', serif", href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'lora', label: 'Lora', stack: "'Lora', serif", href: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'eb-garamond', label: 'EB Garamond', stack: "'EB Garamond', serif", href: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'merriweather', label: 'Merriweather', stack: "'Merriweather', serif", href: 'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&display=swap' },
    { id: 'spectral', label: 'Spectral', stack: "'Spectral', serif", href: 'https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'crimson-pro', label: 'Crimson Pro', stack: "'Crimson Pro', serif", href: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap' },
    { id: 'instrument-serif', label: 'Instrument Serif', stack: "'Instrument Serif', serif", href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap' },
    // Display
    { id: 'cinzel', label: 'Cinzel', stack: "'Cinzel', serif", href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap' },
    { id: 'bebas-neue', label: 'Bebas Neue', stack: "'Bebas Neue', sans-serif", href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap' }
  ];

  const COLOR_FIELDS = [
    { key: 'prestige', label: 'Warna aksen (Prestige Brown)' },
    { key: 'goldDust', label: 'Warna aksen lembut (Gold Dust)' },
    { key: 'richBlack', label: 'Warna huruf utama (Rich Black)' },
    { key: 'clearWhite', label: 'Warna latar (Clear White)' },
    { key: 'gradientStart', label: 'Gradient Start' },
    { key: 'gradientEnd', label: 'Gradient End' }
  ];

  function ensureThemeSettings() {
    if (!content.settings) content.settings = {};
    if (!content.settings.colors) {
      content.settings.colors = {
        prestige: '#b48040',
        goldDust: '#eac17f',
        clearWhite: '#FFFFFF',
        richBlack: '#000000',
        gradientStart: '#23E396',
        gradientEnd: '#b48040'
      };
    }
    if (!content.settings.typography) {
      content.settings.typography = {
        fontFamily: 'dm-sans',
        fontSize: 16,
        headingSize: 100
      };
    }
    if (!content.settings.fieldStyles || typeof content.settings.fieldStyles !== 'object') {
      content.settings.fieldStyles = {};
    }
  }

  function renderTypographyFields() {
    ensureThemeSettings();
    const typo = content.settings.typography;
    const box = document.getElementById('typographyFields');
    if (!box) return;
    box.innerHTML = `
      <div class="field">
        <label for="typo-font">Jenis huruf</label>
        <select id="typo-font" data-typo="fontFamily">
          ${FONT_OPTIONS.map((f) => `<option value="${f.id}" ${typo.fontFamily === f.id ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="typo-size">Ukuran huruf dasar</label>
        <select id="typo-size" data-typo="fontSize">
          ${[14, 15, 16, 17, 18].map((n) => `<option value="${n}" ${Number(typo.fontSize) === n ? 'selected' : ''}>${n}px</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="typo-heading">Ukuran judul (skala)</label>
        <select id="typo-heading" data-typo="headingSize">
          ${[90, 100, 110, 120].map((n) => `<option value="${n}" ${Number(typo.headingSize) === n ? 'selected' : ''}>${n}%</option>`).join('')}
        </select>
      </div>
    `;
    box.querySelectorAll('[data-typo]').forEach((el) => {
      el.addEventListener('change', () => {
        ensureThemeSettings();
        const key = el.getAttribute('data-typo');
        content.settings.typography[key] = key === 'fontFamily' ? el.value : Number(el.value);
      });
    });
  }

  function renderColorPalette() {
    ensureThemeSettings();
    const colors = content.settings.colors;
    const box = document.getElementById('colorPaletteFields');
    if (!box) return;
    box.innerHTML = COLOR_FIELDS.map(({ key, label }) => `<div class="field">
      <label for="col-${key}">${escapeHtml(label)}</label>
      <div class="color-row">
        <input type="color" id="col-${key}" data-color="${key}" value="${escapeAttr(colors[key] || '#000000')}">
        <input type="text" data-color-text="${key}" value="${escapeAttr(colors[key] || '')}" placeholder="#000000" readonly>
      </div>
    </div>`).join('');

    box.querySelectorAll('[type="color"]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const key = e.target.getAttribute('data-color');
        const value = e.target.value;
        ensureThemeSettings();
        content.settings.colors[key] = value;
        const text = box.querySelector(`[data-color-text="${key}"]`);
        if (text) text.value = value;
      });
    });
  }

  function collectSettings() {
    if (!content.settings) content.settings = {};
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
        <img class="entity-thumb" src="${escapeAttr(mediaUrl(item.image))}" alt="" onerror="this.style.opacity=.25">
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
        <div class="field">
          <label>Website eksternal (URL)</label>
          <input data-plain="websiteUrl" value="${escapeAttr(item.websiteUrl || '')}" placeholder="https://contoh.com">
          <p class="field-hint muted">Kosongkan sampai URL siap. Jika diisi, tampil link logo + alamat di halaman detail (tab baru).</p>
        </div>
        <div class="field">
          <label>Logo website (opsional)</label>
          <input data-plain="websiteLogo" value="${escapeAttr(item.websiteLogo || '')}" placeholder="images/logo-elementi.svg">
          <p class="field-hint muted">Path gambar logo kecil. Kosong = tampilkan nama brand sebagai teks.</p>
        </div>
        <div class="field">
          <label>Instagram (URL)</label>
          <input data-plain="instagramUrl" value="${escapeAttr(item.instagramUrl || '')}" placeholder="https://www.instagram.com/handle">
          <p class="field-hint muted">Kosongkan sampai handle siap. Jika diisi, tampil ikon Instagram + alamat di halaman detail (tab baru), bisa berdampingan dengan website.</p>
        </div>
        <div class="field">
          <label>Logo Instagram (opsional)</label>
          <input data-plain="instagramLogo" value="${escapeAttr(item.instagramLogo || '')}" placeholder="images/logo-instagram.svg">
          <p class="field-hint muted">Path gambar logo kecil. Kosong = ikon Instagram bawaan (glyph).</p>
        </div>
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
          <div class="media-preview-frame ratio-${type === 'products' ? 'square' : 'wide'}" id="mediaPreviewFrame">
            <img class="media-thumb wide" id="entityImagePreview" src="${escapeAttr(mediaUrl(item.image))}" alt="Preview gambar" onerror="this.style.opacity=.3">
            <span class="media-preview-badge">Preview terpasang</span>
          </div>
          <div class="media-meta">
            <label>Gambar</label>
            <p class="media-hint">${escapeHtml(meta.hint)}</p>
            <p class="media-hint">Ganti gambar → atur zoom/posisi di canvas, lalu potong sesuai rasio tampilan website.</p>
            <div class="media-actions">
              <input type="file" accept="image/*" hidden id="entityFile">
              <button type="button" class="btn-primary" id="entityUploadBtn">Ganti gambar</button>
              <p class="media-status" id="entityUploadStatus"></p>
            </div>
            <input data-plain="image" id="entityImagePath" value="${escapeAttr(item.image || '')}" placeholder="Path / URL gambar">
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
    const pathInput = document.getElementById('entityImagePath');
    const previewImg = document.getElementById('entityImagePreview');

    pathInput?.addEventListener('input', () => {
      if (previewImg) {
        previewImg.style.opacity = '1';
        previewImg.src = mediaUrl(pathInput.value);
      }
    });

    document.getElementById('entityUploadBtn')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      const status = document.getElementById('entityUploadStatus');
      if (!file) return;
      status.className = 'media-status';
      status.textContent = 'Membuka editor gambar...';
      try {
        const cropped = await openImageCropper(file, type);
        if (!cropped) {
          status.textContent = 'Dibatalkan.';
          return;
        }
        status.textContent = 'Mengunggah...';
        const fd = new FormData();
        fd.append('file', cropped, cropped.name || 'crop.jpg');
        const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload gagal');
        content.media[type][index].image = data.path;
        if (pathInput) pathInput.value = data.path;
        if (previewImg) {
          previewImg.style.opacity = '1';
          const src = mediaUrl(data.path);
          previewImg.src = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
        status.className = 'media-status ok';
        status.textContent = 'Gambar dipotong & dipasang. Klik Simpan item.';
      } catch (err) {
        status.className = 'media-status err';
        status.textContent = err.message;
      } finally {
        fileInput.value = '';
      }
    });
  }

  const CROP_PRESETS = {
    brands: { ratio: 16 / 10, outW: 1600, outH: 1000, label: '16:10 · 1600×1000' },
    products: { ratio: 1, outW: 1000, outH: 1000, label: '1:1 · 1000×1000' },
    gallery: { ratio: 16 / 10, outW: 1600, outH: 1000, label: '16:10 · 1600×1000' },
    articles: { ratio: 16 / 10, outW: 1200, outH: 750, label: '16:10 · 1200×750' },
    about: { ratio: 3 / 2, outW: 1200, outH: 800, label: '3:2 · 1200×800' }
  };

  function renderAboutImage() {
    const box = document.getElementById('aboutImageBox');
    if (!box) return;
    if (!content.settings) content.settings = {};
    const img = content.settings.aboutImage || 'images/about-building.jpg';
    box.innerHTML = `
      <div class="entity-toolbar">
        <p class="muted" style="margin:0">Foto section "About Us" di halaman utama.</p>
      </div>
      <div class="media-card">
        <div class="media-preview-frame ratio-wide" id="aboutPreviewFrame">
          <img class="media-thumb wide" id="aboutImagePreview" src="${escapeAttr(mediaUrl(img))}" alt="Preview foto About" onerror="this.style.opacity=.3">
          <span class="media-preview-badge">Preview terpasang</span>
        </div>
        <div class="media-meta">
          <label>Foto About (gedung)</label>
          <p class="media-hint">Rasio 3:2 · 1200×800. Ganti gambar → atur zoom/posisi di canvas, lalu potong sesuai rasio.</p>
          <div class="media-actions">
            <input type="file" accept="image/*" hidden id="aboutFile">
            <button type="button" class="btn-primary" id="aboutUploadBtn">Ganti gambar</button>
            <p class="media-status" id="aboutUploadStatus"></p>
          </div>
          <input data-set="aboutImage" id="aboutImagePath" value="${escapeAttr(img)}" placeholder="Path / URL gambar">
        </div>
      </div>
    `;

    const fileInput = document.getElementById('aboutFile');
    const pathInput = document.getElementById('aboutImagePath');
    const previewImg = document.getElementById('aboutImagePreview');

    pathInput?.addEventListener('input', () => {
      content.settings.aboutImage = pathInput.value;
      if (previewImg) {
        previewImg.style.opacity = '1';
        previewImg.src = mediaUrl(pathInput.value);
      }
    });

    document.getElementById('aboutUploadBtn')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      const status = document.getElementById('aboutUploadStatus');
      if (!file) return;
      status.className = 'media-status';
      status.textContent = 'Membuka editor gambar...';
      try {
        const cropped = await openImageCropper(file, 'about');
        if (!cropped) {
          status.textContent = 'Dibatalkan.';
          return;
        }
        status.textContent = 'Mengunggah...';
        const fd = new FormData();
        fd.append('file', cropped, cropped.name || 'crop.jpg');
        const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload gagal');
        content.settings.aboutImage = data.path;
        if (pathInput) pathInput.value = data.path;
        if (previewImg) {
          previewImg.style.opacity = '1';
          const src = mediaUrl(data.path);
          previewImg.src = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
        status.className = 'media-status ok';
        status.textContent = 'Gambar dipotong & dipasang. Klik Simpan Perubahan.';
      } catch (err) {
        status.className = 'media-status err';
        status.textContent = err.message;
      } finally {
        fileInput.value = '';
      }
    });
  }

  function openImageCropper(file, type) {
    const preset = CROP_PRESETS[type] || CROP_PRESETS.brands;
    const modal = document.getElementById('cropModal');
    const canvas = document.getElementById('cropCanvas');
    const zoomInput = document.getElementById('cropZoom');
    const ratioLabel = document.getElementById('cropRatioLabel');
    const applyBtn = document.getElementById('cropApplyBtn');
    const cancelBtn = document.getElementById('cropCancelBtn');
    if (!modal || !canvas) return Promise.reject(new Error('Editor gambar tidak tersedia'));

    return new Promise((resolve) => {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let settled = false;

      function finish(result) {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        modal.hidden = true;
        document.body.classList.remove('crop-open');
        cleanup();
        resolve(result);
      }

      function cleanup() {
        canvas.onpointerdown = null;
        canvas.onpointermove = null;
        canvas.onpointerup = null;
        canvas.onpointerleave = null;
        zoomInput.oninput = null;
        applyBtn.onclick = null;
        cancelBtn.onclick = null;
      }

      function fitCanvas() {
        const maxW = Math.min(720, window.innerWidth - 48);
        const viewH = Math.round(maxW / preset.ratio);
        canvas.width = maxW;
        canvas.height = viewH;
      }

      function coverScale() {
        return Math.max(canvas.width / img.width, canvas.height / img.height);
      }

      function draw() {
        const base = coverScale();
        const s = base * scale;
        const drawW = img.width * s;
        const drawH = img.height * s;
        // Clamp offsets so canvas stays covered
        const minX = canvas.width - drawW;
        const minY = canvas.height - drawH;
        offsetX = Math.min(0, Math.max(minX, offsetX));
        offsetY = Math.min(0, Math.max(minY, offsetY));

        ctx.fillStyle = '#1a1916';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        // Frame guide
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      }

      function exportCropped() {
        const out = document.createElement('canvas');
        out.width = preset.outW;
        out.height = preset.outH;
        const octx = out.getContext('2d');
        const base = coverScale();
        const s = base * scale;
        // Map canvas viewport back to source image
        const sx = -offsetX / s;
        const sy = -offsetY / s;
        const sw = canvas.width / s;
        const sh = canvas.height / s;
        octx.fillStyle = '#fff';
        octx.fillRect(0, 0, out.width, out.height);
        octx.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
        return new Promise((res, rej) => {
          out.toBlob((blob) => {
            if (!blob) return rej(new Error('Gagal memotong gambar'));
            const nameBase = String(file.name || 'image').replace(/\.[^.]+$/, '');
            res(new File([blob], nameBase + '-crop.jpg', { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.9);
        });
      }

      img.onload = () => {
        fitCanvas();
        scale = 1;
        zoomInput.value = '100';
        const base = coverScale();
        offsetX = (canvas.width - img.width * base) / 2;
        offsetY = (canvas.height - img.height * base) / 2;
        ratioLabel.textContent = preset.label;
        document.getElementById('cropHint').textContent =
          'Geser gambar & atur zoom. Area di dalam bingkai akan dipotong ke ' + preset.label + '.';
        modal.hidden = false;
        document.body.classList.add('crop-open');
        draw();
      };
      img.onerror = () => finish(null);
      img.src = url;

      zoomInput.oninput = () => {
        scale = Number(zoomInput.value) / 100;
        draw();
      };

      canvas.onpointerdown = (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
      };
      canvas.onpointermove = (e) => {
        if (!dragging) return;
        offsetX += e.clientX - lastX;
        offsetY += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        draw();
      };
      canvas.onpointerup = () => { dragging = false; };
      canvas.onpointerleave = () => { dragging = false; };

      cancelBtn.onclick = () => finish(null);
      applyBtn.onclick = async () => {
        try {
          applyBtn.disabled = true;
          applyBtn.textContent = 'Memproses...';
          const fileOut = await exportCropped();
          finish(fileOut);
        } catch (err) {
          setStatus(err.message, false);
          finish(null);
        } finally {
          applyBtn.disabled = false;
          applyBtn.textContent = 'Potong & pasang';
        }
      };
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
      overview: ['Overview', 'Health, checklist SEO, dan ringkasan konten'],
      content: ['Konten', 'Edit teks + warna/ukuran/huruf per field'],
      brands: ['Brand Kami / Our Brand', 'CRUD brand — maks 10, klik → halaman detail'],
      products: ['Our Product Gallery', 'CRUD produk — maks 10, klik → halaman detail'],
      gallery: ['Galeri', 'CRUD galeri — maks 10, klik → lightbox'],
      articles: ['Artikel', 'CRUD artikel — maks 15, klik → halaman detail'],
      seo: ['SEO', 'Title, description, Open Graph, robots — fokus pencarian Google'],
      'color-palette': ['Color Palette', 'Warna VI + tipografi global website'],
      settings: ['Kontak & Settings', 'Telepon, email, alamat, GA4, Search Console']
    };
    pageTitle.textContent = titles[view][0];
    pageSub.textContent = titles[view][1];

    if (view === 'color-palette') {
      renderColorPalette();
      renderTypographyFields();
    }
    if (ENTITY_META[view]) renderEntityPanel(view);
  }

  loginForm.addEventListener('submit', () => {
    loginError.hidden = true;
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST', body: '{}' });
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
