/**
 * main.js - Trang chủ: Danh sách phim hoạt hình từ API Ophim
 * Tối ưu hóa: Skeleton screen, Image loading, Error boundary, Event delegation
 * 
 * PATCH 2026 - Lệnh 1+2+3: redesigned layout, 6-column grid, tooltip, keywords, top movies
 */

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22200%22 height%3D%22300%22 viewBox%3D%220 0 200 300%22%3E%3Crect width%3D%22200%22 height%3D%22300%22 fill%3D%22%2312121a%22%2F%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2214%22 fill%3D%22%23555566%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
const BANNER_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22800%22 height%3D%22400%22 viewBox%3D%220 0 800 400%22%3E%3Crect width%3D%22800%22 height%3D%22400%22 fill%3D%22%2312121a%22%2F%3E%3Cdefs%3E%3ClinearGradient id%3D%22g%22 x1%3D%220%25%22 y1%3D%220%25%22 x2%3D%22100%25%22 y2%3D%22100%25%22%3E%3Cstop offset%3D%220%25%22 stop-color%3D%22%231a1a2e%22/%3E%3Cstop offset%3D%22100%25%22 stop-color%3D%22%230a0a0f%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width%3D%22800%22 height%3D%22400%22 fill%3D%22url(%23g)%22/%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2220%22 fill%3D%22%23555566%22%3E%F0%9F%8E%AC Anime%3C%2Ftext%3E%3C%2Fsvg%3E';
const DEMO_BG = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22800%22 height%3D%22400%22 viewBox%3D%220 0 800 400%22%3E%3Crect width%3D%22800%22 height%3D%22400%22 fill%3D%22%2312121a%22/%3E%3Ccircle cx%3D%22400%22 cy%3D%22200%22 r%3D%22100%22 fill%3D%22%232a2a3a%22 opacity%3D%220.5%22/%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2224%22 fill%3D%22%23666677%22%3E%F0%9F%8E%AC%3C%2Ftext%3E%3C%2Fsvg%3E';
let IMG_BASE = 'https://img.ophim.live/uploads/movies/';
const CACHE_KEY = 'anime_data';
const CACHE_TIME_KEY = 'anime_data_time';
const MAX_RETRIES = 2;

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

// ====== SWIPER BANNER ======
let swiperInstance = null;

// ====== KEYWORDS LỌC ANIME ======
const ANIME_KEYWORDS = ['hoạt hình', 'anime', 'animation', 'hoat hinh', 'cartoon', 'hoathinh', 'animated'];

// ====== ALL GENRE KEYWORDS FOR TAG CLOUD ======
const ALL_GENRES = [
  'Anime', 'Hành Động', 'Phiêu Lưu', 'Chính Kịch', 'Siêu Nhân', 'Hài Hước',
  'Kinh Dị', 'Tình Cảm', 'Tâm Lý', 'Viễn Tưởng', 'Võ Thuật', 'Học Đường',
  'Phép Thuật', 'Khoa Học', 'Âm Nhạc', 'Thể Thao', 'Siêu Nhiên', 'Lịch Sử',
  'Chiến Tranh', 'Đời Thường', 'Mecha', 'Romance', 'Shounen', 'Seinen',
  'Shoujo', 'Slice of Life', 'Super Power', 'Fantasy', 'Horror', 'Thriller',
  'Mystery', 'Drama', 'Comedy', 'Action', 'Adventure'
];

/**
 * Kiểm tra phim có phải là anime/hoạt hình hay không
 */
function isAnimeMovie(movie) {
    if (!movie) return false;
    if (Array.isArray(movie.category)) {
        const catNames = movie.category.map(c => (typeof c === 'object' ? c.name : '').toLowerCase().trim()).filter(Boolean);
        for (const name of catNames) {
            if (ANIME_KEYWORDS.some(keyword => name.includes(keyword))) return true;
        }
    }
    const desc = (movie.content || movie.description || '').toLowerCase();
    if (ANIME_KEYWORDS.some(keyword => desc.includes(keyword))) return true;
    if (Array.isArray(movie.category)) {
        const catSlugs = movie.category.map(c => (typeof c === 'object' ? c.slug : '')).filter(Boolean);
        for (const slug of catSlugs) {
            if (ANIME_KEYWORDS.some(keyword => slug.includes(keyword))) return true;
        }
    }
    const type = (movie.type || '').toLowerCase();
    if (ANIME_KEYWORDS.some(keyword => type.includes(keyword))) return true;
    return false;
}

