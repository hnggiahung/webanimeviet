import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Moon, Sun, Menu, X, Star, Play, ChevronRight, Clock, Film, User, Heart, Loader2, AlertTriangle } from "lucide-react";

// ─── CSS STYLES ──────────────────────────────────────────────────────────────
const mobileStyles = `
/* ═══ BASE RESET ═══ */
.mobile-homepage * { box-sizing: border-box; }
.mobile-homepage body { margin: 0; background: #0a0a12; }

/* ═══ SCROLLBAR HIDE ═══ */
.mobile-homepage .scrollbar-hide::-webkit-scrollbar { display: none; }
.mobile-homepage .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* ═══ SMOOTH SCROLL ═══ */
.mobile-homepage .smooth-scroll-x {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* ═══ LINE CLAMP ═══ */
.mobile-homepage .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
.mobile-homepage .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

/* ═══ SLIDER ANIMATIONS ═══ */
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mobile-homepage .anim-title   { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) forwards; }
.mobile-homepage .anim-info    { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.04s forwards; opacity:0; }
.mobile-homepage .anim-desc    { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.08s forwards; opacity:0; }
.mobile-homepage .anim-btns    { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.12s forwards; opacity:0; }

/* ═══ PULSE LOADING ═══ */
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.mobile-homepage .animate-pulse { animation: pulse 1.5s ease-in-out infinite; }

/* ═══ RATING RIBBON ═══ */
.mobile-homepage .rating-ribbon {
  position: absolute; top: 0; left: 0; z-index: 10;
  background: rgba(0,0,0,0.75);
  clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
  padding: 3px 7px 6px 5px;
  display: flex; align-items: center; gap: 2px;
  color: white; font-weight: 700; font-size: 9px; line-height: 1;
}
.mobile-homepage .rating-ribbon .star-icon { color: #f5c518; fill: #f5c518; width: 9px; height: 9px; }

/* ═══ EPISODE BADGE ═══ */
.mobile-homepage .ep-badge {
  position: absolute; top: 5px; right: 5px; z-index: 10;
  background: #d82b2b; color: white;
  font-size: 8px; font-weight: 700;
  padding: 2px 6px; border-radius: 3px;
  line-height: 1.4;
}

/* ═══ COMPLETE BADGE ═══ */
.mobile-homepage .complete-badge {
  position: absolute; top: 5px; right: 5px; z-index: 10;
  background: #16a34a; color: white;
  font-size: 7px; font-weight: 700;
  padding: 2px 5px; border-radius: 3px;
  line-height: 1.3;
}

/* ═══ PROGRESS BAR ═══ */
.mobile-homepage .slider-progress {
  position: absolute; bottom: 0; left: 0; height: 3px;
  background: linear-gradient(90deg, #e50914, #ff6b6b);
  z-index: 20;
  transition: width 0.05s linear;
}
`;

// ─── FALLBACK IMAGE ──────────────────────────────────────────────────────────
function getFallbackImg(title) {
  return `https://placehold.co/300x420/1f2937/6b7280?text=${encodeURIComponent(title?.slice(0, 8) || "Anime")}`;
}

