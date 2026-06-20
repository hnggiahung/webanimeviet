/**
 * main.js - Trang chủ: Danh sách phim hoạt hình từ API Ophim
 * 
 * CẢI TIẾN LỚN:
 * 1. Phân trang - Lấy TOÀN BỘ phim từ API (không chỉ trang 1)
 * 2. Lọc anime hoạt hình chính xác
 * 3. Lưu cache dạng UPSERT - không mất phim cũ
 * 4. Tìm kiếm mở rộng trên nhiều trường
 * 5. Tự động đồng bộ mỗi 30 phút
 * 6. Banner redesign 2026 (gradient overlay, meta badges, avatars)
 * 7. Group grid - Thu gọn danh sách theo nhóm 9 phim
 * 8. Lazy load ảnh bằng IntersectionObserver + shimmer skeleton
 */

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22200%22 height%3D%22300%22 viewBox%3D%220 0 200 300%22%3E%3Crect width%3D%22200%22 height%3D%22300%22 fill%3D%22%23181a20%22%2F%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2214%22 fill%3D%22%23555566%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
const DEMO_BG = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22800%22 height%3D%22400%22 viewBox%3D%220 0 800 400%22%3E%3Crect width%3D%22800%22 height%3D%22400%22 fill%3D%22%2312121a%22/%3E%3Ccircle cx%3D%22400%22 cy%3D%22200%22 r%3D%22100%22 fill%3D%22%232a2a3a%22 opacity%3D%220.5%22/%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2224%22 fill%3D%22%23666677%22%3E%F0%9F%8E%AC%3C%2Ftext%3E%3C%2Fsvg%3E';
let IMG_BASE = 'https://img.ophim.live/uploads/movies/';
const CACHE_KEY = 'anime_data';
const CACHE_TIME_KEY = 'anime_data_time';
const CACHE_META_KEY = 'anime_data_meta';
const MAX_RETRIES = 2;
const API_DELAY_MS = 500; // Delay giữa các request tránh spam API
const ITEMS_PER_PAGE = 24;

// ====== BIẾN GLOBAL ======
let allMovies = [];
let displayCount = 12;
const LAZY_STEP = 12;
let currentCategory = 'all';
let currentFiltered = null;
let currentPage = 1;
let totalPages = 1;
let isLoadingMore = false;
let renderedMovieIds = new Set();
let intersectionObserver = null;
let swiperInstance = null;
let syncInProgress = false;

// ====== LAZY LOAD OBSERVER (cho ảnh card) ======
let imageObserver = null;

// ====== GROUP GRID STATE ======
const ITEMS_PER_GROUP = 9;
const groupExpanded = {};

// ====== DANH SÁCH ĐEN (BLOCKLIST) - Keywords LOẠI BỎ phim người thật ======
const BLOCKLIST_KEYWORDS = [
    'live-action', 'người đóng', 'nguoi dong',
    'phim chiếu rạp', 'chieu rap',
    'behind the scene', 'making of', 
    'trailer', 'teaser', 'phim ngắn', 'short film',
    'doraemon live action', 'one piece live action', 
    'death note live action', 'attack on titan live action',
    'fullmetal alchemist live action',
    'cinderella', 'beauty and the beast', 'aladdin live action',
    'mulan live action', 'lion king', 'the little mermaid',
    'barbie', 'disney live action',
];

// ====== DANH SÁCH TRẮNG (WHITELIST) cho CATEGORY ======
const ANIME_CATEGORY_KEYWORDS = [
    'anime', 'hoạt hình', 'hoat hinh', 'shounen', 'shoujo', 'seinen',
    'mecha', 'slice of life', 'super power', 'magic', 'fantasy anime',
    'japanese anime', 'anime vietsub', 'anime bộ', 'anime lẻ',
    'manga', 'japan', 'nhật bản', 'nhật',
];

const ANIME_STYLE_CATEGORIES = [
    'shounen', 'shoujo', 'seinen', 'mecha', 'magic', 'slice of life',
    'super power', 'school', 'harem', 'isekai', 'romance anime',
    'fantasy anime', 'action anime', 'comedy anime', 'drama anime',
];

const ALL_GENRES = [
    'Anime', 'Hành Động', 'Phiêu Lưu', 'Chính Kịch', 'Siêu Nhân', 'Hài Hước',
    'Kinh Dị', 'Tình Cảm', 'Tâm Lý', 'Viễn Tưởng', 'Võ Thuật', 'Học Đường',
    'Phép Thuật', 'Khoa Học', 'Âm Nhạc', 'Thể Thao', 'Siêu Nhiên', 'Lịch Sử',
    'Chiến Tranh', 'Đời Thường', 'Mecha', 'Romance', 'Shounen', 'Seinen',
    'Shoujo', 'Slice of Life', 'Super Power', 'Fantasy', 'Horror', 'Thriller',
    'Mystery', 'Drama', 'Comedy', 'Action', 'Adventure'
];

// ====== BƯỚC 3: HÀM LỌC ANIME HOẠT HÌNH (CHẶT CHẼ) ======
function isAnimeCartoon(movie) {
    if (!movie) return false;

    const typeFields = [
        movie.type, movie.format, movie.kind,
        movie.category, movie.genre,
        Array.isArray(movie.category) ? movie.category.map(c => typeof c === 'object' ? c.name : c).join(' ') : '',
        Array.isArray(movie.tags) ? movie.tags.join(' ') : ''
    ].filter(Boolean).join(' ').toLowerCase();

    const titleField = [
        movie.name, movie.title, movie.origin_name,
        movie.originName, movie.alternative_names
    ].filter(Boolean).join(' ').toLowerCase();

    const blockedTypes = [
        'live action', 'live-action', 'người đóng', 'nguoi dong',
        'phim lẻ người thật', 'phim bộ người thật', 'phim chiếu rạp',
        'drama', 'variety', 'reality', 'documentary', 'tvshows',
        'tv show', 'talk show', 'news', 'sport'
    ];

    const allowedTypes = [
        'anime', 'hoạt hình', 'hoat hinh', 'animation',
        'animated', 'donghua', 'dong hua', 'cartoon',
        'motion comic', 'webtoon', '3d animation', 'cgi',
        'hoathinh', 'hoạt hình nhật bản', 'anime vietsub',
        'anime bộ', 'anime lẻ', 'anime movie', 'movie anime',
        'tv anime', 'anime series', 'anime tv'
    ];

    // Ưu tiên 1: type === 'hoathinh' là chắc chắn anime
    if (movie.type === 'hoathinh') return true;
    
    // Ưu tiên 2: Nếu type là 'series' hoặc 'single', kiểm tra category
    if (movie.type === 'series' || movie.type === 'single' || !movie.type) {
        // Kiểm tra category slugs
        if (Array.isArray(movie.category)) {
            const catSlugs = movie.category.map(c => typeof c === 'object' ? c.slug : '').filter(Boolean);
            const catNames = movie.category.map(c => typeof c === 'object' ? c.name : '').filter(Boolean);
            
            // Nếu có slug 'hoat-hinh' hoặc 'anime' → chắc chắn là anime
            if (catSlugs.some(s => s === 'hoat-hinh' || s === 'anime')) return true;
            if (catNames.some(n => n.toLowerCase() === 'anime' || n.toLowerCase() === 'hoạt hình')) return true;
            
            // Nếu category là thể loại anime điển hình (shounen, seinen, mecha...) → giữ lại
            const animeGenres = ['shounen', 'shoujo', 'seinen', 'mecha', 'magic', 'slice of life',
                'super power', 'school', 'harem', 'isekai', 'romance', 'comedy anime',
                'action anime', 'drama anime', 'fantasy anime', 'ecchi', 'demons',
                'supernatural', 'military', 'police', 'psychological', 'thriller',
                'samurai', 'vampire', 'josei', 'kids', 'game', 'martial arts',
                'parody', 'sports', 'music', 'space', 'sci-fi'];
            if (catSlugs.some(s => animeGenres.includes(s))) return true;
            if (catNames.some(n => animeGenres.includes(n.toLowerCase()))) return true;
        }
        
        // Kiểm tra title có chứa từ khóa anime không
        if (allowedTypes.some(k => titleField.includes(k))) return true;
        
        // Kiểm tra typeFields
        if (allowedTypes.some(k => typeFields.includes(k))) return true;
    }
    
    // Ưu tiên 3: Block phim người đóng
    if (blockedTypes.some(k => typeFields.includes(k))) return false;
    if (blockedTypes.some(k => titleField.includes(k))) return false;
    
    // Mặc định: KHÔNG giữ lại nếu không chắc chắn (tránh lẫn phim lạ)
    return false;
}