function filterAnimeMovies(movies) {
    if (!movies || !Array.isArray(movies)) return [];
    return movies.filter(isAnimeMovie);
}

/**
 * I. IMAGE OPTIMIZATION: WebP support with fallback
 */
function supportsWebP() {
    try {
        return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch(e) {
        return false;
    }
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
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(movies));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) { /* Silent fail */ }
}

function getCachedMovies() {
    try {
        const data = localStorage.getItem(CACHE_KEY);
        const time = localStorage.getItem(CACHE_TIME_KEY);
        if (!data || !time) return null;
        return JSON.parse(data);
    } catch (e) { return null; }
}

function formatViews(views) {
    if (!views) return '0';
    const num = parseInt(views);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Tr';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function handleImageLoaded(imgEl) {
    if (imgEl) imgEl.classList.add('loaded');
}

function removeSkeletonCards(container) {
    if (!container) return;
    const skeletons = container.querySelectorAll('.skeleton-card');
    skeletons.forEach(s => s.remove());
}

function createMovieCardHTML(movie) {
    try {
        const title = movie.name || movie.title || 'Không có tên';
        const slug = movie.slug || movie._id || '';
        const year = movie.year || 'Đang cập nhật';
        const displayEp = safeEpisodeDisplay(movie.episode_current);
        const thumbUrl = movie.thumb_url || movie.thumb || '';
        const posterUrl = movie.poster_url || '';
        const imgSrc = buildImageUrl(thumbUrl, posterUrl);
        const views = formatViews(movie.view || movie.views || 0);
        const rating = movie.tmdb?.vote_average || movie.vote_average || 'N/A';
        const quality = movie.quality || 'FHD';
        let catStr = 'Hoạt hình';
        if (Array.isArray(movie.category)) {
            catStr = movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean).slice(0, 3).join(', ');
        }

        return `
            <div class="movie-card" data-slug="${slug}">
                <a href="watch.html?id=${slug}" class="block">
                    <div class="relative overflow-hidden bg-gray-700">
                        <img src="${imgSrc}" 
                             alt="${title}" 
                             class="movie-card-img"
                             width="200"
                             height="300"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='${PLACEHOLDER}'; this.style.opacity='0.5';"
                             onload="this.classList.add('loaded')">
                        <span class="episode-badge">${displayEp}</span>
                        <div class="movie-card-overlay">
                            <span class="play-button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21"></polygon>
                                </svg>
                                Xem Phim
                            </span>
                        </div>
                        <div class="movie-tooltip">
                            <div class="tooltip-item">
                                <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                <span>Điểm đánh giá: <strong>${rating}</strong></span>
                            </div>
                            <div class="tooltip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <span>Năm: <strong>${year}</strong></span>
                            </div>
                            <div class="tooltip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                <span>Thể loại: <strong>${catStr}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div class="movie-info">
                        <h3 class="movie-title">${title}</h3>
                        <div class="movie-meta">
                            <span class="movie-views">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                ${views}
                            </span>
                            <span>•</span>
                            <span>${year}</span>
                            <span>•</span>
                            <span>${quality}</span>
                        </div>
                    </div>
                </a>
            </div>`;
    } catch (e) {
        console.error('❌ Lỗi tạo thẻ phim HTML:', e.message, movie);
        return `<div class="movie-card bg-gray-800 rounded-lg p-4 text-center text-gray-400 text-sm">
                    <p>Không thể hiển thị phim</p>
                    <p class="text-xs opacity-60">${movie?.name || movie?.title || 'Không xác định'}</p>
                </div>`;
    }
}

/**
 * renderMovies - Xóa skeleton, render movies vào container
 */
