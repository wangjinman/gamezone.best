// ============================================
// GameZone - GamePix Feed API Adapter
// Source: feeds.gamepix.com/v2/json
// ============================================

const GamePixApi = (() => {
    const BASE_URL = 'https://feeds.gamepix.com/v2/json';
    const SID = '35605';
    const CACHE_PREFIX = 'gpx_cache_';
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour

    // GamePix category -> our category mapping
    const CATEGORY_MAP = {
        'action': 'action',
        'adventure': 'adventure',
        'arcade': 'casual',
        'ball': 'casual',
        'battle': 'action',
        'bubble': 'bubble',
        'casual': 'casual',
        'drawing': 'casual',
        'hyper-casual': 'casual',
        'kids': 'casual',
        'match-3': 'match3',
        'memory': 'puzzle',
        'platformer': 'adventure',
        'puzzle': 'puzzle',
        'racing': 'racing',
        'shooter': 'shooter',
        'simulation': 'simulation',
        'sports': 'sports',
        'stickman': 'action',
        'strategy': 'strategy',
        '2048': 'puzzle',
        'io': 'io',
        '.io': 'io',
        'quiz': 'puzzle',
        'escape': 'puzzle',
        'running': 'action',
        'idle': 'casual',
        'tycoon': 'simulation',
        'cooking': 'casual',
        'dress-up': 'casual',
        'music': 'casual',
        'pinball': 'arcade',
        'snake': 'casual',
        'tetris': 'puzzle',
        'tower-defense': 'strategy',
        'word': 'puzzle',
        'card': 'puzzle',
        'board': 'strategy',
        'educational': 'casual',
        'soccer': 'sports',
        'football': 'sports',
        'basketball': 'sports',
        'baseball': 'sports',
        'tennis': 'sports',
        'golf': 'sports',
        'boxing': 'sports',
        'pool': 'sports',
        'bowling': 'sports',
        'car': 'racing',
        'motorcycle': 'racing',
        'truck': 'racing',
        'bicycle': 'racing',
        'flying': 'action',
        'math': 'puzzle',
        'jigsaw': 'puzzle',
        'hidden-object': 'puzzle',
        'spot-the-difference': 'puzzle',
        'sudoku': 'puzzle',
        'chess': 'strategy',
        'checkers': 'strategy',
        'mahjong': 'puzzle',
        'solitaire': 'puzzle',
        'mining': 'casual',
        'clicker': 'casual',
        'merge': 'puzzle',
        'slicing': 'casual',
        'stack': 'casual',
        'jump': 'action',
        'climb': 'action',
        'swim': 'sports',
        'skateboard': 'sports',
        'skiing': 'sports',
        'hockey': 'sports',
        'cricket': 'sports',
        'rugby': 'sports',
        'volleyball': 'sports',
        'table-tennis': 'sports',
        'badminton': 'sports',
        'gymnastics': 'sports',
        'darts': 'sports',
        'archery': 'sports',
        'fencing': 'sports',
        'rowing': 'sports',
        'surfing': 'sports',
        'fishing': 'casual',
        'hunting': 'action',
        'shooting': 'shooter',
        'sniper': 'shooter',
        'tank': 'action',
        'war': 'strategy',
        'medieval': 'strategy',
        'zombie': 'action',
        'horror': 'adventure',
        'scary': 'adventure',
        'space': 'action',
        'alien': 'action',
        'robot': 'action',
        'ninja': 'action',
        'samurai': 'action',
        'pirate': 'adventure',
        'dinosaur': 'adventure',
        'animal': 'casual',
        'cat': 'casual',
        'dog': 'casual',
        'bird': 'casual',
        'farm': 'simulation',
        'garden': 'casual',
        'doctor': 'simulation',
        'baby': 'casual',
        'cooking': 'casual',
        'bakery': 'simulation',
        'restaurant': 'simulation',
        'barber': 'simulation',
        'tattoo': 'casual',
        'makeup': 'casual',
        'nail': 'casual',
        'hair': 'casual',
        'fashion': 'casual',
        'design': 'casual',
        'decoration': 'casual',
        'build': 'simulation',
        'craft': 'simulation',
        'repair': 'simulation',
        'puzzle-adventure': 'puzzle',
        'rpg': 'adventure',
        'mmorpg': 'adventure',
        'moba': 'strategy',
        'battle-royale': 'shooter',
        'fps': 'shooter',
        'tps': 'shooter',
        'tower-defense': 'strategy',
        'defense': 'strategy',
        'rts': 'strategy',
        'turn-based': 'strategy',
        'idle-tycoon': 'simulation',
        'clicker-idle': 'casual',
        'physics': 'puzzle',
        'gravity': 'puzzle',
        'color': 'puzzle',
        'number': 'puzzle',
        'logic': 'puzzle',
        'brain': 'puzzle',
        'maze': 'puzzle',
        'escape-room': 'puzzle',
        'detective': 'puzzle',
        'mystery': 'adventure',
        'crime': 'adventure',
        'police': 'action',
        'firefighter': 'action',
        'pilot': 'action',
        'driver': 'racing',
        'taxi': 'racing',
        'bus': 'simulation',
        'train': 'simulation',
        'airplane': 'action',
        'helicopter': 'action',
        'submarine': 'adventure',
        'ship': 'adventure',
        'boat': 'casual',
        'sailing': 'casual',
        'diving': 'adventure',
    };

    function mapCategory(gpxCategory) {
        const cat = (gpxCategory || '').toLowerCase().trim();
        return CATEGORY_MAP[cat] || 'casual';
    }

    function formatPlays(qualityScore) {
        // GamePix doesn't provide play counts, use quality_score as a proxy
        // quality_score ranges 0-1, map to display values
        if (qualityScore >= 0.95) return '1M+';
        if (qualityScore >= 0.85) return '500K+';
        if (qualityScore >= 0.7) return '100K+';
        if (qualityScore >= 0.5) return '50K+';
        return '10K+';
    }

    function getCacheKey(page, pagination) {
        return `${CACHE_PREFIX}page_${page}_per_${pagination}`;
    }

    function getCached(page, pagination) {
        try {
            const key = getCacheKey(page, pagination);
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    function setCache(page, pagination, data) {
        try {
            const key = getCacheKey(page, pagination);
            localStorage.setItem(key, JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
        } catch (e) {
            // localStorage full or unavailable, ignore
        }
    }

    function transformGame(item) {
        const ns = item.namespace || item.id || '';
        return {
            id: ns,
            title: item.title || 'Unknown Game',
            category: mapCategory(item.category),
            description: item.description || '',
            thumbnail: item.banner_image || item.image || '',
            thumbnailSmall: item.image || item.banner_image || '',
            gameUrl: item.url || '',
            plays: formatPlays(item.quality_score || 0),
            rating: Math.round((item.quality_score || 0.5) * 5 * 10) / 10,
            badge: '', // Could derive from date_published
            source: 'gamepix',
            qualityScore: item.quality_score || 0,
            width: item.width || 800,
            height: item.height || 600,
            orientation: item.orientation || 'all',
            responsive: item.responsive || false,
            datePublished: item.date_published || '',
            dateModified: item.date_modified || ''
        };
    }

    async function fetchGames(page = 1, perPage = 12) {
        // Check cache first
        const cached = getCached(page, perPage);
        if (cached) {
            return cached;
        }

        const url = `${BASE_URL}?sid=${SID}&per_page=${perPage}&page=${page}&order=quality`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`GamePix API error: ${response.status}`);
        }

        const feed = await response.json();

        // Extract games from items array (JSON Feed format)
        // GamePix API returns items directly - no _gpx wrapper needed
        const games = (feed.items || []).map(transformGame);

        // Get category list from all games
        const categories = [...new Set(games.map(g => g.category))];

        const lastPage = feed.last_page_url
            ? parseInt(new URL(feed.last_page_url).searchParams.get('page') || '1')
            : page;

        const result = {
            games,
            categories,
            hasMore: lastPage > page,
            nextPage: page + 1,
            totalPage: lastPage
        };

        // Cache the result
        setCache(page, perPage, result);

        return result;
    }

    return {
        fetchGames,
        mapCategory,
        CACHE_TTL,
        CACHE_PREFIX
    };
})();
