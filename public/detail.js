(function (global) {
  async function loadContent() {
    try {
      const res = await fetch('/api/content');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.i18n) {
        global.DKG_I18N = {
          id: { ...(global.DKG_I18N?.id || {}), ...data.i18n.id },
          en: { ...(global.DKG_I18N?.en || {}), ...data.i18n.en }
        };
      }
      return data;
    } catch (err) {
      console.warn('Detail content load failed:', err.message);
      return null;
    }
  }

  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = global.DKGMedia.t(el.getAttribute('data-i18n'));
    });
  }

  function setLang(lang) {
    const l = lang === 'en' ? 'en' : 'id';
    localStorage.setItem('dkg-lang', l);
    document.documentElement.lang = l;
    document.querySelectorAll('.lang-switch button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === l);
    });
    return l;
  }

  function mount(options) {
    const root = document.getElementById('detailRoot');
    const M = global.DKGMedia;
    let content = null;
    let item = null;

    function paint() {
      const l = setLang(localStorage.getItem('dkg-lang') === 'id' ? 'id' : 'en');
      applyStaticI18n();
      if (!item) {
        root.innerHTML = `<p class="detail-empty">${M.escapeHtml(M.t('ui.notFound'))}</p>`;
        return;
      }
      root.innerHTML = options.render(item, l, M.bi, M.escapeHtml);
      const titleText = item.name || M.bi(item.title, l) || item.caption || 'DKG';
      document.title = titleText + ' — PT Diana Karya Gemilang';
      const desc = document.querySelector('meta[name="description"]');
      if (desc) {
        desc.setAttribute('content', M.bi(item.summary || item.short || item.body, l).slice(0, 160));
      }
    }

    document.querySelectorAll('.lang-switch button').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLang(btn.dataset.lang);
        paint();
      });
    });

    loadContent().then((data) => {
      content = data;
      const slug = M.querySlug();
      const list = content?.media?.[options.collection] || [];
      item = M.findBySlug(list, slug);
      paint();
    });
  }

  global.DKGDetail = { mount, loadContent };
})(window);
