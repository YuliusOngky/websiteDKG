/**
 * Shared Phase 2 helpers: bilingual fields, carousel, lightbox, detail lookup.
 */
(function (global) {
  const LIMITS = { brands: 10, products: 10, gallery: 10, articles: 15 };

  function lang() {
    return localStorage.getItem('dkg-lang') === 'id' ? 'id' : 'en';
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
      // Trackpad / mouse: vertical wheel → horizontal browse (MacBook-like)
      track.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        if (Math.abs(e.deltaY) < 1) return;
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        if (maxScroll <= 0) return;
        const atStart = track.scrollLeft <= 0 && e.deltaY < 0;
        const atEnd = track.scrollLeft >= maxScroll - 1 && e.deltaY > 0;
        if (atStart || atEnd) return;
        e.preventDefault();
        track.scrollLeft += e.deltaY;
        updateButtons();
      }, { passive: false });
      window.addEventListener('resize', updateButtons);
    }
    updateButtons();
  }

  let lightboxReturnFocus = null;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxKeyHandler = null;
  let lightboxStepping = false;
  let lightboxMotionTimer = null;
  let lightboxMotionHandler = null;

  const LB_SWIPE_THRESHOLD = 48;
  const LB_DRAG_FOLLOW = 0.38;
  const LB_MOTION_MS = 1200;

  function lightboxStage() {
    const lb = document.getElementById('dkgLightbox');
    return lb ? lb.querySelector('.lightbox-stage') : null;
  }

  function cancelLightboxMotionWait() {
    if (lightboxMotionTimer != null) {
      window.clearTimeout(lightboxMotionTimer);
      lightboxMotionTimer = null;
    }
    if (lightboxMotionHandler) {
      const stage = lightboxStage();
      if (stage) stage.removeEventListener('transitionend', lightboxMotionHandler);
      lightboxMotionHandler = null;
    }
  }

  /** Prefer transitionend; fall back to timeout synced to CSS duration. */
  function afterLightboxMotion(stage, cb) {
    cancelLightboxMotionWait();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cancelLightboxMotionWait();
      cb();
    };
    lightboxMotionHandler = (e) => {
      if (!e.target || !e.target.classList || !e.target.classList.contains('lightbox-slide')) return;
      if (e.propertyName && e.propertyName !== 'transform') return;
      finish();
    };
    stage.addEventListener('transitionend', lightboxMotionHandler);
    lightboxMotionTimer = window.setTimeout(finish, LB_MOTION_MS + 120);
  }

  function setLightboxDrag(px, opts) {
    const stage = lightboxStage();
    if (!stage) return;
    const snap = opts && opts.snap;
    stage.classList.toggle('is-snapping', !!snap);
    stage.classList.toggle('is-dragging', !!(opts && opts.dragging));
    stage.style.setProperty('--lb-drag', `${px || 0}px`);
  }

  function clearLightboxDrag() {
    const stage = lightboxStage();
    if (!stage) return;
    stage.classList.remove('is-dragging', 'is-snapping', 'is-morph-next', 'is-morph-prev', 'is-settling');
    stage.style.setProperty('--lb-drag', '0px');
  }

  /** After morph settles: freeze CSS, reassign sources, unfreeze without a pop. */
  function settleLightboxAfterMorph(delta) {
    const stage = lightboxStage();
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    if (stage) {
      stage.classList.add('is-settling');
      stage.classList.remove('is-morph-next', 'is-morph-prev', 'is-snapping', 'is-dragging');
      stage.style.setProperty('--lb-drag', '0px');
    }
    paintLightbox({ skipAnim: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const s = lightboxStage();
        if (s) s.classList.remove('is-settling');
        lightboxStepping = false;
      });
    });
  }

  function beginLightboxMorph(delta) {
    const stage = lightboxStage();
    if (!stage) {
      lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
      paintLightbox({ skipAnim: true });
      lightboxStepping = false;
      return;
    }
    lightboxStepping = true;
    stage.classList.remove('is-dragging');
    // Capture current computed positions as transition start
    void stage.offsetWidth;
    stage.classList.add(delta > 0 ? 'is-morph-next' : 'is-morph-prev', 'is-snapping');
    stage.style.setProperty('--lb-drag', '0px');
    afterLightboxMotion(stage, () => settleLightboxAfterMorph(delta));
  }

  function ensureLightbox() {
    let lb = document.getElementById('dkgLightbox');
    if (lb && !lb.querySelector('.lightbox-stage')) {
      lb.remove();
      lb = null;
    }
    if (lb) return lb;
    lb = document.createElement('div');
    lb.id = 'dkgLightbox';
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.innerHTML = `
      <div class="lightbox-backdrop" data-lightbox-close></div>
      <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Image preview">
        <button type="button" class="lightbox-close" data-lightbox-close aria-label="Close">&times;</button>
        <div class="lightbox-stage">
          <button type="button" class="lightbox-slide is-prev" data-lightbox-prev aria-label="Previous">
            <img alt="">
          </button>
          <div class="lightbox-slide is-current">
            <img class="lightbox-img" alt="">
          </div>
          <button type="button" class="lightbox-slide is-next" data-lightbox-next aria-label="Next">
            <img alt="">
          </button>
        </div>
        <p class="lightbox-cap" hidden></p>
        <p class="lightbox-count" hidden></p>
      </div>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => {
      if (e.target.closest('[data-lightbox-close]')) closeLightbox();
      if (e.target.closest('[data-lightbox-prev]')) {
        e.preventDefault();
        stepLightbox(-1);
      }
      if (e.target.closest('[data-lightbox-next]')) {
        e.preventDefault();
        stepLightbox(1);
      }
    });

    const stage = lb.querySelector('.lightbox-stage');
    let swipeX = 0;
    let swipeY = 0;
    let swiping = false;
    let dragActive = false;
    let didSwipe = false;
    let pointerId = null;

    function endDrag(e) {
      if (!swiping) return;
      swiping = false;
      const dx = (e && e.clientX != null ? e.clientX : swipeX) - swipeX;
      const dy = (e && e.clientY != null ? e.clientY : swipeY) - swipeY;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const commit = dragActive && horizontal && Math.abs(dx) >= LB_SWIPE_THRESHOLD && lightboxItems.length > 1;
      dragActive = false;
      stage.classList.remove('is-dragging');

      if (pointerId != null) {
        try { stage.releasePointerCapture(pointerId); } catch (_) { /* ignore */ }
        pointerId = null;
      }

      if (commit) {
        didSwipe = true;
        const dir = dx < 0 ? 1 : -1;
        beginLightboxMorph(dir);
        return;
      }

      // Small movement / cancel: soft snap back
      setLightboxDrag(0, { snap: true });
      afterLightboxMotion(stage, () => {
        const s = lightboxStage();
        if (s) s.classList.remove('is-snapping');
      });
    }

    stage.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      if (lightboxStepping) return;
      // Side previews navigate via click; don't start a swipe on them
      if (e.target.closest('[data-lightbox-prev], [data-lightbox-next], .lightbox-close')) return;
      if (lightboxItems.length < 2) return;
      swipeX = e.clientX;
      swipeY = e.clientY;
      swiping = true;
      dragActive = false;
      didSwipe = false;
      pointerId = e.pointerId;
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    stage.addEventListener('pointermove', (e) => {
      if (!swiping || lightboxItems.length < 2) return;
      const dx = e.clientX - swipeX;
      const dy = e.clientY - swipeY;
      if (!dragActive) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        // Prefer vertical scroll — abort horizontal drag intent
        if (Math.abs(dy) > Math.abs(dx)) {
          swiping = false;
          clearLightboxDrag();
          return;
        }
        dragActive = true;
        stage.classList.add('is-dragging');
      }
      if (e.cancelable) e.preventDefault();
      setLightboxDrag(dx * LB_DRAG_FOLLOW, { dragging: true });
    });
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', () => {
      if (!swiping) return;
      swiping = false;
      dragActive = false;
      pointerId = null;
      setLightboxDrag(0, { snap: true });
      afterLightboxMotion(stage, () => clearLightboxDrag());
    });
    lb.addEventListener('click', (e) => {
      if (!didSwipe) return;
      e.preventDefault();
      e.stopPropagation();
      didSwipe = false;
    }, true);

    return lb;
  }

  function lightboxItemAt(offset) {
    const n = lightboxItems.length;
    if (!n) return null;
    const i = (lightboxIndex + offset + n * 10) % n;
    return lightboxItems[i];
  }

  function paintLightbox(opts) {
    const lb = ensureLightbox();
    const item = lightboxItems[lightboxIndex] || {};
    const prevItem = lightboxItemAt(-1);
    const nextItem = lightboxItemAt(1);
    const img = lb.querySelector('.lightbox-img');
    const prevImg = lb.querySelector('.lightbox-slide.is-prev img');
    const nextImg = lb.querySelector('.lightbox-slide.is-next img');
    const prevSlide = lb.querySelector('.lightbox-slide.is-prev');
    const nextSlide = lb.querySelector('.lightbox-slide.is-next');
    const cap = lb.querySelector('.lightbox-cap');
    const count = lb.querySelector('.lightbox-count');
    const skipAnim = opts && opts.skipAnim;

    img.src = item.src || '';
    img.alt = item.alt || item.caption || '';
    const text = item.caption || '';
    cap.textContent = text;
    cap.hidden = !text;

    const multi = lightboxItems.length > 1;
    lb.classList.toggle('is-multi', multi);

    if (prevImg && prevItem) {
      prevImg.src = prevItem.src;
      prevImg.alt = prevItem.alt || '';
    }
    if (nextImg && nextItem) {
      nextImg.src = nextItem.src;
      nextImg.alt = nextItem.alt || '';
    }
    if (prevSlide) prevSlide.hidden = !multi;
    if (nextSlide) nextSlide.hidden = !multi;

    if (count) {
      count.textContent = multi ? `${lightboxIndex + 1} / ${lightboxItems.length}` : '';
      count.hidden = !multi;
    }

    // Soft float only on open — not after morph settle (avoids a second pop)
    const current = lb.querySelector('.lightbox-slide.is-current');
    if (current) {
      current.classList.remove('is-animating');
      if (!skipAnim) {
        void current.offsetWidth;
        current.classList.add('is-animating');
      }
    }
  }

  function stepLightbox(delta) {
    if (lightboxItems.length < 2) return;
    if (lightboxStepping) return;
    beginLightboxMorph(delta);
  }

  function openLightbox(src, caption, alt) {
    openLightboxGallery([{ src, caption: caption || '', alt: alt || caption || '' }], 0);
  }

  function openLightboxGallery(items, startIndex) {
    const list = (items || []).filter((it) => it && it.src);
    if (!list.length) return;
    const lb = ensureLightbox();
    lightboxItems = list;
    lightboxIndex = Math.max(0, Math.min(list.length - 1, startIndex || 0));
    lightboxReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lightboxStepping = false;
    cancelLightboxMotionWait();
    clearLightboxDrag();
    paintLightbox();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';

    if (lightboxKeyHandler) {
      document.removeEventListener('keydown', lightboxKeyHandler);
    }
    lightboxKeyHandler = (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepLightbox(-1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepLightbox(1);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = lb.querySelectorAll('button:not([hidden]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const listEl = Array.from(focusables).filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true');
      if (!listEl.length) return;
      const first = listEl[0];
      const last = listEl[listEl.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', lightboxKeyHandler);

    const closeBtn = lb.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    const lb = document.getElementById('dkgLightbox');
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = '';
    const img = lb.querySelector('.lightbox-img');
    if (img) img.removeAttribute('src');
    lightboxItems = [];
    lightboxIndex = 0;
    lightboxStepping = false;
    cancelLightboxMotionWait();
    clearLightboxDrag();
    if (lightboxKeyHandler) {
      document.removeEventListener('keydown', lightboxKeyHandler);
      lightboxKeyHandler = null;
    }
    if (lightboxReturnFocus && typeof lightboxReturnFocus.focus === 'function') {
      lightboxReturnFocus.focus();
    }
    lightboxReturnFocus = null;
  }

  /** Open lightbox on click / keyboard; ignore when the pointer moved (carousel swipe). */
  function bindLightboxTrigger(el, getSrc, getCaption, getAlt, getGallery, getIndex) {
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
      const gallery = typeof getGallery === 'function' ? getGallery() : null;
      if (gallery && gallery.length) {
        const idx = typeof getIndex === 'function' ? getIndex() : 0;
        e.preventDefault();
        openLightboxGallery(gallery, idx);
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
    const gallery = list.map((p) => {
      const title = bi(p.title, l) || p.caption || '';
      return { src: p.image || '', caption: '', alt: title };
    }).filter((it) => it.src);
    container.innerHTML = list.map((p) => {
      const title = bi(p.title, l) || p.caption || '';
      const src = p.image || '';
      return `<button type="button" class="showcase-item reveal carousel-card" data-product-src="${escapeHtml(src)}" aria-label="${escapeHtml(title || 'View image')}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy">
      </button>`;
    }).join('');

    container.querySelectorAll('[data-product-src]').forEach((btn, i) => {
      const src = btn.getAttribute('data-product-src');
      const idx = gallery.findIndex((g) => g.src === src);
      bindLightboxTrigger(
        btn,
        () => src,
        () => '',
        () => btn.querySelector('img')?.getAttribute('alt') || '',
        () => gallery,
        () => (idx >= 0 ? idx : i)
      );
    });
  }

  function renderGallery(container, galleryItems, l) {
    if (!container) return;
    const list = limitList(galleryItems, 'gallery');
    const gallery = list.map((g) => {
      const title = bi(g.title, l);
      return { src: g.image || '', caption: '', alt: title };
    }).filter((it) => it.src);
    container.innerHTML = list.map((g, i) => {
      const title = bi(g.title, l);
      const wide = i === 0 ? ' wide' : '';
      const src = g.image || '';
      return `<button type="button" class="gallery-item${wide} reveal carousel-card" data-gallery-src="${escapeHtml(src)}" aria-label="${escapeHtml(title || 'View image')}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy">
      </button>`;
    }).join('');

    container.querySelectorAll('[data-gallery-src]').forEach((btn, i) => {
      const src = btn.getAttribute('data-gallery-src');
      const idx = gallery.findIndex((g) => g.src === src);
      bindLightboxTrigger(
        btn,
        () => src,
        () => '',
        () => btn.querySelector('img')?.getAttribute('alt') || '',
        () => gallery,
        () => (idx >= 0 ? idx : i)
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
    openLightboxGallery,
    closeLightbox,
    renderBrands,
    renderProducts,
    renderGallery,
    renderArticles,
    findBySlug,
    querySlug
  };
})(window);