function renderMovies(movies, container) {
    try {
        if (!movies || movies.length === 0) return;
        removeSkeletonCards(container);

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

// ====== RENDER SUGGESTION CARDS (bên phải banner) ======
function renderSuggestions(movies) {
    const container = document.getElementById('suggestions-list');
    if (!container || !movies || movies.length === 0) return;

    // Lấy 3-4 phim có view cao nhất
    const sorted = [...movies].sort((a, b) => {
        const viewA = parseInt(a.view || a.views || 0);
        const viewB = parseInt(b.view || b.views || 0);
        return viewB - viewA;
    }).slice(0, 4);

    let html = '';
    sorted.forEach((movie, idx) => {
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
                     onerror="this.onerror=null; this.src='${PLACEHOLDER}'; this.style.opacity='0.5';">
                <div class="suggestion-card-info">
                    <div class="suggestion-card-title">${title}</div>
                    <div class="suggestion-card-meta">${year} • ${quality} • ${lang}</div>
                </div>
                <span class="suggestion-card-badge">${ep}</span>
            </a>`;
    });

    container.innerHTML = html;
}

// ====== RENDER KEYWORDS (TAG CLOUD) ======
function renderKeywords() {
    const containers = [
        document.getElementById('sidebar-keywords'),
        document.getElementById('sidebar-keywords-mobile')
    ].filter(Boolean);

    if (containers.length === 0) return;

    // Lấy keywords từ dữ liệu phim hiện có
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

    // Nếu không đủ keywords từ phim, dùng danh sách mặc định
    let keywordArray = Array.from(keywords).filter(Boolean);
    if (keywordArray.length < 10) {
        keywordArray = ALL_GENRES;
    }

    // Random sắp xếp và lấy 15-20 tag
    const shuffled = [...keywordArray].sort(() => Math.random() - 0.5).slice(0, 18);

    const html = shuffled.map(kw => {
        const slug = kw.toLowerCase()
            .replace(/đ/g, 'd').replace(/Đ/g, 'd')
            .replace(/[\s]+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        return `<a href="#" class="keyword-tag" onclick="event.preventDefault(); if(typeof window.filterByCategory === 'function') window.filterByCategory('${slug}');">${kw}</a>`;
    }).join('');

    containers.forEach(container => {
        container.innerHTML = html;
    });
}

// ====== RENDER TOP MOVIES (1-10) ======
function renderTopMovies() {
    const containers = [
        document.getElementById('sidebar-top-movies'),
        document.getElementById('sidebar-top-movies-mobile')
    ].filter(Boolean);

    if (containers.length === 0) return;

    // Sắp xếp theo view/rating để lấy top 10
    const sorted = allMovies && allMovies.length > 0
        ? [...allMovies].sort((a, b) => {
            const viewA = parseInt(a.view || a.views || 0);
            const viewB = parseInt(b.view || b.views || 0);
            return viewB - viewA;
        }).slice(0, 10)
        : [];

    if (sorted.length === 0) {
        const fallbackHtml = `<div class="text-center text-gray-500 text-xs py-4">Chưa có dữ liệu</div>`;
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

    containers.forEach(container => {
        container.innerHTML = html;
    });
}

// ====== XEM PHIM NGẪU NHIÊN ======
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

// ====== SEARCH (Instant Search - local filter) ======
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

    const filtered = allMovies.filter(m => {
        const name = (m.name || m.title || '').toLowerCase();
        const originName = (m.origin_name || m.originName || '').toLowerCase();
        return name.includes(q) || originName.includes(q);
    });

    currentFiltered = filtered;
    container.innerHTML = '';
    renderedMovieIds.clear();
    destroyLazyLoader();

    if (!filtered.length) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 opacity-50">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p class="text-lg font-semibold mb-1">Không tìm thấy kết quả</p>
                <p class="text-sm opacity-60">Không tìm thấy phim nào với từ khóa "${q}"</p>
            </div>`;
        return;
    }

    displayCount = 12;
    renderMovies(filtered.slice(0, displayCount), container);
    setupLazyLoader(container);
};

/**
 * FALLBACK: Load dữ liệu từ file data.json khi API chính không hoạt động
 */
async function loadFallbackData(container) {
    console.log('📁 Đang tải fallback từ data.json...');
    try {
        console.log('🔍 Đường dẫn fetch data.json:', 'data/data.json');
        const response = await fetch('data/data.json');
        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Content-Type:', response.headers.get('content-type'));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log('📦 Dữ liệu phim (raw):', data);
        let movies = data?.movies || data?.items || [];
        
        if (!movies || movies.length === 0) {
            console.log('⚠️ Fallback data.json không có dữ liệu');
            return [];
        }
        
        console.log('🎬 Số phim tìm thấy:', movies.length);

        const convertedMovies = movies.map(m => ({
            name: m.title || m.name || 'Không có tên',
            slug: m.slug || String(m.id || Math.random()),
            title: m.title || m.name || 'Không có tên',
            year: m.year || '2024',
            episode_current: m.episode_current || '1',
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

        console.log(`📁 Fallback: ${convertedMovies.length} phim từ data.json`);
        
        const hasMovies = container && container.querySelectorAll('.movie-card').length > 0;
        if (!hasMovies || !allMovies.length) {
            container.innerHTML = '';
            renderedMovieIds.clear();
            destroyLazyLoader();
            cacheMovies(convertedMovies);
            allMovies = convertedMovies;
            syncWindowExports();
            renderMovies(allMovies.slice(0, displayCount), container);
            setupLazyLoader(container);
            initSwiperBanner(convertedMovies);
            renderSuggestions(convertedMovies);
            renderKeywords();
            renderTopMovies();
            hideLoadingSpinner();
        }
        
        return convertedMovies;
    } catch (err) {
        console.error('⚠️ Fallback lỗi:', err.message);
        return [];
    }
}

// ====== HÀM CHÍNH: fetchMovies ======
async function fetchMovies(container, page) {
    console.log('📡 Đang tải trang:', page);

    const url = `https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${page}`;
    console.log('🔗 URL:', url);

    try {
        const data = await fetchWithRetry(url);

        const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }

        const paginate = data?.data?.paginate || {};
        totalPages = paginate.total_page || 1;
        console.log('📊 Tổng số trang:', totalPages);

        let apiMovies = data?.data?.items || data?.items || [];
        if (!apiMovies || apiMovies.length === 0) {
            console.log('⚠️ Không có phim nào ở trang', page, '- Thử fallback từ data.json');
            const fallbackData = await loadFallbackData(container);
            if (fallbackData && fallbackData.length > 0) {
                return fallbackData;
            }
            if (!allMovies.length) showEmptyState(container);
            return [];
        }

        const filteredMovies = filterAnimeMovies(apiMovies);
        console.log(`🎬 Sau lọc anime: ${filteredMovies.length}/${apiMovies.length} phim`);
        
        if (filteredMovies.length > 0) {
            apiMovies = filteredMovies;
        } else {
            console.log('⚠️ Không tìm thấy phim anime sau lọc, dùng tất cả phim');
        }

        if (page === 1) {
            container.innerHTML = '';
            renderedMovieIds.clear();
            destroyLazyLoader();
            cacheMovies(apiMovies);
            allMovies = apiMovies;
            syncWindowExports();
            renderMovies(allMovies.slice(0, displayCount), container);
            setupLazyLoader(container);
            initSwiperBanner(apiMovies);
            renderSuggestions(apiMovies);
            renderKeywords();
            renderTopMovies();
            console.log('✅ Render trang 1:', apiMovies.length, 'phim');
            hideLoadingSpinner();
        } else {
            renderMovies(apiMovies, container);
            allMovies = allMovies.concat(apiMovies);
            syncWindowExports();
            renderKeywords(); // Cập nhật keywords khi có thêm phim
            renderTopMovies(); // Cập nhật top movies
            hideLoadingSpinner();
            console.log('📄 Đã ghép thêm trang', page, ':', apiMovies.length, 'phim - Tổng:', allMovies.length);
        }

        return apiMovies;
    } catch (err) {
        console.error('⚠️ API lỗi:', err.message);
        hideLoadingSpinner();
        if (!allMovies || allMovies.length === 0) {
            try {
                const fallbackData = await loadFallbackData(container);
                if (fallbackData && fallbackData.length > 0) {
                    return fallbackData;
                }
            } catch (fbErr) {
                console.error('⚠️ Fallback cũng lỗi:', fbErr.message);
            }
            showErrorState(container);
        }
        return [];
    }
}

// ====== INTERSECTION OBSERVER - LAZY LOADING ======
function setupLazyLoader(container) {
    destroyLazyLoader();
    if (!container) return;
    
    let sentinel = document.getElementById('lazy-load-sentinel');
    if (!sentinel) {
        sentinel = document.createElement('div');
        sentinel.id = 'lazy-load-sentinel';
        sentinel.className = 'col-span-full h-1';
        container.appendChild(sentinel);
    }

    intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadMoreMovies(container);
            }
        });
    }, {
        rootMargin: '200px',
        threshold: 0
    });

    intersectionObserver.observe(sentinel);
    console.log('♾️ Lazy Loader (IntersectionObserver) đã được kích hoạt');
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

    const currentCount = container.querySelectorAll('.movie-card').length;
    const totalAvailable = allMovies.length;

    if (currentCount >= totalAvailable) {
        if (!isLoadingMore && currentPage < totalPages) {
            loadNextPage();
        }
        return;
    }

    const nextBatch = allMovies.slice(currentCount, currentCount + LAZY_STEP);
    if (nextBatch.length > 0) {
        renderMovies(nextBatch, container);
        console.log(`📄 Lazy load: +${nextBatch.length} phim (hiện tại: ${currentCount + nextBatch.length}/${allMovies.length})`);
    }
}

