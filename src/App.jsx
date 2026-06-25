import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Moon, Sun, Play, Star, Eye, Bell, ChevronRight,
  ChevronLeft, ChevronRight as ChevronRightIcon, ArrowLeft,
  Home, Film, Grid, Calendar, TrendingUp, MessageCircle,
  Clock, Shuffle, Youtube, Facebook, Twitter, Heart, Menu, X,
  Loader2, AlertTriangle
} from "lucide-react";
import MovieDetail from "./components/MovieDetail";
import WatchPage from "./components/WatchPage";
import ErrorBoundary from "./components/ErrorBoundary";
import HeroBannerSlider from "./components/HeroBannerSlider";
import { fetchMovieList, filterAnimeList } from "./services/ophimApi";

// ─── FALLBACK MOCK DATA (hiển thị ngay lập tức nếu API lỗi) ────────────────
const FALLBACK_MOVIES = [
  { _id:"1", name:"One Piece – Đảo Hải Tặc", slug:"one-piece", thumb_url:"https://cdn.myanimelist.net/images/anime/6/73245l.jpg", lang:"Vietsub", episode_current:"1167", episode_total:"9999", year:1999, category:[{name:"Hoạt Hình"},{name:"Hành Động"},{name:"Phiêu Lưu"}], tmdb:{vote_average:9.3}, type:"series", content:"Cuộc phiêu lưu của băng Mũ Rơm." },
  { _id:"2", name:"Needy Girl Overdose", slug:"needy-girl-overdose", thumb_url:"https://cdn.myanimelist.net/images/anime/1887/138739l.jpg", lang:"Vietsub", episode_current:"12", episode_total:"13", year:2026, category:[{name:"Hoạt Hình"},{name:"Drama"},{name:"Tâm Lý"}], tmdb:{vote_average:8.3}, type:"series", content:"Câu chuyện về game streamer." },
  { _id:"3", name:"Hắc Miêu Và Lớp Học Phù Thủy", slug:"hac-mieu-va-lop-hoc-phu-thuy", thumb_url:"https://cdn.myanimelist.net/images/anime/1908/143997l.jpg", lang:"Vietsub", episode_current:"11", episode_total:"24", year:2026, category:[{name:"Hoạt Hình"},{name:"Fantasy"},{name:"Magic"},{name:"School"}], tmdb:{vote_average:9.0}, type:"series", content:"Một cô gái bí ẩn gia nhập lớp học phù thủy." },
  { _id:"4", name:"Reborn as a Cat", slug:"reborn-as-a-cat", thumb_url:"https://cdn.myanimelist.net/images/anime/1544/144402l.jpg", lang:"Vietsub", episode_current:"34", episode_total:"48", year:2026, category:[{name:"Hoạt Hình"},{name:"Comedy"},{name:"Fantasy"}], tmdb:{vote_average:8.1}, type:"series", content:"Tái sinh thành mèo." },
  { _id:"5", name:"Ichijouma Mankitsugurashi!", slug:"ichijouma-mankitsugurashi", thumb_url:"https://cdn.myanimelist.net/images/anime/1765/146557l.jpg", lang:"Vietsub", episode_current:"11", episode_total:"12", year:2026, category:[{name:"Hoạt Hình"},{name:"Comedy"},{name:"Romance"},{name:"School"}], tmdb:{vote_average:9.3}, type:"series", content:"Cuộc sống học đường vui nhộn." },
  { _id:"6", name:"Võ Thần Chúa Tế", slug:"vo-than-chua-te", thumb_url:"https://cdn.myanimelist.net/images/anime/6/73245l.jpg", lang:"Vietsub", episode_current:"667", episode_total:"9999", year:2019, category:[{name:"Hoạt Hình"},{name:"Action"},{name:"Fantasy"},{name:"Martial Arts"}], tmdb:{vote_average:8.5}, type:"series", content:"Hành trình tu luyện võ đạo." },
  { _id:"7", name:"Tiên Nghịch", slug:"tien-nghich", thumb_url:"https://cdn.myanimelist.net/images/anime/1887/138739l.jpg", lang:"Vietsub", episode_current:"146", episode_total:"9999", year:2023, category:[{name:"Hoạt Hình"},{name:"Action"},{name:"Fantasy"},{name:"Cultivation"}], tmdb:{vote_average:9.1}, type:"series", content:"Tu tiên nghịch thiên cải mệnh." },
  { _id:"8", name:"Mục Thần Ký", slug:"muc-than-ky", thumb_url:"https://cdn.myanimelist.net/images/anime/1544/144402l.jpg", lang:"Vietsub", episode_current:"88", episode_total:"9999", year:2024, category:[{name:"Hoạt Hình"},{name:"Fantasy"},{name:"Action"},{name:"Adventure"}], tmdb:{vote_average:9.2}, type:"series", content:"Mục Trần trên con đường trở thành cường giả." },
  { _id:"9", name:"Thần Y Cổ Đại Ở Đô Thị", slug:"than-y-co-dai-o-do-thi", thumb_url:"https://cdn.myanimelist.net/images/anime/1908/143997l.jpg", lang:"Vietsub", episode_current:"186", episode_total:"9999", year:2025, category:[{name:"Hoạt Hình"},{name:"Action"},{name:"Drama"},{name:"Supernatural"}], tmdb:{vote_average:9.5}, type:"series", content:"Thần y tái thế." },
  { _id:"10", name:"Wistoria: Trượng Và Kiếm Mùa 2", slug:"wistoria-truong-va-kiem-mua-2", thumb_url:"https://cdn.myanimelist.net/images/anime/1398/154432l.jpg", lang:"Vietsub", episode_current:"11", episode_total:"12", year:2026, category:[{name:"Hoạt Hình"},{name:"Fantasy"},{name:"Action"},{name:"Magic"},{name:"School"}], tmdb:{vote_average:9.6}, type:"series", content:"Will Serfort chinh phục Tháp Thần." },
  { _id:"11", name:"Song Mệnh Cõi Hoàng Tuyền", slug:"song-menh-coi-hoang-tuyen", thumb_url:"https://cdn.myanimelist.net/images/anime/1544/144402l.jpg", lang:"Vietsub", episode_current:"12", episode_total:"24", year:2026, category:[{name:"Hoạt Hình"},{name:"Action"},{name:"Drama"},{name:"Supernatural"},{name:"Romance"}], tmdb:{vote_average:9.5}, type:"series", content:"Hành trình ở cõi hoàng tuyền." },
  { _id:"12", name:"Ghost Concert: Missing Songs", slug:"ghost-concert-missing-songs", thumb_url:"https://cdn.myanimelist.net/images/anime/1765/146557l.jpg", lang:"Vietsub", episode_current:"1", episode_total:"1", year:2026, category:[{name:"Hoạt Hình"},{name:"Mystery"},{name:"Horror"},{name:"Supernatural"}], tmdb:{vote_average:6.8}, type:"single", content:"Buổi hòa nhạc ma ám." },
];

