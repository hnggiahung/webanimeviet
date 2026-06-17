// ========== WATCH.JS - Trang Xem Phim (API Ophim) ==========
// API chính: https://ophim1.com/phim/{slug}
// Selector: video-player (iframe), episode-container (danh sách tập)

const IMG_BASE = 'https://img.otruyenapi.com/uploads/movies/';
const PLACEHOLDER = 'https://via.placeholder.com/200x300';

/**
 * Hàm build URL ảnh - xử lý mọi edge case:
 * - thumb_url null/undefined/empty
 * - poster_url fallback
 * - URL không hợp lệ
 * Tránh lỗi "IMG_BASE + ''' (404 do thiếu filename)
 */
function buildImageUrl(thumb_url, poster_url) {
    const img = thumb_url || poster_url || '';
    if (!img || img.trim() === '') {
        return PLACEHOLDER;
    }
    if (img.startsWith('http://') || img.startsWith('https://')) {
        return ensureHttps(img); // Đảm bảo HTTPS
    }
    const cleanName = img.trim().replace(/^\//, '');
    return IMG_BASE + cleanName;
}

let currentMovie = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let currentEpisodeServer = 0;
let bookmarkData = {};
let sidebarVisible = false;
let allTrendingMovies = [];

// ====== Helper ======

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || '';
}