// ====== INFINITE SCROLL ======
function showLoadingSpinner() {
    const container = document.getElementById('movies-grid');
    if (!container) return;
    let spinner = document.getElementById('infinite-scroll-spinner');
    if (spinner) return;

    spinner = document.createElement('div');
    spinner.id = 'infinite-scroll-spinner';
    spinner.className = 'col-span-full flex justify-center py-8';
    spinner.innerHTML = `
        <div class="flex items-center gap-3 text-gray-400">
            <div class="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
            <span class="text-sm">Đang tải trang ${currentPage + 1}...</span>
        </div>`;
    container.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('infinite-scroll-spinner');
    if (spinner) spinner.remove();
}

function showEndOfCatalog() {
    const container = document.getElementById('movies-grid');
    if (!container) return;
    const existing = document.getElementById('infinite-scroll-end');
    if (existing) return;

    const endDiv = document.createElement('div');
    endDiv.id = 'infinite-scroll-end';
    endDiv.className = 'col-span-full flex flex-col items-center justify-center py-10 text-gray-500';
    endDiv.innerHTML = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 opacity-50">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
        <p class="text-sm font-medium">🎉 Bạn đã xem hết tất cả phim!</p>
        <p class="text-xs opacity-60 mt-1">Có ${allMovies.length} bộ phim đã được tải. Hẹn gặp lại bạn ở những bộ phim mới nhất.</p>`;
    container.appendChild(endDiv);
}

async function loadNextPage() {
    if (isLoadingMore) return;
    if (currentPage >= totalPages) {
        console.log('🏁 Đã hết trang, không tải nữa. currentPage:', currentPage, '/', totalPages);
        return;
    }

    isLoadingMore = true;
    currentPage++;
    showLoadingSpinner();

    const container = document.getElementById('movies-grid');
    const newMovies = await fetchMovies(container, currentPage);

    if (!newMovies || newMovies.length === 0) {
        currentPage--;
        hideLoadingSpinner();
        isLoadingMore = false;
        return;
    }

    hideLoadingSpinner();

    if (currentPage >= totalPages) {
        showEndOfCatalog();
    }

    isLoadingMore = false;
}

// ====== DOMContentLoaded - Parallel Loading với Promise.all ======
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    container.className = 'movies-grid';

    // Xóa cache cũ
    try {
        const oldCache = localStorage.getItem(CACHE_KEY);
        if (oldCache) {
            const parsed = JSON.parse(oldCache);
            const filteredCache = filterAnimeMovies(parsed);
            if (parsed.length > 0 && filteredCache.length === 0) {
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIME_KEY);
            }
        }
    } catch (e) {}

    // Parallel: Load từ cache + fetch API cùng lúc
    const [cached, apiResult] = await Promise.all([
        // Cache promise
        new Promise(resolve => {
            const c = getCachedMovies();
            resolve(c || []);
        }),
        // API promise
        (async () => {
            try {
                const data = await fetchWithRetry('https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=1');
                const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE;
                if (cdnDomain) {
                    IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
                }
                const paginate = data?.data?.paginate || {};
                totalPages = paginate.total_page || 1;
                let apiMovies = data?.data?.items || data?.items || [];
                if (!apiMovies || apiMovies.length === 0) return null;
                const filteredMovies = filterAnimeMovies(apiMovies);
                if (filteredMovies.length > 0) apiMovies = filteredMovies;
                return apiMovies;
            } catch (err) {
                console.warn('⚠️ API lỗi:', err.message);
                return null;
            }
        })()
    ]);

    // Cache render ngay lập tức (nếu có)
    if (cached && cached.length > 0) {
        allMovies = cached;
        syncWindowExports();
        container.innerHTML = '';
        renderedMovieIds.clear();
        renderMovies(allMovies.slice(0, displayCount), container);
        setupLazyLoader(container);
        initSwiperBanner(cached);
        renderSuggestions(cached);
        renderKeywords();
        renderTopMovies();
        console.log('📦 Render từ cache:', cached.length, 'phim');
    }

    // API result - ghi đè lên cache
    if (apiResult && apiResult.length > 0) {
        container.innerHTML = '';
        renderedMovieIds.clear();
        destroyLazyLoader();
        cacheMovies(apiResult);
        allMovies = apiResult;
        syncWindowExports();
        renderMovies(allMovies.slice(0, displayCount), container);
        setupLazyLoader(container);
        initSwiperBanner(apiResult);
        renderSuggestions(apiResult);
        renderKeywords();
        renderTopMovies();
        hideLoadingSpinner();
        console.log('✅ Render từ API:', apiResult.length, 'phim');
    } else if (!cached || cached.length === 0) {
        // Không có cache và API lỗi, thử fallback
        setupLazyLoader(container);
        loadFallbackData(container);
    }

    // RANDOM ANIME BUTTON
    const randomBtn = document.getElementById('random-anime-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleRandomAnime();
        });
    }

    // FILTER BUTTONS
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            filterByCategory(category);
        });
    });
});

// ====== TẢI TOÀN BỘ PHIM ANIME ======
async function loadAllAnimeMovies(container) {
    console.log('🎬 [ANIME] Bắt đầu tải toàn bộ phim anime...');
    
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <div class="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin mb-4"></div>
            <p class="text-sm">Đang tải toàn bộ phim anime...</p>
            <p class="text-xs opacity-60 mt-1">Vui lòng chờ trong giây lát</p>
        </div>`;

    try {
        const firstUrl = 'https://ophim1.com/v1/api/the-loai/hoat-hinh?page=1';
        const firstResponse = await fetchWithRetry(firstUrl);
        
        const totalPage = firstResponse?.data?.paginate?.total_page || 1;
        console.log('📊 [ANIME] Tổng số trang:', totalPage);
        
        let allAnimeMovies = firstResponse?.data?.items || [];
        
        const cdnDomain = firstResponse?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }
        
        const maxPages = Math.min(totalPage, 5);
        
        for (let page = 2; page <= maxPages; page++) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <div class="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin mb-4"></div>
                    <p class="text-sm">Đang tải phim trang ${page}/${maxPages}...</p>
                    <p class="text-xs opacity-60 mt-1">Đã tải ${allAnimeMovies.length} phim</p>
                </div>`;
            
            try {
                const pageUrl = `https://ophim1.com/v1/api/the-loai/hoat-hinh?page=${page}`;
                const pageResponse = await fetchWithRetry(pageUrl);
                const pageMovies = pageResponse?.data?.items || [];
                
                if (pageMovies.length > 0) {
                    allAnimeMovies = allAnimeMovies.concat(pageMovies);
                    console.log(`📄 [ANIME] Trang ${page}: +${pageMovies.length} phim`);
                }
            } catch (e) {
                console.warn(`⚠️ [ANIME] Lỗi trang ${page}:`, e.message);
            }
        }
        
        console.log(`✅ [ANIME] Tổng cộng: ${allAnimeMovies.length} phim`);
        
        container.innerHTML = '';
        
        if (!allAnimeMovies || allAnimeMovies.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 opacity-50">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                        <line x1="7" y1="2" x2="7" y2="22"></line>
                        <line x1="17" y1="2" x2="17" y2="22"></line>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                    </svg>
                    <p class="text-lg font-semibold mb-1">Chưa có phim cho thể loại này</p>
                    <p class="text-sm opacity-60">Hiện tại chưa có phim thuộc thể loại Anime.</p>
                </div>`;
            return;
        }
        
        destroyLazyLoader();
        renderMovies(allAnimeMovies, container);
        setupLazyLoader(container);
        renderKeywords();
        renderTopMovies();
        
        const countEl = document.createElement('div');
        countEl.className = 'col-span-full text-center text-gray-500 text-xs py-2';
        countEl.textContent = `🎬 Đã tải tổng cộng ${allAnimeMovies.length} phim anime`;
        container.appendChild(countEl);
        
        console.log('✅ [ANIME] Hoàn tất!');
    } catch (err) {
        console.error('⚠️ [ANIME] Lỗi:', err.message);
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 text-red-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p class="text-lg font-semibold mb-1 text-red-400">Lỗi kết nối</p>
                <p class="text-sm opacity-60">Không thể tải dữ liệu phim anime.</p>
                <button onclick="location.reload()" 
                        class="mt-4 px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium">
                    Thử lại
                </button>
            </div>`;
    }
}

