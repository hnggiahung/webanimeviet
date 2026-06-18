// ========== WATCH.JS - Trang Xem Phim (API Ophim) ==========
// API chính: https://ophim1.com/phim/{slug}
// Sửa lỗi: Ưu tiên HLS (m3u8), thêm chọn server, xử lý lỗi toàn diện

let IMG_BASE = 'https://img.ophim.live/uploads/movies/';
const PLACEHOLDER = 'https://via.placeholder.com/200x300';

/**
 * Build URL ảnh an toàn - xử lý relative/absolute, mixed content, fallback
 */
function buildImageUrl(thumb_url, poster_url) {
    const img = thumb_url || poster_url || '';
    if (!img || img.trim() === '') return PLACEHOLDER;
    if (img.startsWith('http://') || img.startsWith('https://')) {
        return img.replace('http://', 'https://');
    }
    const cleanName = img.trim().replace(/^\//, '');
    return IMG_BASE + cleanName;
}

let currentMovie = null;
let currentEpisodes = [];
let allEpisodeServers = [];
let currentEpisodeIndex = 0;
let currentServerIndex = 0;
let bookmarkData = {};
let allTrendingMovies = [];

function getSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || '';
}

function ensureHttps(url) {
    if (!url) return '';
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    return url;
}

function getCurrentVideoUrl() {
    if (!currentEpisodes.length) return '';
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep) return '';
    if (ep.link_m3u8) return ensureHttps(ep.link_m3u8);
    if (ep.link_embed) return ensureHttps(ep.link_embed);
    return '';
}

function isM3u8Url(url) {
    return url && (url.includes('.m3u8') || url.includes('.m3u'));
}

function escapeJsString(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

function generateHlsPlayerHtml(m3u8Url) {
    const escapedUrl = escapeJsString(m3u8Url);
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif}
video{width:100%;height:100%;max-height:100vh;object-fit:contain}
#c{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
#l{color:#888;text-align:center;font-size:14px;padding:20px}
#e{color:#ef4444;text-align:center;font-size:14px;padding:20px}
#r{margin-top:10px;padding:8px 20px;background:#4a5568;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px}
#r:hover{background:#718096}
</style>
</head>
<body>
<div id="c"><div id="l"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" style="display:block;margin:0 auto 12px"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>Đang tải video...</div></div>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"><\/script>
<script>
(function(){var u='${escapedUrl}';var c=document.getElementById('c');var l=document.getElementById('l');
if(!u){c.innerHTML='<div id="e">Không có nguồn video</div>';return}
if(typeof Hls==='undefined'){c.innerHTML='<div id="e">Trình duyệt không hỗ trợ HLS</div>';return}
var v=document.createElement('video');v.setAttribute('controls','');v.setAttribute('playsinline','');v.style.cssText='width:100%;height:100%'
if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=u;c.innerHTML='';c.appendChild(v);v.play().catch(function(){});return}
var h=new Hls({capLevelToPlayerSize:true,maxBufferLength:30,enableWorker:true});h.loadSource(u);h.attachMedia(v)
h.on(Hls.Events.MANIFEST_PARSED,function(){c.innerHTML='';c.appendChild(v);v.play().catch(function(){})})
h.on(Hls.Events.ERROR,function(e,d){if(d.fatal){c.innerHTML='<div id="e">Lỗi phát video. <button id="r" onclick="location.reload()">Thử lại</button></div>'}})
setTimeout(function(){if(c.contains(l)){c.innerHTML='<div id="e">Quá thời gian tải. <button id="r" onclick="location.reload()">Thử lại</button></div>'}},15000)})();
<\/script>
</body>
</html>`;
}

// ====== Load phim ======
async function loadMovieData() {
    const slug = getSlugFromURL();
    if (!slug) { showError('ID phim không hợp lệ'); return; }

    showLoadingState();

    try {
        const res = await fetch(`https://ophim1.com/phim/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !data.movie) {
            const ok = await tryFallback(slug);
            if (!ok) throw new Error('Không tìm thấy phim');
            return;
        }
        processMovieData(data.movie, data.episodes || []);
    } catch (e) {
        console.warn('API chính thất bại:', e.message);
        const ok = await tryFallback(slug);
        if (!ok) showError('Không thể tải phim từ máy chủ');
    }
}