function ensureHttps(url) {
  if (!url) return '';
  // Nếu URL bắt đầu bằng http:// thì chuyển thành https://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

function getCurrentVideoUrl() {
  if (!currentEpisodes.length) return '';
  const ep = currentEpisodes[currentEpisodeIndex];
  if (!ep) return '';
  const rawUrl = ep.link_embed || ep.link_m3u8 || '';
  return ensureHttps(rawUrl);
}

// ====== Load phim ======

async function loadMovieData() {
  const slug = getSlugFromURL();
  if (!slug) {
    showError('ID phim không hợp lệ');
    return;
  }

  // Thử API chính: ophim1.com/phim/{slug}
  try {
    const response = await fetch(`https://ophim1.com/phim/${slug}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const movie = data.movie || data.data?.movie || data.data?.item;
    const episodes = data.episodes || data.data?.episodes || [];

    if (!movie) {
      const fallback = await tryFallback(slug);
      if (!fallback) throw new Error('Không tìm thấy phim');
      return;
    }

    processMovieData(movie, episodes);
  } catch (error) {
    console.warn('API chính thất bại:', error.message);
    const fallback = await tryFallback(slug);
    if (!fallback) showError('Không thể tải phim từ máy chủ');
  }
}

// Fallback: dùng Ophim API v1
async function tryFallback(slug) {
  try {
    const response = await fetch(`https://ophim1.com/v1/api/phim/${slug}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const movie = data?.data?.item || data?.data?.movie;
    const episodes = data?.data?.episodes || [];

    if (!movie) return false;
    processMovieData(movie, episodes);
    return true;
  } catch (error) {
    console.warn('Fallback thất bại:', error.message);
    return false;
  }
}

function processMovieData(movie, episodes) {
  // Xử lý category
  let categoryStr = 'Chưa phân loại';
  if (Array.isArray(movie.category)) {
    categoryStr = movie.category
      .map(c => (typeof c === 'object' ? c.name : c))
      .filter(Boolean)
      .join(', ');
  } else if (typeof movie.category === 'string') {
    categoryStr = movie.category;
  }

  // Lấy số sao đánh giá (nếu có)
  let rating = movie.tmdb?.vote_average || movie.vote_average || movie.vote || 0;
  if (typeof rating === 'string') rating = parseFloat(rating) || 0;
  rating = parseFloat(rating).toFixed(1);

  // Lấy lượt xem
  let views = movie.view || movie.views || movie.view_count || 0;
  if (typeof views === 'string') views = parseInt(views) || 0;
  const viewText = views >= 1000 ? Math.floor(views / 1000) + 'K' : views;

  // Lấy season
  const season = movie.season || movie.season_count || movie.episode_total || '';

  // Lấy sub/vietsub info
  const lang = movie.lang || movie.language || 'Vietsub';

  currentMovie = {
    name: movie.name || movie.title || 'Không có tên',
    origin_name: movie.origin_name || movie.originName || '',
    content: movie.content || movie.description || 'Chưa có mô tả',
    category: categoryStr,
    time: movie.time || movie.duration || 'Đang cập nhật',
    year: movie.year || '',
    thumb_url: movie.thumb_url || movie.thumb || movie.poster_url || '',
    episode_current: movie.episode_current || movie.episodeCurrent || '',
    episode_total: movie.episode_total || movie.episodeTotal || '',
    rating: rating,
    views: viewText,
    season: season,
    lang: lang,
    quality: movie.quality || 'FHD',
    date_created: movie.modified?.time || movie.created_at || movie.year || '',
  };

  // Xử lý episodes
  if (Array.isArray(episodes)) {
    if (episodes.length > 0 && episodes[0].server_data) {
      currentEpisodes = episodes[0].server_data;
    } else if (episodes[0] && episodes[0].link_embed) {
      currentEpisodes = episodes;
    } else {
      currentEpisodes = [];
    }
  } else {
    currentEpisodes = [];
  }

  // Tìm server có nhiều tập nhất
  if (Array.isArray(episodes) && episodes.length > 1) {
    for (let i = 1; i < episodes.length; i++) {
      if (episodes[i].server_data && episodes[i].server_data.length > currentEpisodes.length) {
        currentEpisodes = episodes[i].server_data;
        currentEpisodeServer = i;
      }
    }
  }
  
  // Đảm bảo tất cả link video đều dùng HTTPS
  currentEpisodes = currentEpisodes.map(ep => {
    if (ep.link_embed) ep.link_embed = ensureHttps(ep.link_embed);
    if (ep.link_m3u8) ep.link_m3u8 = ensureHttps(ep.link_m3u8);
    return ep;
  });

  currentEpisodeIndex = 0;

  renderWatchPage();
  loadBookmark();
  initializeEventListeners();
  fetchRelatedMovies();
  fetchTrending(); // Load sidebar data
}

function showError(message) {
  document.body.innerHTML = `
    <div class="flex items-center justify-center min-h-screen bg-[#0f0f1e]">
      <div class="text-center p-8 max-w-md">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" class="mx-auto mb-4">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p class="text-red-500 text-2xl font-bold mb-2">${message}</p>
        <p class="text-gray-400 mb-6">Vui lòng thử lại hoặc quay về trang chủ.</p>
        <div class="flex gap-3 justify-center">
          <a href="index.html" class="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
            ← Về trang chủ
          </a>
          <button onclick="location.reload()" class="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors">
            Thử lại
          </button>
        </div>
      </div>
    </div>
  `;
}

// ====== Render ======

function renderWatchPage() {
  // --- VIDEO PLAYER ---
  const videoUrl = getCurrentVideoUrl();
  const player = document.getElementById('video-player');
  if (player) {
    if (videoUrl) {
      player.src = videoUrl;
    } else {
      player.srcdoc = `
        <html>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#000;color:#666;font-family:sans-serif;flex-direction:column;gap:12px;height:100vh;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p style="font-size:14px;">Chưa có video để phát</p>
        </body></html>`;
    }
  }

  // --- THÔNG TIN PHIM ---
  const titleEl = document.getElementById('movie-title');
  if (titleEl) titleEl.textContent = currentMovie.name;

  const originEl = document.getElementById('movie-origin-name');
  if (originEl) {
    originEl.textContent = currentMovie.origin_name ? `(${currentMovie.origin_name})` : '';
  }

  const descEl = document.getElementById('movie-description');
  if (descEl) descEl.textContent = currentMovie.content;

  const catEl = document.getElementById('movie-category');
  if (catEl) catEl.textContent = currentMovie.category;

  const durEl = document.getElementById('movie-duration');
  if (durEl) durEl.textContent = currentMovie.time;

  // Season info
  const seasonEl = document.getElementById('movie-season');
  if (seasonEl) {
    seasonEl.textContent = currentMovie.season ? `${currentMovie.season} Seasons` : 'Đang cập nhật';
  }

  // Rating stars
  const ratingEl = document.getElementById('movie-rating');
  if (ratingEl) {
    ratingEl.innerHTML = '';
    const rating = parseFloat(currentMovie.rating) || 0;
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.innerHTML = i <= Math.round(rating / 2) 
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      ratingEl.appendChild(star);
    }
    const num = document.createElement('span');
    num.className = 'text-yellow-400 text-sm font-bold ml-1';
    num.textContent = currentMovie.rating;
    ratingEl.appendChild(num);
  }

  // Views
  const viewEl = document.getElementById('movie-views');
  if (viewEl) viewEl.textContent = currentMovie.views ? `${currentMovie.views} lượt xem` : 'Đang cập nhật';

  // Date
  const dateEl = document.getElementById('movie-date');
  if (dateEl) dateEl.textContent = currentMovie.date_created || 'Đang cập nhật';

  // Lang
  const langEl = document.getElementById('movie-lang');
  if (langEl) langEl.textContent = currentMovie.lang;

  // Quality
  const qualityEl = document.getElementById('movie-quality');
  if (qualityEl) qualityEl.textContent = currentMovie.quality;

  // Episode count
  const epCountEl = document.getElementById('movie-episode-count');
  if (epCountEl) epCountEl.textContent = currentMovie.episode_current || (currentEpisodes.length ? `Tập ${currentEpisodeIndex + 1}/${currentEpisodes.length}` : 'Đang cập nhật');

  const epTotalEl = document.getElementById('movie-episode-total');
  if (epTotalEl) epTotalEl.textContent = currentMovie.episode_total || currentEpisodes.length || '??';

  // Poster - dùng buildImageUrl
  const posterImg = document.getElementById('movie-poster-img');
  if (posterImg) {
    posterImg.src = buildImageUrl(currentMovie.thumb_url, null);
    posterImg.onerror = function() { this.src = PLACEHOLDER; this.style.opacity = '0.5'; };
  }

  document.title = `${currentMovie.name} - Xem Phim`;

  // --- DANH SÁCH TẬP (Grid) ---
  renderEpisodeGrid();
}

// ====== Render danh sách tập dạng GRID ======

function renderEpisodeGrid() {
  const container = document.getElementById('episode-container');
  if (!container) return;
  container.innerHTML = '';

  if (!currentEpisodes.length) {
    container.innerHTML = '<div class="col-span-full text-center text-gray-500 text-sm py-8">Chưa có tập phim nào</div>';
    return;
  }

  // Header with count
  const header = document.createElement('div');
  header.className = 'col-span-full flex items-center justify-between mb-2 pb-2 border-b border-white/5';
  header.innerHTML = `
    <span class="text-xs text-gray-400">Tổng số: <strong class="text-white">${currentEpisodes.length}</strong> tập</span>
    <span class="text-xs text-orange-400">${currentMovie.episode_current || `Tập ${currentEpisodeIndex + 1}/${currentEpisodes.length}`}</span>
  `;
  container.appendChild(header);

  // Grid episodes
  currentEpisodes.forEach((ep, index) => {
    const epName = ep.name || `Tập ${index + 1}`;
    const isActive = index === currentEpisodeIndex;

    const item = document.createElement('div');
    item.className = `episode-item rounded-lg cursor-pointer transition-all duration-200 text-center py-2 px-1 text-xs font-medium border ${
      isActive
        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm shadow-orange-500/20'
        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-orange-500/50'
    }`;
    item.dataset.index = index;
    item.textContent = epName;
    item.addEventListener('click', () => switchEpisode(index));
    container.appendChild(item);
  });
}

// ====== Chuyển tập ======

function switchEpisode(index) {
  if (index === currentEpisodeIndex) return;
  if (!currentEpisodes[index]) return;

  currentEpisodeIndex = index;

  const videoUrl = getCurrentVideoUrl();
  const player = document.getElementById('video-player');
  if (player && videoUrl) {
    player.src = videoUrl;
  }

  // Cập nhật UI danh sách tập (grid)
  document.querySelectorAll('.episode-item').forEach((el) => {
    const idx = parseInt(el.dataset.index);
    if (idx === currentEpisodeIndex) {
      el.className = 'episode-item rounded-lg cursor-pointer transition-all duration-200 text-center py-2 px-1 text-xs font-medium border bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm shadow-orange-500/20';
    } else {
      el.className = 'episode-item rounded-lg cursor-pointer transition-all duration-200 text-center py-2 px-1 text-xs font-medium border bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-orange-500/50';
    }
  });

  // Update episode count in header
  const epCountEl = document.getElementById('movie-episode-count');
  if (epCountEl) epCountEl.textContent = `Tập ${index + 1}/${currentEpisodes.length}`;

  // Update episode header text
  const epHeader = document.querySelector('#episode-container .col-span-full .text-orange-400');
  if (epHeader) epHeader.textContent = `Tập ${index + 1}/${currentEpisodes.length}`;

  showToast(`Đã chuyển sang ${currentEpisodes[index].name || 'Tập ' + (index + 1)}`, 'info');
}

// ====== Bookmark ======

function saveBookmark(episodeIndex) {
  if (!currentMovie) return;
  const movieId = getSlugFromURL();
  const bookmarks = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}');

  bookmarks[movieId] = {
    episodeIndex: episodeIndex !== undefined ? episodeIndex : currentEpisodeIndex,
    episodeName: currentEpisodes[currentEpisodeIndex]?.name || `Tập ${currentEpisodeIndex + 1}`,
    title: currentMovie.name,
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem('anime_bookmarks', JSON.stringify(bookmarks));

  const statusEl = document.getElementById('bookmark-status');
  if (statusEl) {
    statusEl.classList.remove('hidden');
    if (typeof feather !== 'undefined') feather.replace();
    setTimeout(() => statusEl.classList.add('hidden'), 3000);
  }

  showToast('Đã lưu dấu trang ✓', 'bookmark');
}

function loadBookmark() {
  const movieId = getSlugFromURL();
  const bookmarks = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}');
  const bookmark = bookmarks[movieId];

  if (bookmark) {
    bookmarkData = bookmark;
    if (bookmark.episodeIndex !== undefined && bookmark.episodeIndex < currentEpisodes.length) {
      switchEpisode(bookmark.episodeIndex);
    }
    showBookmarkNotification(bookmark);
  }
}