// ====== BƯỚC 2: LẤY TOÀN BỘ PHIM TỪ API (PHÂN TRANG + NHIỀU NGUỒN) ======
async function fetchAllAnimeFromAPI() {
    let allMovies = [];
    let seenSlugs = new Set();
    let maxPages = 200;
    let consecutiveEmptyPages = 0;

    console.log('📡 [FETCH ALL] Bắt đầu lấy toàn bộ phim từ API...');

    // === NGUỒN 1: Lấy từ endpoint danh-sach/hoat-hinh (chuyên cho anime) ===
    console.log('📡 [FETCH ALL] === NGUỒN 1: danh-sach/hoat-hinh ===');
    for (let page = 1; page <= 50; page++) {
        try {
            const url = `https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=${page}`;
            const res = await fetchWithRetry(url);
            
            const cdnDomain = res?.data?.APP_DOMAIN_CDN_IMAGE;
            if (cdnDomain && page === 1) {
                IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
            }

            const pagination = res?.data?.params?.pagination || {};
            const totalItems = pagination.totalItems || 0;
            const totalItemsPerPage = pagination.totalItemsPerPage || ITEMS_PER_PAGE;
            const totalPageCount = Math.ceil(totalItems / totalItemsPerPage) || 1;
            
            if (page === 1) {
                console.log(`📊 [FETCH ALL - HOAT HINH] Tổng số phim: ${totalItems}, Tổng số trang: ${totalPageCount}`);
            }

            const movies = res?.data?.items || res?.items || [];
            if (!movies || movies.length === 0) {
                consecutiveEmptyPages++;
                if (consecutiveEmptyPages >= 3) break;
                continue;
            }
            consecutiveEmptyPages = 0;

            // Endpoint hoat-hinh đã là anime, không cần lọc
            movies.forEach(m => {
                const slug = m.slug || m._id || '';
                if (slug && !seenSlugs.has(slug)) {
                    seenSlugs.add(slug);
                    allMovies.push(m);
                }
            });
            
            console.log(`📡 [FETCH ALL - HOAT HINH] Trang ${page}: +${movies.length} phim, tổng: ${allMovies.length}`);

            if (page >= totalPageCount) break;
            await new Promise(r => setTimeout(r, API_DELAY_MS));
        } catch (err) {
            console.error(`❌ [FETCH ALL - HOAT HINH] Lỗi trang ${page}:`, err.message);
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= 3) break;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // === NGUỒN 2: Lấy từ endpoint phim-moi-cap-nhat (bổ sung thêm) ===
    console.log('📡 [FETCH ALL] === NGUỒN 2: phim-moi-cap-nhat ===');
    consecutiveEmptyPages = 0;
    for (let page = 1; page <= maxPages; page++) {
        try {
            const url = `https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`;
            const res = await fetchWithRetry(url);

            const pagination = res?.data?.params?.pagination || {};
            const totalItems = pagination.totalItems || 0;
            const totalItemsPerPage = pagination.totalItemsPerPage || ITEMS_PER_PAGE;
            const totalPageCount = Math.ceil(totalItems / totalItemsPerPage) || 1;
            
            if (page === 1) {
                console.log(`📊 [FETCH ALL - MOI CAP NHAT] Tổng số phim: ${totalItems}, Tổng số trang: ${totalPageCount}`);
            }

            const movies = res?.data?.items || res?.items || [];
            if (!movies || movies.length === 0) {
                consecutiveEmptyPages++;
                if (consecutiveEmptyPages >= 3) break;
                continue;
            }
            consecutiveEmptyPages = 0;

            const animeMovies = movies.filter(isAnimeCartoon);
            let added = 0;
            animeMovies.forEach(m => {
                const slug = m.slug || m._id || '';
                if (slug && !seenSlugs.has(slug)) {
                    seenSlugs.add(slug);
                    allMovies.push(m);
                    added++;
                }
            });
            
            console.log(`📡 [FETCH ALL - MOI CAP NHAT] Trang ${page}: ${movies.length} phim, +${added} anime mới, tổng: ${allMovies.length}`);

            if (page >= totalPageCount) break;
            await new Promise(r => setTimeout(r, API_DELAY_MS));
        } catch (err) {
            console.error(`❌ [FETCH ALL - MOI CAP NHAT] Lỗi trang ${page}:`, err.message);
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= 3) break;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log(`✅ [FETCH ALL] HOÀN TẤT! Tổng phim anime: ${allMovies.length}`);
    return allMovies;
}

// ====== BƯỚC 4: LƯU VÀO CACHE - UPSERT KHÔNG XOÁ ======
function saveMoviesToCache(newMovies) {
    if (!newMovies || newMovies.length === 0) return { added: 0, updated: 0, skipped: 0 };

    let added = 0, updated = 0, skipped = 0;

    let existingMovies = [];
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) existingMovies = JSON.parse(cached);
    } catch (e) { /* ignore */ }

    const existingMap = new Map();
    existingMovies.forEach(m => {
        const key = m.slug || m._id || m.name || '';
        if (key) existingMap.set(key, m);
    });

    newMovies.forEach(movie => {
        try {
            const uniqueKey = movie.slug || movie._id || movie.name || '';
            if (!uniqueKey) { skipped++; return; }

            const existing = existingMap.get(uniqueKey);

            if (existing) {
                existingMap.set(uniqueKey, {
                    ...existing,
                    name: movie.name || existing.name,
                    title: movie.title || existing.title,
                    origin_name: movie.origin_name || existing.origin_name,
                    thumb_url: movie.thumb_url || existing.thumb_url,
                    poster_url: movie.poster_url || existing.poster_url,
                    episode_current: movie.episode_current || existing.episode_current,
                    episode_total: movie.episode_total || existing.episode_total,
                    quality: movie.quality || existing.quality,
                    lang: movie.lang || existing.lang,
                    year: movie.year || existing.year,
                    type: movie.type || existing.type,
                    category: movie.category || existing.category,
                    status: movie.status || existing.status,
                    modified: movie.modified || existing.modified,
                    updated_at: new Date().toISOString()
                });
                updated++;
            } else {
                existingMap.set(uniqueKey, {
                    ...movie,
                    views: movie.views || movie.view || 0,
                    visible: true,
                    is_anime: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                added++;
            }
        } catch (err) {
            console.error('❌ Lỗi upsert phim:', movie?.name || movie?.title, err);
            skipped++;
        }
    });

    const mergedMovies = Array.from(existingMap.values());

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(mergedMovies));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        localStorage.setItem(CACHE_META_KEY, JSON.stringify({
            total: mergedMovies.length,
            lastSync: new Date().toISOString(),
            added,
            updated,
            skipped
        }));
    } catch (e) {
        console.error('❌ Lỗi lưu cache:', e.message);
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            try {
                const trimmed = mergedMovies.slice(-1000);
                localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
                console.warn('⚠️ Cache bị giới hạn, chỉ lưu 1000 phim gần nhất');
            } catch (e2) { /* ignore */ }
        }
    }

    console.log(`✅ [UPSERT] Thêm mới: ${added} | Cập nhật: ${updated} | Lỗi: ${skipped} | Tổng cache: ${mergedMovies.length}`);
    return { added, updated, skipped, total: mergedMovies.length };
}

// ====== HÀM LẤY CACHE ======
function getCachedMovies() {
    try {
        const data = localStorage.getItem(CACHE_KEY);
        const time = localStorage.getItem(CACHE_TIME_KEY);
        if (!data || !time) return null;
        return JSON.parse(data);
    } catch (e) { return null; }
}

function getCacheMeta() {
    try {
        const meta = localStorage.getItem(CACHE_META_KEY);
        return meta ? JSON.parse(meta) : null;
    } catch (e) { return null; }
}

// ====== BƯỚC 6: SCHEDULER TỰ ĐỘNG CẬP NHẬT ======
async function autoSync() {
    if (syncInProgress) {
        console.log('🔄 [SYNC] Đã có tiến trình sync đang chạy, bỏ qua...');
        return;
    }

    syncInProgress = true;
    console.log('🔄 [SYNC] Bắt đầu đồng bộ anime tự động...');

    try {
        const fetchedMovies = await fetchAllAnimeFromAPI();
        const result = saveMoviesToCache(fetchedMovies);

        const container = document.getElementById('anime-groups-container');
        if (container && document.querySelector('.app-container')) {
            const meta = getCacheMeta();
            if (meta && meta.total > 0) {
                const cached = getCachedMovies();
                if (cached && cached.length > 0) {
                    container.innerHTML = '';
                    renderedMovieIds.clear();
                    destroyImageLazyLoader();
                    window.allMovies = cached;
                    allMovies = cached;
                    syncWindowExports();
                    renderMovieGroups(allMovies, container);
                    initBanner(cached);
                    renderSuggestions(cached);
                    renderKeywords();
                    renderTopMovies();
                }
            }
        }

        console.log(`✅ [SYNC] Hoàn tất! +${result.added} mới, ~${result.updated} cập nhật, tổng: ${result.total} phim`);
    } catch (err) {
        console.error('❌ [SYNC] Lỗi đồng bộ:', err.message);
    } finally {
        syncInProgress = false;
    }
}

// ====== HÀM FETCH CŨ ĐÃ ĐƯỢC CẢI TIẾN ======
function safeFilterAnimeOnly(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return data || [];
    return data.filter(isAnimeCartoon);
}

function buildImageUrl(thumb_url, poster_url) {
    const img = thumb_url || poster_url || '';
    if (!img || img.trim() === '') return PLACEHOLDER;
    if (img.startsWith('http://') || img.startsWith('https://')) {
        return img.replace('http://', 'https://');
    }
    const cleanName = img.trim().replace(/^\//, '');
    return IMG_BASE + cleanName;
}

function safeEpisodeDisplay(episode) {
    return episode ? `Tập ${episode}` : "Đang cập nhật";
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`⚠️ Lần thử ${attempt + 1}/${retries + 1} thất bại:`, error.message);
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw error;
            }
        }
    }
}

function cacheMovies(movies) {
    saveMoviesToCache(movies);
}

function formatViews(views) {
    if (!views) return '0';
    const num = parseInt(views);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    return num.toLocaleString('en-US');
}

function getCategoryString(movie) {
    if (Array.isArray(movie.category)) {
        return movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean).slice(0, 2).join(', ');
    }
    return 'Hoạt hình';
}

function getCategories(movie) {
    if (Array.isArray(movie.category)) {
        return movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean);
    }
    return [];
}