// ─── LAZY IMAGE ──────────────────────────────────────────────────────────────
function LazyImg({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const fallback = getFallbackImg(alt);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
      <img
        src={err ? fallback : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => { setErr(true); setLoaded(true); }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

// ─── MOBILE HEADER ───────────────────────────────────────────────────────────
function MobileHeader({ dark, setDark, searchQuery, setSearchQuery, menuOpen, setMenuOpen }) {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a12]/95 backdrop-blur-xl border-b border-[#1f1f2e]">
      <div className="flex items-center justify-between px-3 h-12 gap-2">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img src="/logo.jpg" alt="AnimeVietsub" className="h-8 w-auto" />
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-[180px] mx-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm anime..."
              className="w-full bg-[#1c1c2e] border border-[#2a2a3e] rounded-full pl-8 pr-3 py-1.5 text-gray-300 text-xs placeholder-gray-600 focus:outline-none focus:border-[#e50914]/50 focus:bg-[#1c1c2e] transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#1f1f2e] rounded-full transition-all"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#1f1f2e] rounded-full transition-all"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0a0a12]/98 backdrop-blur-xl border-b border-[#1f1f2e] shadow-2xl z-50">
          <div className="px-4 py-4 space-y-3">
            <a href="#" className="block text-gray-300 text-sm font-medium py-2 px-3 hover:bg-[#1f1f2e] rounded-lg transition-colors">Trang Chủ</a>
            <a href="#" className="block text-gray-300 text-sm font-medium py-2 px-3 hover:bg-[#1f1f2e] rounded-lg transition-colors">Thể Loại</a>
            <a href="#" className="block text-gray-300 text-sm font-medium py-2 px-3 hover:bg-[#1f1f2e] rounded-lg transition-colors">Top Anime</a>
            <a href="#" className="block text-gray-300 text-sm font-medium py-2 px-3 hover:bg-[#1f1f2e] rounded-lg transition-colors">Lịch Chiếu</a>
            <div className="border-t border-[#1f1f2e] pt-3 mt-3">
              <button className="w-full bg-[#e50914] hover:bg-[#b91c1c] text-white text-sm font-bold py-2.5 rounded-lg transition-colors">
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── TOP HORIZONTAL SCROLL (Hot Movies) ──────────────────────────────────────
function TopHorizontalScroll({ items, onMovieClick }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-[#e50914] rounded-full" />
        <span className="text-white font-bold text-xs uppercase tracking-wider">Đề Cử</span>
      </div>
      <div className="smooth-scroll-x flex gap-2.5 pb-1 scrollbar-hide">
        {items.slice(0, 15).map((item, idx) => {
          const src = item.thumb_url || item.poster_url || item.thumbnail || "";
          const title = item.name || item.title || "";
          const rating = item.tmdb?.vote_average || item.rating || 0;
          const ep = item.episode_current || "";
          const isComplete = item.episode_total && item.episode_current && parseInt(item.episode_current) >= parseInt(item.episode_total);
          const slug = item.slug || "";
          return (
            <div
              key={item._id || item.slug || idx}
              className="flex-shrink-0 cursor-pointer"
              style={{ width: 90 }}
              onClick={() => onMovieClick && onMovieClick(slug)}
            >
              <div className="relative overflow-hidden rounded-xl" style={{ width: 90, height: 130, borderRadius: 10 }}>
                <LazyImg src={src} alt={title} className="w-full h-full" />
                {/* Rating Badge */}
                {rating > 0 && (
                  <div className="rating-ribbon" style={{ padding: "2px 5px 5px 3px", fontSize: "7px" }}>
                    <Star className="star-icon" style={{ width: 7, height: 7 }} />
                    <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
                  </div>
                )}
                {/* Status Badge */}
                {isComplete ? (
                  <div className="complete-badge">HOÀN TẤT</div>
                ) : ep ? (
                  <div className="ep-badge">TẬP {ep.slice(0, 4)}</div>
                ) : null}
              </div>
              <p className="text-gray-300 text-[10px] mt-1.5 leading-tight line-clamp-2 font-medium">{title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── HERO SLIDER ─────────────────────────────────────────────────────────────
function HeroSlider({ items, onMovieClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);
  const progressStartRef = useRef(Date.now());
  const dragRef = useRef({ startX: 0, diffX: 0, isDragging: false });

  const slides = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, 5).map((item) => ({
      thumb_url: item.thumb_url || item.poster_url || "",
      image: item.banner || item.thumb_url || item.poster_url || item.image || "",
      title: item.name || item.title || "",
      rating: Number(item.tmdb?.vote_average) || Number(item.rating) || 0,
      episode: item.episode_current ? `Tập ${item.episode_current}` : "",
      year: item.year || "",
      genres: (item.category || []).map((c) => c?.name).filter(Boolean),
      description: item.content || item.synopsis || "",
      quality: "HD VIETSUB",
      slug: item.slug || "",
      studio: item.director || "Đang cập nhật",
      episode_current: item.episode_current || "",
      episode_total: item.episode_total || "",
    }));
  }, [items]);

  const totalSlides = slides.length;
  const AUTOPLAY_DELAY = 5000;

  const goTo = useCallback((index) => {
    if (totalSlides === 0) return;
    setCurrentIndex(index);
    progressStartRef.current = Date.now();
    setProgress(0);
  }, [totalSlides]);

  const goNext = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    progressStartRef.current = Date.now();
    setProgress(0);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    progressStartRef.current = Date.now();
    setProgress(0);
  }, [totalSlides]);

  // Autoplay
  useEffect(() => {
    if (totalSlides <= 1) return;
    progressStartRef.current = Date.now();
    setProgress(0);
    intervalRef.current = setInterval(goNext, AUTOPLAY_DELAY);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext, totalSlides]);

  // Progress bar
  useEffect(() => {
    if (totalSlides <= 1) return;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current;
      setProgress(Math.min((elapsed / AUTOPLAY_DELAY) * 100, 100));
    }, 50);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, totalSlides]);

  // Touch drag
  const handleTouchStart = useCallback((e) => {
    dragRef.current = { startX: e.touches[0].clientX, diffX: 0, isDragging: true };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.diffX = dragRef.current.startX - e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    const diff = dragRef.current.diffX;
    if (Math.abs(diff) > 40) (diff > 0 ? goNext : goPrev)();
  }, [goNext, goPrev]);

  if (totalSlides === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="px-3 mb-3">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[#1a1c20] select-none"
        style={{ aspectRatio: "16/9", maxHeight: 280 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image */}
        {slides.map((slide, index) => (
          <div
            key={slide.slug || index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${
              index === currentIndex ? "opacity-100 z-[2]" : "opacity-0 z-[1]"
            }`}
          >
            <img
              src={slide.image || slide.thumb_url}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading={index === currentIndex ? "eager" : "lazy"}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.style.background = "#1a1c20";
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
          </div>
        ))}

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6">
          {/* Title */}
          <h2 className="text-white font-bold text-lg leading-tight mb-1.5 anim-title line-clamp-2">
            {currentSlide.title}
          </h2>

          {/* Info Row */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2 anim-info">
            {currentSlide.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="text-yellow-400 fill-yellow-400 w-3.5 h-3.5" />
                <span className="text-white font-bold text-xs">{currentSlide.rating.toFixed(1)}</span>
              </span>
            )}
            {currentSlide.episode && (
              <span className="text-gray-300 text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                {currentSlide.episode}
              </span>
            )}
            {currentSlide.year && (
              <span className="text-gray-400 text-[10px]">{currentSlide.year}</span>
            )}
            <span className="bg-green-600 text-white font-bold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
              {currentSlide.quality}
            </span>
          </div>

          {/* Genres */}
          {currentSlide.genres.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 anim-info flex-wrap">
              {currentSlide.genres.slice(0, 3).map((g, i) => (
                <span key={i} className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Studio */}
          <div className="text-[10px] text-gray-400 mb-2.5 anim-info">
            Studio: <span className="text-gray-300">{currentSlide.studio}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 anim-btns">
            <button
              onClick={() => onMovieClick && onMovieClick(currentSlide.slug)}
              className="flex items-center gap-1.5 bg-[#e50914] hover:bg-[#b91c1c] text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all active:scale-95 shadow-lg shadow-[#e50914]/30"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Xem Phim
            </button>
            <button className="flex items-center justify-center w-9 h-9 bg-[#1a5cff] hover:bg-[#1448cc] text-white rounded-lg transition-all active:scale-95">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="slider-progress" style={{ width: `${progress}%` }} />

        {/* Pagination Dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-1 right-4 z-20 flex items-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? "w-5 h-1.5 rounded-full bg-[#e50914]"
                    : "w-1.5 h-1.5 rounded-full bg-white/40"
                }`}
                onClick={() => goTo(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB SYSTEM ──────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "series", label: "Anime bộ" },
  { key: "movie", label: "Anime lẻ" },
  { key: "china", label: "Hoạt hình Trung Quốc" },
];

function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="px-3 mb-3">
      <div className="flex items-center gap-0 bg-[#14141f] rounded-xl p-1 border border-[#1f1f2e]">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 text-xs py-2 px-2 rounded-lg font-medium transition-all ${
              activeTab === tab.key
                ? "text-white bg-[#e50914]/20 border-b-2 border-[#e50914] font-bold"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MOVIE GRID CARD ─────────────────────────────────────────────────────────
function MovieGridCard({ anime, onMovieClick }) {
  const src = anime.thumb_url || anime.poster_url || anime.thumbnail || anime.img || "";
  const title = anime.name || anime.title || "";
  const rating = anime.tmdb?.vote_average || anime.rating || 0;
  const ep = anime.episode_current || "";
  const isComplete = anime.episode_total && anime.episode_current && parseInt(anime.episode_current) >= parseInt(anime.episode_total);
  const slug = anime.slug || "";

  return (
    <div
      className="cursor-pointer group"
      onClick={() => onMovieClick && onMovieClick(slug)}
    >
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "2/3", borderRadius: 10 }}>
        <LazyImg src={src} alt={title} className="w-full h-full" />
        {/* Rating Badge */}
        {rating > 0 && (
          <div className="rating-ribbon">
            <Star className="star-icon" />
            <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
          </div>
        )}
        {/* Status Badge */}
        {isComplete ? (
          <div className="complete-badge">HOÀN TẤT</div>
        ) : ep ? (
          <div className="ep-badge">TẬP {ep.slice(0, 4)}</div>
        ) : null}
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/70 border-2 border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-gray-200 text-xs font-medium mt-1.5 leading-tight line-clamp-2 group-hover:text-[#e50914] transition-colors">
        {title}
      </p>
    </div>
  );
}

// ─── MOBILE HOMEPAGE ─────────────────────────────────────────────────────────
export default function MobileHomepage({
  allItems,
  filteredAnime,
  filterTab,
  setFilterTab,
  onMovieClick,
  isLoading,
  isError,
  dark,
  setDark,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Filter locally by search
  const displayItems = useMemo(() => {
    if (!searchQuery) return filteredAnime;
    const q = searchQuery.toLowerCase();
    return filteredAnime.filter((item) => (item.name || item.title || "").toLowerCase().includes(q));
  }, [filteredAnime, searchQuery]);

  return (
    <div className="mobile-homepage min-h-screen bg-[#0a0a12] text-white font-sans">
      <style>{mobileStyles}</style>

      {/* Header */}
      <MobileHeader
        dark={dark}
        setDark={setDark}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Loading / Error Indicators */}
      {isLoading && (
        <div className="bg-blue-900/30 py-1.5 text-center">
          <span className="text-blue-400 text-[10px] flex items-center justify-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang đồng bộ dữ liệu...
          </span>
        </div>
      )}
      {isError && !isLoading && (
        <div className="bg-amber-900/30 py-1.5 text-center">
          <span className="text-amber-400 text-[10px] flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Đang dùng dữ liệu dự phòng
          </span>
        </div>
      )}

      {/* Top Horizontal Scroll - Hot Movies */}
      <TopHorizontalScroll items={allItems} onMovieClick={onMovieClick} />

      {/* Hero Slider */}
      <HeroSlider items={allItems} onMovieClick={onMovieClick} />

      {/* Tab System */}
      <TabBar activeTab={filterTab} onTabChange={setFilterTab} />

      {/* Movie Grid - 2 Columns */}
      <div className="px-3 pb-6">
        {displayItems.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-sm">
            <p>Không tìm thấy phim nào.</p>
            <p className="mt-1">Thử thay đổi bộ lọc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayItems.map((item, idx) => (
              <MovieGridCard
                key={item._id || item.slug || idx}
                anime={item}
                onMovieClick={onMovieClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-[#1f1f2e] bg-[#0d0d1a] px-4 py-6">
        <div className="text-center">
          <img src="/logo.jpg" alt="Logo" className="h-6 w-auto mx-auto mb-3 opacity-50" />
          <div className="flex items-center justify-center gap-4 mb-3">
            <button className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors">Xem Phim</button>
            <button className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors">Góp ý</button>
            <button className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors">Liên hệ</button>
          </div>
          <p className="text-gray-700 text-[9px]">© 2026 Dự án cá nhân | Phát triển bởi Gia Hưng</p>
        </div>
      </footer>
    </div>
  );
}