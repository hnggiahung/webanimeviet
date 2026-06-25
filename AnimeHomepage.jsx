import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Moon, Sun, Play, Star, Eye, Bell, ChevronRight,
  Home, Film, Grid, Calendar, BookOpen, TrendingUp, MessageCircle, Send,
  Clock, Shuffle, Youtube, Facebook, Twitter, Heart, Menu, X,
  Volume2, Maximize, Info, Loader2, AlertTriangle
} from "lucide-react";
import { fetchMovieList, filterAnimeList, normalizeMovieData, isJapaneseAnime } from "./src/services/ophimApi";
import HeroBannerSlider from "./src/components/HeroBannerSlider";

// ─── DEFAULT FALLBACK DATA ──────────────────────────────────────────────────
const DEFAULT_FALLBACK = {
  title: "One Piece – Đảo Hải Tặc",
  altTitle: "One Piece",
  rating: 9.3,
  episodes: "1167/??",
  year: 1999,
  season: "Đang phát sóng",
  studio: "Toei Animation",
  status: "Đang phát sóng",
  tags: ["Action", "Adventure", "Comedy", "Fantasy"],
  synopsis: "Câu chuyện về băng Mũ Rơm trên hành trình tìm kho báu One Piece.",
  poster: "https://cdn.myanimelist.net/images/anime/6/73245l.jpg",
  trailer: "/trailer.mp4",
};

const DEFAULT_EPISODES = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  title: `Tập ${i + 1}`,
  duration: `${23 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
  thumbnail: `https://placehold.co/320x180/1e1e2e/6366f1?text=EP+${i + 1}`,
  isWatched: i < 8,
  releaseDate: i < 2 ? "Hôm nay" : i < 5 ? "Hôm qua" : `${i - 1} ngày trước`,
}));