// ====== HÀM TẠO THẺ PHIM (CARD) VỚI DATA-SRC LAZY LOAD ======
function createMovieCardHTML(movie) {
    try {
        const title = movie.name || movie.title || 'Không có tên';
        const slug = movie.slug || movie._id || '';
        const displayEp = safeEpisodeDisplay(movie.episode_current);
        const thumbUrl = movie.thumb_url || movie.thumb || '';
        const posterUrl = movie.poster_url || '';
        const imgSrc = buildImageUrl(thumbUrl, posterUrl);
        const views = formatViews(movie.view || movie.views || 0);
        const rating = movie.tmdb?.vote_average || movie.vote_average || 'N/A';

        const isComplete = displayEp.toLowerCase().includes('hoàn') || movie.episode_current === 'full' || movie.status === 'completed';
        const episodeBadgeClass = isComplete ? 'badge-episode complete' : 'badge-episode';
        
        let episodeNum = '';
        const epMatch = displayEp.match(/\d+/);
        const epNumber = epMatch ? epMatch[0] : '';
        const epNumberClass = epNumber.length > 2 ? 'episode-number small' : 'episode-number';
        
        let episodeLabelHtml;
        if (isComplete) {
            episodeLabelHtml = `
                <span class="episode-label">HOÀN</span>
                <span class="episode-number">TẤT</span>`;
        } else {
            episodeLabelHtml = `
                <span class="episode-label">TẬP</span>
                <span class="${epNumberClass}">${epNumber}</span>`;
        }

        return `
            <div class="anime-card" data-slug="${slug}">
                <a href="watch.html?id=${slug}" class="anime-card-link">
                    <div class="anime-card-thumb">
                        <div class="skeleton-placeholder"></div>
                        <img 
                            data-src="${imgSrc}" 
                            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                            alt="${title}" 
                            width="200"
                            height="300"
                            loading="lazy"
                            decoding="async"
                            onerror="this.onerror=null; this.classList.add('img-error'); this.parentElement.classList.add('loaded'); this.src='${PLACEHOLDER}';"
                            onload="this.classList.add('loaded'); this.parentElement.classList.add('loaded')">
                        
                        <div class="badge-score">
                            <span class="star-icon">★</span>
                            ${rating}
                        </div>
                        
                        <div class="${episodeBadgeClass}">${episodeLabelHtml}</div>
                    </div>
                    <div class="anime-card-info">
                        <h3 class="anime-card-title">${title}</h3>
                        <div class="anime-card-views">Lượt xem: ${views}</div>
                    </div>
                </a>
            </div>`;
    } catch (e) {
        console.error('❌ Lỗi tạo thẻ phim HTML:', e.message, movie);
        return `
            <div class="anime-card" style="padding:20px;text-align:center;color:var(--text-sub);font-size:var(--font-size-base);">
                <p>Không thể hiển thị phim</p>
                <p style="font-size:var(--font-size-xs);opacity:0.6;">${movie?.name || movie?.title || 'Không xác định'}</p>
            </div>`;
    }
}

// ====== RENDER MOVIE LIST (đơn giản: 18 phim đầu + 1 nút Xem Thêm) ======
let showAllMovies = false;

function renderMovieGroups(movies, container) {
    if (!movies || movies.length === 0) return;
    if (!container) container = document.getElementById('anime-groups-container');
    if (!container) return;
    
    // Ẩn grid cũ
    const oldGrid = document.getElementById('movies-grid');
    if (oldGrid) oldGrid.style.display = 'none';
    container.style.display = 'block';
    
    const visibleList = showAllMovies ? movies : movies.slice(0, 18);
    
    container.innerHTML = '';
    
    // Grid chứa card
    const gridDiv = document.createElement('div');
    gridDiv.className = 'anime-grid';
    gridDiv.id = 'movie-grid-main';
    
    gridDiv.innerHTML = visibleList.map(m => {
        const id = m.slug || m._id || '';
        if (id) renderedMovieIds.add(id);
        return createMovieCardHTML(m);
    }).join('');
    
    container.appendChild(gridDiv);
    
    // 1 nút toggle duy nhất
    if (movies.length > 18) {
        const wrapDiv = document.createElement('div');
        wrapDiv.style.cssText = 'display:flex;justify-content:center;margin:16px 0;';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = showAllMovies ? '▲ Thu Gọn' : '▼ Xem Thêm';
        toggleBtn.style.cssText = 'background:rgba(255,255,255,0.08);color:#eee;border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:10px 40px;font-size:14px;cursor:pointer;transition:background 0.2s;';
        toggleBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255,255,255,0.15)';
        });
        toggleBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255,255,255,0.08)';
        });
        toggleBtn.addEventListener('click', function() {
            showAllMovies = !showAllMovies;
            renderMovieGroups(movies, container);
            // Khi mở hết, lazy load tất cả ảnh
            if (showAllMovies) {
                const newGrid = document.getElementById('movie-grid-main');
                if (newGrid) initImageLazyLoader(newGrid);
            }
        });
        
        wrapDiv.appendChild(toggleBtn);
        container.appendChild(wrapDiv);
    }
    
    // Lazy load cho ảnh hiện tại
    initImageLazyLoader(gridDiv);
}

// ====== LAZY LOAD ẢNH BẰNG INTERSECTION OBSERVER ======
function initImageLazyLoader(container) {
    if (!container) container = document;
    
    if (!imageObserver) {
        imageObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            },
            { 
                rootMargin: '300px 0px',
                threshold: 0.01 
            }
        );
    }
    
    // Observe ALL images with data-src in container (including new ones)
    container.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

function destroyImageLazyLoader() {
    if (imageObserver) {
        imageObserver.disconnect();
        imageObserver = null;
    }
}

// ====== OLD FUNCTIONS (giữ tương thích) ======
function renderMovies(movies, container) {
    if (!container) container = document.getElementById('anime-groups-container');
    renderMovieGroups(movies, container);
}

function renderSuggestions(movies) {
    const container = document.getElementById('suggestions-list');
    if (!container || !movies || movies.length === 0) return;
    const sorted = [...movies].sort((a, b) => {
        const viewA = parseInt(a.view || a.views || 0);
        const viewB = parseInt(b.view || b.views || 0);
        return viewB - viewA;
    }).slice(0, 4);

    let html = '';
    sorted.forEach((movie) => {
        const title = movie.name || movie.title || 'Phim mới';
        const slug = movie.slug || movie._id || '';
        const year = movie.year || '';
        const ep = safeEpisodeDisplay(movie.episode_current);
        const quality = movie.quality || 'FHD';
        const lang = movie.lang || 'Vietsub';

        html += `
            <a href="watch.html?id=${slug}" class="suggestion-card">
                <div class="suggestion-card-info">
                    <div class="suggestion-card-title">${title}</div>
                    <div class="suggestion-card-meta">${year} • ${quality} • ${lang}</div>
                </div>
                <span class="suggestion-card-badge">${ep}</span>
            </a>`;
    });

    container.innerHTML = html;
}

