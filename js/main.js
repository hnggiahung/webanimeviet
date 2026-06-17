/**
 * main.js - Trang chủ: Danh sách phim hoạt hình từ API Ophim
 * API: https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1
 * Ảnh: https://img.otruyenapi.com/uploads/movies/{thumb_url}
 */

const API_BASE = 'https://ophim1.com/v1/api';
const IMG_BASE = 'https://img.otruyenapi.com/uploads/movies/';
const PLACEHOLDER = 'https://via.placeholder.com/200x300';

/**
 * Chuyển http:// thành https:// để tránh Mixed Content
 */
function ensureHttps(url) {
    if (!url) return '';
    if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
}

/**
 * Hàm build URL ảnh - xử lý mọi edge case:
 * - thumb_url null/undefined/empty
 * - poster_url fallback
 * - URL không hợp lệ
 * - Mixed Content (http)
 * Tránh lỗi "this.src='IMG_BASE + ''' (404 do thiếu filename)
 */
function buildImageUrl(thumb_url, poster_url) {
    const img = thumb_url || poster_url || '';
    if (!img || img.trim() === '') {
        return PLACEHOLDER; // Trả ngay placeholder nếu không có ảnh
    }
    // Nếu đã là URL đầy đủ (http/https) thì dùng luôn
    if (img.startsWith('http://') || img.startsWith('https://')) {
        return ensureHttps(img); // Đảm bảo HTTPS
    }
    // Nếu chỉ là tên file, ghép với base
    const cleanName = img.trim().replace(/^\//, ''); // bỏ dấu / ở đầu nếu có
    return IMG_BASE + cleanName;
}

/**
 * Hàm tạo onerror handler chuẩn cho img
 */
function imgErrorHandler(imgEl) {
    imgEl.onerror = function() {
        if (this.src !== PLACEHOLDER) {
            this.src = PLACEHOLDER;
            this.style.opacity = '0.5';
        }
    };
}

let allMovies = [];
let displayCount = 12;

document.addEventListener('DOMContentLoaded', () => {
    fetch(`${API_BASE}/danh-sach/hoat-hinh?page=1`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            const movies = data?.data?.items || data?.items || [];
            const container = document.getElementById('movies-grid');
            if (!container) return;

            container.innerHTML = '';

            if (!movies || !movies.length) {
                container.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 opacity-50">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="2" y1="7" x2="7" y2="7"></line>
                            <line x1="2" y1="17" x2="7" y2="17"></line>
                            <line x1="17" y1="7" x2="22" y2="7"></line>
                            <line x1="17" y1="17" x2="22" y2="17"></line>
                        </svg>
                        <p class="text-lg font-semibold mb-1">Không tìm thấy phim</p>
                        <p class="text-sm opacity-60">API hiện tại không có dữ liệu.</p>
                    </div>`;
                return;
            }

            allMovies = movies;
            displayCount = 12;

            // Update banner with API data
            updateBanner(movies);

            renderMovies(allMovies.slice(0, displayCount), container);

            if (allMovies.length > displayCount) {
                addLoadMoreButton(container);
            }
        })
        .catch(err => {
            console.error('Lỗi kết nối API:', err);
            const container = document.getElementById('movies-grid');
            if (container) {
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
                                class="mt-4 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
                            Thử lại
                        </button>
                    </div>`;
            }
        });
});

function addLoadMoreButton(container) {
    const existing = document.getElementById('load-more-wrapper');
    if (existing) existing.remove();

    const loadMoreDiv = document.createElement('div');
    loadMoreDiv.className = 'col-span-full text-center mt-6';
    loadMoreDiv.id = 'load-more-wrapper';
    loadMoreDiv.innerHTML = `
        <button id="load-more-btn" 
                class="load-more-btn px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 inline-flex items-center gap-2">
            <svg class="arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span class="btn-text">Xem thêm (${allMovies.length - displayCount})</span>
        </button>`;
    container.appendChild(loadMoreDiv);

    document.getElementById('load-more-btn').addEventListener('click', () => toggleMovies(container));
}

function toggleMovies(container) {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    
    const btnText = btn.querySelector('.btn-text');
    const arrowIcon = btn.querySelector('.arrow-icon');
    const isExpanded = btn.dataset.expanded === 'true';

    if (!isExpanded) {
        const hidden = allMovies.slice(displayCount);
        renderMovies(hidden, container);
        displayCount = allMovies.length;

        btnText.textContent = 'Thu gọn';
        btn.dataset.expanded = 'true';
        arrowIcon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
        btn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'hover:shadow-orange-500/25');
        btn.classList.add('bg-gray-700', 'hover:bg-gray-600');

        const wrapper = document.getElementById('load-more-wrapper');
        if (wrapper) container.appendChild(wrapper);
    } else {
        const cards = container.querySelectorAll('.movie-card');
        for (let i = 12; i < cards.length; i++) {
            cards[i].classList.add('hidden');
        }
        displayCount = 12;

        btnText.textContent = `Xem thêm (${allMovies.length - displayCount})`;
        btn.dataset.expanded = 'false';
        arrowIcon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
        btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
        btn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'hover:shadow-orange-500/25');
    }
}