function showBookmarkNotification(bookmark) {
  const existing = document.querySelector('.bookmark-notification');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.className = 'bookmark-notification';
  div.innerHTML = `
    <div>
      <p class="font-bold text-sm">Tiếp tục xem ${bookmark.episodeName || ''}</p>
      <p class="text-xs opacity-80">Lần xem lần trước</p>
    </div>
    <button onclick="document.querySelector('.bookmark-notification')?.remove(); switchEpisode(${bookmark.episodeIndex || 0})">Xem Tiếp</button>
    <button onclick="this.parentElement.remove()">Bỏ Qua</button>
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 10000);
}

function continueWatching() {
  const movieId = getSlugFromURL();
  const bookmarks = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}');
  const bookmark = bookmarks[movieId];
  if (bookmark && bookmark.episodeIndex !== undefined) {
    switchEpisode(bookmark.episodeIndex);
  }
}

// ====== Phim liên quan ======
async function fetchRelatedMovies() {
  const container = document.getElementById('related-container');
  if (!container) return;

  try {
    const response = await fetch('https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    let movies = data?.data?.related || data?.related || data?.data?.items || data?.items || [];

    movies = movies.filter(m => m && m.slug && (m.name || m.title));

    container.innerHTML = '';

    if (!movies.length) {
      container.innerHTML = '<div class="col-span-full text-center text-gray-500 text-sm py-8">Chưa có phim liên quan</div>';
      return;
    }

    movies.slice(0, 6).forEach((movie) => {
      const slug = movie.slug;
      const title = movie.name || movie.title || 'Không có tên';
      const year = movie.year || '';

      // ✅ Dùng buildImageUrl thay vì tự ghép URL
      const imgUrl = buildImageUrl(movie.thumb_url, movie.thumb);

      const card = document.createElement('a');
      card.href = `watch.html?id=${slug}`;
      card.className = 'group block bg-gray-800/50 rounded-lg overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-200';
      card.innerHTML = `
        <div class="aspect-[16/9] bg-gray-700 overflow-hidden flex items-center justify-center">
          <img src="${imgUrl}" alt="${title}" 
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/200x300'; this.style.opacity='0.5';">
        </div>
        <div class="p-2.5">
          <h4 class="text-white text-sm font-semibold truncate">${title}</h4>
          ${year ? `<p class="text-gray-500 text-xs mt-0.5">${year}</p>` : ''}
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Lỗi tải phim liên quan:', error);
    const container = document.getElementById('related-container');
    if (container) {
      container.innerHTML = '<div class="col-span-full text-center text-gray-500 text-sm py-8">Chưa có phim liên quan</div>';
    }
  }
}

