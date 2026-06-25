import { useState, useEffect, useRef, useCallback } from "react";
import { Star, Clock, User, Film, Play, Ellipsis } from "lucide-react";
import heroBannerSlides from "../data/heroBannerData";

// ─── CSS ANIMATIONS (tối thiểu) ──────────────────────────────────────────────
const styles = `
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.anim-title   { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) forwards; }
.anim-info    { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.04s forwards; opacity:0; }
.anim-desc    { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.08s forwards; opacity:0; }
.anim-director{ animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.1s forwards; opacity:0; }
.anim-genre   { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.12s forwards; opacity:0; }
.anim-btns    { animation: slideUpFade 0.4s cubic-bezier(0.4,0,0.2,1) 0.14s forwards; opacity:0; }
.banner-wrapper:hover .banner-arrow-btn { opacity:1 !important; }
`;

// ─── HELPER: normalize slide data (cả API và fallback) ──────────────────────
function normalizeSlide(item, isApi) {
  if (isApi) {
    const cats = item?.category || [];
    return {
      // GIỮ NGUYÊN key thumb_url từ API gốc để dùng cho ảnh nền banner
      thumb_url: item.thumb_url || "",
      image: item.banner || item.thumb_url || item.poster_url || item.image || "",
      title: item.name || item.title || "",
      rating: Number(item.tmdb?.vote_average) || Number(item.rating) || 0,
      episode: item.episode_current ? `Tập ${item.episode_current}` : "",
      year: item.year || "",
      director: item.director || "",
      genres: cats.map((c) => c?.name).filter(Boolean),
      description: item.content || item.synopsis || "",
      quality: "HD VietSub",
      slug: item.slug || item._id || "",
    };
  }
  // Fallback data từ heroBannerData
  return {
    thumb_url: item.image || "",
    image: item.image || "",
    title: item.title || "",
    rating: item.rating || 0,
    episode: item.episode || "",
    year: item.year || "",
    director: item.director || "",
    genres: item.genres || [],
    description: item.description || "",
    quality: item.quality || "HD VietSub",
    slug: item.link || item.id || "",
  };
}