async function tryFallback(slug) {
    try {
        const res = await fetch(`https://ophim1.com/v1/api/phim/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const movie = data?.data?.item || data?.data?.movie;
        const episodes = data?.data?.episodes || [];
        const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdn) { IMG_BASE = cdn.endsWith('/') ? cdn + 'uploads/movies/' : cdn + '/uploads/movies/'; }
        if (!movie) return false;
        processMovieData(movie, episodes);
        return true;
    } catch (e) {
        console.warn('Fallback thất bại:', e.message);
        return false;
    }
}

function showLoadingState() {
    const els = {
        title: document.getElementById('movie-title'),
        poster: document.getElementById('movie-poster-img'),
        desc: document.getElementById('movie-description'),
        epContainer: document.getElementById('episode-container')
    };
    if (els.title && els.title.textContent === 'Đang tải...') return; // already loading
    if (els.epContainer) els.epContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 text-sm py-8">Đang tải dữ liệu...</div>';
}

function processMovieData(movie, episodes) {
    let categoryStr = 'Chưa phân loại';
    if (Array.isArray(movie.category)) {
        categoryStr = movie.category.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean).join(', ');
    } else if (typeof movie.category === 'string') { categoryStr = movie.category; }

    let rating = movie.tmdb?.vote_average || movie.vote_average || movie.vote || 0;
    if (typeof rating === 'string') rating = parseFloat(rating) || 0;
    rating = parseFloat(rating).toFixed(1);

    let views = movie.view || movie.views || movie.view_count || 0;
    if (typeof views === 'string') views = parseInt(views) || 0;
    const viewText = views >= 1000 ? Math.floor(views / 1000) + 'K' : views;
    const season = movie.season || movie.season_count || movie.episode_total || '';
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

    allEpisodeServers = [];
    if (Array.isArray(episodes)) {
        episodes.forEach(ep => {
            if (ep.server_data && Array.isArray(ep.server_data) && ep.server_data.length > 0) {
                allEpisodeServers.push({ server_name: ep.server_name || 'Server ' + (allEpisodeServers.length + 1), server_data: ep.server_data });
            } else if (ep.link_embed || ep.link_m3u8) {
                allEpisodeServers.push({ server_name: 'Server ' + (allEpisodeServers.length + 1), server_data: episodes });
            }
        });
    }

    if (allEpisodeServers.length === 0) {
        allEpisodeServers.push({ server_name: 'Mặc định', server_data: [] });
    }

    currentServerIndex = 0;
    currentEpisodes = allEpisodeServers[currentServerIndex].server_data.map(ep => {
        if (ep.link_embed) ep.link_embed = ensureHttps(ep.link_embed);
        if (ep.link_m3u8) ep.link_m3u8 = ensureHttps(ep.link_m3u8);
        return ep;
    });
    currentEpisodeIndex = 0;

    renderWatchPage();
    loadBookmark();
    initializeEventListeners();
    fetchRelatedMovies();
    fetchTrending();
    renderComments();
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
          <a href="index.html" class="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">← Về trang chủ</a>
          <button onclick="location.reload()" class="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors">Thử lại</button>
        </div>
      </div>
    </div>`;
}

// ====== Render ======
function renderWatchPage() {
    const videoUrl = getCurrentVideoUrl();
    const player = document.getElementById('video-player');
    if (player) {
        if (videoUrl) {
            if (isM3u8Url(videoUrl)) {
                player.srcdoc = generateHlsPlayerHtml(videoUrl);
                player.src = '';
                player.onload = null;
            } else {
                player.src = videoUrl;
                player.srcdoc = '';
            }
        } else {
            player.srcdoc = '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#000;color:#666;font-family:sans-serif;flex-direction:column;gap:12px;height:100vh;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><p style="font-size:14px;">Chưa có video để phát</p><p style="font-size:12px;color:#444;">Tập này có thể chưa được cập nhật</p></body></html>';
        }
    }

    const $ = id => document.getElementById(id);
    const setText = (id, text) => { const el = $(id); if (el) el.textContent = text || ''; };

    setText('movie-title', currentMovie.name);
    setText('movie-origin-name', currentMovie.origin_name ? `(${currentMovie.origin_name})` : '');
    setText('movie-description', currentMovie.content);
    setText('movie-category', currentMovie.category);
    setText('movie-duration', currentMovie.time);
    setText('movie-season', currentMovie.season || 'Đang cập nhật');
    setText('movie-views', currentMovie.views ? `${currentMovie.views} lượt xem` : 'Đang cập nhật');
    setText('movie-date', currentMovie.date_created || 'Đang cập nhật');
    setText('movie-lang', currentMovie.lang);
    setText('movie-quality', currentMovie.quality);
    setText('movie-episode-count', currentMovie.episode_current || (currentEpisodes.length ? `Tập ${currentEpisodeIndex + 1}` : 'Đang cập nhật'));
    setText('movie-episode-total', currentMovie.episode_total || currentEpisodes.length || '??');

    const ratingEl = $('movie-rating');
    if (ratingEl) {
        ratingEl.innerHTML = '';
        const r = parseFloat(currentMovie.rating) || 0;
        const sc = Math.round(r / 2);
        for (let i = 1; i <= 5; i++) {
            const s = document.createElement('span');
            s.innerHTML = i <= sc
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
            ratingEl.appendChild(s);
        }
        const n = document.createElement('span');
        n.className = 'text-yellow-400 text-sm font-bold ml-1';
        n.textContent = currentMovie.rating;
        ratingEl.appendChild(n);
    }

    const posterImg = $('movie-poster-img');
    if (posterImg) {
        posterImg.src = buildImageUrl(currentMovie.thumb_url, null);
        posterImg.onerror = function() { this.onerror = null; this.src = PLACEHOLDER; this.style.opacity = '0.5'; };
    }

    document.title = `${currentMovie.name} - Xem Phim`;
    renderServerTabs();
    renderEpisodeGrid();
}

// ====== Server tabs ======
function renderServerTabs() {
    const container = document.getElementById('server-tabs');
    if (!container) return;
    if (allEpisodeServers.length <= 1) { container.innerHTML = ''; container.style.display = 'none'; return; }
    container.style.display = 'flex';
    container.innerHTML = allEpisodeServers.map((s, i) =>
        `<button class="server-tab px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${i === currentServerIndex ? 'bg-orange-500/20 border border-orange-500 text-orange-400' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}" data-server-index="${i}">${s.server_name || 'Server ' + (i+1)}</button>`
    ).join('');
    container.querySelectorAll('.server-tab').forEach(b => b.addEventListener('click', () => switchServer(parseInt(b.dataset.serverIndex))));
}

function switchServer(idx) {
    if (idx === currentServerIndex || !allEpisodeServers[idx]) return;
    currentServerIndex = idx;
    currentEpisodes = (allEpisodeServers[currentServerIndex].server_data || []).map(ep => {
        if (ep.link_embed) ep.link_embed = ensureHttps(ep.link_embed);
        if (ep.link_m3u8) ep.link_m3u8 = ensureHttps(ep.link_m3u8);
        return ep;
    });
    currentEpisodeIndex = 0;
    renderServerTabs();
    renderEpisodeGrid();
    const vu = getCurrentVideoUrl();
    const pl = document.getElementById('video-player');
    if (pl && vu) {
        if (isM3u8Url(vu)) { pl.srcdoc = generateHlsPlayerHtml(vu); pl.src = ''; }
        else { pl.src = vu; pl.srcdoc = ''; }
    }
    const ec = document.getElementById('movie-episode-count');
    if (ec) ec.textContent = currentEpisodes.length ? 'Tập 1' : 'Đang cập nhật';
    showToast(`Đã chuyển sang ${allEpisodeServers[currentServerIndex].server_name}`, 'info');
}

// ====== Episode grid ======
function renderEpisodeGrid() {
    const container = document.getElementById('episode-container');
    if (!container) return;
    container.innerHTML = '';
    if (!currentEpisodes.length) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 text-sm py-8">Chưa có tập phim nào cho server này</div>';
        return;
    }
    const h = document.createElement('div');
    h.className = 'col-span-full flex items-center justify-between mb-2 pb-2 border-b border-white/5';
    h.innerHTML = `<span class="text-xs text-gray-400">Tổng: <strong class="text-white">${currentEpisodes.length}</strong> tập</span><span class="text-xs text-orange-400">${currentMovie.episode_current || 'Tập ' + (currentEpisodeIndex+1)}</span>`;
    container.appendChild(h);
    currentEpisodes.forEach((ep, i) => {
        const en = ep.name || 'Tập ' + (i+1);
        const a = i === currentEpisodeIndex;
        const d = document.createElement('div');
        d.className = `episode-item rounded-lg cursor-pointer transition-all duration-200 text-center py-2 px-1 text-xs font-medium border ${a ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm shadow-orange-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-orange-500/50'}`;
        d.dataset.index = i;
        d.textContent = en;
        d.addEventListener('click', () => switchEpisode(i));
        container.appendChild(d);
    });
}

function switchEpisode(index) {
    if (index === currentEpisodeIndex || !currentEpisodes[index]) return;
    currentEpisodeIndex = index;
    const vu = getCurrentVideoUrl();
    const pl = document.getElementById('video-player');
    if (pl && vu) {
        if (isM3u8Url(vu)) { pl.srcdoc = generateHlsPlayerHtml(vu); pl.src = ''; }
        else { pl.src = vu; pl.srcdoc = ''; }
    }
    document.querySelectorAll('.episode-item').forEach(el => {
        const i = parseInt(el.dataset.index);
        el.className = `episode-item rounded-lg cursor-pointer transition-all duration-200 text-center py-2 px-1 text-xs font-medium border ${i === currentEpisodeIndex ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm shadow-orange-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-orange-500/50'}`;
    });
    const ec = document.getElementById('movie-episode-count');
    if (ec) ec.textContent = 'Tập ' + (index + 1);
    const eh = document.querySelector('#episode-container .col-span-full .text-orange-400');
    if (eh) eh.textContent = 'Tập ' + (index + 1) + '/' + currentEpisodes.length;
    showToast('Đã chuyển sang ' + (currentEpisodes[index].name || 'Tập ' + (index+1)), 'info');
}

// ====== Bookmark ======
function saveBookmark(episodeIndex) {
    if (!currentMovie) return;
    const id = getSlugFromURL();
    const bm = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}');
    bm[id] = { episodeIndex: episodeIndex !== undefined ? episodeIndex : currentEpisodeIndex, serverIndex: currentServerIndex, episodeName: currentEpisodes[currentEpisodeIndex]?.name || 'Tập ' + (currentEpisodeIndex+1), title: currentMovie.name, timestamp: new Date().toISOString() };
    localStorage.setItem('anime_bookmarks', JSON.stringify(bm));
    const st = document.getElementById('bookmark-status');
    if (st) { st.classList.remove('hidden'); setTimeout(() => st.classList.add('hidden'), 3000); }
    showToast('Đã lưu dấu trang ✓', 'bookmark');
}

