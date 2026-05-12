// ============================================
// GameZone - Unified Game Store (Multi-source)
// ============================================

const GameStore = (() => {
    let allGames = [];
    let allCategories = [];
    let currentPage = 0;
    let isLoading = false;
    let hasMore = true;
    let sources = [];
    const PAGINATION = 12;

    // Built-in category list with emojis
    const DEFAULT_CATEGORIES = [
        { id: 'all', name: 'All Games', emoji: '🎮' },
        { id: 'action', name: 'Action', emoji: '⚔️' },
        { id: 'adventure', name: 'Adventure', emoji: '🗺️' },
        { id: 'puzzle', name: 'Puzzle', emoji: '🧩' },
        { id: 'casual', name: 'Casual', emoji: '☕' },
        { id: 'racing', name: 'Racing', emoji: '🏎️' },
        { id: 'sports', name: 'Sports', emoji: '⚽' },
        { id: 'simulation', name: 'Simulation', emoji: '🏭' },
        { id: 'strategy', name: 'Strategy', emoji: '🛡️' },
        { id: 'shooter', name: 'Shooter', emoji: '🔫' },
        { id: 'match3', name: 'Match-3', emoji: '💎' },
        { id: 'bubble', name: 'Bubble', emoji: '🫧' },
        { id: 'io', name: '.io Games', emoji: '🌐' }
    ];

    // Register a data source
    function registerSource(name, fetchFn) {
        sources.push({ name, fetch: fetchFn });
    }

    // Register GamePix as default source
    registerSource('gamepix', GamePixApi.fetchGames);

    // Load a page of games from all sources
    async function loadPage(page) {
        if (isLoading) return { games: [], hasMore: false };

        isLoading = true;
        try {
            const results = await Promise.all(
                sources.map(src => src.fetch(page, PAGINATION).catch(err => {
                    console.warn(`Source ${src.name} failed:`, err);
                    return { games: [], hasMore: false };
                }))
            );

            let newGames = [];
            results.forEach(r => {
                newGames = newGames.concat(r.games || []);
                // hasMore = true if ANY source has more
                if (r.hasMore) hasMore = true;
            });

            // Deduplicate by id
            const existingIds = new Set(allGames.map(g => g.id));
            newGames = newGames.filter(g => !existingIds.has(g.id));

            allGames = allGames.concat(newGames);
            currentPage = page;

            // Update categories
            updateCategories();

            return { games: newGames, hasMore };
        } finally {
            isLoading = false;
        }
    }

    // Load next page (convenience)
    async function loadNextPage() {
        return loadPage(currentPage + 1);
    }

    function updateCategories() {
        const usedCats = new Set(allGames.map(g => g.category));
        allCategories = DEFAULT_CATEGORIES.filter(c => c.id === 'all' || usedCats.has(c.id));
    }

    // ---- Query Methods ----

    function getAllGames() {
        return allGames;
    }

    function getByCategory(category) {
        if (category === 'all') return allGames;
        return allGames.filter(g => g.category === category);
    }

    function getById(id) {
        return allGames.find(g => g.id === id) || null;
    }

    function search(query) {
        const q = query.toLowerCase().trim();
        if (!q) return allGames;
        return allGames.filter(g =>
            g.title.toLowerCase().includes(q) ||
            g.category.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q)
        );
    }

    function getPopular(n = 8) {
        return [...allGames]
            .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
            .slice(0, n);
    }

    function getNew(n = 8) {
        return [...allGames]
            .sort((a, b) => new Date(b.datePublished || 0) - new Date(a.datePublished || 0))
            .slice(0, n);
    }

    function getFeatured() {
        // Return highest quality game
        return getPopular(1)[0] || allGames[0] || null;
    }

    function getRandom(n = 6, excludeId = null) {
        let pool = excludeId ? allGames.filter(g => g.id !== excludeId) : [...allGames];
        pool.sort(() => Math.random() - 0.5);
        return pool.slice(0, n);
    }

    function getCategories() {
        return allCategories;
    }

    function getTotalCount() {
        return allGames.length;
    }

    function getHasMore() {
        return hasMore;
    }

    function isLoadingGames() {
        return isLoading;
    }

    // Clear all cached data
    function clearCache() {
        allGames = [];
        allCategories = [];
        currentPage = 0;
        hasMore = true;
        // Clear localStorage cache
        Object.keys(localStorage)
            .filter(k => k.startsWith(GamePixApi.CACHE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
    }

    return {
        registerSource,
        loadPage,
        loadNextPage,
        getAllGames,
        getByCategory,
        getById,
        search,
        getPopular,
        getNew,
        getFeatured,
        getRandom,
        getCategories,
        getTotalCount,
        getHasMore,
        isLoadingGames,
        clearCache,
        DEFAULT_CATEGORIES
    };
})();