// ─── HERO BANNER SLIDER COMPONENT ──────────────────────────────────────────
export default function HeroBannerSlider({ items = [] }) {
  // Xác định nguồn dữ liệu: API hay fallback
  const hasApiData = Array.isArray(items) && items.length > 0;
  // Sắp xếp: ưu tiên phim có tập mới nhất (episode_current cao nhất) lên đầu
  const sortedItems = hasApiData
    ? [...items].sort((a, b) => {
        const epA = parseInt(a.episode_current) || 0;
        const epB = parseInt(b.episode_current) || 0;
        return epB - epA;
      })
    : [];
  const rawSlides = hasApiData
    ? sortedItems.slice(0, 5)
    : heroBannerSlides.slice(0, 5);
  const slides = rawSlides.map((item) => normalizeSlide(item, hasApiData));
  const totalSlides = slides.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);
  const progressStartRef = useRef(Date.now());
  const dragRef = useRef({ startX: 0, startY: 0, diffX: 0, isDragging: false });

  const AUTOPLAY_DELAY = 5000;
  const PROGRESS_INTERVAL = 50;

  // ─── Detect mobile ───
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── Navigation ───
  const goTo = useCallback(
    (index) => {
      if (totalSlides === 0) return;
      setCurrentIndex(index);
      progressStartRef.current = Date.now();
      setProgress(0);
    },
    [totalSlides]
  );

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

  // ─── Autoplay (luôn chạy, không phụ thuộc hover) ───
  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (totalSlides <= 1) return;
    progressStartRef.current = Date.now();
    setProgress(0);
    intervalRef.current = setInterval(goNext, AUTOPLAY_DELAY);
  }, [goNext, totalSlides]);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Luôn chạy autoplay, không phụ thuộc hover
  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [currentIndex, startAutoplay, stopAutoplay]);

  // ─── Progress bar ───
  useEffect(() => {
    if (totalSlides <= 1) return;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current;
      setProgress(Math.min((elapsed / AUTOPLAY_DELAY) * 100, 100));
    }, PROGRESS_INTERVAL);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, totalSlides]);

  // ─── Mouse & Touch drag events (vuốt để chuyển slide) ───
  const handleDragStart = useCallback((clientX, clientY) => {
    dragRef.current = { startX: clientX, startY: clientY, diffX: 0, isDragging: true };
  }, []);

  const handleDragMove = useCallback((clientX, clientY) => {
    if (!dragRef.current.isDragging) return;
    const diffX = dragRef.current.startX - clientX;
    const diffY = dragRef.current.startY - clientY;
    dragRef.current.diffX = diffX;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    const diff = dragRef.current.diffX;
    if (Math.abs(diff) > 50) (diff > 0 ? goNext : goPrev)();
  }, [goNext, goPrev]);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse drag events (cho desktop)
  const handleMouseDown = useCallback((e) => {
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e) => {
    handleDragMove(e.clientX, e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (dragRef.current.isDragging) handleDragEnd();
  }, [handleDragEnd]);

  // ─── Fallback khi không có slide ───
  if (totalSlides === 0) {
    return (
      <div className="relative w-full h-[260px] overflow-hidden bg-[#1a1c20] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Đang tải dữ liệu banner...</p>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div
          className="banner-wrapper relative w-full h-[260px] md:h-[300px] overflow-hidden bg-[#1a1c20] select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* ─── TẤT CẢ CÁC SLIDE ─── */}
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.slug || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-[0.6s] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isActive ? "opacity-100 z-[2] pointer-events-auto" : "opacity-0 z-[1] pointer-events-none"
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              role="region"
              aria-label={`Slide ${index + 1}`}
              aria-hidden={!isActive}
            >
               {/* ════════════════════════════════════════════════════
                    LỚP 1 – ẢNH NỀN (z-0, nằm dưới cùng)
                   ════════════════════════════════════════════════════ */}
              <img
                src={slide.image}
                alt={slide.title}
className="absolute inset-0 w-full h-full object-cover object-[50%_15%] z-0"
                loading={isActive ? "eager" : "lazy"}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.style.background = "#1a1c20";
                }}
              />

              {/* ════════════════════════════════════════════════════
                    LỚP 2 – LỚP PHỦ TỐI BÊN TRÁI (z-10) - đen trong suốt 60%
                    ════════════════════════════════════════════════════ */}
              <div className="absolute inset-y-0 left-0 w-[60%] bg-black/60 z-10" />

              {/* ══════════════════════════════════════════════════
                    LỚP 3 – KHỐI CHỮ & ICON (z-20, nằm trên cùng)
                   ══════════════════════════════════════════════════ */}
              <div className="relative z-20 pl-6 md:pl-8 flex flex-col justify-center h-full space-y-1.5 w-full md:w-[45%] text-white">
                {/* DÒNG 1: Tiêu đề */}
                <h2 className={`text-base md:text-lg font-bold text-white leading-tight line-clamp-2 ${
                  isActive ? "anim-title" : ""
                }`}>
                  {slide.title}
                </h2>

                {/* DÒNG 2: Thông số + Thể loại gộp chung */}
                <div className={`flex items-center flex-wrap gap-x-2 gap-y-1 ${
                  isActive ? "anim-info" : ""
                }`}>
                  {slide.rating > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Star className="text-yellow-400 fill-yellow-400 w-3 h-3" />
                      <span className="font-bold text-white text-[11px]">
                        {slide.rating.toFixed(1)}
                      </span>
                    </span>
                  )}

                  {slide.episode && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock className="text-green-500 w-3 h-3" />
                      <span className="font-bold text-white text-[11px]">
                        {slide.episode}
                      </span>
                    </span>
                  )}

                  {slide.year && (
                    <span className="text-[11px] text-gray-400">
                      {slide.year}
                    </span>
                  )}

                  <span className="bg-green-600 text-white font-bold text-[9px] px-[6px] py-[1px] rounded-[3px] uppercase tracking-[0.5px] leading-[1.4]">
                    {slide.quality}
                  </span>

                  {slide.genres.length > 0 && (
                    <span className="text-[11px] text-gray-500">•</span>
                  )}
                  {slide.genres.slice(0, 3).map((g, i) => (
                    <span key={i} className="text-[9px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                      {g}
                    </span>
                  ))}
                </div>

                {/* DÒNG 3: Mô tả ngắn */}
                {slide.description && (
                  <p className={`text-[11px] text-gray-300 line-clamp-2 leading-relaxed max-w-full ${
                    isActive ? "anim-desc" : ""
                  }`}>
                    {slide.description}
                  </p>
                )}

                {/* DÒNG 4: Studio & Đạo diễn gộp 1 dòng */}
                <div className={`flex items-center gap-3 text-[10px] ${
                  isActive ? "anim-director" : ""
                }`}>
                  <span className="text-green-400">📁 Studio: <span className="text-green-200">{slide.director || 'Đang cập nhật'}</span></span>
                  {slide.director && (
                    <span className="text-green-400">🎬 Đạo diễn: <span className="text-green-200">{slide.director}</span></span>
                  )}
                </div>

                {/* DÒNG 5: Nút bấm */}
                <div className={`flex items-center gap-2 pt-1 ${
                  isActive ? "anim-btns" : ""
                }`}>
                  <a
                    href={`/phim/${slide.slug}`}
                    className="inline-flex items-center justify-center gap-[2px] bg-black/50 text-green-400 font-bold text-[10px] px-[10px] py-[6px] rounded-[6px] border border-green-500 no-underline cursor-pointer transition-all duration-200 hover:bg-green-600 hover:text-white hover:scale-[1.03] leading-none"
                    aria-label={`Chi tiết phim ${slide.title}`}
                  >
                    <User size={12} />
                  </a>

                  <a
                    href={`/phim/${slide.slug}`}
                    className="inline-flex items-center gap-[4px] bg-[#b91c1c] text-white font-bold text-[11px] px-[16px] py-[7px] rounded-none border border-[#b91c1c] no-underline cursor-pointer transition-all duration-200 hover:bg-[#991b1b] hover:scale-[1.03] leading-none"
                    aria-label={`Xem phim ${slide.title}`}
                  >
                    <Play size={12} fill="currentColor" className="shrink-0" />
                    Xem Phim
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* ─── MŨI TÊN ĐIỀU HƯỚNG ─── */}
        {totalSlides > 1 && (
          <button
            className="banner-arrow-btn absolute top-1/2 -translate-y-1/2 left-[6px] w-7 h-7 rounded-full bg-black/40 text-white border-none cursor-pointer z-10 flex items-center justify-center opacity-0 transition-all duration-250 hover:bg-black/70 hover:scale-110 p-0"
            onClick={goPrev}
            aria-label="Slide trước"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {totalSlides > 1 && (
          <button
            className="banner-arrow-btn absolute top-1/2 -translate-y-1/2 right-[6px] w-7 h-7 rounded-full bg-black/40 text-white border-none cursor-pointer z-10 flex items-center justify-center opacity-0 transition-all duration-250 hover:bg-black/70 hover:scale-110 p-0"
            onClick={goNext}
            aria-label="Slide tiếp theo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* ─── CHẤM TRÒN CHỈ MỤC ─── */}
        {totalSlides > 1 && (
          <div
            className="absolute bottom-[10px] left-[25%] -translate-x-1/2 z-10 flex items-center gap-[4px]"
            role="tablist"
            aria-label="Điều hướng slide"
          >
            {slides.map((_, index) => (
              <button
                key={index}
                className={`border-none cursor-pointer p-0 transition-all duration-300 ease ${
                  index === currentIndex
                    ? "w-[18px] h-[5px] rounded-[3px] bg-green-500"
                    : "w-[5px] h-[5px] rounded-full bg-white/35"
                }`}
                onClick={() => goTo(index)}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}