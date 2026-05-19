// ============================================
// GameZone - Shared UI Rendering Functions
// ============================================

const UI = (() => {

    const SITE_BASE = 'https://gamezone.best';

    // ---- Game Card HTML ----

    function createGameCardHTML(game) {
        const badgeHTML = game.badge
            ? `<span class="game-badge ${game.badge}">${game.badge === 'hot' ? '🔥 HOT' : '✨ NEW'}</span>`
            : '';
        const starHTML = '★'.repeat(Math.floor(game.rating)) + (game.rating % 1 >= 0.5 ? '½' : '');
        const thumbSrc = game.thumbnail || game.thumbnailSmall || '';

        return `
            <a href="${SITE_BASE}/game?id=${encodeURIComponent(game.id)}" class="game-card">
                <div class="game-thumb">
                    <img src="${thumbSrc}" alt="${escapeHTML(game.title)}" loading="lazy"
                         onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1a1a3e, #2d1b69)';">
                    ${badgeHTML}
                </div>
                <div class="game-info">
                    <div class="game-title">${escapeHTML(game.title)}</div>
                    <div class="game-meta">
                        <span>🎮 ${game.plays || '-'}</span>
                        <span style="color: var(--warning)">${starHTML} ${game.rating}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function createFeaturedCardHTML(game) {
        if (!game) return '<p style="color: var(--text-dim);">No featured game available.</p>';
        const thumbSrc = game.thumbnail || game.thumbnailSmall || '';

        return `
            <a href="${SITE_BASE}/game?id=${encodeURIComponent(game.id)}" class="featured-card">
                <div class="game-thumb">
                    <img src="${thumbSrc}" alt="${escapeHTML(game.title)}" loading="lazy"
                         onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1a1a3e, #2d1b69)';">
                </div>
                <div class="featured-info">
                    <span class="game-badge hot">🔥 FEATURED</span>
                    <div class="game-title">${escapeHTML(game.title)}</div>
                    <div class="game-desc">${escapeHTML(game.description || 'Play this amazing game now!')}</div>
                    <div class="game-meta" style="margin-bottom: 8px">
                        <span>🎮 ${game.plays || '-'}</span>
                        <span>⭐ ${game.rating}</span>
                        <span>📂 ${game.category}</span>
                    </div>
                    <div class="play-btn">▶ Play Now</div>
                </div>
            </a>
        `;
    }

    function createMiniGameHTML(game) {
        const thumbSrc = game.thumbnailSmall || game.thumbnail || '';

        return `
            <a href="${SITE_BASE}/game?id=${encodeURIComponent(game.id)}" class="mini-game">
                <img src="${thumbSrc}" alt="${escapeHTML(game.title)}" class="mini-game-thumb" loading="lazy"
                     onerror="this.background='var(--bg-card-hover)';">
                <div class="mini-game-info">
                    <div class="title">${escapeHTML(game.title)}</div>
                    <div class="meta">🎮 ${game.plays || '-'} · ⭐ ${game.rating}</div>
                </div>
            </a>
        `;
    }

    // ---- Category Navigation ----

    function createCategoryNavHTML(categories, activeCat = 'all') {
        if (!categories || categories.length === 0) return '';
        return categories.map(cat =>
            `<a href="${SITE_BASE}/category?cat=${cat.id}" class="${cat.id === activeCat ? 'active' : ''}">${cat.emoji} ${cat.name}</a>`
        ).join('');
    }

    // ---- Game Iframe ----

    function renderGameIframe(container, game, options = {}) {
        const loading = options.loadingEl;
        const fullscreenBtn = options.fullscreenBtn;

        if (!game || !game.gameUrl) {
            if (loading) {
                loading.innerHTML = '<span style="color: #e17055;">Game URL not available.</span>';
            }
            return;
        }

        // Clear previous iframe if any
        container.querySelectorAll('iframe').forEach(f => f.remove());

        const iframe = document.createElement('iframe');

        // Build iframe src based on game source
        let src = game.gameUrl;
        if (game.source === 'gamedistribution') {
            // GD needs referrer URL param
            const referrer = encodeURIComponent(window.location.href);
            src += (src.includes('?') ? '&' : '?') + 'gd_sdk_referrer_url=' + referrer;
        }
        // GamePix URLs already contain sid, no extra params needed

        iframe.src = src;
        iframe.allow = 'autoplay; fullscreen; gamepad; clipboard-write';
        iframe.allowFullscreen = true;

        let loaded = false;

        iframe.addEventListener('load', () => {
            loaded = true;
            if (loading) loading.style.display = 'none';
            if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
        });

        // Timeout: if still not loaded after 10s, hide spinner and show tip
        setTimeout(() => {
            if (!loaded) {
                if (loading) {
                    loading.innerHTML = `
                        <div style="text-align:center; padding:40px; color: var(--text-dim);">
                            <div style="font-size:2.5rem; margin-bottom:16px;">⚠️</div>
                            <div style="font-size:1rem; margin-bottom:12px;">Game is taking too long to load.</div>
                            <div style="font-size:0.85rem; margin-bottom:16px;">Try refreshing the page or check your connection.</div>
                            <button onclick="location.reload()" style="
                                background: var(--primary); color:#fff; border:none;
                                padding:10px 24px; border-radius:8px; font-size:0.9rem;
                                cursor:pointer;">Reload Page</button>
                        </div>`;
                }
            }
        }, 10000);

        container.appendChild(iframe);
    }

    // ---- Loading States ----

    function createSkeletonCards(count = 8) {
        return Array(count).fill('').map(() => `
            <div class="game-card skeleton-card">
                <div class="game-thumb skeleton-pulse"></div>
                <div class="game-info">
                    <div class="game-title skeleton-pulse" style="width: 70%; height: 16px;"></div>
                    <div class="game-meta skeleton-pulse" style="width: 50%; height: 12px; margin-top: 8px;"></div>
                </div>
            </div>
        `).join('');
    }

    function createLoadMoreBtn(onClick) {
        const btn = document.createElement('div');
        btn.className = 'load-more-container';
        btn.innerHTML = `
            <button class="load-more-btn" id="loadMoreBtn">Load More Games</button>
            <span class="load-more-status" id="loadMoreStatus"></span>
        `;
        // Bind click after a tick to ensure DOM is ready
        setTimeout(() => {
            const btnEl = btn.querySelector('#loadMoreBtn');
            if (btnEl) {
                btnEl.addEventListener('click', onClick);
            }
        }, 0);
        return btn;
    }

    // ---- SEO Utilities ----

    function setMetaContent(attr, attrValue, content) {
        let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, attrValue);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    function updateMeta(options = {}) {
        if (options.title) {
            document.title = options.title;
            setMetaContent('property', 'og:title', options.title);
            setMetaContent('name', 'twitter:title', options.title);
        }
        if (options.description) {
            setMetaContent('name', 'description', options.description);
            setMetaContent('property', 'og:description', options.description);
            setMetaContent('name', 'twitter:description', options.description);
        }
        if (options.url) {
            setMetaContent('property', 'og:url', options.url);
        }
        if (options.image) {
            setMetaContent('property', 'og:image', options.image);
            setMetaContent('name', 'twitter:image', options.image);
        }
    }

    // ---- Utility ----

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function _requestFullscreen(el) {
        if (el.requestFullscreen) return el.requestFullscreen();
        if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
        if (el.msRequestFullscreen) return el.msRequestFullscreen();
        return Promise.reject(new Error('Fullscreen API not supported'));
    }

    function _exitFullscreen() {
        if (document.exitFullscreen) return document.exitFullscreen();
        if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
        if (document.msExitFullscreen) return document.msExitFullscreen();
        return Promise.reject(new Error('Exit fullscreen not supported'));
    }

    function _getFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    }

    // CSS simulated fullscreen (fallback for mobile browsers where native fullscreen fails)
    function _enterCSSFullscreen(container) {
        document.body.classList.add('css-fullscreen-active');
        container.classList.add('css-fullscreen');
        document.addEventListener('fullscreenchange', _watchNativeExit);
        document.addEventListener('webkitfullscreenchange', _watchNativeExit);
    }

    function _exitCSSFullscreen(container) {
        document.body.classList.remove('css-fullscreen-active');
        container.classList.remove('css-fullscreen');
        document.removeEventListener('fullscreenchange', _watchNativeExit);
        document.removeEventListener('webkitfullscreenchange', _watchNativeExit);
    }

    function _watchNativeExit() {
        // When native fullscreen exits (user pressed Esc), clean up CSS state too
        const container = document.querySelector('.game-frame-container.css-fullscreen');
        if (container && !_getFullscreenElement()) {
            _exitCSSFullscreen(container);
        }
    }

    function toggleFullscreen(element) {
        if (_getFullscreenElement()) {
            // Currently fullscreen — exit
            _exitCSSFullscreen(element);
            _exitFullscreen().catch(() => {});
        } else {
            // Try native fullscreen first, fallback to CSS simulation
            _requestFullscreen(element)
                .then(() => {
                    // Native fullscreen succeeded — also add CSS class for extra styling
                    element.classList.add('css-fullscreen');
                    document.body.classList.add('css-fullscreen-active');
                })
                .catch(() => {
                    // Native not available or rejected — use CSS simulation
                    _enterCSSFullscreen(element);
                });
        }
    }

    function initMobileMenu() {
        const toggle = document.querySelector('.menu-toggle');
        const links = document.querySelector('.nav-links');
        if (toggle && links) {
            toggle.addEventListener('click', () => {
                links.classList.toggle('show');
            });
        }
    }

    function initSearch() {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `${SITE_BASE}/search?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        }
    }

    return {
        createGameCardHTML,
        createFeaturedCardHTML,
        createMiniGameHTML,
        createCategoryNavHTML,
        renderGameIframe,
        createSkeletonCards,
        createLoadMoreBtn,
        toggleFullscreen,
        initMobileMenu,
        initSearch,
        updateMeta,
        escapeHTML,
        SITE_BASE
    };
})();