// ====== Sidebar: Từ khóa phim mới & Top phim ======

async function fetchTrending() {
  try {
    const response = await fetch('https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const movies = data?.data?.items || data?.items || [];
    const validMovies = movies.filter(m => m && m.slug && (m.name || m.title));
    
    allTrendingMovies = validMovies;
    
    renderSidebarKeywords();
    renderSidebarTopMovies();
  } catch (error) {
    console.error('Lỗi tải danh sách cho sidebar:', error);
  }
}

function renderSidebarKeywords() {
  const container = document.getElementById('sidebar-keywords');
  if (!container) return;

  // Extract unique categories/keywords from trending movies
  const keywords = new Set();
  allTrendingMovies.slice(0, 20).forEach(m => {
    if (Array.isArray(m.category)) {
      m.category.forEach(c => {
        const name = typeof c === 'object' ? c.name : c;
        if (name) keywords.add(name);
      });
    }
  });

  // Add some common anime keywords
  const extraKeywords = ['Anime Mới', 'Vietsub', 'Hoạt Hình', 'Siêu Phẩm', 'Đề Cử', 'Hot Trending'];
  extraKeywords.forEach(k => keywords.add(k));

  const keywordList = Array.from(keywords).slice(0, 10);

  container.innerHTML = keywordList.length
    ? keywordList.map(kw => `<span class="inline-block px-3 py-1.5 bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-orange-400 rounded-full text-xs cursor-pointer transition-all duration-200 border border-white/5 hover:border-orange-500/30">${kw}</span>`).join('')
    : '<span class="text-gray-500 text-xs">Đang cập nhật...</span>';
}

function renderSidebarTopMovies() {
  const container = document.getElementById('sidebar-top-movies');
  if (!container) return;

  const topMovies = allTrendingMovies.slice(0, 5);

  if (!topMovies.length) {
    container.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">Chưa có dữ liệu</div>';
    return;
  }

  container.innerHTML = topMovies.map((movie, idx) => {
    const title = movie.name || movie.title || 'Không có tên';
    const slug = movie.slug || '';
    // ✅ Dùng buildImageUrl
    const imgUrl = buildImageUrl(movie.thumb_url, movie.thumb);
    const view = movie.view || movie.views || 0;
    const viewText = view >= 1000 ? Math.floor(view / 1000) + 'K' : view;

    return `
      <a href="watch.html?id=${slug}" class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group">
        <span class="text-xs font-bold w-5 text-center ${idx < 3 ? 'text-orange-400' : 'text-gray-500'}">${idx + 1}</span>
        <div class="w-10 h-14 rounded-md overflow-hidden bg-gray-700 shrink-0">
          <img src="${imgUrl}" alt="${title}" 
               class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/40x60'; this.style.opacity='0.5';">
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-white text-xs font-semibold truncate group-hover:text-orange-400 transition-colors">${title}</h4>
          <p class="text-gray-500 text-[10px] mt-0.5">${viewText} lượt xem</p>
        </div>
      </a>
    `;
  }).join('');
}

// ====== Comment System (LocalStorage - no login needed) ======

function renderComments() {
  const container = document.getElementById('comments-container');
  if (!container) return;

  const movieId = getSlugFromURL();
  const comments = JSON.parse(localStorage.getItem('anime_comments_' + movieId) || '[]');

  if (!comments.length) {
    container.innerHTML = '<div class="col-span-full text-center text-gray-500 text-sm py-6">Chưa có bình luận. Hãy là người đầu tiên bình luận!</div>';
    return;
  }

  // Show latest comments first
  container.innerHTML = comments.slice().reverse().map((c, idx) => {
    const time = c.timestamp ? new Date(c.timestamp).toLocaleString('vi-VN') : '';
    const avatarLetter = c.nickname ? c.nickname.charAt(0).toUpperCase() : '?';
    const colors = ['bg-orange-500', 'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
    const colorIdx = (c.nickname?.length || 0) % colors.length;

    return `
      <div class="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
        <div class="w-8 h-8 ${colors[colorIdx]} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">${avatarLetter}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-white text-xs font-semibold">${c.nickname || 'Ẩn danh'}</span>
            <span class="text-gray-600 text-[10px]">${time}</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed">${c.content || ''}</p>
        </div>
      </div>
    `;
  }).join('');
}

function submitComment() {
  const movieId = getSlugFromURL();
  const nicknameInput = document.getElementById('comment-nickname');
  const contentInput = document.getElementById('comment-content');
  
  const nickname = nicknameInput?.value?.trim() || 'Ẩn danh';
  const content = contentInput?.value?.trim() || '';

  if (!content) {
    showToast('Vui lòng nhập nội dung bình luận', 'info');
    return;
  }

  const comments = JSON.parse(localStorage.getItem('anime_comments_' + movieId) || '[]');
  
  comments.push({
    nickname: nickname,
    content: content,
    timestamp: new Date().toISOString(),
    id: Date.now()
  });

  localStorage.setItem('anime_comments_' + movieId, JSON.stringify(comments));

  // Clear input
  if (contentInput) contentInput.value = '';

  showToast('Bình luận thành công ✓', 'bookmark');
  
  // Re-render comments
  renderComments();
}

// ====== Cinema Mode ======

function toggleCinemaMode() {
  const videoSection = document.querySelector('.video-section');
  videoSection.classList.toggle('cinema-mode');

  if (videoSection.classList.contains('cinema-mode')) {
    document.querySelector('header').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    document.querySelector('main').style.padding = '0';
    document.querySelector('main').style.maxWidth = '100%';

    if (videoSection.requestFullscreen) videoSection.requestFullscreen();
    else if (videoSection.webkitRequestFullscreen) videoSection.webkitRequestFullscreen();
  } else {
    document.querySelector('header').style.display = '';
    document.querySelector('footer').style.display = '';
    document.querySelector('main').style.padding = '';
    document.querySelector('main').style.maxWidth = '';

    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

// ====== Share & Like ======

function shareMovie() {
  if (navigator.share) {
    navigator.share({ title: currentMovie.name, text: currentMovie.content, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Đã sao chép link!', 'share'))
      .catch(() => showToast('Chia sẻ: ' + window.location.href, 'share'));
  }
}

function toggleLike() {
  const btn = document.getElementById('like-btn');
  const icon = btn.querySelector('i');
  const isLiked = btn.dataset.liked === 'true';

  if (isLiked) {
    btn.dataset.liked = 'false';
    icon.setAttribute('data-feather', 'heart');
    btn.classList.remove('text-red-400');
    btn.classList.add('text-gray-400');
    showToast('Đã bỏ yêu thích', 'heart');
  } else {
    btn.dataset.liked = 'true';
    icon.setAttribute('data-feather', 'heart');
    btn.classList.remove('text-gray-400');
    btn.classList.add('text-red-400');
    showToast('Đã thêm vào yêu thích ❤', 'heart');
  }
  if (typeof feather !== 'undefined') feather.replace();
}

// ====== Toast ======

function showToast(message, icon = 'info') {
  const existing = document.querySelector('.custom-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'custom-toast fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-orange-500/10 text-sm text-white flex items-center gap-3 animate-slideUp';

  let iconSvg = '';
  if (icon === 'bookmark') {
    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
  } else if (icon === 'heart') {
    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#ff6b00" stroke="#ff6b00" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
  } else {
    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  }

  toast.innerHTML = iconSvg + '<span>' + message + '</span>';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ====== Auto-save ======

function startAutoSaveBookmark() {
  setInterval(() => {
    if (currentMovie && currentEpisodes.length) {
      saveBookmark(currentEpisodeIndex);
    }
  }, 15000);
}

// ====== Initialize ======

function initializeEventListeners() {
  const cinemaBtn = document.getElementById('cinema-mode-btn');
  if (cinemaBtn) cinemaBtn.addEventListener('click', toggleCinemaMode);

  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarkBtn) bookmarkBtn.addEventListener('click', () => saveBookmark(currentEpisodeIndex));

  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      const movieId = getSlugFromURL();
      const bookmarks = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}');
      const bookmark = bookmarks[movieId];
      if (bookmark && bookmark.episodeIndex !== undefined) {
        continueWatching();
      } else {
        showToast('Chưa có dấu trang nào', 'info');
      }
    });
  }

  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) shareBtn.addEventListener('click', shareMovie);

  const likeBtn = document.getElementById('like-btn');
  if (likeBtn) likeBtn.addEventListener('click', toggleLike);

  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', () => window.history.back());

  // Comment submit
  const commentSubmit = document.getElementById('comment-submit');
  if (commentSubmit) commentSubmit.addEventListener('click', submitComment);

  // Enter key for comment
  const commentContent = document.getElementById('comment-content');
  if (commentContent) {
    commentContent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitComment();
      }
    });
  }

  startAutoSaveBookmark();
}

// ====== Khởi chạy ======

document.addEventListener('DOMContentLoaded', loadMovieData);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const videoSection = document.querySelector('.video-section');
    if (videoSection?.classList.contains('cinema-mode')) toggleCinemaMode();
  }
});