const DEFAULT_COMMENTS = [
  { id:1, user:"Thành Bế Văn", avatar:"T", time:"1 phút trước", text:"phim này có ra ss2 kh mn ơi", likes:12,
    replies:[{ id:101, user:"Hoàng Nhẫn [HAE]", avatar:"H", time:"5 phút trước", text:"Có bạn ơi, đang chiếu mùa 4 rồi!", likes:5 }] },
  { id:2, user:"Hoàng Nhẫn [HAE]", avatar:"H", time:"14 phút trước", text:"cái bà là nó húp sạch năng lượng không lỗ như thế mà ko bị quá tải ms bá", likes:24, replies:[] },
  { id:3, user:"Hyun_?!?!", avatar:"H", time:"1 giờ trước", text:"mn cho mình xin vài bộ romcom buồn vs ạ :]]", likes:8,
    replies:[{ id:102, user:"Kubo Nagisa", avatar:"K", time:"2 giờ trước", text:"Your Lie in April, Anohana, Clannad...", likes:15 }] },
  { id:4, user:"Kubo Nagisa", avatar:"K", time:"2 giờ trước", text:"mong admin khôi phục tính năng chụp ảnh trực tiếp", likes:32, replies:[] },
  { id:5, user:"thanhpham2079", avatar:"T", time:"5 giờ trước", text:"SPOILER — click để xem", likes:3, replies:[] },
  { id:6, user:"AnimeLover123", avatar:"A", time:"8 giờ trước", text:"Hay quá admin ơi, mong ra tập mới nhanh hơn!", likes:18, replies:[] },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function LazyImg({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const fallback = `https://placehold.co/300x420/1f2937/6366f1?text=${encodeURIComponent(alt?.slice(0,8)||"Anime")}`;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
      <img
        src={err ? fallback : src} alt={alt} loading="lazy" decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setErr(true); setLoaded(true); }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}



// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ dark, setDark, onSearch }) {
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState(false);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    if (onSearch) onSearch(value);
  }

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-white font-black text-base tracking-tight">
            Anime<span className="text-violet-400">VietSub</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {[
            { label:"Trang Chủ", icon:Home },
            { label:"Thể Loại", icon:Grid },
            { label:"Top Anime", icon:TrendingUp },
            { label:"Lịch Chiếu", icon:Calendar },
          ]?.map(({ label, icon: Icon }) => (
            <button key={label} className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg text-xs font-medium transition-all">
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search} onChange={handleSearchChange}
              placeholder="Tìm anime..."
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl pl-9 pr-3 py-2 text-gray-300 text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-gray-800 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setDark(!dark)} className="p-2 text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="hidden md:flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors">
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

// ─── VIDEO PLAYER ─────────────────────────────────────────────────────────────
function VideoPlayer({ src, poster }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden group shadow-2xl shadow-black/50">
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <video
          src={src}
          poster={poster}
          className="w-full h-full object-contain bg-black"
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-violet-500/40 transition-transform hover:scale-110 cursor-pointer">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
          </div>
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-violet-600 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">Tập 1</span>
          <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-[10px] md:text-xs px-2.5 py-1 rounded-lg">24:35</span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">FHD</span>
          <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-[10px] px-2 py-0.5 rounded-lg">1080p</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-full h-1 bg-gray-700/60 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: "35%" }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <button className="text-white hover:text-violet-300 transition-colors">
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-white" />
              </button>
              <button className="text-white/70 hover:text-white transition-colors">
                <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <span className="text-white/60 text-[10px] md:text-xs font-mono">8:36 / 24:35</span>
            </div>
            <button className="text-white/70 hover:text-white transition-colors">
              <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MOVIE INFO SECTION ───────────────────────────────────────────────────────
function MovieInfo({ info }) {
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
        <div className="w-24 h-32 md:w-28 md:h-38 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/40">
          <LazyImg src={info?.poster} alt={info?.title} className="w-full h-full" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg md:text-2xl leading-tight mb-1">{info?.title}</h1>
          <p className="text-gray-500 text-xs mb-3">{info?.altTitle}</p>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2 py-0.5">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-xs font-bold">{info?.rating}</span>
            </div>
            <span className="text-gray-400 text-xs">{info?.episodes} tập</span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-gray-400 text-xs">{info?.year}</span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-gray-400 text-xs">{info?.season}</span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-green-400 text-xs font-semibold">{info?.status}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-gray-500 text-xs">🎬 Studio: <span className="text-gray-300">{info?.studio}</span></span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(info?.tags || []).map(t => (
              <span key={t} className="bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px] px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105">
          <Play className="w-3.5 h-3.5 fill-white" /> Xem Ngay
        </button>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all border border-white/10">
          <Heart className="w-3.5 h-3.5" /> Yêu thích
        </button>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all border border-white/10">
          <Bell className="w-3.5 h-3.5" /> Theo dõi
        </button>
      </div>

      <div className="border-t border-gray-800/60 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Nội Dung</span>
        </div>
        <p className={`text-gray-400 text-xs leading-relaxed ${showFullSynopsis ? "" : "line-clamp-3"}`}>{info?.synopsis}</p>
        <button onClick={() => setShowFullSynopsis(!showFullSynopsis)} className="text-violet-400 hover:text-violet-300 text-[10px] font-medium mt-1 transition-colors">
          {showFullSynopsis ? "Thu gọn" : "Xem thêm"}
        </button>
      </div>

      <div className="border-t border-gray-800/60 pt-3 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Server:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Server #1 (VIP)", "Server #2 (HD)", "Server #3 (SD)"].map(s => (
            <button key={s} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
              s.includes("VIP")
                ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
                : "bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200"
            }`}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EPISODE LIST ─────────────────────────────────────────────────────────────
function EpisodeList({ episodes, currentEp }) {
  const [viewMode, setViewMode] = useState("list");

  const safeEpisodes = Array.isArray(episodes) ? episodes : [];

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-violet-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Danh Sách Tập</h3>
          <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{safeEpisodes.length}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
          <button onClick={() => setViewMode("list")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${viewMode === "list" ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>DS</button>
          <button onClick={() => setViewMode("grid")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${viewMode === "grid" ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>Ô</button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/40">
        <span className="text-gray-500 text-[10px]">Đang xem: <span className="text-violet-400 font-semibold">Tập {currentEp}</span></span>
        <div className="flex items-center gap-1.5">
          <button className="text-gray-500 hover:text-violet-400 text-[10px] transition-colors px-2 py-0.5 bg-gray-800/40 rounded-md">Mới nhất</button>
          <button className="text-gray-500 hover:text-violet-400 text-[10px] transition-colors px-2 py-0.5 bg-gray-800/40 rounded-md">Chưa xem</button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
        {viewMode === "list" ? (
          <div className="divide-y divide-gray-800/40">
            {safeEpisodes.map((ep) => (
              <div key={ep.id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 ${
                  ep.number === currentEp
                    ? "bg-violet-600/10 border-l-2 border-violet-500"
                    : "hover:bg-gray-800/40 border-l-2 border-transparent"
                }`}>
                <div className="relative w-20 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                  <img src={ep.thumbnail} alt={`Tập ${ep.number}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${ep.number === currentEp ? "text-violet-300" : "text-gray-300"}`}>{ep.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-gray-600 text-[10px]"><Clock className="w-2.5 h-2.5" />{ep.duration}</span>
                    <span className="text-gray-600 text-[10px]">{ep.releaseDate}</span>
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ep.number === currentEp ? "bg-violet-600" : "bg-gray-800"
                }`}>
                  {ep.number === currentEp
                    ? <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    : <Play className="w-3 h-3 text-gray-600" />
                  }
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-4">
            {safeEpisodes.map((ep) => (
              <div key={ep.id}
                className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer group transition-all duration-200 ${
                  ep.number === currentEp ? "ring-2 ring-violet-500" : ""
                }`}>
                <img src={ep.thumbnail} alt={`Tập ${ep.number}`} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center">
                  {ep.number === currentEp
                    ? <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"><Play className="w-4 h-4 text-white fill-white ml-0.5" /></div>
                    : <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{ep.number}</span>
                  }
                </div>
                <div className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${ep.number === currentEp ? "bg-violet-600 text-white" : "bg-black/60 text-gray-300"}`}>{ep.number}</div>
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded">{ep.duration}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMMENTS SECTION ─────────────────────────────────────────────────────────
function CommentsSection({ comments: propComments }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(propComments || DEFAULT_COMMENTS);
  const [sortBy, setSortBy] = useState("newest");

  const safeComments = comments || [];
  const sortedComments = [...safeComments].sort((a, b) =>
    sortBy === "newest" ? b.id - a.id : a.id - b.id
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([{
      id: Date.now(), user: "Bạn", avatar: "B", time: "Vừa xong",
      text: newComment.trim(), likes: 0, replies: []
    }, ...safeComments]);
    setNewComment("");
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-violet-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Bình Luận</h3>
          <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{safeComments.length}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
          <button onClick={() => setSortBy("newest")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${sortBy === "newest" ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>Mới nhất</button>
          <button onClick={() => setSortBy("oldest")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${sortBy === "oldest" ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>Cũ nhất</button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-800/40">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">B</div>
          <div className="flex-1 relative">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Viết bình luận..." rows={2}
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-2 text-gray-300 text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-gray-800 transition-all resize-none" />
            <button type="submit" disabled={!newComment.trim()}
              className="absolute bottom-2 right-2 p-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </form>
      </div>

      <div className="divide-y divide-gray-800/40">
        {sortedComments.map(comment => (
          <div key={comment.id} className="p-4 hover:bg-gray-800/20 transition-colors">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-lg shadow-violet-500/20">{comment.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-200 text-xs font-semibold">{comment.user}</span>
                  <span className="text-gray-600 text-[10px]">{comment.time}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-2">{comment.text}</p>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-violet-400 text-[10px] transition-colors">
                    👍 <span>{Number(comment.likes) > 0 ? Number(comment.likes) : "Thích"}</span>
                  </button>
                  <button className="text-gray-600 hover:text-violet-400 text-[10px] transition-colors">Trả lời</button>
                </div>
                {(comment.replies?.length > 0) && (
                  <div className="mt-3 ml-2 pl-3 border-l-2 border-gray-800/60 space-y-3">
                    {(comment.replies || []).map(reply => (
                      <div key={reply.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold">{reply.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-gray-200 text-[11px] font-semibold">{reply.user}</span>
                            <span className="text-gray-600 text-[9px]">{reply.time}</span>
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <input placeholder="Viết trả lời..." className="w-full bg-gray-800/40 border border-gray-700/30 rounded-lg px-2.5 py-1.5 text-gray-400 text-[11px] placeholder-gray-600 focus:outline-none focus:border-violet-500/30 transition-all" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-800/60 py-8">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-gray-400 font-bold text-sm">Anime<span className="text-violet-400">VietSub</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {["Xem Phim", "Donate ♥", "Chat Anime/Discord", "Thuật Ngữ", "Group Thảo Luận"].map(l => (
              <button key={l} className="hover:text-violet-400 transition-colors">{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {[Facebook, Twitter, Youtube].map((Icon, i) => (
              <button key={i} className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-violet-600 flex items-center justify-center transition-colors group">
                <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800/40 text-center">
          <p className="text-gray-700 text-[11px]">© Copyright 2026 AnimeVietSub.TV. All rights reserved.</p>
          <p className="text-gray-800 text-[10px] mt-1">Trang web cung cấp nội dung anime chỉ với mục đích giải trí và{" "}
            <span className="text-gray-700 font-semibold">không chịu trách nhiệm</span> về bất kỳ nội dung quảng cáo nào.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── RECOMMENDED ROW ──────────────────────────────────────────────────────────
function RecommendedRow({ items }) {
  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 bg-violet-500 rounded-full" />
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Đề Xuất Cho Bạn</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {(Array.isArray(safeItems) ? safeItems : []).map(item => (
          <div key={item._id || item.slug || item.id} className="flex-shrink-0 w-28 group cursor-pointer">
            <div className="relative overflow-hidden rounded-xl aspect-[2/3] mb-2">
              <LazyImg src={item.thumb_url || item.poster_url || item.thumbnail || item.img} alt={item.name || item.title} className="w-full h-full" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />
              <div className="absolute top-0 left-0 z-10">
                <span
                  className="flex items-center gap-1 px-2.5 py-1 text-white text-[10px] font-bold"
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)",
                  }}
                >
                  <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  <span>{Number(item.tmdb?.vote_average) || Number(item.rating) || 0}</span>
                </span>
              </div>
              <div
                className="absolute z-10 flex flex-col items-center justify-center text-center text-white font-bold leading-tight"
                style={{
                  top: "5px",
                  right: "5px",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  background: "#d82b2b",
                  fontSize: "8px",
                  lineHeight: "1.2",
                }}
              >
                <span>TẬP</span>
                <span>{item.episode_current || item.ep || "??"}</span>
              </div>
            </div>
            <p className="text-gray-300 text-xs font-medium line-clamp-2 group-hover:text-violet-300 transition-colors">{item.name || item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── ANIME CARD ───────────────────────────────────────────────────────────────
function AnimeCard({ anime }) {
  const [hovered, setHovered] = useState(false);
  const src = anime?.thumb_url || anime?.poster_url || anime?.thumbnail || "";
  const title = anime?.name || anime?.title || "";
  const rating = Number(anime?.tmdb?.vote_average) || Number(anime?.rating) || 0;
  const epNum = anime?.episode_current || null;

  return (
    <div
      className="relative shrink-0 cursor-pointer group"
      style={{ width: 160, overflow: "visible" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden w-[160px] h-[240px]" style={{ borderRadius: 8 }}>
        <LazyImg src={src} alt={title} className="w-full h-full" />
        <div className={`absolute inset-0 transition-all duration-200 ease-in-out ${hovered ? "bg-black/50" : "bg-transparent"}`} />
        {rating > 0 && (
          <div className="absolute top-0 left-0 z-10">
            <span
              className="flex items-center gap-1 px-2.5 py-1 text-white text-[10px] font-bold"
              style={{
                background: "rgba(0,0,0,0.7)",
                clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)",
              }}
            >
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" /> {rating > 0 ? rating.toFixed(1) : "0.0"}
            </span>
          </div>
        )}
        {epNum && (
          <div
            className="absolute z-10 flex flex-col items-center justify-center text-center text-white font-bold leading-tight"
            style={{
              top: "5px",
              right: "5px",
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "#d82b2b",
              fontSize: "8px",
              lineHeight: "1.2",
            }}
          >
            <span>TẬP</span>
            <span>{epNum}</span>
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
      <div className="mt-1.5 px-0.5" style={{ width: 160 }}>
        <p className="text-white text-[11px] font-medium leading-tight truncate group-hover:text-violet-400 transition-colors">{title}</p>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-yellow-500 text-[10px] font-medium">{rating > 0 ? rating.toFixed(1) : "0.0"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ANIME GRID SECTION ──────────────────────────────────────────────────────
function AnimeGrid({ items, activeTab, onTabChange }) {
  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "series", label: "Anime bộ" },
    { key: "movie", label: "Anime lẻ" },
  ];

  console.log('Loại dữ liệu items:', typeof items, items);
  const safeItems = Array.isArray(items) ? items : [];

  const filtered = safeItems.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "series") return item.type === "series";
    if (activeTab === "movie") return item.type === "single";
    return true;
  });

  if (safeItems.length === 0) return null;

  return (
    <section className="mb-8 mt-6">
      <div className="flex items-center flex-wrap gap-3 mb-4">
        <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-1.5 rounded-lg transition-all">
          🔔 MỚI CẬP NHẬT <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-0 ml-2">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => onTabChange(tab.key)}
              className={`text-xs px-3 py-1.5 transition-all ${
                activeTab === tab.key
                  ? "text-white font-bold border-b-2 border-violet-500"
                  : "text-gray-400 hover:text-white border-b-2 border-transparent"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">Không tìm thấy phim nào.</div>
      ) : (
        <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0" style={{ scrollbarWidth: "none" }}>
          {(Array.isArray(filtered) ? filtered : []).map((item, idx) => (
            <AnimeCard key={item._id || item.slug || idx} anime={item} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── STATE for API data ────────────────────────────────────────────────
  const [animeList, setAnimeList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── HANDLE SEARCH: lọc trên animeList gốc, lưu vào filteredList ──────
  function handleSearch(query) {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredList(animeList);
      return;
    }
    const lower = query.toLowerCase().trim();
    const results = (animeList || []).filter(item => {
      const name = (item.name || item.title || "").toLowerCase();
      const originName = (item.origin_name || "").toLowerCase();
      return name.includes(lower) || originName.includes(lower);
    });
    setFilteredList(results);
  }

  // ─── FETCH API data ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMovieList(1);
        if (cancelled) return;

        const items = result?.items || [];
        // Lọc: chỉ giữ lại anime Nhật Bản Vietsub
        const filtered = filterAnimeList(items);
        if (Array.isArray(filtered) && filtered.length > 0) {
          console.log("✅ AnimeHomepage: loaded", items.length, "raw,", filtered.length, "after Japan filter");
          setAnimeList(filtered);
          setFilteredList(filtered);
        } else {
          console.log("ℹ️ AnimeHomepage: API returned empty, using fallback");
          setAnimeList([]);
          setFilteredList([]);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("⚠️ AnimeHomepage: API error, using fallback:", err.message);
        setError(err.message);
        setAnimeList([]);
        setFilteredList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // ─── BUILD movie info from API data ──────────────────────────────────────
  const movieInfo = animeList.length > 0 ? (() => {
    const first = animeList[0];
    const cats = first?.category || [];
    return {
      title: first?.name || DEFAULT_FALLBACK.title,
      altTitle: first?.origin_name || first?.name || DEFAULT_FALLBACK.altTitle,
      rating: Number(first?.tmdb?.vote_average) || Number(first?.rating) || DEFAULT_FALLBACK.rating,
      episodes: `${first?.episode_current || "?"}/${first?.episode_total || "??"}`,
      year: first?.year || DEFAULT_FALLBACK.year,
      season: first?.status || DEFAULT_FALLBACK.season,
      studio: "Đang cập nhật",
      status: first?.status || DEFAULT_FALLBACK.status,
      tags: (cats || []).map(c => c?.name).slice(0, 7),
      synopsis: first?.content || DEFAULT_FALLBACK.synopsis,
      poster: first?.thumb_url || first?.poster_url || DEFAULT_FALLBACK.poster,
      trailer: "/trailer.mp4",
    };
  })() : DEFAULT_FALLBACK;

  // ─── BUILD episodes from API data ────────────────────────────────────────
  const episodeList = animeList.length > 0
    ? (animeList || []).slice(0, 24).map((item, i) => ({
        id: i + 1,
        number: i + 1,
        title: item?.name || `Tập ${i + 1}`,
        duration: "24:00",
        thumbnail: item?.thumb_url || `https://placehold.co/320x180/1e1e2e/6366f1?text=Tập+${i + 1}`,
        isWatched: false,
        releaseDate: "Hôm nay",
      }))
    : DEFAULT_EPISODES;

  // ─── BUILD recommended items ────────────────────────────────────────────
  const recommendedItems = animeList.length > 0
    ? animeList.slice(0, 10)
    : [
        { id:1, name:"One Piece – Đảo Hải Tặc", ep:"1167", rating:9.3, img:"https://cdn.myanimelist.net/images/anime/6/73245l.jpg" },
        { id:2, name:"Needy Girl Overdose", ep:"12", rating:8.3, img:"https://cdn.myanimelist.net/images/anime/1887/138739l.jpg" },
        { id:3, name:"Ghost Concert: Missing Songs", ep:"Full", rating:6.8, img:"https://cdn.myanimelist.net/images/anime/1765/146557l.jpg" },
        { id:4, name:"Hắc Miêu Và Lớp Học Phù Thủy", ep:"11", rating:9.0, img:"https://cdn.myanimelist.net/images/anime/1908/143997l.jpg" },
        { id:5, name:"Reborn as a Cat", ep:"34", rating:8.1, img:"https://cdn.myanimelist.net/images/anime/1544/144402l.jpg" },
        { id:6, name:"Tiên Nghịch", ep:"146", rating:9.1, img:"https://cdn.myanimelist.net/images/anime/1887/138739l.jpg" },
      ];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .line-clamp-3 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#111; }
        ::-webkit-scrollbar-thumb { background:#4c1d95; border-radius:4px; }
        img { display:block; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .animate-pulse { animation:pulse 1.5s ease-in-out infinite; }
        @keyframes zoomIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        
      `}</style>

      <Header dark={dark} setDark={setDark} onSearch={handleSearch} />

      {/* Loading indicator */}
      {loading && (
        <div className="bg-violet-900/30 border-b border-violet-800/30 py-1.5 text-center">
          <span className="text-violet-400 text-[10px] flex items-center justify-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang tải dữ liệu...
          </span>
        </div>
      )}

      {/* Error indicator */}
      {error && !loading && (
        <div className="bg-amber-900/30 border-b border-amber-800/30 py-1.5 text-center">
          <span className="text-amber-400 text-[10px] flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Không thể kết nối API, đang dùng dữ liệu dự phòng
          </span>
        </div>
      )}


      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* ─── TOP ROW: Banner (left) + Hôm nay xem gì (right) ─── */}
        <div className="flex flex-col lg:flex-row gap-4 items-start w-full mb-5">
          {/* Banner - left column (75%) */}
          <div className="w-full lg:w-[75%] shrink-0">
            <HeroBannerSlider items={animeList} />
          </div>

          {/* Right side - Hôm nay xem gì (25%) */}
          <div className="w-full lg:w-[25%] shrink-0">
            {/* Hôm nay xem gì */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-800/60">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-violet-400" />
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">Hôm nay xem gì</h3>
                </div>
              </div>
              <div className="p-3">
                <p className="text-gray-400 text-[11px] mb-3 leading-relaxed">Nếu bạn không biết xem gì hôm nay, hãy để chúng tôi chọn cho bạn.</p>
                <div className="space-y-2">
                  {episodeList.slice(0, 4).map((ep) => (
                    <div key={ep.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/40 rounded-lg p-1.5 transition-all duration-200">
                      <div className="relative w-14 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                        <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-[11px] font-medium truncate">{ep.title}</p>
                        <span className="text-gray-600 text-[9px]">{ep.releaseDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TRAILER ROW ─── */}
        <div className="w-full mb-5">
          <VideoPlayer src={movieInfo?.trailer} poster={movieInfo?.poster} />
        </div>

        {/* ─── SECOND ROW: MovieInfo (left) + EpisodeList (right) ─── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-[65%] flex flex-col gap-5">
            {movieInfo && movieInfo.title ? (
              <MovieInfo info={movieInfo} />
            ) : (
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-4 md:p-5 text-center text-gray-500 text-sm">
                <p>Đang tải thông tin phim...</p>
              </div>
            )}

            {/* Comments inside left column */}
            <CommentsSection comments={DEFAULT_COMMENTS} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[35%] flex-shrink-0">
            <div className="lg:sticky lg:top-20 flex flex-col gap-5">
              <EpisodeList
                episodes={episodeList}
                currentEp={currentEpisode}
                onSelectEpisode={setCurrentEpisode}
              />
            </div>
          </div>
        </div>

        {/* ─── ANIME GRID - Full width ─── */}
        {(searchQuery ? filteredList : animeList).length > 0 ? (
          <AnimeGrid
            items={searchQuery ? filteredList : animeList}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            <p>{searchQuery ? "Không tìm thấy phim nào phù hợp." : "Đang tải hoặc không có dữ liệu"}</p>
            {!loading && !searchQuery && <p className="mt-1 text-gray-600">Vui lòng thử lại sau.</p>}
          </div>
        )}

        {/* ─── RECOMMENDED ─── */}
        {recommendedItems && recommendedItems.length > 0 ? (
          <RecommendedRow items={recommendedItems} />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}