const GENRES_LIST = [
  "Action", "Comedy", "Romance", "Fantasy", "Horror",
  "Slice of Life", "Sci-Fi", "Drama", "Mystery", "Adventure",
  "Supernatural", "Mecha", "Isekai", "Magic", "Thriller"
];

const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "series", label: "Anime bộ" },
  { key: "movie", label: "Anime lẻ" },
  { key: "china", label: "Hoạt hình Trung Quốc" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function LazyImg({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const fallback = `https://placehold.co/300x420/1f2937/6b7280?text=${encodeURIComponent(alt?.slice(0, 8) || "Anime")}`;
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

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// ─── ANIME CARD ──────────────────────────────────────────────────────────────
function AnimeCard({ anime, onMovieClick }) {
  const [hovered, setHovered] = useState(false);
  const src = anime.thumb_url || anime.poster_url || anime.thumbnail || anime.img || "";
  const title = anime.name || anime.title || "";
  const rating = anime.tmdb?.vote_average || anime.rating || 0;
  const epLabel = anime.episode_current ? `TẬP ${anime.episode_current}` : anime.ep ? `TẬP ${anime.ep}` : null;
  const slug = anime.slug || "";

  return (
    <div
      className="relative shrink-0 cursor-pointer group"
      style={{ width: 140, overflow: "visible" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onMovieClick && onMovieClick(slug)}
    >
      <div className="relative overflow-hidden w-[140px] h-[210px]" style={{ borderRadius: 8 }}>
        <LazyImg src={src} alt={title} className="w-full h-full" />
        <div className={`absolute inset-0 transition-all duration-200 ease-in-out ${hovered ? "bg-black/50" : "bg-transparent"}`} />
        {rating > 0 && (
          <div className="rating-ribbon">
            <Star className="star-icon" />
            <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
          </div>
        )}
        {epLabel && (
          <div className="ep-circle-badge">
            <span className="ep-circle-label">TẬP</span>
            <span className="ep-circle-number">{(anime.episode_current || anime.ep || "").slice(0,4)}</span>
          </div>
        )}
        {anime.lang === "Vietsub" && !epLabel && (
          <div className="absolute top-1 right-1 z-10">
            <span className="bg-green-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">Vietsub</span>
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/70 border-2 border-white flex items-center justify-center" style={{ animation: "zoomIn 0.2s ease-out forwards" }}>
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 px-0.5" style={{ width: 140 }}>
        <p className="text-white text-[11px] font-medium leading-tight truncate group-hover:text-[#e50914] transition-colors">{title}</p>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-yellow-500 text-[10px] font-medium">{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
          </div>
        )}
        {anime.lang === "Vietsub" && (
          <span className="inline-block bg-green-600/20 text-green-400 text-[9px] font-bold px-1 py-0.5 rounded mt-0.5">Vietsub</span>
        )}
      </div>
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-gray-500 rounded-full" />
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          <span className="text-white font-bold text-sm uppercase tracking-wider">{title}</span>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR WIDGET ───────────────────────────────────────────────────────────
function SidebarWidget({ title, icon: Icon, children }) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a2a] p-4 mb-4" style={{ borderRadius: 8 }}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2a2a2a]">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-white font-bold text-sm uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function AnimatedLogo() {
  const [showVideo, setShowVideo] = useState(true);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  function handleVideoEnded() {
    setShowVideo(false);
    // Sau 5 giây chuyển lại sang video
    timerRef.current = setTimeout(() => {
      setShowVideo(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, 5000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative h-10 w-auto flex-shrink-0 rounded overflow-hidden" style={{ width: 80, height: 40, background: "#000" }}>
      <video
        ref={videoRef}
        src="/hung.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${showVideo ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <img
        src="/logo.jpg"
        alt="Logo"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${showVideo ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      />
    </div>
  );
}

function Header({ dark, setDark, activeGenre, onGenreSelect }) {
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-[#2a2a2a]">
      <div className="max-w-[1150px] mx-auto px-4 h-14 flex items-center gap-4">
        <div className="flex items-center flex-shrink-0">
          <AnimatedLogo />
        </div>
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {[
            { label: "Trang Chủ", icon: Home },
            { label: "Thể Loại", icon: Grid, hasDropdown: true },
            { label: "Top Anime", icon: TrendingUp },
            { label: "Lịch Chiếu", icon: Calendar },
          ].map(({ label, icon: Icon, hasDropdown }) => (
            <div key={label} className="group relative">
              <button className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] text-xs font-medium transition-all" style={{ borderRadius: 4 }}>
                <Icon className="w-3 h-3" /> {label}
              </button>
              {hasDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1a2e] border border-[#2a2a2a] shadow-2xl z-50 hidden group-hover:block" style={{ borderRadius: 4 }}>
                  <div className="grid grid-cols-3 gap-1 p-3">
                    {GENRES_LIST.map((g) => (
                      <button key={g} onClick={() => onGenreSelect(g)}
                        className={`text-[11px] py-1.5 px-2 text-left transition-colors ${activeGenre === g ? "bg-[#e50914] text-white" : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"}`}
                        style={{ borderRadius: 4 }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm anime..."
              className="w-full bg-[#1c1c1c] border border-[#2a2a2a] pl-9 pr-3 py-2 text-gray-300 text-xs placeholder-gray-600 focus:outline-none focus:border-gray-500/50 focus:bg-[#1c1c1c] transition-all" style={{ borderRadius: 4 }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(!dark)} className="p-2 text-gray-400 hover:text-gray-300 hover:bg-[#2a2a2a] transition-all" style={{ borderRadius: 4 }}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="hidden md:flex items-center gap-1.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-semibold px-3 py-1.5 transition-colors" style={{ borderRadius: 4 }}>
            Đăng nhập
          </button>
          <button className="md:hidden p-2 text-gray-400" onClick={() => setMenu(!menu)}>
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── NEW UPDATED SECTION ──────────────────────────────────────────────────────
function NewUpdatedSection({ anime, activeTab, onTabChange, onMovieClick }) {
  return (
    <section className="mb-8 mt-6">
      <div className="flex items-center flex-wrap gap-3 mb-4">
        <button className="flex items-center gap-1.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold px-4 py-1.5 transition-colors" style={{ borderRadius: 4 }}>
          🔔 MỚI CẬP NHẬT <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-0 ml-2">
          {FILTER_TABS.map((tab) => (
            <button key={tab.key} onClick={() => onTabChange(tab.key)}
              className={`text-xs px-3 py-1.5 transition-all ${activeTab === tab.key ? "text-white font-bold border-b-2 border-[#e50914]" : "text-gray-400 hover:text-white border-b-2 border-transparent"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {anime.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          <p>Không tìm thấy phim nào.</p>
          <p className="mt-1">Thử thay đổi bộ lọc.</p>
        </div>
      ) : (
        <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {anime.map((item, idx) => (
            <AnimeCard key={item._id || item.slug || idx} anime={item} onMovieClick={onMovieClick} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#0d0d1a]">
      <div className="max-w-[1150px] mx-auto px-4 py-8">
        {/* Tầng 1: Menu điều hướng */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
          {["Xem Phim", "Góp ý", "Liên hệ", "Điều khoản sử dụng"].map((l) => (
            <button key={l} className="text-gray-500 hover:text-gray-300 text-xs transition-colors font-medium">{l}</button>
          ))}
        </div>

        {/* Tầng 2: Vách ngăn + nội dung Miễn trừ trách nhiệm */}
        <div className="relative mb-6 pt-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-gray-700" />
          <div className="max-w-2xl mx-auto text-left text-gray-500 text-[11px] leading-relaxed space-y-3">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider text-center mb-4">Miễn trừ trách nhiệm và Bản quyền</p>
            <p>Website này được xây dựng bởi cá nhân với mục đích chia sẻ và giải trí thuần túy. Chúng tôi không lưu trữ, sở hữu hay phát hành bất kỳ tệp tin video nào trực tiếp trên máy chủ. Mọi nội dung hiển thị đều được tổng hợp từ các nguồn công khai trên Internet.</p>
            <p>Chúng tôi tôn trọng quyền sở hữu trí tuệ của các đơn vị sản xuất và các nền tảng phát hành chính thống. Nếu bạn là chủ sở hữu bản quyền hoặc đại diện hợp pháp và phát hiện nội dung có liên quan đến bản quyền của mình bị hiển thị tại đây, xin vui lòng liên hệ qua email: <a href="mailto:hnggiahung@gmail.com" className="text-violet-400 hover:text-violet-300 underline transition-colors">hnggiahung@gmail.com</a>. Chúng tôi cam kết sẽ xem xét và gỡ bỏ nội dung vi phạm trong thời gian sớm nhất.</p>
            <p>Lưu ý: Trang web này hoạt động phi lợi nhuận, không phục vụ mục đích thương mại, không quảng cáo cờ bạc, cá độ hoặc các nội dung vi phạm pháp luật dưới mọi hình thức.</p>
          </div>
        </div>

        {/* Tầng 3: Thông tin */}
        <div className="text-center pt-3">
          <p className="text-gray-700 text-[10px]">© 2026 Dự án cá nhân | Phát triển bởi Gia Hưng</p>
        </div>
      </div>
    </footer>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(true);
  const [activeGenre, setActiveGenre] = useState(null);
  const [filterTab, setFilterTab] = useState("all");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [selectedSlugForDetail, setSelectedSlugForDetail] = useState(null); // Tầng 2: MovieDetail
  const [searchQuery, setSearchQuery] = useState("");

  // ─── FETCH FROM OPHIM API (with fallback) ─────────────────────────────────
  const {
    data: apiData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["animeList", 1],
    queryFn: () => fetchMovieList(1),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Use API data if available, otherwise use fallback mock data
  const allItems = useMemo(() => {
    if (apiData?.items && Array.isArray(apiData.items) && apiData.items.length > 0) {
      console.log("✅ Using API data:", apiData.items.length, "items");
      return apiData.items;
    }
    console.log("📦 Using fallback mock data");
    return FALLBACK_MOVIES;
  }, [apiData]);

  // Filter only Anime + Vietsub
  const animeVietsubList = useMemo(() => {
    return filterAnimeList(allItems);
  }, [allItems]);

  // If filter returns empty, use all items as fallback
  const displayList = useMemo(() => {
    if (animeVietsubList.length > 0) return animeVietsubList;
    return allItems;
  }, [animeVietsubList, allItems]);

  const carouselItems = useMemo(() => allItems.slice(0, 10), [allItems]);
  const featuredMovie = useMemo(() => {
    if (displayList.length > 0) return displayList[0];
    if (allItems.length > 0) return allItems[0];
    return null;
  }, [displayList, allItems]);

  // Filter logic
  const filteredAnime = useMemo(() => {
    let list = [...displayList];
    if (activeGenre) {
      list = list.filter((item) => item.category?.some((cat) => cat.name === activeGenre));
    }
    if (filterTab === "series") list = list.filter((item) => item.type === "series");
    else if (filterTab === "movie") list = list.filter((item) => item.type === "single");
    else if (filterTab === "china") {
      list = list.filter((item) => item.country?.some((c) => c.name === "Trung Quốc" || c.name === "China"));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => (item.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [displayList, activeGenre, filterTab, searchQuery]);

  // Handle WatchPage navigation (Tầng 3)
  function handleWatchMovie(slug) {
    if (slug) {
      setSelectedSlug(slug);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Handle click from Homepage (Tầng 1 → Tầng 2: MovieDetail)
  function handleMovieClick(slugOrId) {
    if (typeof slugOrId === "string" && slugOrId.length > 0) {
      setSelectedSlugForDetail(slugOrId);
    } else {
      setSelectedMovieId(slugOrId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle click from Sidebar (go directly to WatchPage Tầng 3)
  function handleSidebarClick(slug) {
    if (slug) {
      setSelectedSlug(slug);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBackToHome() {
    setSelectedMovieId(null);
    setSelectedSlug(null);
    setSelectedSlugForDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleMovieDetailBack() {
    setSelectedSlugForDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Build movie object for MovieDetail from slug
  const detailMovie = useMemo(() => {
    if (!selectedSlugForDetail) return null;
    const found = allItems.find((a) => a.slug === selectedSlugForDetail);
    if (!found) return null;
    return {
      id: found._id || found.slug,
      title: found.name || found.title,
      subtitle: found.category ? found.category.map((c) => c.name).join(" · ") : "Anime",
      coverImage: found.thumb_url || found.poster_url,
      rating: found.tmdb?.vote_average || found.rating || 8.5,
      viewCount: 100000,
      year: found.year,
      status: found.episode_current && found.episode_total ? "Đang phát sóng" : "Hoàn thành",
      episodeCount: `${found.episode_current || "?"}/${found.episode_total || "??"}`,
      quality: found.quality || "HD",
      language: found.lang === "Vietsub" ? "Vietsub" : "Thuyết minh",
      studio: "Đang cập nhật",
      director: "Đang cập nhật",
      country: found.country ? found.country.map((c) => c.name).join(", ") : "Nhật Bản",
      genres: found.category ? found.category.map((c) => c.name) : [],
      synopsis: found.content || `${found.name} là một bộ anime hấp dẫn.`,
      slug: found.slug,
      seasons: [
        {
          id: 1,
          label: "All Episodes",
          episodes: Array.from({ length: Math.min(parseInt(found.episode_current) || 12, 24) }, (_, i) => ({
            number: i + 1,
            isAvailable: true,
          })),
        },
      ],
      relatedMovies: allItems.slice(0, 8).map((c) => ({
        id: c._id || c.slug,
        title: c.name || c.title,
        thumbnail: c.thumb_url || c.poster_url,
        rating: c.tmdb?.vote_average || c.rating || 0,
        slug: c.slug,
      })),
      comments: [],
    };
  }, [selectedSlugForDetail, allItems]);

  // ─── ROUTING ───────────────────────────────────────────────────────────────
  // Tầng 3: WatchPage (phát video) - wrapped with ErrorBoundary
  if (selectedSlug) {
    return (
      <ErrorBoundary onBack={handleBackToHome}>
        <WatchPage
          slug={selectedSlug}
          onBack={handleBackToHome}
          onMovieClick={(s) => typeof s === "string" ? handleWatchMovie(s) : handleMovieClick(s)}
          isLoggedIn={false}
        />
      </ErrorBoundary>
    );
  }

  // Tầng 2: MovieDetail (thông tin phim + tập, có nút "Xem Phim" để qua Tầng 3) - WRAPPED WITH ERRORBOUNDARY
  if (selectedSlugForDetail) {
    // Nếu không tìm thấy dữ liệu phim trong allItems, thử navigate trực tiếp đến WatchPage
    if (!detailMovie) {
      return (
        <ErrorBoundary onBack={handleBackToHome}>
          <WatchPage
            slug={selectedSlugForDetail}
            onBack={handleBackToHome}
            onMovieClick={(s) => typeof s === "string" ? handleWatchMovie(s) : handleMovieClick(s)}
            isLoggedIn={false}
          />
        </ErrorBoundary>
      );
    }
    return (
      <ErrorBoundary onBack={handleBackToHome}>
        <div className="min-h-screen bg-neutral-950">
          <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800">
            <div className="max-w-[1150px] mx-auto px-4 h-14 flex items-center gap-4">
              <button onClick={handleMovieDetailBack} className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>
              <div className="flex items-center gap-2 ml-4">
                <img src="/logo.jpg" alt="Logo" className="h-8 w-auto" />
              </div>
            </div>
          </div>
          <MovieDetail
            movie={detailMovie}
            isLoggedIn={false}
            onEpisodeSelect={(seasonId, epNumber) => handleWatchMovie(selectedSlugForDetail)}
            onMovieClick={(id) => {
              // Khi click phim liên quan, tìm slug từ id
              const found = allItems.find((a) => a._id === id || a.slug === id);
              if (found) handleMovieClick(found.slug);
            }}
            accentColor="lime-400"
            onWatchMovie={() => handleWatchMovie(selectedSlugForDetail)}
          />
        </div>
      </ErrorBoundary>
    );
  }

  // ─── HOMEPAGE ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white font-sans relative">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background-color: #0a0a12; }
        .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .line-clamp-3 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#111; }
        ::-webkit-scrollbar-thumb { background:#444; border-radius:4px; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        img { display:block; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .animate-pulse { animation:pulse 1.5s ease-in-out infinite; }
        @keyframes zoomIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        /* OVERRIDE: Khi HeroBannerSlider nằm trong flex container, bỏ max-w-7xl và mx-auto */
        .banner-flex-wrapper .banner-wrapper { max-width: none !important; margin-left: 0 !important; margin-right: 0 !important; padding-left: 0 !important; padding-right: 0 !important; }

        /* ═══ VIDEO BACKGROUND ═══ */
        #bg-video {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          z-index: 0;
        }
        .bg-video-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.55);
          z-index: 1;
        }

        /* ═══ GLASSMORPHISM ═══ */
        .main-container {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          background: rgba(20, 20, 31, 0.75) !important;
          border-left: 1px solid rgba(255,255,255,0.06);
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .glass-card {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          background: rgba(26, 26, 46, 0.6) !important;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* ═══ RATING RIBBON BADGE (góc trái trên) ═══ */
        .rating-ribbon {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 10;
          background: rgba(0,0,0,0.75);
          clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
          padding: 3px 7px 6px 5px;
          display: flex;
          align-items: center;
          gap: 2px;
          color: white;
          font-weight: 700;
          font-size: 9px;
          line-height: 1;
        }
        .rating-ribbon .star-icon {
          color: #f5c518;
          fill: #f5c518;
          width: 9px;
          height: 9px;
        }

        /* ═══ EPISODE CIRCLE BADGE (góc phải trên) ═══ */
        .ep-circle-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #d82b2b;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
          font-weight: 700;
          line-height: 1.1;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .ep-circle-label {
          font-size: 6px;
          letter-spacing: 0.3px;
          margin-top: 1px;
        }
        .ep-circle-number {
          font-size: 11px;
        }
      `}</style>

      <Header dark={dark} setDark={setDark} activeGenre={activeGenre} onGenreSelect={setActiveGenre} />

      {/* API loading indicator (nhỏ, không block UI) */}
      {isLoading && (
        <div className="bg-blue-900/30 border-b border-blue-800/30 py-1.5 text-center">
          <span className="text-blue-400 text-[10px] flex items-center justify-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang đồng bộ dữ liệu từ Ophim...
          </span>
        </div>
      )}

      {/* API error warning (nhỏ, không block UI) */}
      {isError && !isLoading && (
        <div className="bg-amber-900/30 border-b border-amber-800/30 py-1.5 text-center">
          <span className="text-amber-400 text-[10px] flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Không thể kết nối Ophim, đang dùng dữ liệu dự phòng
          </span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MAIN CONTAINER - Bọc toàn bộ nội dung, max-width 1150px, màu nền riêng
          ════════════════════════════════════════════════════════ */}
      <div className="main-container mx-auto w-full max-w-[1150px] bg-[#14141f] px-4 md:px-5 py-5" style={{ minHeight: "70vh" }}>

        {/* ─── TOP CAROUSEL: Danh sách poster phim (ngang) ─── */}
        <div className="top-carousel mb-5 overflow-hidden">
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {allItems.slice(0, 12).map((item, idx) => {
              const src = item.thumb_url || item.poster_url || item.thumbnail || "";
              const title = item.name || item.title || "";
              const rating = item.tmdb?.vote_average || item.rating || 0;
              const ep = item.episode_current || "";
              const slug = item.slug || "";
              return (
                <div key={item._id || item.slug || idx} className="flex-shrink-0 cursor-pointer group" style={{ width: 78 }} onClick={() => handleMovieClick(slug)}>
                  <div className="relative overflow-hidden rounded-lg" style={{ width: 78, height: 110, aspectRatio: "2/3" }}>
                    <LazyImg src={src} alt={title} className="w-full h-full" />
                    {rating > 0 && (
                      <div className="absolute top-0 left-0 z-10" style={{background:"rgba(0,0,0,0.75)", clipPath:"polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)", padding:"2px 5px 5px 3px", display:"flex", alignItems:"center", gap:"1px", color:"white", fontWeight:700, fontSize:"7px", lineHeight:1}}>
                        <Star className="w-[7px] h-[7px] text-yellow-400 fill-yellow-400" />
                        <span>{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
                      </div>
                    )}
                    {ep && (
                      <div className="absolute top-1 right-1 z-10" style={{width:"26px", height:"26px", borderRadius:"50%", background:"#d82b2b", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", color:"white", fontWeight:700, lineHeight:1, boxShadow:"0 1px 3px rgba(0,0,0,0.4)"}}>
                        <span style={{fontSize:"4.5px", letterSpacing:"0.2px"}}>TẬP</span>
                        <span style={{fontSize:"7px"}}>{ep.slice(0,3)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/70 border-2 border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-[10px] mt-1 leading-tight line-clamp-2 group-hover:text-[#e50914] transition-colors">{title}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── MAIN CONTENT: 2-Column Layout (70% left + 30% right) ─── */}
        <div className="main-content-grid flex flex-col lg:flex-row gap-5 w-full">
          
          {/* ═══ LEFT COLUMN (70%) ═══ */}
          <div className="w-full lg:w-[70%] min-w-0">
            {/* Banner Hero Slider */}
            <div className="banner-flex-wrapper w-full mb-5 overflow-hidden rounded-xl">
              <HeroBannerSlider items={allItems} />
            </div>

            {/* Nội dung chính: AnimeGrid + comments */}
            <div className="flex-1 min-w-0">
              {activeGenre && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gray-400 text-xs">Đang lọc:</span>
                  <span className="inline-flex items-center gap-1 bg-[#e50914]/20 text-[#e50914] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#e50914]/30">
                    {activeGenre}
                    <button onClick={() => setActiveGenre(null)} className="hover:bg-[#e50914]/30 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </span>
                </div>
              )}
              <NewUpdatedSection anime={filteredAnime} activeTab={filterTab} onTabChange={setFilterTab} onMovieClick={handleMovieClick} />
            </div>
          </div>

          {/* ═══ RIGHT COLUMN (30%) - Sidebar ═══ */}
          <div className="w-full lg:w-[30%] shrink-0">
            <aside className="space-y-4 lg:sticky lg:top-20">
              
              {/* Hôm Nay Xem Gì Widget */}
              <div className="bg-[#1a1a2e] border border-[#2a2a2a] overflow-hidden" style={{ borderRadius: 8 }}>
                <div className="p-4 pb-3 border-b border-[#2a2a2a]">
                  <div className="flex items-center gap-2 mb-3">
                    <Shuffle className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-bold text-sm uppercase tracking-wider">Hôm Nay Xem Gì?</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-3 leading-relaxed">Nếu bạn không biết xem gì hôm nay, hãy để chúng tôi chọn cho bạn.</p>
                  <a href="https://www.facebook.com/share/1VUiy5vr5e/" target="_blank" rel="noopener noreferrer" className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold py-2.5 transition-all flex items-center justify-center gap-2" style={{ borderRadius: 4, boxShadow: "0 2px 10px rgba(185,28,28,0.2)" }}>
                    <Shuffle className="w-3.5 h-3.5" /> Fanpage chính thức
                  </a>
                </div>
                <div className="aspect-[4/3]">
                  <video className="w-full h-full object-cover" poster="https://placehold.co/400x300/1c1c1c/6b7280?text=Video+Trailer" autoPlay muted loop playsInline>
                    <source src="/trailer.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>

              {/* Anime Mới Cập Nhật (Sidebar) */}
              <SidebarWidget title="Anime Mới Cập Nhật" icon={Bell}>
                <div className="space-y-2">
                  {allItems.slice(0, 10).map((item, i) => (
                    <div key={item._id || i} className="flex items-center justify-between group cursor-pointer" onClick={() => handleMovieClick(item.slug)}>
                       <span className="text-gray-400 group-hover:text-gray-300 text-xs transition-colors truncate flex-1 pr-2">{item.name || item.title}</span>
                       <span className="text-gray-500 text-[10px] bg-gray-800 px-1.5 py-0.5 flex-shrink-0" style={{ borderRadius: 2 }}>
                         {item.episode_current ? `Tập ${item.episode_current}` : item.lang || ""}
                       </span>
                     </div>
                  ))}
                </div>
              </SidebarWidget>

              {/* Hot Tuần (Sidebar) */}
              <SidebarWidget title="Hot Tuần" icon={TrendingUp}>
                <div className="space-y-3">
                  {allItems.slice(0, 5).map((item, i) => {
                    const src = item.thumb_url || item.poster_url;
                    const title = item.name || item.title;
                    const ep = item.episode_current ? `${item.episode_current}/${item.episode_total || "??"}` : "";
                    return (
                      <div key={item._id || i} className="flex items-center gap-2.5 group cursor-pointer" onClick={() => handleMovieClick(item.slug)}>
                        <span className={`text-lg font-black w-6 text-center flex-shrink-0 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>{i + 1}</span>
                        <div className="w-9 h-12 overflow-hidden flex-shrink-0" style={{ borderRadius: 4 }}>
                          {src && <LazyImg src={src} alt={title} className="w-full h-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 group-hover:text-gray-100 text-xs font-medium line-clamp-2 transition-colors leading-tight">{title}</p>
                          {ep && <p className="text-gray-600 text-[10px] mt-0.5">{ep}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SidebarWidget>

              {/* Banner quảng cáo / Discord */}
              <div className="bg-[#1a1a2e] border border-[#2a2a2a] overflow-hidden" style={{ borderRadius: 8 }}>
                <div className="aspect-[16/9] bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex flex-col items-center justify-center p-4 text-center">
                  <img src="https://cdn.prod.website-files.com/6257adef93867e50d84b30e2/663e6e3e9f6bda4c7adf3bd2_2c17a67e.svg" alt="Discord" className="w-12 h-12 mb-2 brightness-0 invert" />
                  <p className="text-white text-xs font-bold mb-1">Tham gia Discord!</p>
                  <p className="text-white/70 text-[10px] mb-3">Cùng thảo luận anime mỗi ngày</p>
                  <button className="bg-white text-[#5865F2] text-[10px] font-bold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">Join Now</button>
                </div>
              </div>

              {/* Bình Luận Mới (Sidebar) */}
              <SidebarWidget title="Bình Luận Mới" icon={MessageCircle}>
                <div className="text-center py-6 text-gray-600 text-xs">Đăng nhập để xem bình luận mới nhất</div>
              </SidebarWidget>
            </aside>
          </div>

        </div>
      </div>
      {/* ═══════════════════════════ END MAIN CONTAINER ═══════════════════════ */}

      <Footer />
    </div>
  );
}