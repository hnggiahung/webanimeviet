/**
 * main.js - Trang chủ: Danh sách phim hoạt hình từ API Ophim
 * API: https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=1
 */

const PLACEHOLDER = 'https://via.placeholder.com/200x300';
let IMG_BASE = 'https://img.ophim.live/uploads/movies/';
const CACHE_KEY = 'anime_data';
const CACHE_TIME_KEY = 'anime_data_time';
const MAX_RETRIES = 2;

// ====== BIẾN GLOBAL ======
let allMovies = [];
let displayCount = 12;
let currentCategory = 'all';
let currentFiltered = null;
let currentPage = 1;          // <-- Biến toàn cục: trang hiện tại
let totalPages = 1;           // <-- Tổng số trang API
let isLoadingMore = false;    // Chống gọi trùng
let renderedMovieIds = new Set(); // Theo dõi ID phim đã render để tránh trùng lặp

// ====== BANNER ======
let bannerInterval = null;
let bannerMovies = [];
let currentBannerIndex = 0;

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
    } catch (e) {
        return null;
    }
}

function formatViews(views) {
    if (!views) return '0';
    const num = parseInt(views);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Tr';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
        const lang = movie.lang || 'Vietsub';
        const date = movie.modified?.time || movie.publish_date || 'Đang cập nhật';
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
                             loading="lazy"
                             onerror="this.onerror=null; this.src='${PLACEHOLDER}'; this.style.opacity='0.5';">
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
                                <span>Ngày đăng: <strong>${date}</strong></span>
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
 * renderMovies - LUÔN dùng insertAdjacentHTML('beforeend') để ghép vào cuối.
 * KHÔNG BAO GIỜ dùng container.innerHTML ở đây.
 * Chỉ xóa danh sách cũ ở BÊN NGOÀI (trong fetchMovies, filterByCategory, searchMovies)
 * khi cần render lại từ đầu.
 * Có kiểm tra trùng lặp ID để tránh thêm phim đã có trong DOM.
 */
function renderMovies(movies, container) {
    try {
        if (!movies || movies.length === 0) return;

        let html = '';
        movies.forEach(m => {
            const id = m.slug || m._id || '';
            // Kiểm tra trùng lặp: bỏ qua nếu phim đã có trong DOM
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

// ====== XEM PHIM NGẪU NHIÊN ======
window.handleRandomAnime = function() {
    // Lấy từ local storage hoặc allMovies
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

// ====== SEARCH ======
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
        renderMovies(allMovies.slice(0, displayCount), container);
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
};

// ====== HÀM CHÍNH: fetchMovies - TẢI PHIM TỪ API ======
async function fetchMovies(container, page) {
    console.log('📡 Đang tải trang:', page);  // LOG quan trọng: in ra trang đang tải

    // URL: https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${page}
    const url = `https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${page}`;
    console.log('🔗 URL:', url);

    try {
        const data = await fetchWithRetry(url);

        // Cập nhật CDN nếu có
        const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }

        // Lấy thông tin phân trang
        const paginate = data?.data?.paginate || {};
        totalPages = paginate.total_page || 1;
        console.log('📊 Tổng số trang:', totalPages);

        const apiMovies = data?.data?.items || data?.items || [];
        if (!apiMovies || apiMovies.length === 0) {
            console.log('⚠️ Không có phim nào ở trang', page);
            if (!allMovies.length) showEmptyState(container);
            return [];
        }

        if (page === 1) {
            // === TRANG 1: Xóa sạch container THỦ CÔNG, render bằng insertAdjacentHTML ===
            container.innerHTML = '';
            renderedMovieIds.clear();
            cacheMovies(apiMovies);
            allMovies = apiMovies;
            syncWindowExports();
            renderMovies(allMovies.slice(0, displayCount), container);
            updateBanner(apiMovies);
            console.log('✅ Render trang 1:', apiMovies.length, 'phim');
            hideLoadingSpinner();
        } else {
            // === TRANG > 1: GHÉP VÀO CUỐI (chỉ dùng insertAdjacentHTML, KHÔNG clear) ===
            renderMovies(apiMovies, container);
            allMovies = allMovies.concat(apiMovies);
            syncWindowExports();
            hideLoadingSpinner();
            console.log('📄 Đã ghép thêm trang', page, ':', apiMovies.length, 'phim - Tổng:', allMovies.length);
        }

        return apiMovies;
    } catch (err) {
        console.error('⚠️ API lỗi:', err.message);
        hideLoadingSpinner();
        if (!allMovies || allMovies.length === 0) {
            showErrorState(container);
        }
        return [];
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
    currentPage++;  // <-- TĂNG TRANG LÊN
    showLoadingSpinner();

    const container = document.getElementById('movies-grid');
    const newMovies = await fetchMovies(container, currentPage);  // <-- GỌI fetchMovies với trang mới

    if (!newMovies || newMovies.length === 0) {
        currentPage--; // Không có dữ liệu, lùi lại
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

function handleScroll() {
    // Chỉ hoạt động ở chế độ 'all' (không lọc, không tìm kiếm)
    if (currentCategory !== 'all' || currentFiltered !== null) return;

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Khi cuộn cách cuối 300px thì tải
    if (scrollY + windowHeight >= documentHeight - 300) {
        loadNextPage();
    }
}

function setupInfiniteScroll() {
    window.addEventListener('scroll', handleScroll, { passive: true });
    console.log('♾️ Infinite Scroll đã được kích hoạt');
}

// ====== DOMContentLoaded ======
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3';

    // Bước 1: Render từ cache ngay lập tức
    const cached = getCachedMovies();
    if (cached && cached.length > 0) {
        allMovies = cached;
        syncWindowExports();
        container.innerHTML = '';
        renderedMovieIds.clear();
        renderMovies(allMovies.slice(0, displayCount), container);
        console.log('📦 Render từ cache:', cached.length, 'phim');
    }

    // Bước 2: Gọi API trang 1
    fetchMovies(container, 1).then(() => {
        setupInfiniteScroll(); // Kích hoạt scroll sau khi có dữ liệu
    }).catch(() => {
        setupInfiniteScroll(); // Vẫn kích hoạt scroll kể cả lỗi
    });

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

// ====== TẢI TOÀN BỘ PHIM ANIME (NHIỀU TRANG) ======
async function loadAllAnimeMovies(container) {
    console.log('🎬 [ANIME] Bắt đầu tải toàn bộ phim anime...');
    
    // Hiển thị loading
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <div class="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin mb-4"></div>
            <p class="text-sm">Đang tải toàn bộ phim anime...</p>
            <p class="text-xs opacity-60 mt-1">Vui lòng chờ trong giây lát</p>
        </div>`;

    try {
        // Bước 1: Gọi trang 1 để lấy tổng số trang
        const firstUrl = 'https://ophim1.com/v1/api/the-loai/hoat-hinh?page=1';
        const firstResponse = await fetchWithRetry(firstUrl);
        
        const totalPage = firstResponse?.data?.paginate?.total_page || 1;
        console.log('📊 [ANIME] Tổng số trang:', totalPage);
        
        // Lấy phim từ trang 1
        let allAnimeMovies = firstResponse?.data?.items || [];
        
        // Cập nhật CDN
        const cdnDomain = firstResponse?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }
        
        // Bước 2: Tải các trang còn lại (tối đa 5 trang để tránh quá tải)
        const maxPages = Math.min(totalPage, 5);
        
        for (let page = 2; page <= maxPages; page++) {
            // Cập nhật loading text
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
                // Tiếp tục tải trang khác
            }
        }
        
        console.log(`✅ [ANIME] Tổng cộng: ${allAnimeMovies.length} phim`);
        
        // Xóa loading
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
        
        // Render tất cả phim
        renderMovies(allAnimeMovies, container);
        
        // Thêm thông báo số lượng phim
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
                        class="mt-4 px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Thử lại
                </button>
            </div>`;
    }
}

// ====== HÀM FETCH THEO THỂ LOẠI (ĐỘC LẬP) ======
/**
 * fetchMoviesByCategory(slug) - Gọi API thể loại, trả về danh sách phim
 * @param {string} slug - Slug thể loại (vd: hanh-dong, phieu-luu, hoat-hinh...)
 * @returns {Promise<Array>} - Mảng phim, hoặc [] nếu lỗi/không có
 */
async function fetchMoviesByCategory(slug) {
    const url = `https://ophim1.com/v1/api/the-loai/${slug}?page=1`;
    console.log('📡 [fetchMoviesByCategory] Đang tải thể loại:', slug);
    console.log('🔗 [fetchMoviesByCategory] URL:', url);

    try {
        const response = await fetchWithRetry(url);
        console.log('📦 [fetchMoviesByCategory] Response:', response);

        // Cập nhật CDN nếu có
        const cdnDomain = response?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdnDomain) {
            IMG_BASE = cdnDomain.endsWith('/') ? cdnDomain + 'uploads/movies/' : cdnDomain + '/uploads/movies/';
        }

        // API Ophim trả về: { status: true, data: { items: [...], paginate: {...}, ... } }
        const apiMovies = response?.data?.items || [];
        console.log('🎬 [fetchMoviesByCategory] Số phim:', apiMovies.length);

        return apiMovies;
    } catch (err) {
        console.error('⚠️ [fetchMoviesByCategory] Lỗi:', err.message);
        return [];
    }
}

// ====== FILTER ======
async function filterByCategory(category) {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    // Lấy slug từ nút active (ưu tiên data-slug, fallback data-category)
    const activeBtn = document.querySelector(`.filter-btn[data-category="${category}"]`);
    const slug = activeBtn ? (activeBtn.dataset.slug || category) : category;

    container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3';

    // Cập nhật trạng thái active cho nút
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-gray-600', 'border-gray-500');
        btn.classList.add('bg-gray-700', 'border-gray-600');
    });

    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-700', 'border-gray-600');
        activeBtn.classList.add('active', 'bg-gray-600', 'border-gray-500');
    }

    // Xóa sạch danh sách cũ + reset trạng thái
    container.innerHTML = '';
    renderedMovieIds.clear();

    // Vô hiệu hóa infinite scroll khi đang xem thể loại
    currentCategory = category;
    currentFiltered = 'category';

    if (category === 'all') {
        currentFiltered = null;
        currentPage = 1;
        displayCount = 12;
        await fetchMovies(container, 1);
        return;
    }

    // === NẾU LÀ "hoat-hinh" (ANIME) THÌ TẢI TOÀN BỘ NHIỀU TRANG ===
    if (category === 'hoat-hinh' || slug === 'hoat-hinh') {
        await loadAllAnimeMovies(container);
        return;
    }

    // === GỌI API THỂ LOẠI QUA HÀM fetchMoviesByCategory ===
    currentPage = 1;

    // Hiển thị loading
    container.innerHTML = `
        <div class="col-span-full flex justify-center py-20">
            <div class="flex items-center gap-3 text-gray-400">
                <div class="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                <span class="text-sm">Đang tải phim thể loại "${slug}"...</span>
            </div>
        </div>`;

    const apiMovies = await fetchMoviesByCategory(slug);

    // Xóa loading
    container.innerHTML = '';

    if (!apiMovies || apiMovies.length === 0) {
        console.warn('⚠️ API trả về 0 phim cho thể loại:', slug);
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

    // Render danh sách mới từ API thể loại
    renderMovies(apiMovies, container);
    console.log('✅ Đã tải', apiMovies.length, 'phim thể loại', slug);
}

// ====== BANNER ======
function updateBanner(movies) {
    if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
    }

    bannerMovies = movies.slice(0, 5).filter(m => m && m.slug);
    if (!bannerMovies.length) return;

    currentBannerIndex = 0;

    function renderBanner(index) {
        const movie = bannerMovies[index];
        if (!movie) return;

        const title = movie.name || movie.title || 'Anime Hot';
        const slug = movie.slug || '';
        const year = movie.year || '';
        const displayEp = safeEpisodeDisplay(movie.episode_current);
        const thumbUrl = movie.thumb_url || movie.thumb || '';
        const posterUrl = movie.poster_url || '';
        const bgUrl = buildImageUrl(thumbUrl, posterUrl);

        let catStr = 'Hoạt hình';
        if (Array.isArray(movie.category)) {
            catStr = movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean).slice(0, 3).join(', ');
        }

        const epTotal = movie.episode_total || '??';
        const quality = movie.quality || 'FHD';
        const lang = movie.lang || 'Vietsub';

        const bgEl = document.getElementById('banner-bg');
        if (bgEl) bgEl.style.backgroundImage = `url('${bgUrl}')`;

        const titleEl = document.getElementById('banner-title');
        if (titleEl) titleEl.textContent = title;

        const metaEl = document.getElementById('banner-meta');
        if (metaEl) {
            metaEl.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span class="text-white font-bold text-sm">${movie.tmdb?.vote_average || movie.vote_average || '9.0'}</span>
                </div>
                <span class="text-gray-400 text-xs">|</span>
                <span class="text-gray-300 text-sm">${displayEp}</span>
                <span class="text-gray-400 text-xs">|</span>
                <span class="text-gray-300 text-sm">${year}</span>
                <span class="text-gray-400 text-xs">|</span>
                <span class="px-2 py-0.5 text-[11px] font-bold bg-gray-700 text-gray-200 rounded">${quality}</span>
                <span class="text-gray-400 text-xs">|</span>
                <span class="text-gray-300 text-sm">${lang}</span>`;
        }

        const descEl = document.getElementById('banner-desc');
        if (descEl) descEl.textContent = movie.content || movie.description || `Xem ${title} với chất lượng cao, vietsub, cập nhật nhanh nhất.`;

        const seasonEl = document.getElementById('banner-season');
        if (seasonEl) seasonEl.textContent = epTotal;

        const catBannerEl = document.getElementById('banner-category');
        if (catBannerEl) catBannerEl.textContent = catStr;

        const watchLink = document.getElementById('banner-watch-link');
        if (watchLink) watchLink.href = `watch.html?id=${slug}`;

        const detailLink = document.getElementById('banner-detail-link');
        if (detailLink) detailLink.href = `watch.html?id=${slug}`;

        const dotsContainer = document.getElementById('banner-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = bannerMovies.map((_, i) => `
                <button class="w-2 h-2 rounded-full transition-all duration-300 ${i === index ? 'bg-gray-400 w-3' : 'bg-white/30 hover:bg-white/50'}" data-banner-index="${i}"></button>
            `).join('');
            dotsContainer.querySelectorAll('button').forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    if (bannerInterval) clearInterval(bannerInterval);
                    currentBannerIndex = i;
                    renderBanner(i);
                    bannerInterval = setInterval(nextBanner, 6000);
                });
            });
        }
    }

    function nextBanner() {
        currentBannerIndex = (currentBannerIndex + 1) % bannerMovies.length;
        renderBanner(currentBannerIndex);
    }

    renderBanner(0);
    bannerInterval = setInterval(nextBanner, 6000);
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
                    class="mt-4 px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
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
                         onerror="this.onerror=null; this.src='${PLACEHOLDER}'; this.style.opacity='0.5';">
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