/**
 * Shared Phase 2 helpers: bilingual fields, carousel, lightbox, detail lookup.
 */
(function (global) {
  const LIMITS = { brands: 10, products: 10, gallery: 10, articles: 15 };

  function lang() {
    return localStorage.getItem('dkg-lang') === 'en' ? 'en' : 'id';
  }

  function bi(field, l) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    const use = l || lang();
    return field[use] || field.id || field.en || '';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function t(key) {
    const pack = (global.DKG_I18N && (global.DKG_I18N[lang()] || global.DKG_I18N.id)) || {};
    const fallback = (global.DKG_I18N && global.DKG_I18N.id) || {};
    return pack[key] || fallback[key] || key;
  }

  function limitList(arr, type) {
    const max = LIMITS[type] || 10;
    return (arr || []).slice(0, max);
  }

  function initCarousel(root) {
    if (!root) return;
    const track = root.querySelector('.carousel-track');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    if (!track) return;

    function step() {
      const card = track.querySelector(':scope > *');
      return card ? card.getBoundingClientRect().width + 2 : track.clientWidth * 0.8;
    }

    function updateButtons() {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth - 2);
      if (prev) prev.disabled = track.scrollLeft <= 2 || maxScroll <= 0;
      if (next) next.disabled = track.scrollLeft >= maxScroll || maxScroll <= 0;
    }

    if (!root.dataset.carouselReady) {
      root.dataset.carouselReady = '1';
      if (prev) {
        prev.addEventListener('click', () => {
          track.scrollBy({ left: -step(), behavior: 'smooth' });
        });
      }
      if (next) {
        next.addEventListener('click', () => {
          track.scrollBy({ left: step(), behavior: 'smooth' });
        });
      }
      track.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons);
    }
    updateButtons();
  }

  let lightboxReturnFocus = null;

  function ensureLightbox() {
    let lb = document.getElementById('dkgLightbox');
    if (lb) return lb;
    lb = document.createElement('div');
    lb.id = 'dkgLightbox';
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.innerHTML = `
      <div class="lightbox-backdrop" data-lightbox-close></div>
      <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Image preview">
        <button type="button" class="lightbox-close" data-lightbox-close aria-label="Close">&times;</button>
        <img class="lightbox-img" alt="">
        <p class="lightbox-cap" hidden></p>
      </div>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => {
      if (e.target.closest('[data-lightbox-close]')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const list = Array.from(focusables).filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true');
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    return lb;
  }

  function openLightbox(src, caption, alt) {
    const lb = ensureLightbox();
    const img = lb.querySelector('.lightbox-img');
    const cap = lb.querySelector('.lightbox-cap');
    const closeBtn = lb.querySelector('.lightbox-close');
    lightboxReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    img.src = src;
    const text = caption || '';
    img.alt = alt || text || '';
    cap.textContent = text;
    cap.hidden = !text;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    const lb = document.getElementById('dkgLightbox');
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = '';
    const img = lb.querySelector('.lightbox-img');
    if (img) img.removeAttribute('src');
    if (lightboxReturnFocus && typeof lightboxReturnFocus.focus === 'function') {
      lightboxReturnFocus.focus();
    }
    lightboxReturnFocus = null;
  }

  /** Open lightbox on click / keyboard; ignore when the pointer moved (carousel swipe). */
  function bindLightboxTrigger(el, getSrc, getCaption, getAlt) {
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    const THRESHOLD = 8;

    el.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      dragging = false;
    });
    el.addEventListener('pointermove', (e) => {
      if (Math.abs(e.clientX - startX) > THRESHOLD || Math.abs(e.clientY - startY) > THRESHOLD) {
        dragging = true;
      }
    });
    el.addEventListener('click', (e) => {
      if (dragging) {
        e.preventDefault();
        e.stopPropagation();
        dragging = false;
        return;
      }
      const src = typeof getSrc === 'function' ? getSrc(el) : getSrc;
      if (!src) return;
      e.preventDefault();
      const caption = typeof getCaption === 'function' ? getCaption(el) : (getCaption || '');
      const alt = typeof getAlt === 'function' ? getAlt(el) : getAlt;
      openLightbox(src, caption, alt);
    });
  }

  function renderBrands(container, brands, l) {
    if (!container) return;
    const list = limitList(brands, 'brands');
    container.innerHTML = list.map((b) => {
      const cat = bi(b.category, l);
      const short = bi(b.short, l);
      const img = b.image || 'images/placeholder-brand-dd.svg';
      return `<a class="brand-card reveal carousel-card" href="brand.html?slug=${encodeURIComponent(b.slug)}">
        <img class="brand-thumb" src="${escapeHtml(img)}" alt="${escapeHtml(b.name || '')}" loading="lazy">
        <span class="tag">${escapeHtml(cat)}</span>
        <h3>${escapeHtml(b.name || '')}</h3>
        <p>${escapeHtml(short)}</p>
      </a>`;
    }).join('');
  }

  function renderProducts(container, products, l) {
    if (!container) return;
    const list = limitList(products, 'products');
    container.innerHTML = list.map((p) => {
      const title = bi(p.title, l) || p.caption || '';
      const src = p.image || '';
      return `<button type="button" class="showcase-item reveal carousel-card" data-product-src="${escapeHtml(src)}" aria-label="${escapeHtml(title || 'View image')}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy">
      </button>`;
    }).join('');

    container.querySelectorAll('[data-product-src]').forEach((btn) => {
      bindLightboxTrigger(
        btn,
        () => btn.getAttribute('data-product-src'),
        () => '',
        () => btn.querySelector('img')?.getAttribute('alt') || ''
      );
    });
  }

  function renderGallery(container, gallery, l) {
    if (!container) return;
    const list = limitList(gallery, 'gallery');
    container.innerHTML = list.map((g, i) => {
      const title = bi(g.title, l);
      const wide = i === 0 ? ' wide' : '';
      const src = g.image || '';
      return `<button type="button" class="gallery-item${wide} reveal carousel-card" data-gallery-src="${escapeHtml(src)}" aria-label="${escapeHtml(title || 'View image')}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy">
      </button>`;
    }).join('');

    container.querySelectorAll('[data-gallery-src]').forEach((btn) => {
      bindLightboxTrigger(
        btn,
        () => btn.getAttribute('data-gallery-src'),
        () => '',
        () => btn.querySelector('img')?.getAttribute('alt') || ''
      );
    });
  }

  function renderArticles(container, articles, l) {
    if (!container) return;
    const list = limitList(articles, 'articles');
    container.innerHTML = list.map((a) => {
      const tag = bi(a.tag, l);
      const title = bi(a.title, l);
      const summary = bi(a.summary, l);
      return `<a class="blog-card reveal carousel-card" href="article.html?slug=${encodeURIComponent(a.slug)}">
        <div class="blog-img"><img src="${escapeHtml(a.image || '')}" alt="${escapeHtml(title)}" loading="lazy"></div>
        <span class="tag">${escapeHtml(tag)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(summary)}</p>
      </a>`;
    }).join('');
  }

  function findBySlug(list, slug) {
    const s = String(slug || '').toLowerCase();
    return (list || []).find((item) => String(item.slug || '').toLowerCase() === s) || null;
  }

  function querySlug() {
    return new URLSearchParams(location.search).get('slug') || '';
  }

  global.DKGMedia = {
    LIMITS,
    lang,
    bi,
    escapeHtml,
    t,
    limitList,
    initCarousel,
    openLightbox,
    closeLightbox,
    renderBrands,
    renderProducts,
    renderGallery,
    renderArticles,
    findBySlug,
    querySlug
  };
})(window);
