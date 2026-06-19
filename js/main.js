/**
 * main.js - Trang chủ: Danh sách phim hoạt hình từ API Ophim
 * 
 * CẢI TIẾN LỚN:
 * 1. Phân trang - Lấy TOÀN BỘ phim từ API (không chỉ trang 1)
 * 2. Lọc anime hoạt hình chính xác
 * 3. Lưu cache dạng UPSERT - không mất phim cũ
 * 4. Tìm kiếm mở rộng trên nhiều trường
 * 5. Tự động đồng bộ mỗi 30 phút
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

// ====== BƯỚC 3: HÀM LỌC ANIME HOẠT HÌNH ======
function isAnimeCartoon(movie) {
    if (!movie) return false;

    // Gom tất cả field chứa thông tin thể loại
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

    // Từ khóa CHẶN (phim người thật)
    const blockedTypes = [
        'live action', 'live-action', 'người đóng', 'nguoi dong',
        'phim lẻ người thật', 'phim bộ người thật', 'phim chiếu rạp',
        'drama', 'variety', 'reality', 'documentary', 'tvshows'
    ];

    // Từ khóa CHO PHÉP (hoạt hình)
    const allowedTypes = [
        'anime', 'hoạt hình', 'hoat hinh', 'animation',
        'animated', 'donghua', 'dong hua', 'cartoon',
        'motion comic', 'webtoon', '3d animation', 'cgi',
        'hoathinh'
    ];

    // Layer 1: Nếu type là 'hoathinh' → chắc chắn là hoạt hình
    if (movie.type === 'hoathinh') return true;

    // Layer 2: Chặn nếu có từ khóa người thật
    if (blockedTypes.some(k => typeFields.includes(k))) return false;

    // Layer 3: Cho phép nếu có từ khóa hoạt hình
    if (allowedTypes.some(k => typeFields.includes(k))) return true;
    if (allowedTypes.some(k => titleField.includes(k))) return true;

    // Layer 4: Kiểm tra category slug
    if (Array.isArray(movie.category)) {
        const catSlugs = movie.category.map(c => typeof c === 'object' ? c.slug : '').filter(Boolean);
        if (catSlugs.some(s => s === 'hoat-hinh' || s.includes('hoat-hinh') || s === 'anime')) return true;
    }

    // Layer 5: Nếu không xác định được thì GIỮ LẠI (tránh mất phim)
    return true;
}

// ====== BƯỚC 2: LẤY TOÀN BỘ PHIM TỪ API (PHÂN TRANG) ======
async function fetchAllAnimeFromAPI() {
    let allMovies = [];
    let page = 1;
    let hasMore = true;
    let maxPages = 200; // Giới hạn an toàn, tránh loop vô hạn
    let consecutiveEmptyPages = 0;

    console.log('📡 [FETCH ALL] Bắt đầu lấy toàn bộ phim từ API...');

    while (hasMore && page <= maxPages) {
        try {
            const url = `https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`;
            console.log(`📡 [FETCH ALL] Đang lấy trang ${page}...`);
            
            const res = await fetchWithRetry(url);
            
            // Lấy CDN domain nếu có
            const cdnDomain = res?.data?.APP_DOMAIN_CDN_IMAGE;
            if (cdnDomain && page === 1) {
                IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
            }

            // Lấy thông tin phân trang
            const pagination = res?.data?.params?.pagination || {};
            const totalItems = pagination.totalItems || 0;
            const totalItemsPerPage = pagination.totalItemsPerPage || ITEMS_PER_PAGE;
            const totalPageCount = Math.ceil(totalItems / totalItemsPerPage) || 1;
            
            if (page === 1) {
                console.log(`📊 [FETCH ALL] Tổng số phim: ${totalItems}, Tổng số trang: ${totalPageCount}`);
                maxPages = Math.min(totalPageCount, maxPages);
            }

            const movies = res?.data?.items || res?.items || [];

            if (!movies || movies.length === 0) {
                consecutiveEmptyPages++;
                if (consecutiveEmptyPages >= 3) {
                    console.log('📡 [FETCH ALL] 3 trang liên tiếp không có dữ liệu, dừng lại.');
                    hasMore = false;
                    break;
                }
                page++;
                continue;
            }
            consecutiveEmptyPages = 0;

            // Lọc chỉ giữ anime hoạt hình
            const animeMovies = movies.filter(isAnimeCartoon);
            console.log(`📡 [FETCH ALL] Trang ${page}: ${movies.length} phim, giữ lại ${animeMovies.length} anime`);

            allMovies = allMovies.concat(animeMovies);

            // Kiểm tra có trang tiếp theo không
            if (page >= totalPageCount || page >= maxPages) {
                hasMore = false;
            } else {
                page++;
            }

            // Delay tránh spam API
            await new Promise(r => setTimeout(r, API_DELAY_MS));

        } catch (err) {
            console.error(`❌ [FETCH ALL] Lỗi trang ${page}:`, err.message);
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= 3) {
                hasMore = false;
            } else {
                page++;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    console.log(`✅ [FETCH ALL] Hoàn tất! Tổng phim anime lấy được: ${allMovies.length}`);
    return allMovies;
}

// ====== BƯỚC 4: LƯU VÀO CACHE - UPSERT KHÔNG XOÁ ======
function saveMoviesToCache(newMovies) {
    if (!newMovies || newMovies.length === 0) return { added: 0, updated: 0, skipped: 0 };

    let added = 0, updated = 0, skipped = 0;

    // Đọc cache cũ
    let existingMovies = [];
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) existingMovies = JSON.parse(cached);
    } catch (e) { /* ignore */ }

    // Tạo Map từ cache cũ để tra cứu nhanh
    const existingMap = new Map();
    existingMovies.forEach(m => {
        const key = m.slug || m._id || m.name || '';
        if (key) existingMap.set(key, m);
    });

    // UPSERT: merge dữ liệu mới vào cũ
    newMovies.forEach(movie => {
        try {
            const uniqueKey = movie.slug || movie._id || movie.name || '';
            if (!uniqueKey) { skipped++; return; }

            const existing = existingMap.get(uniqueKey);

            if (existing) {
                // CẬP NHẬT: chỉ update thông tin mới
                // GIỮ NGUYÊN: views, trạng thái ẩn/hiện, ngày tạo
                existingMap.set(uniqueKey, {
                    ...existing, // Giữ toàn bộ dữ liệu cũ
                    // Ghi đè thông tin mới
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
                    // KHÔNG ghi đè: views, visible (nếu có)
                    updated_at: new Date().toISOString()
                });
                updated++;
            } else {
                // THÊM MỚI
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

    // Chuyển Map về array
    const mergedMovies = Array.from(existingMap.values());

    // Lưu vào localStorage
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
        // Nếu localStorage đầy, thử xóa cache cũ và lưu lại
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            try {
                // Chỉ giữ 1000 phim gần nhất
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
        // 1. Lấy toàn bộ anime từ API
        const allMovies = await fetchAllAnimeFromAPI();

        // 2. Lưu vào cache (upsert)
        const result = saveMoviesToCache(allMovies);

        // 3. Cập nhật UI nếu đang ở trang chủ
        const container = document.getElementById('movies-grid');
        if (container && document.querySelector('.app-container')) {
            const meta = getCacheMeta();
            if (meta && meta.total > 0) {
                // Load từ cache mới
                const cached = getCachedMovies();
                if (cached && cached.length > 0) {
                    container.innerHTML = '';
                    renderedMovieIds.clear();
                    destroyLazyLoader();
                    allMovies = cached;
                    syncWindowExports();
                    renderMovies(allMovies.slice(0, displayCount), container);
                    setupLazyLoader(container);
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
        // KHÔNG crash app, chỉ log lỗi và chờ lần sau
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
    // Chuyển sang dùng upsert
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
                        <img src="${imgSrc}" 
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

function renderMovies(movies, container) {
    try {
        if (!movies || movies.length === 0) return;
        let html = '';
        movies.forEach(m => {
            const id = m.slug || m._id || '';
            if (id && renderedMovieIds.has(id)) return;
            if (id) renderedMovieIds.add(id);
            html += createMovieCardHTML(m);
        });
        if (html) {
            container.insertAdjacentHTML('beforeend', html);
        }
    } catch (e) {
        console.error('❌ Lỗi renderMovies:', e.message);
    }
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
        const thumbUrl = movie.thumb_url || movie.thumb || '';
        const posterUrl = movie.poster_url || '';
        const imgSrc = buildImageUrl(thumbUrl, posterUrl);
        const quality = movie.quality || 'FHD';
        const lang = movie.lang || 'Vietsub';

        html += `
            <a href="watch.html?id=${slug}" class="suggestion-card">
                <img src="${imgSrc}" alt="${title}" class="suggestion-card-img"
                     onerror="this.onerror=null; this.classList.add('img-error'); this.src='${PLACEHOLDER}';">
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

// ====== BƯỚC 8: THANH TÌM KIẾM CẢI TIẾN ======
window.searchMovies = function(query) {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    const q = query.toLowerCase().trim();
    if (!q) {
        currentCategory = 'all';
        currentFiltered = null;
        displayCount = 12;
        container.innerHTML = '';
        renderedMovieIds.clear();
        destroyLazyLoader();
        renderMovies(allMovies.slice(0, displayCount), container);
        setupLazyLoader(container);
        return;
    }

    // Tìm kiếm trên NHIỀU trường
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
    destroyLazyLoader();

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
    renderMovies(filtered.slice(0, displayCount), container);
    setupLazyLoader(container);
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
            destroyLazyLoader();
            saveMoviesToCache(convertedMovies);
            allMovies = convertedMovies;
            syncWindowExports();
            renderMovies(allMovies.slice(0, displayCount), container);
            setupLazyLoader(container);
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
    if (!container) container = document.getElementById('movies-grid');
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

// ====== FETCH MOVIES CẢI TIẾN: Lấy trang 1 + cache ======
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

        // Lọc anime
        apiMovies = apiMovies.filter(isAnimeCartoon);

        if (apiMovies.length === 0) {
            showAnimeUpdatingMessage(container);
            return [];
        }

        if (page === 1) {
            container.innerHTML = '';
            renderedMovieIds.clear();
            destroyLazyLoader();
            // UPSERT vào cache thay vì ghi đè
            saveMoviesToCache(apiMovies);
            allMovies = apiMovies;
            syncWindowExports();
            renderMovies(allMovies.slice(0, displayCount), container);
            setupLazyLoader(container);
            initBanner(apiMovies);
            renderSuggestions(apiMovies);
            renderKeywords();
            renderTopMovies();
        } else {
            renderMovies(apiMovies, container);
            allMovies = allMovies.concat(apiMovies);
            syncWindowExports();
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

function setupLazyLoader(container) {
    destroyLazyLoader();
    if (!container) return;
    
    let sentinel = document.getElementById('lazy-load-sentinel');
    if (!sentinel) {
        sentinel = document.createElement('div');
        sentinel.id = 'lazy-load-sentinel';
        sentinel.className = 'sentinel';
        container.appendChild(sentinel);
    }

    intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) loadMoreMovies(container);
        });
    }, { rootMargin: '200px', threshold: 0 });

    intersectionObserver.observe(sentinel);
}

function destroyLazyLoader() {
    if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
    }
    const sentinel = document.getElementById('lazy-load-sentinel');
    if (sentinel) sentinel.remove();
}

function loadMoreMovies(container) {
    if (!container) container = document.getElementById('movies-grid');
    if (!container) return;
    if (currentCategory !== 'all' || currentFiltered !== null) return;

    const currentCount = container.querySelectorAll('.anime-card').length;
    const totalAvailable = allMovies.length;

    if (currentCount >= totalAvailable) {
        if (!isLoadingMore && currentPage < totalPages) loadNextPage();
        return;
    }

    const nextBatch = allMovies.slice(currentCount, currentCount + LAZY_STEP);
    if (nextBatch.length > 0) renderMovies(nextBatch, container);
}

function showEndOfCatalog() {
    const container = document.getElementById('movies-grid');
    if (!container) return;
    const existing = document.getElementById('infinite-scroll-end');
    if (existing) return;

    const endDiv = document.createElement('div');
    endDiv.id = 'infinite-scroll-end';
    endDiv.className = 'end-of-catalog';
    endDiv.innerHTML = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px;opacity:0.5;">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
        <p style="font-size:var(--font-size-md);font-weight:var(--font-weight-medium);">🎉 Bạn đã xem hết tất cả phim!</p>
        <p style="font-size:var(--font-size-base);opacity:0.6;margin-top:4px;">Có ${allMovies.length} bộ phim anime đã được tải.</p>`;
    container.appendChild(endDiv);
}

async function loadNextPage() {
    if (isLoadingMore) return;
    if (currentPage >= totalPages) return;

    isLoadingMore = true;
    currentPage++;

    const container = document.getElementById('movies-grid');
    const newMovies = await fetchMovies(container, currentPage);

    if (!newMovies || newMovies.length === 0) {
        currentPage--;
        isLoadingMore = false;
        return;
    }

    if (currentPage >= totalPages) showEndOfCatalog();
    isLoadingMore = false;
}

function setDefaultAnimeTab() {
    const animeTab = document.querySelector('.filter-tab[data-category="hoat-hinh"]');
    if (animeTab) {
        document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
        animeTab.classList.add('active');
    }
}

// ====== DOMContentLoaded ======
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('movies-grid');
    if (!container) return;
    container.className = 'anime-grid';

    setDefaultAnimeTab();

    // ===== TỐI ƯU: Chỉ hiển thị 8 phim đầu tiên từ cache để ko lag =====
    const cached = getCachedMovies();
    if (cached && cached.length > 0) {
        // Chỉ lấy 12 phim đầu từ cache để hiển thị nhanh
        const limitedCache = cached.slice(0, 12);
        allMovies = limitedCache.filter(isAnimeCartoon);
        syncWindowExports();
        container.innerHTML = '';
        renderedMovieIds.clear();
        
        if (allMovies.length > 0) {
            // Chỉ render 8 phim ban đầu
            const initialCount = Math.min(8, allMovies.length);
            renderMovies(allMovies.slice(0, initialCount), container);
            setupLazyLoader(container);
            // Banner chỉ lấy 5 phim đầu
            initBanner(limitedCache);
            renderSuggestions(limitedCache);
        } else {
            showAnimeUpdatingMessage(container);
        }
        
        // Tối ưu: Dùng requestIdleCallback cho các tác vụ nặng không cần thiết ngay
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

    // Bước 2: Fetch API trang 1 - trì hoãn 200ms để UI kịp render
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
                // Tối ưu: UPSERT cache bằng setTimeout để không block UI
                setTimeout(() => saveMoviesToCache(apiMovies), 100);
                
                container.innerHTML = '';
                renderedMovieIds.clear();
                destroyLazyLoader();
                allMovies = apiMovies;
                syncWindowExports();
                // Chỉ render 8 phim đầu
                const initialCount = Math.min(8, allMovies.length);
                renderMovies(allMovies.slice(0, initialCount), container);
                setupLazyLoader(container);
                initBanner(apiMovies);
                renderSuggestions(apiMovies);
                
                // Keywords và Top Movies chạy sau
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
                    destroyLazyLoader();
                    allMovies = fallbackAnime;
                    syncWindowExports();
                    const initialCount = Math.min(8, allMovies.length);
                    renderMovies(allMovies.slice(0, initialCount), container);
                    setupLazyLoader(container);
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

    // Bước 3: TRÌ HOÃN sync toàn bộ - 12 giây thay vì 3 giây
    setTimeout(() => {
        autoSync();
    }, 12000);

    // Lên lịch chạy mỗi 45 phút (tăng từ 30 lên 45 để giảm tải)
    setInterval(autoSync, 45 * 60 * 1000);

    const randomBtn = document.getElementById('random-anime-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', (e) => { e.preventDefault(); handleRandomAnime(); });
    }

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            const grid = document.getElementById('movies-grid');
            const currentCount = grid ? grid.querySelectorAll('.anime-card').length : 0;
            const totalAvailable = allMovies.length;
            if (currentCount < totalAvailable) {
                const nextBatch = allMovies.slice(currentCount, currentCount + LAZY_STEP);
                if (nextBatch.length > 0) renderMovies(nextBatch, grid);
            } else if (!isLoadingMore && currentPage < totalPages) {
                loadNextPage();
            }
        });
    }
});

// ====== loadAllAnimeMovies - CẢI TIẾN: Dùng fetchAllAnimeFromAPI ======
async function loadAllAnimeMovies(container) {
    console.log('🎬 [ANIME] Bắt đầu tải toàn bộ phim anime...');
    
    try {
        // Dùng hàm fetchAllAnimeFromAPI đã cải tiến
        const apiMovies = await fetchAllAnimeFromAPI();
        
        container.innerHTML = '';
        renderedMovieIds.clear();
        destroyLazyLoader();
        
        if (!apiMovies || apiMovies.length === 0) {
            showAnimeUpdatingMessage(container);
            return;
        }
        
        // UPSERT vào cache
        saveMoviesToCache(apiMovies);
        allMovies = apiMovies;
        syncWindowExports();
        renderMovies(allMovies.slice(0, displayCount), container);
        setupLazyLoader(container);
        renderKeywords();
        renderTopMovies();
        
        const countEl = document.createElement('div');
        countEl.className = 'count-info';
        countEl.textContent = `🎬 Đã tải tổng cộng ${apiMovies.length} phim anime`;
        container.appendChild(countEl);
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
        // Lọc anime cho các category khác
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
    const container = document.getElementById('movies-grid');
    if (!container) return;

    const slug = CATEGORY_SLUG_MAP[category] || category;
    container.className = 'anime-grid';

    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-tab[data-category="${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    container.innerHTML = '';
    renderedMovieIds.clear();
    destroyLazyLoader();

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

    renderMovies(apiMovies, container);
    setupLazyLoader(container);
}

// ====== BANNER MỚI: Auto-slide + Hot Movies ======
let bannerInterval = null;
let bannerCurrentIndex = 0;
let bannerMovies = [];

function initBanner(movies) {
    const bannerEl = document.getElementById('banner-section');
    if (!bannerEl) return;

    // Lọc 5 phim đầu có ảnh
    bannerMovies = movies.slice(0, 5).filter(m => m && m.slug && m.thumb_url);
    if (!bannerMovies.length) return;

    bannerCurrentIndex = 0;

    // Render dots
    renderBannerDots();
    // Render hot movies
    renderHotMovies();
    // Hiển thị banner đầu tiên
    showBannerSlide(0);
    // Auto-slide
    startBannerAutoSlide();
    // Click hot item
    setupHotClick();
    // Click watch button
    setupWatchButton();
}

function renderBannerDots() {
    const dotsContainer = document.getElementById('banner-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = bannerMovies.map((_, i) => 
        `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
    ).join('');
    
    // Click dots
    dotsContainer.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            bannerCurrentIndex = idx;
            showBannerSlide(idx);
            resetBannerAutoSlide();
        });
    });
}

function renderHotMovies() {
    const hotList = document.getElementById('hot-list');
    if (!hotList) return;
    
    // Lấy 6 phim hot nhất (theo view)
    const hotMovies = [...bannerMovies].slice(0, 6);
    
    hotList.innerHTML = hotMovies.map((movie, idx) => {
        const title = movie.name || movie.title || 'Anime';
        const thumbUrl = movie.thumb_url || movie.thumb || '';
        const posterUrl = movie.poster_url || '';
        const imgSrc = buildImageUrl(thumbUrl, posterUrl);
        const rating = movie.tmdb?.vote_average || movie.vote_average || 'N/A';
        const ep = movie.episode_current || '1';
        
        return `
            <div class="hot-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                <div class="hot-thumb">
                    <img src="${imgSrc}" alt="${title}" loading="lazy" />
                    <span class="hot-badge-rating">⭐${rating}</span>
                    <span class="hot-badge-ep">
                        <small>TẬP</small>
                        ${ep}
                    </span>
                </div>
                <p class="hot-title">${title}</p>
            </div>`;
    }).join('');
}

function setupHotClick() {
    document.querySelectorAll('.hot-item').forEach(item => {
        item.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            bannerCurrentIndex = idx;
            showBannerSlide(idx);
            resetBannerAutoSlide();
            // Highlight active
            document.querySelectorAll('.hot-item').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function setupWatchButton() {
    const btn = document.getElementById('btn-watch-banner');
    if (!btn) return;
    btn.addEventListener('click', function() {
        const movie = bannerMovies[bannerCurrentIndex];
        if (movie && movie.slug) {
            window.location.href = 'watch.html?id=' + movie.slug;
        }
    });
}

function showBannerSlide(index) {
    const movie = bannerMovies[index];
    if (!movie) return;

    const img = document.getElementById('banner-img');
    const titleEl = document.getElementById('banner-title');
    const descEl = document.getElementById('banner-desc');
    const genresEl = document.getElementById('banner-genres');
    const metaEl = document.getElementById('banner-meta');
    const dots = document.querySelectorAll('.dot');
    const hotItems = document.querySelectorAll('.hot-item');

    const thumbUrl = movie.thumb_url || movie.thumb || '';
    const posterUrl = movie.poster_url || '';
    const imgSrc = buildImageUrl(thumbUrl, posterUrl);

    // Cập nhật ảnh nền
    if (img) {
        img.src = imgSrc !== PLACEHOLDER ? imgSrc : DEMO_BG;
        img.alt = movie.name || movie.title || 'Anime';
    }

    // Cập nhật title
    if (titleEl) {
        titleEl.textContent = movie.name || movie.title || 'Anime Hot';
    }

    // Cập nhật description
    if (descEl) {
        descEl.textContent = movie.content || movie.description || `Xem ${movie.name || movie.title} với chất lượng cao, vietsub.`;
    }

    // Cập nhật genres
    if (genresEl) {
        let catStr = 'Hoạt hình';
        if (Array.isArray(movie.category)) {
            catStr = movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean).slice(0, 3).join(', ');
        }
        genresEl.textContent = `🎬 Thể Loại: ${catStr}`;
    }

    // Cập nhật meta (rating, tập, năm...)
    if (metaEl) {
        const rating = movie.tmdb?.vote_average || movie.vote_average || 'N/A';
        const ep = safeEpisodeDisplay(movie.episode_current);
        const year = movie.year || '2024';
        const quality = movie.quality || 'HD';
        const lang = movie.lang || 'Vietsub';
        metaEl.innerHTML = `
            <span class="rating">⭐ ${rating}</span>
            <span class="episode">${ep}</span>
            <span class="year">${year}</span>
            <span class="quality">${quality}</span>
            <span class="sub">${lang}</span>`;
    }

    // Cập nhật dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Cập nhật hot items highlight
    hotItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// Auto-slide
function startBannerAutoSlide() {
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const next = (bannerCurrentIndex + 1) % bannerMovies.length;
        bannerCurrentIndex = next;
        showBannerSlide(next);
        // Update hot items active
        document.querySelectorAll('.hot-item').forEach((el, i) => {
            el.classList.toggle('active', i === next);
        });
    }, 5000);
}

function resetBannerAutoSlide() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
    }
    startBannerAutoSlide();
}

// Preload ảnh tiếp theo
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

// Gọi preload sau khi show slide
const originalShowBannerSlide = showBannerSlide;
showBannerSlide = function(index) {
    originalShowBannerSlide(index);
    preloadNextBannerImage();
};

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

    // Tìm kiếm mở rộng
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