// ====== HÀM FETCH THEO THỂ LOẠI ======
async function fetchMoviesByCategory(slug) {
    const url = `https://ophim1.com/v1/api/the-loai/${slug}?page=1`;
    console.log('📡 [fetchMoviesByCategory] Đang tải thể loại:', slug);

    try {
        const response = await fetchWithRetry(url);

        const cdnDomain = response?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }

        const apiMovies = response?.data?.items || [];
        console.log('🎬 [fetchMoviesByCategory] Số phim:', apiMovies.length);

        return apiMovies;
    } catch (err) {
        console.error('⚠️ [fetchMoviesByCategory] Lỗi:', err.message);
        return [];
    }
}

// ====== CATEGORY SLUG MAP ======
const CATEGORY_SLUG_MAP = {
    'all': 'all',
    'hanh-dong': 'hanh-dong',
    'phieu-luu': 'phieu-luu',
    'chinh-kich': 'chinh-kich',
    'hoat-hinh': 'hoat-hinh',
    'sieu-nhan': 'sieu-nhan',
    'anime': 'hoat-hinh',
    'hoat-hinh-trung-quoc': 'hoat-hinh-trung-quoc',
    'hai-huoc': 'hai-huoc',
    'kinh-di': 'kinh-di',
    'tinh-cam': 'tinh-cam',
    'tam-ly': 'tam-ly',
    'vien-tuong': 'vien-tuong',
    'vo-thuat': 'vo-thuat'
};