function loadBookmark() {
    const id = getSlugFromURL();
    const bm = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}');
    const bk = bm[id];
    if (!bk) return;
    bookmarkData = bk;
    if (bk.serverIndex !== undefined && bk.serverIndex < allEpisodeServers.length) {
        currentServerIndex = bk.serverIndex;
        currentEpisodes = allEpisodeServers[currentServerIndex].server_data || [];
    }
    if (bk.episodeIndex !== undefined && bk.episodeIndex < currentEpisodes.length) switchEpisode(bk.episodeIndex);
    showBookmarkNotification(bk);
}

function showBookmarkNotification(bk) {
    const ex = document.querySelector('.bookmark-notification');
    if (ex) ex.remove();
    const d = document.createElement('div');
    d.className = 'bookmark-notification';
    d.innerHTML = `<div><p class="font-bold text-sm">Tiếp tục xem ${bk.episodeName || ''}</p><p class="text-xs opacity-80">Lần xem lần trước</p></div>
<button onclick="this.closest('.bookmark-notification')?.remove();continueWatching();">Xem Tiếp</button>
<button onclick="this.parentElement.remove()">Bỏ Qua</button>`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 10000);
}

function continueWatching() {
    const id = getSlugFromURL();
    const bm = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}');
    const bk = bm[id];
    if (!bk) return;
    if (bk.serverIndex !== undefined && bk.serverIndex < allEpisodeServers.length) {
        currentServerIndex = bk.serverIndex;
        currentEpisodes = allEpisodeServers[currentServerIndex].server_data || [];
        renderServerTabs();
        renderEpisodeGrid();
    }
    if (bk.episodeIndex !== undefined) switchEpisode(bk.episodeIndex);
}