function renderKeywords() {
    const containers = [
        document.getElementById('sidebar-keywords'),
        document.getElementById('sidebar-keywords-mobile')
    ].filter(Boolean);
    if (containers.length === 0) return;

    let keywords = new Set();
    if (allMovies && allMovies.length > 0) {
        allMovies.forEach(movie => {
            if (Array.isArray(movie.category)) {
                movie.category.forEach(c => {
                    const name = typeof c === 'object' ? c.name : c;
                    if (name) keywords.add(name.trim());
                });
            }
        });
    }

    let keywordArray = Array.from(keywords).filter(Boolean);
    if (keywordArray.length < 10) {
        keywordArray = ALL_GENRES;
    }

    const shuffled = [...keywordArray].sort(() => Math.random() - 0.5).slice(0, 18);
    const html = shuffled.map(kw => {
        const slug = kw.toLowerCase()
            .replace(/đ/g, 'd').replace(/Đ/g, 'd')
            .replace(/[\s]+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        return `<a href="#" class="keyword-tag" onclick="event.preventDefault(); if(typeof window.filterByCategory === 'function') window.filterByCategory('${slug}');">${kw}</a>`;
    }).join('');

    containers.forEach(container => { container.innerHTML = html; });
}

function renderTopMovies() {
    const containers = [
        document.getElementById('sidebar-top-movies'),
        document.getElementById('sidebar-top-movies-mobile')
    ].filter(Boolean);
    if (containers.length === 0) return;

    const sorted = allMovies && allMovies.length > 0
        ? [...allMovies].sort((a, b) => {
            const viewA = parseInt(a.view || a.views || 0);
            const viewB = parseInt(b.view || b.views || 0);
            return viewB - viewA;
        }).slice(0, 10)
        : [];

    if (sorted.length === 0) {
        const fallbackHtml = `<div class="text-center" style="color:var(--text-dim);font-size:var(--font-size-xs);padding:16px;">Chưa có dữ liệu</div>`;
        containers.forEach(c => c.innerHTML = fallbackHtml);
        return;
    }

    let html = '';
    sorted.forEach((movie, idx) => {
        const rank = idx + 1;
        const title = movie.name || movie.title || 'Không có tên';
        const slug = movie.slug || movie._id || '';
        const year = movie.year || '';
        const rating = movie.tmdb?.vote_average || movie.vote_average || 'N/A';
        const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';

        html += `
            <a href="watch.html?id=${slug}" class="top-movie-item">
                <span class="top-movie-rank ${rankClass}">${rank}</span>
                <div class="top-movie-info">
                    <div class="top-movie-name">${title}</div>
                    <div class="top-movie-year">${year}</div>
                </div>
                <span class="top-movie-score">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="display:inline;vertical-align:-1px">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    ${rating}
                </span>
            </a>`;
    });

    containers.forEach(container => { container.innerHTML = html; });
}

window.handleRandomAnime = function() {
    let movies = allMovies;
    if (!movies || movies.length === 0) {
        try {
            const cached = localStorage.getItem('anime_data');
            if (cached) movies = JSON.parse(cached);
        } catch(e) {}
    }
    if (!movies || movies.length === 0) {
        alert('Chưa có dữ liệu phim. Vui lòng đợi trang tải xong.');
        return;
    }
    const randomIndex = Math.floor(Math.random() * movies.length);
    const randomMovie = movies[randomIndex];
    if (randomMovie && (randomMovie.slug || randomMovie._id)) {
        const slug = randomMovie.slug || randomMovie._id;
        window.location.href = 'watch.html?id=' + slug;
    } else {
        alert('Không thể tìm phim ngẫu nhiên.');
    }
};

function syncWindowExports() {
    window.allMovies = allMovies;
    window.displayCount = displayCount;
    window.currentCategory = currentCategory;
    window.currentFiltered = currentFiltered;
}

// ====== THANH TÌM KIẾM ======
window.searchMovies = function(query) {
    const container = document.getElementById('anime-groups-container');
    if (!container) return;

    const q = query.toLowerCase().trim();
    if (!q) {
        currentCategory = 'all';
        currentFiltered = null;
        displayCount = 12;
        container.innerHTML = '';
        renderedMovieIds.clear();
        destroyImageLazyLoader();
        renderMovieGroups(allMovies, container);
        return;
    }

    const filtered = allMovies.filter(m => {
        const name = (m.name || m.title || '').toLowerCase();
        const originName = (m.origin_name || m.originName || '').toLowerCase();
        const altNames = Array.isArray(m.alternative_names) 
            ? m.alternative_names.join(' ').toLowerCase() 
            : (m.alternative_names || '').toLowerCase();
        const slug = (m.slug || '').toLowerCase();
        const catStr = getCategoryString(m).toLowerCase();
        
        return name.includes(q) || 
               originName.includes(q) || 
               altNames.includes(q) || 
               slug.includes(q) || 
               catStr.includes(q);
    });

    currentFiltered = filtered;
    container.innerHTML = '';
    renderedMovieIds.clear();
    destroyImageLazyLoader();

    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>Không tìm thấy kết quả</p>
                <p class="sub-text">Không tìm thấy phim nào với từ khóa "${q}"</p>
            </div>`;
        return;
    }

    displayCount = 12;
    renderMovieGroups(filtered, container);
};

async function loadFallbackData(container) {
    console.log('📁 Đang tải fallback từ data.json...');
    try {
        const response = await fetch('/data/data.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        let movies = data?.movies || data?.items || [];
        if (!movies || movies.length === 0) return [];

        const convertedMovies = movies.map(m => ({
            name: m.title || m.name || 'Không có tên',
            slug: m.slug || String(m.id || Math.random()),
            title: m.title || m.name || 'Không có tên',
            year: m.year || '2024',
            episode_current: m.episode_current || '1',
            type: 'hoathinh',
            thumb_url: m.cover_image || m.thumb_url || '',
            poster_url: m.poster_url || m.cover_image || '',
            quality: m.quality || 'FHD',
            lang: m.lang || 'Vietsub',
            category: Array.isArray(m.category) ? m.category.map(c => typeof c === 'string' ? {name: c, slug: c.toLowerCase().replace(/\s+/g, '-')} : c) : [{name: 'Hoạt hình', slug: 'hoat-hinh'}],
            content: m.content || m.description || '',
            description: m.description || m.content || '',
            view: m.view || m.views || Math.floor(Math.random() * 100000),
            modified: { time: m.date || new Date().toISOString().split('T')[0] }
        }));

        const hasMovies = container && container.querySelectorAll('.anime-card').length > 0;
        if (!hasMovies || !allMovies.length) {
            container.innerHTML = '';
            renderedMovieIds.clear();
            destroyImageLazyLoader();
            saveMoviesToCache(convertedMovies);
            allMovies = convertedMovies;
            syncWindowExports();
            renderMovieGroups(allMovies, container);
            initBanner(convertedMovies);
            renderSuggestions(convertedMovies);
            renderKeywords();
            renderTopMovies();
        }
        return convertedMovies;
    } catch (err) {
        console.error('⚠️ Fallback lỗi:', err.message);
        return [];
    }
}

function showAnimeUpdatingMessage(container) {
    if (!container) container = document.getElementById('anime-groups-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state" style="min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--gap-md);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.4;">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <p style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);color:var(--text-main);">Đang cập nhật danh mục...</p>
            <p style="font-size:var(--font-size-base);color:var(--text-dim);max-width:400px;text-align:center;">
                Danh mục phim hoạt hình đang được làm mới. Vui lòng quay lại sau!
            </p>
            <button onclick="location.reload()" style="margin-top:8px;padding:10px 28px;background:var(--accent-gradient, linear-gradient(135deg, #f59e0b, #d97706));border:none;border-radius:var(--radius-lg);color:#fff;font-size:var(--font-size-base);font-weight:var(--font-weight-medium);cursor:pointer;transition:opacity 0.2s;">
                ⟳ Thử lại
            </button>
        </div>`;
}

// ====== FETCH MOVIES CẢI TIẾN ======
async function fetchMovies(container, page) {
    console.log('📡 [ANIME] Đang tải trang:', page);
    const url = `https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`;

    try {
        const data = await fetchWithRetry(url);
        const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }

        const pagination = data?.data?.params?.pagination || {};
        totalPages = Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || ITEMS_PER_PAGE)) || 1;

        let apiMovies = data?.data?.items || data?.items || [];
        if (!apiMovies || apiMovies.length === 0) {
            const fallbackData = await loadFallbackData(container);
            if (fallbackData && fallbackData.length > 0) return fallbackData;
            if (!allMovies.length) showAnimeUpdatingMessage(container);
            return [];
        }

        apiMovies = apiMovies.filter(isAnimeCartoon);

        if (apiMovies.length === 0) {
            showAnimeUpdatingMessage(container);
            return [];
        }

        if (page === 1) {
            container.innerHTML = '';
            renderedMovieIds.clear();
            destroyImageLazyLoader();
            saveMoviesToCache(apiMovies);
            allMovies = apiMovies;
            syncWindowExports();
            renderMovieGroups(allMovies, container);
            initBanner(apiMovies);
            renderSuggestions(apiMovies);
            renderKeywords();
            renderTopMovies();
        } else {
            // Trang sau thì append vào allMovies và render lại groups
            allMovies = allMovies.concat(apiMovies);
            syncWindowExports();
            container.innerHTML = '';
            renderedMovieIds.clear();
            destroyImageLazyLoader();
            renderMovieGroups(allMovies, container);
            renderKeywords();
            renderTopMovies();
        }
        return apiMovies;
    } catch (err) {
        console.error('⚠️ [ANIME] API lỗi:', err.message);
        if (!allMovies || allMovies.length === 0) {
            try {
                const fallbackData = await loadFallbackData(container);
                if (fallbackData && fallbackData.length > 0) return fallbackData;
            } catch (fbErr) {
                console.error('⚠️ [ANIME] Fallback cũng lỗi:', fbErr.message);
            }
            showAnimeUpdatingMessage(container);
        }
        return [];
    }
}

// ====== LEGACY FUNCTIONS (giữ tương thích code cũ) ======
function setupLazyLoader(container) {
    // Không cần dùng nữa vì đã có group grid
}

function destroyLazyLoader() {
    destroyImageLazyLoader();
}

function loadMoreMovies(container) {
    // Không cần dùng nữa
}

async function loadNextPage() {
    if (isLoadingMore) return;
    if (currentPage >= totalPages) return;

    isLoadingMore = true;
    currentPage++;

    const container = document.getElementById('anime-groups-container');
    const newMovies = await fetchMovies(container, currentPage);

    if (!newMovies || newMovies.length === 0) {
        currentPage--;
    }

    isLoadingMore = false;
}

function setDefaultAnimeTab() {
    const allTab = document.querySelector('.filter-tab[data-category="all"]');
    if (allTab) {
        document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
        allTab.classList.add('active');
    }
}