/**
 * Render danh sách phim vào container
 */
function renderMovies(movies, container) {
    movies.forEach((movie, index) => {
        const card = document.createElement('div');
        card.className = 'movie-card bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer';
        if (!container.id || container.id === 'movies-grid') {
            card.style.animationDelay = `${Math.min(index * 0.03, 0.4)}s`;
        }

        const title = movie.name || movie.title || 'Không có tên';
        const slug = movie.slug || movie._id || '';
        const year = movie.year || 'Đang cập nhật';

        // ✅ Dùng buildImageUrl - không bao giờ tạo link 404
        const imgSrc = buildImageUrl(movie.thumb_url, movie.poster_url);

        card.innerHTML = `
            <a href="watch.html?id=${slug}">
                <div class="relative overflow-hidden bg-gray-700" style="height:260px;">
                    <img src="${imgSrc}" alt="${title}" 
                           class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                           loading="lazy"
                           onerror="this.src='https://via.placeholder.com/200x300'; this.style.opacity='0.5';">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="p-3">
                    <h3 class="text-white font-bold text-base truncate">${title}</h3>
                    <p class="text-gray-400 text-xs mt-1">Năm: ${year}</p>
                </div>
            </a>`;

        container.appendChild(card);
    });
}

/**
 * Update banner với dữ liệu phim hot từ API
 */
function updateBanner(movies) {
    const bannerMovies = movies.slice(0, 5).filter(m => m && m.slug);
    if (!bannerMovies.length) return;

    let currentBannerIndex = 0;
    let bannerInterval;

    function renderBanner(index) {
        const movie = bannerMovies[index];
        if (!movie) return;

        const title = movie.name || movie.title || 'Anime Hot';
        const slug = movie.slug || '';
        const year = movie.year || '';
        const thumb = movie.thumb_url || movie.poster_url || '';

        // ✅ Dùng buildImageUrl cho banner background
        const bgUrl = buildImageUrl(movie.thumb_url, movie.poster_url);
        // Nếu bgUrl là placeholder, thay bằng banner mặc định
        const bannerBg = bgUrl === PLACEHOLDER 
            ? 'https://placehold.co/1400x600/1a0f0a/d45c3a?text=Anime&font=roboto'
            : bgUrl;

        // Category
        let catStr = 'Hoạt hình';
        if (Array.isArray(movie.category)) {
            catStr = movie.category
                .map(c => (typeof c === 'object' ? c.name : c))
                .filter(Boolean)
                .slice(0, 3)
                .join(', ');
        }

        const epCurrent = movie.episode_current || 'Đang cập nhật';
        const epTotal = movie.episode_total || '??';
        const quality = movie.quality || 'FHD';
        const lang = movie.lang || 'Vietsub';

        const bgEl = document.getElementById('banner-bg');
        if (bgEl) {
            bgEl.style.backgroundImage = `url('${bannerBg}')`;
        }

        const titleEl = document.getElementById('banner-title');
        if (titleEl) {
            titleEl.innerHTML = `<span class="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">${title}</span>`;
        }

        const metaEl = document.getElementById('banner-meta');
        if (metaEl) {
            metaEl.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span class="text-white font-bold text-sm">${movie.tmdb?.vote_average || movie.vote_average || '9.0'}</span>
                </div>
                <span class="text-gray-400 text-xs">|</span>
                <span class="text-gray-300 text-sm">${epCurrent}</span>
                <span class="text-gray-400 text-xs">|</span>
                <span class="text-gray-300 text-sm">${year}</span>
                <span class="text-gray-400 text-xs">|</span>
                <span class="px-2 py-0.5 text-[11px] font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-md">${quality}</span>
                <span class="text-gray-400 text-xs">|</span>
                <span class="text-gray-300 text-sm">${lang}</span>
            `;
        }

        const descEl = document.getElementById('banner-desc');
        if (descEl) {
            descEl.textContent = movie.content || movie.description || `Xem ${title} với chất lượng cao, vietsub, cập nhật nhanh nhất.`;
        }

        const seasonEl = document.getElementById('banner-season');
        if (seasonEl) seasonEl.textContent = epTotal;

        const catBannerEl = document.getElementById('banner-category');
        if (catBannerEl) catBannerEl.textContent = catStr;

        const watchLink = document.getElementById('banner-watch-link');
        if (watchLink) watchLink.href = `watch.html?id=${slug}`;

        const detailLink = document.getElementById('banner-detail-link');
        if (detailLink) detailLink.href = `watch.html?id=${slug}`;

        const expandLink = document.getElementById('banner-expand-link');
        if (expandLink) expandLink.href = `watch.html?id=${slug}`;

        const dotsContainer = document.getElementById('banner-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = bannerMovies.map((_, i) => `
                <button class="w-2 h-2 rounded-full transition-all duration-300 ${i === index ? 'bg-orange-500 shadow-lg shadow-orange-500/50 w-3' : 'bg-white/30 hover:bg-white/50'}" 
                        data-banner-index="${i}"></button>
            `).join('');

            dotsContainer.querySelectorAll('button').forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    clearInterval(bannerInterval);
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