// ====== FILTER ======
async function filterByCategory(category) {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    const slug = CATEGORY_SLUG_MAP[category] || category;

    container.className = 'movies-grid';

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`.filter-btn[data-category="${category}"]`);
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

    container.innerHTML = `
        <div class="col-span-full flex justify-center py-20">
            <div class="flex items-center gap-3 text-gray-400">
                <div class="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                <span class="text-sm">Đang tải phim thể loại "${slug}"...</span>
            </div>
        </div>`;

    const apiMovies = await fetchMoviesByCategory(slug);

    container.innerHTML = '';

    if (!apiMovies || apiMovies.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 opacity-50">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                </svg>
                <p class="text-lg font-semibold mb-1">Chưa có phim cho thể loại này</p>
                <p class="text-sm opacity-60">Hiện tại chưa có phim thuộc thể loại "${slug}".</p>
            </div>`;
        return;
    }

    renderMovies(apiMovies, container);
    setupLazyLoader(container);
    console.log('✅ Đã tải', apiMovies.length, 'phim thể loại', slug);
}

// ====== SWIPER BANNER - background-image thay vì img tag ======
function initSwiperBanner(movies) {
    const wrapper = document.getElementById('banner-swiper-wrapper');
    if (!wrapper) return;

    const bannerMovies = movies.slice(0, 5).filter(m => m && m.slug);
    if (!bannerMovies.length) return;

    wrapper.innerHTML = '';

    let slidesHTML = '';
    bannerMovies.forEach(movie => {
        const title = movie.name || movie.title || 'Anime Hot';
        const slug = movie.slug || '';
        const year = movie.year || '';
        const displayEp = safeEpisodeDisplay(movie.episode_current);
        const thumbUrl = movie.thumb_url || movie.thumb || '';
        const posterUrl = movie.poster_url || '';
        const imgSrc = buildImageUrl(thumbUrl, posterUrl);
        const desc = movie.content || movie.description || `Xem ${title} với chất lượng cao, vietsub, cập nhật nhanh nhất.`;
        const rating = movie.tmdb?.vote_average || movie.vote_average || '9.0';
        const quality = movie.quality || 'FHD';
        const lang = movie.lang || 'Vietsub';
        const epTotal = movie.episode_total || '??';

        let catStr = 'Hoạt hình';
        if (Array.isArray(movie.category)) {
            catStr = movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean).slice(0, 3).join(', ');
        }

        // background-image fallback chain: ảnh từ API -> fallback SVG -> demo gradient
        const bgImage = imgSrc !== PLACEHOLDER ? `url('${imgSrc}')` : `url('${DEMO_BG}')`;

        slidesHTML += `
            <div class="swiper-slide" style="background-image: ${bgImage}; background-size: cover; background-position: center; background-repeat: no-repeat;">
                <div class="banner-slide-overlay"></div>
                <div class="banner-slide-content">
                    <div class="banner-title">${title}</div>
                    <div class="banner-desc">${desc}</div>
                    <div class="banner-meta-row">
                        <a href="watch.html?id=${slug}" class="banner-cta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21"></polygon>
                            </svg>
                            Xem Phim
                        </a>
                        <span class="banner-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            ${rating}
                        </span>
                        <span class="banner-badge">${displayEp}</span>
                        <span class="banner-badge">${year}</span>
                        <span class="banner-badge">${quality}</span>
                        <span class="banner-badge">${lang}</span>
                        <span class="banner-comment">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            0
                        </span>
                    </div>
                </div>
            </div>`;
    });

    wrapper.innerHTML = slidesHTML;

    if (swiperInstance) {
        swiperInstance.destroy(true, true);
        swiperInstance = null;
    }

    swiperInstance = new Swiper('#banner-swiper', {
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '#banner-swiper-pagination',
            clickable: true,
        },
        speed: 600,
        grabCursor: true,
        watchSlidesProgress: true,
    });
}

// ====== UI HELPERS ======
function showEmptyState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 opacity-50">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <p class="text-lg font-semibold mb-1">Không tìm thấy phim</p>
            <p class="text-sm opacity-60">API hiện tại không có dữ liệu.</p>
        </div>`;
}

function showErrorState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 text-red-400">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p class="text-lg font-semibold mb-1 text-red-400">Lỗi kết nối</p>
            <p class="text-sm opacity-60">Không thể tải dữ liệu. Vui lòng thử lại.</p>
            <button onclick="location.reload()" 
                    class="mt-4 px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium">
                Thử lại
            </button>
        </div>`;
}

// ====== SUGGESTIONS ======
function getCategoryString(movie) {
    if (Array.isArray(movie.category)) {
        return movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean).slice(0, 2).join(', ');
    }
    return 'Hoạt hình';
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
        const catStr = getCategoryString(m).toLowerCase();
        return name.includes(q) || originName.includes(q) || catStr.includes(q);
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
                         onerror="this.onerror=null; this.src='${PLACEHOLDER}'; this.style.opacity='0.5';"
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