// ====== DOMContentLoaded ======
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('anime-groups-container');
    if (!container) return;

    setDefaultAnimeTab();

    const cached = getCachedMovies();
    if (cached && cached.length > 0) {
        const limitedCache = cached.slice(0, 36); // Lấy 36 phim cho 4 group đầu
        allMovies = limitedCache.filter(isAnimeCartoon);
        syncWindowExports();
        container.innerHTML = '';
        renderedMovieIds.clear();
        
        if (allMovies.length > 0) {
            renderMovieGroups(allMovies, container);
            initBanner(limitedCache);
            renderSuggestions(limitedCache);
        } else {
            showAnimeUpdatingMessage(container);
        }
        
        const runAfterRender = (fn) => {
            if (window.requestIdleCallback) {
                requestIdleCallback(fn, { timeout: 3000 });
            } else {
                setTimeout(fn, 500);
            }
        };
        
        runAfterRender(() => {
            renderKeywords();
            renderTopMovies();
        });
    }

    // Fetch API trang 1
    await new Promise(r => setTimeout(r, 200));
    
    try {
        const data = await fetchWithRetry('https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=1');
        const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }
        const pagination = data?.data?.params?.pagination || {};
        totalPages = Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || ITEMS_PER_PAGE)) || 1;
        let apiMovies = data?.data?.items || data?.items || [];
        
        if (apiMovies && apiMovies.length > 0) {
            apiMovies = apiMovies.filter(isAnimeCartoon);
            
            if (apiMovies.length > 0) {
                setTimeout(() => saveMoviesToCache(apiMovies), 100);
                
                container.innerHTML = '';
                renderedMovieIds.clear();
                destroyImageLazyLoader();
                allMovies = apiMovies;
                syncWindowExports();
                renderMovieGroups(allMovies, container);
                initBanner(apiMovies);
                renderSuggestions(apiMovies);
                
                setTimeout(() => {
                    renderKeywords();
                    renderTopMovies();
                }, 300);
            }
        }
    } catch (err) {
        console.warn('⚠️ [ANIME] API lỗi:', err.message);
        if (!cached || cached.length === 0) {
            const fallbackData = await loadFallbackData(container);
            if (fallbackData && fallbackData.length > 0) {
                const fallbackAnime = fallbackData.filter(isAnimeCartoon);
                if (fallbackAnime.length > 0) {
                    container.innerHTML = '';
                    renderedMovieIds.clear();
                    destroyImageLazyLoader();
                    allMovies = fallbackAnime;
                    syncWindowExports();
                    renderMovieGroups(allMovies, container);
                    renderSuggestions(fallbackAnime);
                    setTimeout(() => {
                        renderKeywords();
                        renderTopMovies();
                    }, 300);
                } else {
                    showAnimeUpdatingMessage(container);
                }
            } else {
                showAnimeUpdatingMessage(container);
            }
        }
    }

    // Sync sau 12 giây
    setTimeout(() => {
        autoSync();
    }, 12000);

    setInterval(autoSync, 45 * 60 * 1000);

    const randomBtn = document.getElementById('random-anime-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', (e) => { e.preventDefault(); handleRandomAnime(); });
    }

    // Load More button (load next page / thêm group)
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                loadNextPage();
            } else {
                // Nếu hết trang, thử load thêm từ cache
                const cachedData = getCachedMovies();
                if (cachedData && cachedData.length > allMovies.length) {
                    allMovies = cachedData.filter(isAnimeCartoon);
                    syncWindowExports();
                    container.innerHTML = '';
                    renderedMovieIds.clear();
                    destroyImageLazyLoader();
                    renderMovieGroups(allMovies, container);
                }
            }
        });
    }

    // Init new features
    initNewFeatures();
});

// ====== loadAllAnimeMovies ======
async function loadAllAnimeMovies(container) {
    console.log('🎬 [ANIME] Bắt đầu tải toàn bộ phim anime...');
    
    try {
        const apiMovies = await fetchAllAnimeFromAPI();
        
        container.innerHTML = '';
        renderedMovieIds.clear();
        destroyImageLazyLoader();
        
        if (!apiMovies || apiMovies.length === 0) {
            showAnimeUpdatingMessage(container);
            return;
        }
        
        saveMoviesToCache(apiMovies);
        allMovies = apiMovies;
        syncWindowExports();
        renderMovieGroups(allMovies, container);
        renderKeywords();
        renderTopMovies();
    } catch (err) {
        console.error('⚠️ [ANIME] Lỗi:', err.message);
        showAnimeUpdatingMessage(container);
    }
}

async function fetchMoviesByCategory(slug) {
    const url = `https://ophim1.com/v1/api/the-loai/${slug}?page=1`;
    try {
        const response = await fetchWithRetry(url);
        const cdnDomain = response?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }
        let items = response?.data?.items || [];
        if (slug !== 'hoat-hinh') {
            items = items.filter(isAnimeCartoon);
        }
        return items;
    } catch (err) {
        console.error('⚠️ [fetchMoviesByCategory] Lỗi:', err.message);
        return [];
    }
}

const CATEGORY_SLUG_MAP = {
    'all': 'all', 'hanh-dong': 'hanh-dong', 'phieu-luu': 'phieu-luu',
    'chinh-kich': 'chinh-kich', 'hoat-hinh': 'hoat-hinh', 'sieu-nhan': 'sieu-nhan',
    'anime': 'hoat-hinh', 'hoat-hinh-trung-quoc': 'hoat-hinh-trung-quoc',
    'hai-huoc': 'hai-huoc', 'kinh-di': 'kinh-di', 'tinh-cam': 'tinh-cam',
    'tam-ly': 'tam-ly', 'vien-tuong': 'vien-tuong', 'vo-thuat': 'vo-thuat'
};

window.filterByCategory = async function filterByCategory(category) {
    const container = document.getElementById('anime-groups-container');
    if (!container) return;

    const slug = CATEGORY_SLUG_MAP[category] || category;

    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-tab[data-category="${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    container.innerHTML = '';
    renderedMovieIds.clear();
    destroyImageLazyLoader();

    currentCategory = category;
    currentFiltered = 'category';

    if (category === 'all') {
        currentFiltered = null;
        currentPage = 1;
        displayCount = 12;
        await fetchMovies(container, 1);
        return;
    }

    if (slug === 'hoat-hinh') {
        await loadAllAnimeMovies(container);
        return;
    }

    currentPage = 1;
    const apiMovies = await fetchMoviesByCategory(slug);
    container.innerHTML = '';

    if (!apiMovies || apiMovies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                </svg>
                <p>Chưa có phim cho thể loại này</p>
                <p class="sub-text">Hiện tại chưa có phim thuộc thể loại "${slug}".</p>
            </div>`;
        return;
    }

    // Dùng group grid cho kết quả lọc
    allMovies = apiMovies;
    syncWindowExports();
    renderMovieGroups(apiMovies, container);
};

// ====== HERO BANNER - ĐÃ CHUYỂN SANG TĨNH (VÔ HIỆU HÓA LOGIC TỰ ĐỘNG) ======
// Banner hiện tại dùng ảnh banner.jpg tĩnh trong HTML + CSS
// Không cần JS lấy dữ liệu từ API nữa
// Giữ hàm initBanner rỗng để tránh lỗi gọi từ code cũ
function initBanner(movies) {
    // ĐÃ VÔ HIỆU - Banner tĩnh dùng ảnh banner.jpg
    console.log('✅ [BANNER] Banner tĩnh - dùng ảnh banner.jpg');
}

function renderBannerDots() {
    const dotsContainer = document.getElementById('banner-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = bannerMovies.map((_, i) => 
        `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
    ).join('');
    
    dotsContainer.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            bannerCurrentIndex = idx;
            showBannerSlide(idx);
            resetBannerAutoSlide();
        });
    });
}

function getBannerMetaData(movie) {
    const categories = getCategories(movie);
    return {
        rating: movie.tmdb?.vote_average || movie.vote_average || '9.5',
        episodes: movie.episode_current ? `${movie.episode_current}/${movie.episode_total || '?'}` : '11/12',
        year: movie.year || '2026',
        studio: movie.studio || 'Connect',
        genres: categories.length > 0 ? categories.slice(0, 3).join(', ') : 'Slice of Life, School, Romance',
        quality: movie.quality || 'FHD'
    };
}

function showBannerSlide(index) {
    if (!bannerMovies || !bannerMovies.length) return;
    const movie = bannerMovies[index];
    if (!movie) return;

    const img = document.getElementById('banner-img');
    const titleEl = document.getElementById('banner-title');
    const descEl = document.getElementById('banner-desc');
    const dots = document.querySelectorAll('.dot');
    const bannerBg = document.getElementById('banner-bg');
    
    // Meta elements
    const ratingEl = document.getElementById('banner-rating');
    const episodesEl = document.getElementById('banner-episodes');
    const yearEl = document.getElementById('banner-year');
    const studioEl = document.getElementById('banner-studio');
    const genresEl = document.getElementById('banner-genres');

    // Image handling - thử nhiều field name khác nhau
    const thumbUrl = movie.thumb_url || movie.thumb || '';
    const posterUrl = movie.poster_url || '';
    const imageUrl = movie.image || '';
    const coverUrl = movie.cover || '';
    const bannerUrl = movie.banner || '';
    const backdropUrl = movie.backdrop || '';
    
    // Ưu tiên: poster_url > thumb_url > image > cover > banner > backdrop
    const bestImg = posterUrl || thumbUrl || imageUrl || coverUrl || bannerUrl || backdropUrl;
    const imgSrc = bestImg ? buildImageUrl(bestImg, '') : '';

    if (img) {
        if (imgSrc && imgSrc !== PLACEHOLDER) {
            img.src = imgSrc;
            img.style.display = '';
            if (bannerBg) {
                bannerBg.style.background = '';
                bannerBg.style.backgroundColor = '';
            }
            // Error handler
            img.onerror = function() {
                console.warn('⚠️ [BANNER] Ảnh lỗi:', imgSrc, 'cho phim:', movie.name);
                this.style.display = 'none';
                if (bannerBg) {
                    bannerBg.style.background = `url(${DEMO_BG}) center/cover no-repeat`;
                    bannerBg.style.backgroundColor = '#12121a';
                }
            };
        } else {
            img.style.display = 'none';
            if (bannerBg) {
                bannerBg.style.background = `url(${DEMO_BG}) center/cover no-repeat`;
                bannerBg.style.backgroundColor = '#12121a';
            }
        }
        img.alt = movie.name || movie.title || 'Anime';
    } else if (bannerBg) {
        bannerBg.style.background = `url(${DEMO_BG}) center/cover no-repeat`;
        bannerBg.style.backgroundColor = '#12121a';
    }

    // Title
    if (titleEl) {
        titleEl.textContent = movie.name || movie.title || 'Anime Hot';
    }

    // Description
    if (descEl) {
        descEl.textContent = movie.content || movie.description || `Xem ${movie.name || movie.title} với chất lượng cao, vietsub.`;
    }

    // Meta data
    const meta = getBannerMetaData(movie);
    if (ratingEl) ratingEl.textContent = meta.rating;
    if (episodesEl) episodesEl.textContent = meta.episodes;
    if (yearEl) yearEl.textContent = meta.year;
    if (studioEl) studioEl.textContent = meta.studio;
    if (genresEl) genresEl.textContent = meta.genres;

    // Dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Preload next image
    preloadNextBannerImage();
}