// ====== Phim liên quan (render vào sidebar #related-sidebar) ======
async function fetchRelatedMovies() {
    const container = document.getElementById('related-sidebar');
    if (!container) return;
    try {
        const res = await fetch('https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdn) { IMG_BASE = cdn.endsWith('/') ? cdn + 'uploads/movies/' : cdn + '/uploads/movies/'; }
        let movies = data?.data?.items || data?.items || [];
        movies = movies.filter(m => m && m.slug && (m.name || m.title));
        container.innerHTML = '';
        if (!movies.length) { container.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">Chưa có phim đề xuất</div>'; return; }
        movies.slice(0, 10).forEach(m => {
            const view = (m.view || m.views || 0) >= 1000 ? Math.floor((m.view || m.views || 0) / 1000) + 'K' : (m.view || m.views || 0);
            const a = document.createElement('a');
            a.href = 'watch.html?id=' + m.slug;
            a.className = 'flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group';
            a.innerHTML = `<div class="w-14 h-20 rounded-md overflow-hidden bg-gray-700 shrink-0"><img src="${buildImageUrl(m.thumb_url, m.thumb)}" alt="${m.name || m.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/56x80';this.style.opacity='0.5';"></div><div class="flex-1 min-w-0"><h4 class="text-white text-xs font-semibold truncate group-hover:text-orange-400 transition-colors">${m.name || m.title}</h4><p class="text-gray-500 text-[10px] mt-1">${view} lượt xem</p><p class="text-gray-600 text-[10px]">${m.year || ''}</p></div>`;
            container.appendChild(a);
        });
    } catch(e) {
        console.error('Lỗi tải phim đề xuất:', e);
        if (container) container.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">Chưa có phim đề xuất</div>';
    }
}

// ====== Sidebar ======
async function fetchTrending() {
    try {
        const res = await fetch('https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE;
        if (cdn) { IMG_BASE = cdn.endsWith('/') ? cdn + 'uploads/movies/' : cdn + '/uploads/movies/'; }
        const movies = (data?.data?.items || data?.items || []).filter(m => m && m.slug && (m.name || m.title));
        allTrendingMovies = movies;
        renderSidebarKeywords();
        renderSidebarTopMovies();
    } catch(e) { console.error('Lỗi tải sidebar:', e); }
}

function renderSidebarKeywords() {
    const container = document.getElementById('sidebar-keywords');
    if (!container) return;
    const kw = new Set();
    allTrendingMovies.slice(0, 20).forEach(m => { if (Array.isArray(m.category)) m.category.forEach(c => { const n = typeof c === 'object' ? c.name : c; if (n) kw.add(n); }); });
    ['Anime Mới', 'Vietsub', 'Hoạt Hình', 'Siêu Phẩm', 'Đề Cử', 'Hot Trending'].forEach(k => kw.add(k));
    const list = Array.from(kw).slice(0, 10);
    container.innerHTML = list.length ? list.map(k => `<span class="inline-block px-3 py-1.5 bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-orange-400 rounded-full text-xs cursor-pointer transition-all duration-200 border border-white/5 hover:border-orange-500/30">${k}</span>`).join('') : '<span class="text-gray-500 text-xs">Đang cập nhật...</span>';
}

function renderSidebarTopMovies() {
    const container = document.getElementById('sidebar-top-movies');
    if (!container) return;
    const top = allTrendingMovies.slice(0, 5);
    if (!top.length) { container.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">Chưa có dữ liệu</div>'; return; }
    container.innerHTML = top.map((m, i) => {
        const view = (m.view || m.views || 0) >= 1000 ? Math.floor((m.view || m.views || 0) / 1000) + 'K' : (m.view || m.views || 0);
        return `<a href="watch.html?id=${m.slug}" class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"><span class="text-xs font-bold w-5 text-center ${i < 3 ? 'text-orange-400' : 'text-gray-500'}">${i+1}</span><div class="w-10 h-14 rounded-md overflow-hidden bg-gray-700 shrink-0"><img src="${buildImageUrl(m.thumb_url, m.thumb)}" alt="${m.name || m.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/40x60';this.style.opacity='0.5';"></div><div class="flex-1 min-w-0"><h4 class="text-white text-xs font-semibold truncate group-hover:text-orange-400 transition-colors">${m.name || m.title}</h4><p class="text-gray-500 text-[10px] mt-0.5">${view} lượt xem</p></div></a>`;
    }).join('');
}

// ====== Comment ======
function renderComments() {
    const container = document.getElementById('comments-container');
    if (!container) return;
    const id = getSlugFromURL();
    const cm = JSON.parse(localStorage.getItem('anime_comments_' + id) || '[]');
    if (!cm.length) { container.innerHTML = '<div class="col-span-full text-center text-gray-500 text-sm py-6">Chưa có bình luận. Hãy là người đầu tiên bình luận!</div>'; return; }
    const colors = ['bg-orange-500', 'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
    container.innerHTML = cm.slice().reverse().map(c =>
        `<div class="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/5"><div class="w-8 h-8 ${colors[(c.nickname?.length||0)%6]} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">${(c.nickname ? c.nickname.charAt(0).toUpperCase() : '?')}</div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="text-white text-xs font-semibold">${c.nickname || 'Ẩn danh'}</span><span class="text-gray-600 text-[10px]">${c.timestamp ? new Date(c.timestamp).toLocaleString('vi-VN') : ''}</span></div><p class="text-gray-300 text-sm leading-relaxed">${c.content || ''}</p></div></div>`
    ).join('');
}

function submitComment() {
    const id = getSlugFromURL();
    const ni = document.getElementById('comment-nickname');
    const ci = document.getElementById('comment-content');
    const nickname = ni?.value?.trim() || 'Ẩn danh';
    const content = ci?.value?.trim() || '';
    if (!content) { showToast('Vui lòng nhập nội dung bình luận', 'info'); return; }
    const cm = JSON.parse(localStorage.getItem('anime_comments_' + id) || '[]');
    cm.push({ nickname, content, timestamp: new Date().toISOString(), id: Date.now() });
    localStorage.setItem('anime_comments_' + id, JSON.stringify(cm));
    if (ci) ci.value = '';
    showToast('Bình luận thành công ✓', 'bookmark');
    renderComments();
}

// ====== Cinema Mode ======
function toggleCinemaMode() {
    const vs = document.querySelector('.video-section');
    if (!vs) return;
    vs.classList.toggle('cinema-mode');
    if (vs.classList.contains('cinema-mode')) {
        document.querySelector('header').style.display = 'none';
        document.querySelector('footer').style.display = 'none';
        const m = document.querySelector('main');
        if (m) { m.style.padding = '0'; m.style.maxWidth = '100%'; }
        if (vs.requestFullscreen) vs.requestFullscreen();
        else if (vs.webkitRequestFullscreen) vs.webkitRequestFullscreen();
    } else {
        document.querySelector('header').style.display = '';
        document.querySelector('footer').style.display = '';
        const m = document.querySelector('main');
        if (m) { m.style.padding = ''; m.style.maxWidth = ''; }
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

// ====== Share & Like ======
function shareMovie() {
    if (navigator.share) { navigator.share({ title: currentMovie.name, text: currentMovie.content, url: window.location.href }).catch(() => {}); }
    else { navigator.clipboard.writeText(window.location.href).then(() => showToast('Đã sao chép link!', 'share')).catch(() => showToast('Chia sẻ: ' + window.location.href, 'share')); }
}

function toggleLike() {
    const btn = document.getElementById('like-btn');
    if (!btn) return;
    const liked = btn.dataset.liked === 'true';
    btn.dataset.liked = liked ? 'false' : 'true';
    btn.classList.toggle('text-red-400', !liked);
    btn.classList.toggle('text-gray-400', liked);
    showToast(liked ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích ❤', 'heart');
}

// ====== Toast ======
function showToast(message, icon) {
    const ex = document.querySelector('.custom-toast');
    if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = 'custom-toast fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-orange-500/10 text-sm text-white flex items-center gap-3 animate-slideUp';
    let svg = '';
    if (icon === 'bookmark') svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
    else if (icon === 'heart') svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#ff6b00" stroke="#ff6b00" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    else svg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    t.innerHTML = svg + '<span>' + message + '</span>';
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'all 0.3s ease'; t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ====== Auto-save bookmark ======
function startAutoSaveBookmark() {
    setInterval(() => { if (currentMovie && currentEpisodes.length) saveBookmark(currentEpisodeIndex); }, 15000);
}

// ====== Initialize events ======
function initializeEventListeners() {
    const bid = id => document.getElementById(id);
    const click = (id, fn) => { const el = bid(id); if (el) el.addEventListener('click', fn); };
    click('cinema-mode-btn', toggleCinemaMode);
    click('bookmark-btn', () => saveBookmark(currentEpisodeIndex));
    click('continue-btn', () => { const bm = JSON.parse(localStorage.getItem('anime_bookmarks') || '{}'); if (bm[getSlugFromURL()]) continueWatching(); else showToast('Chưa có dấu trang nào', 'info'); });
    click('share-btn', shareMovie);
    click('like-btn', toggleLike);
    click('back-btn', () => window.history.back());
    click('comment-submit', submitComment);
    const ci = bid('comment-content');
    if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } });
    startAutoSaveBookmark();
}

// ====== Khởi chạy ======
document.addEventListener('DOMContentLoaded', loadMovieData);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const vs = document.querySelector('.video-section'); if (vs?.classList.contains('cinema-mode')) toggleCinemaMode(); } });