function setupWatchButton() {
    const btn = document.getElementById('btn-watch-banner');
    if (!btn) return;
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const movie = bannerMovies[bannerCurrentIndex];
        if (movie && movie.slug) {
            window.location.href = 'watch.html?id=' + movie.slug;
        }
    });
}

function setupBannerArrows() {
    const leftArrow = document.getElementById('banner-arrow-left');
    const rightArrow = document.getElementById('banner-arrow-right');
    
    if (leftArrow) {
        leftArrow.addEventListener('click', function(e) {
            e.stopPropagation();
            const prev = (bannerCurrentIndex - 1 + bannerMovies.length) % bannerMovies.length;
            bannerCurrentIndex = prev;
            showBannerSlide(prev);
            resetBannerAutoSlide();
        });
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('click', function(e) {
            e.stopPropagation();
            const next = (bannerCurrentIndex + 1) % bannerMovies.length;
            bannerCurrentIndex = next;
            showBannerSlide(next);
            resetBannerAutoSlide();
        });
    }
}

function setupSidebarRandomBtn() {
    const btn = document.getElementById('sidebar-random-btn');
    if (!btn) return;
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.handleRandomAnime === 'function') {
            window.handleRandomAnime();
        } else {
            // Fallback random
            let movies = allMovies;
            if (!movies || movies.length === 0) {
                try {
                    const cached = localStorage.getItem('anime_data');
                    if (cached) movies = JSON.parse(cached);
                } catch(e) {}
            }
            if (movies && movies.length > 0) {
                const randomIndex = Math.floor(Math.random() * movies.length);
                const randomMovie = movies[randomIndex];
                if (randomMovie && (randomMovie.slug || randomMovie._id)) {
                    const slug = randomMovie.slug || randomMovie._id;
                    window.location.href = 'watch.html?id=' + slug;
                }
            }
        }
    });
}

function startBannerAutoSlide() {
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const next = (bannerCurrentIndex + 1) % bannerMovies.length;
        bannerCurrentIndex = next;
        showBannerSlide(next);
    }, 4000);
}

function resetBannerAutoSlide() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
    }
    startBannerAutoSlide();
}

function preloadNextBannerImage() {
    if (!bannerMovies.length) return;
    const nextIndex = (bannerCurrentIndex + 1) % bannerMovies.length;
    const nextMovie = bannerMovies[nextIndex];
    if (nextMovie) {
        const thumbUrl = nextMovie.thumb_url || nextMovie.thumb || '';
        const posterUrl = nextMovie.poster_url || '';
        const imgSrc = buildImageUrl(thumbUrl, posterUrl);
        if (imgSrc !== PLACEHOLDER) {
            const img = new Image();
            img.src = imgSrc;
        }
    }
}

function showEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <p>Không tìm thấy phim</p>
            <p class="sub-text">API hiện tại không có dữ liệu.</p>
        </div>`;
}

function showErrorState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--red-primary);">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="color:var(--red-primary);">Lỗi kết nối</p>
            <p class="sub-text">Không thể tải dữ liệu. Vui lòng thử lại.</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;background:var(--bg-hover);border:1px solid var(--border-color);border-radius:var(--radius-lg);color:var(--text-main);font-size:var(--font-size-base);cursor:pointer;">
                Thử lại
            </button>
        </div>`;
}

window.showSuggestions = function(query) {
    const desktopList = document.getElementById('suggestions-list-desktop');
    const mobileList = document.getElementById('suggestions-list-mobile');
    const desktopDropdown = document.getElementById('search-suggestions-desktop');
    const mobileDropdown = document.getElementById('search-suggestions-mobile');
    if (!desktopList || !mobileList) return;

    const q = query.toLowerCase().trim();
    if (!q) {
        desktopDropdown.classList.remove('active');
        mobileDropdown.classList.remove('active');
        return;
    }

    const results = allMovies.filter(m => {
        const name = (m.name || m.title || '').toLowerCase();
        const originName = (m.origin_name || m.originName || '').toLowerCase();
        const altNames = Array.isArray(m.alternative_names) 
            ? m.alternative_names.join(' ').toLowerCase() 
            : (m.alternative_names || '').toLowerCase();
        const slug = (m.slug || '').toLowerCase();
        const catStr = getCategoryString(m).toLowerCase();
        return name.includes(q) || originName.includes(q) || altNames.includes(q) || slug.includes(q) || catStr.includes(q);
    });

    const limited = results.slice(0, 5);

    function renderList(listEl, items) {
        if (!items.length) {
            listEl.innerHTML = `<li><div class="suggestion-empty"><p>Không tìm thấy kết quả cho "${q}"</p></div></li>`;
            return;
        }
        listEl.innerHTML = items.map(m => {
            const title = m.name || m.title || 'Không có tên';
            const slug = m.slug || m._id || '';
            const year = m.year || '';
            const displayEp = safeEpisodeDisplay(m.episode_current);
            const imgSrc = buildImageUrl(m.thumb_url || '', m.poster_url || '');
            const catStr = getCategoryString(m);
            return `<li>
                <a href="watch.html?id=${slug}" onclick="hideAllSuggestions()">
                    <img class="suggestion-thumb" src="${imgSrc}" alt="${title}" 
                         onerror="this.onerror=null; this.classList.add('img-error'); this.src='${PLACEHOLDER}';"
                         onload="this.classList.add('loaded')">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${title}</div>
                        <div class="suggestion-meta">${year} • ${catStr}</div>
                    </div>
                    <span class="suggestion-badge">${displayEp}</span>
                </a>
            </li>`;
        }).join('');
    }

    renderList(desktopList, limited);
    desktopDropdown.classList.toggle('active', limited.length > 0);
    renderList(mobileList, limited);
    mobileDropdown.classList.toggle('active', limited.length > 0);
};

window.hideAllSuggestions = function() {
    const desktopDropdown = document.getElementById('search-suggestions-desktop');
    const mobileDropdown = document.getElementById('search-suggestions-mobile');
    if (desktopDropdown) desktopDropdown.classList.remove('active');
    if (mobileDropdown) mobileDropdown.classList.remove('active');
};

// ============================================================
// TOP ANIME ROW (Trending - above banner)
// ============================================================
const TOP_ANIME = [
  { id:1, title:"Dr. Stone 4th Season", slug:"dr-stone-4th-season", ep:"36", rating:"9.7", views:10278522, done:false, img:"/img/drstone.jpg" },
  { id:2, title:"Re:Zero kara Hajimeru Isekai Seikatsu 4th", slug:"rezero-4th", ep:"11", rating:"9.6", views:1349931, done:false, img:"/img/rezero4.jpg" },
  { id:3, title:"Chào Mừng Đến Với Lớp Học Đề Cao Thực Lực 4", slug:"classroom-4th", ep:"15", rating:"9", views:542371, done:false, img:"/img/classroom4.jpg" },
  { id:4, title:"Class de 2-banme ni Kawaii Onnanoko", slug:"class-2banme", ep:"11", rating:"9.5", views:1473472, done:false, img:"/img/class2banme.jpg" },
  { id:5, title:"Mai Mối Cho Độc Sư", slug:"mai-moi-cho-doc-su", ep:"11", rating:"9.1", views:820300, done:false, img:"/img/maimoi.jpg" },
  { id:6, title:"Cuộc Sống Nông Dân Ở Thế Giới Khác 2", slug:"nong-dan-the-gioi-khac-2", ep:"11", rating:"9.4", views:650000, done:false, img:"/img/nongdan2.jpg" },
  { id:7, title:"Haibara-kun no Tsuyokute Seishun New Game", slug:"haibara-kun", ep:"FULL", rating:"8.7", views:538765, done:true, img:"/img/haibara.jpg" },
  { id:8, title:"Awajima Hyakkei", slug:"awajima-hyakkei", ep:"11", rating:"9.1", views:220802, done:false, img:"/img/awajima.jpg" },
  { id:9, title:"Bức Tường Băng", slug:"buc-tuong-bang", ep:"12", rating:"8.6", views:493640, done:false, img:"/img/buctuongbang.jpg" },
  { id:10, title:"Cánh Hoa Luân Hồi", slug:"canh-hoa-luan-hoi", ep:"12", rating:"8.2", views:180000, done:false, img:"/img/canhhoaluanhoi.jpg" },
];

function renderTopAnimeRow() {
  const container = document.getElementById('top-anime-scroll');
  if (!container) return;

  const limited = TOP_ANIME.slice(0, 10);

  container.innerHTML = limited.map(anime => {
    const epBadgeClass = anime.done ? 'top-anime-ep-badge done' : 'top-anime-ep-badge';
    const epText = anime.done ? 'HOÀN TẤT' : 'Tập ' + anime.ep;
    return `
      <div class="top-anime-card" 
           data-slug="${anime.slug}"
           data-title="${anime.title}"
           data-rating="${anime.rating}"
           data-ep="${anime.ep}"
           data-done="${anime.done}"
           data-views="${anime.views}">
        <div class="top-anime-thumb">
          <div class="top-anime-thumb-placeholder" style="width:100%;height:100%;background:#1a1a1a;position:absolute;inset:0;z-index:1;"></div>
          <img src="data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22130%22 height%3D%22160%22 viewBox%3D%220 0 130 160%22%3E%3Crect width%3D%22130%22 height%3D%22160%22 fill%3D%22%231a1a2e%22/%3E%3C/svg%3E" 
               data-src="${anime.img}" 
               alt="${anime.title}" 
               loading="lazy"
               class="lazy-trending"
               onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22130%22 height%3D%22160%22 viewBox%3D%220 0 130 160%22%3E%3Crect width%3D%22130%22 height%3D%22160%22 fill%3D%22%231a1a2e%22/%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2212%22 fill%3D%22%23555%22%3E%F0%9F%8E%AC%3C/text%3E%3C/svg%3E';">
          <div class="top-anime-overlay">
            <div class="top-anime-play-btn">
              <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"></polygon></svg>
            </div>
          </div>
          <div class="top-anime-rating">⭐ ${anime.rating}</div>
          <div class="${epBadgeClass}">${epText}</div>
        </div>
        <div class="top-anime-title">${anime.title}</div>
      </div>`;
  }).join('');

  container.querySelectorAll('.top-anime-card').forEach(card => {
    card.addEventListener('click', function() {
      const slug = this.dataset.slug;
      if (slug) window.location.href = 'watch.html?id=' + slug;
    });
  });

  setupTrendingLazyLoad(container);
}

function setupTrendingLazyLoad(container) {
  if (!container) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  container.querySelectorAll('img.lazy-trending[data-src]').forEach(img => {
    observer.observe(img);
  });
}

// ============================================================
// HOVER INFO CARD
// ============================================================
const HOVER_INFO_DATA = {
  'dr-stone-4th-season': {
    title: 'Dr. Stone 4th Season',
    rating: '9.7', year: '2025', quality: 'HD',
    studio: 'TMS Entertainment',
    genres: ['Shounen', 'Sci-Fi', 'Comedy'],
    episodes: '36/37',
    season: 'Mùa Xuân 2025',
    desc: 'Senku và nhóm bạn tiếp tục hành trình khôi phục nền văn minh nhân loại sau khi toàn bộ loài người bị hóa đá. Mùa 4 hứa hẹn những khám phá khoa học mới đầy thú vị.'
  },
  'rezero-4th': {
    title: 'Re:Zero kara Hajimeru Isekai Seikatsu 4th',
    rating: '9.6', year: '2025', quality: 'HD',
    studio: 'White Fox',
    genres: ['Isekai', 'Drama', 'Psychological'],
    episodes: '11/12',
    season: 'Mùa Xuân 2025',
    desc: 'Subaru tiếp tục cuộc chiến sinh tồn tại thế giới khác với sức mạnh "Return by Death". Mùa 4 mở ra những bí ẩn mới về thế giới và số phận.'
  },
  'classroom-4th': {
    title: 'Chào Mừng Đến Với Lớp Học Đề Cao Thực Lực 4',
    rating: '9.0', year: '2025', quality: 'HD',
    studio: 'Lerche',
    genres: ['School', 'Psychological', 'Drama'],
    episodes: '15/16',
    season: 'Mùa Xuân 2025',
    desc: 'Ayanokouji Kiyotaka tiếp tục cuộc chiến tâm lý tại trường Cao Trung Đề Cao Thực Lực. Những âm mưu và chiến thuật ngày càng phức tạp.'
  },
  'class-2banme': {
    title: 'Class de 2-banme ni Kawaii Onnanoko',
    rating: '9.5', year: '2025', quality: 'HD',
    studio: 'feel.',
    genres: ['Romance', 'Comedy', 'School'],
    episodes: '11/12',
    season: 'Mùa Xuân 2025',
    desc: 'Câu chuyện tình cảm nhẹ nhàng về cô gái xinh thứ hai trong lớp. Một rom-com đáng yêu với những tình huống dễ thương.'
  },
  'mai-moi-cho-doc-su': {
    title: 'Mai Mối Cho Độc Sư',
    rating: '9.1', year: '2025', quality: 'HD',
    studio: 'A-1 Pictures',
    genres: ['Romance', 'Fantasy', 'Comedy'],
    episodes: '11/12',
    season: 'Mùa Xuân 2025',
    desc: 'Một câu chuyện mai mối hài hước giữa các vị thần và con người. Liệu tình yêu có thể vượt qua mọi rào cản?'
  },
  'nong-dan-the-gioi-khac-2': {
    title: 'Cuộc Sống Nông Dân Ở Thế Giới Khác 2',
    rating: '9.4', year: '2025', quality: 'HD',
    studio: 'Zero-G',
    genres: ['Isekai', 'Slice of Life', 'Fantasy'],
    episodes: '11/12',
    season: 'Mùa Xuân 2025',
    desc: 'Cuộc sống nông dân nhàn nhã tại thế giới khác tiếp tục với nhiều câu chuyện thú vị và những vụ mùa bội thu.'
  },
  'haibara-kun': {
    title: 'Haibara-kun no Tsuyokute Seishun New Game',
    rating: '8.7', year: '2025', quality: 'HD',
    studio: 'Silver Link',
    genres: ['Sports', 'School', 'Comedy'],
    episodes: 'FULL',
    season: 'Mùa Xuân 2025',
    desc: 'Haibara-kun tham gia câu lạc bộ thể thao mới và khám phá những khả năng tiềm ẩn của bản thân.'
  },
  'awajima-hyakkei': {
    title: 'Awajima Hyakkei',
    rating: '9.1', year: '2025', quality: 'HD',
    studio: 'P.A. Works',
    genres: ['Slice of Life', 'Drama'],
    episodes: '11/12',
    season: 'Mùa Xuân 2025',
    desc: 'Bộ phim kể về cuộc sống thường ngày tại hòn đảo Awajima xinh đẹp, nơi những câu chuyện ấm áp diễn ra.'
  },
  'buc-tuong-bang': {
    title: 'Bức Tường Băng',
    rating: '8.6', year: '2025', quality: 'HD',
    studio: 'MAPPA',
    genres: ['Action', 'Mystery', 'Drama'],
    episodes: '12/13',
    season: 'Mùa Xuân 2025',
    desc: 'Một bức tường băng bí ẩn xuất hiện, đe dọa sự sống của nhân loại. Những người dũng cảm phải đứng lên bảo vệ thế giới.'
  },
  'canh-hoa-luan-hoi': {
    title: 'Cánh Hoa Luân Hồi',
    rating: '8.2', year: '2025', quality: 'HD',
    studio: 'Kyoto Animation',
    genres: ['Fantasy', 'Drama', 'Romance'],
    episodes: '12/12',
    season: 'Mùa Xuân 2025',
    desc: 'Một câu chuyện về luân hồi và tình yêu vượt thời gian. Những cánh hoa rơi mang theo ký ức của kiếp trước.'
  }
};

let hoverTimeout = null;
let hoverCardVisible = false;

function setupHoverInfoCard() {
  const hoverCard = document.getElementById('hover-info-card');
  if (!hoverCard) return;

  let showTimer = null;
  document.addEventListener('mouseover', function(e) {
    const card = e.target.closest('.anime-card, .top-anime-card');
    
    if (!card) {
      if (showTimer) clearTimeout(showTimer);
      if (hoverTimeout) clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(function() {
        hoverCard.classList.remove('visible');
        hoverCardVisible = false;
      }, 200);
      return;
    }

    const slug = card.dataset.slug;
    if (!slug) return;
    const data = HOVER_INFO_DATA[slug];
    if (!data) return;

    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (showTimer) clearTimeout(showTimer);

    showTimer = setTimeout(function() {
      hoverCardVisible = true;
      document.getElementById('hover-info-title').textContent = data.title;
      document.getElementById('hover-info-meta').innerHTML = `
        <span>⭐ ${data.rating}</span>
        <span>📅 ${data.year}</span>
        <span>🎬 ${data.quality}</span>`;
      document.getElementById('hover-info-studio').textContent = data.studio;
      document.getElementById('hover-info-genres').innerHTML = data.genres.map(g => 
        `<span class="hover-info-genre-tag">${g}</span>`
      ).join('');
      document.getElementById('hover-info-episodes').textContent = data.episodes;
      document.getElementById('hover-info-season').textContent = data.season;
      document.getElementById('hover-info-desc').textContent = data.desc;

      const rect = card.getBoundingClientRect();
      let left = rect.right + 10;
      let top = rect.top;

      if (left + 240 > window.innerWidth - 10) {
        left = rect.left - 240 - 10;
      }
      if (top + 350 > window.innerHeight) {
        top = window.innerHeight - 350;
      }
      if (top < 10) top = 10;

      hoverCard.style.left = left + 'px';
      hoverCard.style.top = top + 'px';
      hoverCard.classList.add('visible');
    }, 100);
  });

  hoverCard.addEventListener('mouseenter', function() {
    if (hoverTimeout) clearTimeout(hoverTimeout);
  });

  hoverCard.addEventListener('mouseleave', function() {
    hoverCard.classList.remove('visible');
    hoverCardVisible = false;
  });
}

// ============================================================
// BANNER SIDEBAR
// ============================================================
const SIDEBAR_DATA = [
  { title: "Trái Đất Đóng Băng", year: 2026, ep: "Tập 12", quality: "HD", slug: "trai-dat-dong-bang" },
  { title: "Kẻ Thù Hoàng Gia Của Tôi", year: 2026, ep: "Tập 11", quality: "HD", slug: "ke-thu-hoang-gia" },
  { title: "Dáng Say Tựa Đoá Bách Hợp", year: 2025, ep: "Tập 11", quality: "HD", slug: "dang-say-tua-do-bach-hop" },
  { title: "Bức Tường Mê Cung", year: 2026, ep: "Tập 19", quality: "HD", slug: "buc-tuong-me-cung" },
];

function renderBannerSidebar(movies) {
  const container = document.getElementById('banner-sidebar-list');
  if (!container) return;

  // Nếu có bannerMovies (đã được set từ initBanner), dùng nó
  const sourceMovies = (movies && movies.length > 0) ? movies : bannerMovies;
  
  let sidebarItems = [];
  
  if (sourceMovies && sourceMovies.length > 0) {
    const realMovies = sourceMovies.slice(0, 5).filter(m => m && m.slug);
    if (realMovies.length >= 2) {
      sidebarItems = realMovies.map(m => {
        // Lấy ảnh thumbnail cho sidebar
        const thumbUrl = m.thumb_url || m.thumb || '';
        const posterUrl = m.poster_url || '';
        const imageUrl = m.image || '';
        const coverUrl = m.cover || '';
        const bestImg = thumbUrl || posterUrl || imageUrl || coverUrl || m.banner || m.backdrop || '';
        const imgSrc = bestImg ? buildImageUrl(bestImg, '') : PLACEHOLDER;
        
        return {
          title: m.name || m.title || 'Anime',
          year: m.year || '2026',
          ep: safeEpisodeDisplay(m.episode_current),
          quality: m.quality || 'HD',
          slug: m.slug || '',
          image: imgSrc
        };
      });
    }
  }
  
  // Fallback nếu không có data thật
  if (sidebarItems.length < 2) {
    sidebarItems = SIDEBAR_DATA.map(item => ({
      ...item,
      image: PLACEHOLDER
    }));
  }

  container.innerHTML = sidebarItems.map((item, idx) => {
    const title = item.title;
    const slug = item.slug;
    const ep = item.ep || 'Đang cập nhật';
    const imgSrc = item.image || PLACEHOLDER;

    return `
      <div class="banner-sidebar-item ${idx === 0 ? 'active' : ''}" data-slug="${slug}" data-index="${idx}">
        <img 
          src="${imgSrc}" 
          alt="${title}"
          class="banner-sidebar-thumb"
          onerror="this.onerror=null; this.style.display='none'"
        />
        <div class="banner-sidebar-info">
          <div class="banner-sidebar-name">${title}</div>
          <div class="banner-sidebar-ep">${ep}</div>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.banner-sidebar-item').forEach(item => {
    item.addEventListener('click', function() {
      const slug = this.dataset.slug;
      const index = parseInt(this.dataset.index);
      
      container.querySelectorAll('.banner-sidebar-item').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
      
      if (bannerMovies.length > 0 && index < bannerMovies.length) {
        bannerCurrentIndex = index;
        showBannerSlide(index);
        resetBannerAutoSlide();
      } else if (slug) {
        window.location.href = 'watch.html?id=' + slug;
      }
    });
  });
}

// ============================================================
// REALTIME COMMENTS
// ============================================================
const FAKE_COMMENTS = [
  { user:"Minh Hoàng Tiến", text:"thằng rosti gay lo vải dài các ông ạ", anime:"Wistoria: Trượng Và Kiếm", time: Date.now()-4000, likes:12, dislikes:0 },
  { user:"Phúc Nguyễn", text:"Là Miori nó thích thằng main nhưng vẫn quay qua đồng ý làm bạn gái của Reita wtf...", anime:"Haibara-kun no Tsuyokute Seishun New Game", time: Date.now()-18000, likes:24, dislikes:1 },
  { user:"Kiên Đặng", text:"khả năng bộ này không có ss2 r", anime:"Haibara-kun no Tsuyokute Seishun New Game", time: Date.now()-120000, likes:8, dislikes:0 },
  { user:"Linh Nguyễn", text:"Dr. Stone mùa 4 đỉnh quá, khoa học vui vẻ", anime:"Dr. Stone 4th Season", time: Date.now()-300000, likes:45, dislikes:2 },
  { user:"Hoàng Anh", text:"Re:Zero mùa 4 tập mới hay vãi, Subaru trưởng thành hơn", anime:"Re:Zero 4th", time: Date.now()-600000, likes:67, dislikes:1 },
  { user:"Minh Tuấn", text:"Classroom 4 vẫn giữ được chất riêng, Ayanokouji quá ngầu", anime:"Classroom 4th", time: Date.now()-900000, likes:33, dislikes:0 },
  { user:"Thanh Hà", text:"Mai mối cho độc sư tập mới cute quá trời", anime:"Mai Mối Cho Độc Sư", time: Date.now()-1800000, likes:19, dislikes:0 },
  { user:"Quốc Bảo", text:"Bức tường băng animation đẹp xuất sắc, MAPPA đỉnh", anime:"Bức Tường Băng", time: Date.now()-3600000, likes:52, dislikes:3 },
  { user:"Huyền Trang", text:"Cánh hoa luân hồi xem mà khóc cả tập", anime:"Cánh Hoa Luân Hồi", time: Date.now()-7200000, likes:88, dislikes:0 },
  { user:"Đức Mạnh", text:"Class de 2-banme rom-com nhẹ nhàng dễ thương", anime:"Class 2-banme", time: Date.now()-14400000, likes:15, dislikes:0 },
];

let commentsData = [];
let commentInterval = null;
let commentCount = FAKE_COMMENTS.length;

function getRandomColor(name) {
  const colors = ['#e53935','#43a047','#1e88e5','#fb8c00','#8e24aa','#00acc1','#3949ab','#c0ca33','#f4511e','#6d4c41'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'vài giây trước';
  if (seconds < 60) return seconds + ' giây trước';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' phút trước';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' giờ trước';
  const days = Math.floor(hours / 24);
  return days + ' ngày trước';
}

function renderComments(comments) {
  const container = document.getElementById('comments-list');
  if (!container) return;

  container.innerHTML = comments.map(c => {
    const avatarColor = getRandomColor(c.user);
    const initial = c.user.charAt(0).toUpperCase();
    const badgeHtml = c.user === 'Minh Hoàng Tiến' ? '<span class="comment-badge boss">Boss</span>' : 
                      c.user === 'Phúc Nguyễn' ? '<span class="comment-badge gau">Gấu</span>' : '';
    
    return `
      <div class="comment-item-new">
        <div class="comment-avatar-new" style="background:${avatarColor}">${initial}</div>
        <div class="comment-body-new">
          <div class="comment-user-row">
            <span class="comment-username">${c.user}</span>
            ${badgeHtml}
            <span class="comment-time-new">${timeAgo(c.time)}</span>
          </div>
          <div class="comment-text-new">${c.text}</div>
          <div class="comment-actions-new">
            <button class="comment-action-btn" data-action="like">
              👍 <span>${c.likes}</span>
            </button>
            <button class="comment-action-btn" data-action="dislike">
              👎 <span>${c.dislikes}</span>
            </button>
            <button class="comment-action-btn" data-action="reply">💬 Trả lời</button>
          </div>
        </div>
      </div>`;
  }).join('');

  const countEl = document.getElementById('comment-count');
  if (countEl) countEl.textContent = `(${comments.length})`;

  container.querySelectorAll('.comment-action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const action = this.dataset.action;
      if (action === 'like' || action === 'dislike') {
        const span = this.querySelector('span');
        if (span) {
          let count = parseInt(span.textContent) || 0;
          if (this.classList.contains('liked')) {
            count--;
            this.classList.remove('liked');
          } else {
            count++;
            this.classList.add('liked');
          }
          span.textContent = count;
        }
      } else if (action === 'reply') {
        alert('Chức năng trả lời đang phát triển!');
      }
    });
  });
}

function addFakeComment() {
  const randomNames = ['Ngọc Mai', 'Tuấn Anh', 'Hồng Nhung', 'Đức Huy', 'Phương Thảo', 'Minh Quân', 'Bảo Ngọc', 'Hoàng Long'];
  const randomTexts = [
    'tập này hay quá các bạn ơi',
    'xem đi xem lại vẫn thấy hay',
    'mong chờ tập sau quá',
    'anime mùa này chất lượng quá',
    'opening bài này hay vãi',
    'cốt truyện ngày càng hấp dẫn',
    'hóng tập mới mỗi tuần',
    'không biết bao giờ ra tập tiếp theo',
    'đỉnh quá đỉnh',
    'xem phim này mà quên cả ăn'
  ];
  
  const user = randomNames[Math.floor(Math.random() * randomNames.length)];
  const text = randomTexts[Math.floor(Math.random() * randomTexts.length)];
  const likes = Math.floor(Math.random() * 50) + 1;
  const dislikes = Math.floor(Math.random() * 5);
  
  commentsData.unshift({
    user: user,
    text: text,
    anime: 'Anime',
    time: Date.now(),
    likes: likes,
    dislikes: dislikes
  });
  
  commentCount++;
  renderComments(commentsData);
}

function initComments() {
  commentsData = [...FAKE_COMMENTS];
  renderComments(commentsData);

  if (commentInterval) clearInterval(commentInterval);
  
  function scheduleNextComment() {
    const delay = 5000 + Math.random() * 10000;
    commentInterval = setTimeout(function() {
      addFakeComment();
      scheduleNextComment();
    }, delay);
  }
  
  scheduleNextComment();
}

window.sortComments = function(sortType) {
  if (sortType === 'new') {
    commentsData.sort((a, b) => b.time - a.time);
  } else if (sortType === 'top') {
    commentsData.sort((a, b) => b.likes - a.likes);
  }
  renderComments(commentsData);
};

// ============================================================
// INIT ALL NEW FEATURES
// ============================================================
// initBanner now tự động gọi renderBannerSidebar bên trong
// Không cần override nữa

function initNewFeatures() {
  renderTopAnimeRow();
  setupHoverInfoCard();
  initComments();
}

// Export functions for inline JS
window.renderMovieGroups = renderMovieGroups;
