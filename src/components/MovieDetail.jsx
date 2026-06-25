import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Star, Eye, Heart, MessageCircle, ChevronDown, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Send, AlertTriangle, RefreshCw } from "lucide-react";

// ─── UTILS ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-violet-600 to-pink-600",
  "from-blue-600 to-cyan-500",
  "from-emerald-600 to-teal-500",
  "from-orange-600 to-red-500",
  "from-rose-600 to-purple-500",
  "from-sky-600 to-indigo-500",
  "from-fuchsia-600 to-pink-500",
  "from-lime-600 to-green-500",
];

function getAvatarColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return `${Math.floor(diff / 2592000)} tháng trước`;
}

function formatViews(n) {
  if (!n) return "";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function renderStars(rating) {
  // rating có thể ở thang 10 (0-10) hoặc thang 5 (0-5)
  // Chuyển về thang 5 nếu rating > 5
  const normalized = rating > 5 ? rating / 2 : rating;
  // Clamp an toàn: không cho phép số âm hoặc > 5
  const safeRating = Math.max(0, Math.min(5, normalized || 0));
  const full = Math.floor(safeRating);
  const half = safeRating - full >= 0.5 ? 1 : 0;
  const empty = Math.max(0, 5 - full - half);
  return (
    <span className="inline-flex items-center gap-0.5">
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

/** Large banner image with gradient overlay */
function MovieBanner({ src, title, accentColor = "lime-400" }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const fallback = `https://placehold.co/800x450/1f2937/${accentColor.replace("lime-400","84cc16").replace("red-500","ef4444").replace("violet-500","8b5cf6")}?text=${encodeURIComponent(title?.slice(0,12)||"Anime")}`;

  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-900" style={{ aspectRatio: "16/9" }}>
      {!loaded && <div className="absolute inset-0 bg-neutral-800 animate-pulse" />}
      <img
        src={err ? fallback : src}
        alt={title}
        loading="eager"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => { setErr(true); setLoaded(true); }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/60 via-transparent to-transparent" />
    </div>
  );
}

/** Movie title, rating, view count, quick stats */
function MovieInfo({ movie, accentColor = "lime-400", onWatchMovie }) {
  const [showFull, setShowFull] = useState(false);
  const synopsisLong = movie.synopsis && movie.synopsis.length > 200;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-neutral-100 leading-tight">{movie.title}</h1>
        {movie.subtitle && (
          <p className="text-sm text-neutral-500 mt-1">{movie.subtitle}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-1.5 bg-${accentColor}/20 border border-${accentColor}/30 rounded-full px-3 py-1`}>
          <Star className={`w-4 h-4 text-${accentColor} fill-${accentColor}`} />
          <span className={`text-${accentColor} font-bold text-sm`}>{movie.rating}</span>
          <span className="text-neutral-500 text-xs ml-0.5">{renderStars(movie.rating)}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-500 text-xs">
          <Eye className="w-3.5 h-3.5" />
          <span>{formatViews(movie.viewCount)} lượt xem</span>
        </div>
        {movie.quality && (
          <span className="bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">{movie.quality}</span>
        )}
        {movie.language && (
          <span className="bg-neutral-700 text-neutral-300 text-[10px] px-2 py-0.5 rounded">{movie.language}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onWatchMovie?.()}
          className={`flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105`}
        >
          <Play className="w-4 h-4 fill-white" /> Xem Phim
        </button>
        <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium px-4 py-3 rounded-xl transition-all border border-neutral-700">
          <Heart className="w-4 h-4" /> Theo dõi
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {movie.studio && (
          <>
            <span className="text-neutral-500">Studio</span>
            <span className="text-neutral-200 font-medium text-right">{movie.studio}</span>
          </>
        )}
        {movie.director && (
          <>
            <span className="text-neutral-500">Đạo diễn</span>
            <span className="text-neutral-200 font-medium text-right">{movie.director}</span>
          </>
        )}
        {movie.country && (
          <>
            <span className="text-neutral-500">Quốc gia</span>
            <span className="text-neutral-200 font-medium text-right">{movie.country}</span>
          </>
        )}
        {movie.year && (
          <>
            <span className="text-neutral-500">Năm phát hành</span>
            <span className="text-neutral-200 font-medium text-right">{movie.year}</span>
          </>
        )}
        {movie.status && (
          <>
            <span className="text-neutral-500">Trạng thái</span>
            <span className={`font-medium text-right ${movie.status === "Đang phát sóng" ? "text-green-400" : "text-neutral-200"}`}>{movie.status}</span>
          </>
        )}
        {movie.episodeCount && (
          <>
            <span className="text-neutral-500">Số tập</span>
            <span className="text-neutral-200 font-medium text-right">{movie.episodeCount}</span>
          </>
        )}
      </div>

      {movie.genres && movie.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {movie.genres.map((g) => (
            <span key={g} className="bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[11px] px-2.5 py-0.5 rounded-full">
              {g}
            </span>
          ))}
        </div>
      )}

      {movie.synopsis && (
        <div className="border-t border-neutral-800 pt-3">
          <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">Tóm tắt</h4>
          <p className={`text-neutral-400 text-sm leading-relaxed ${showFull ? "" : "line-clamp-3"}`}>
            {movie.synopsis}
          </p>
          {synopsisLong && (
            <button onClick={() => setShowFull(!showFull)} className="text-violet-400 hover:text-violet-300 text-xs font-medium mt-1 transition-colors">
              {showFull ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SeasonTabs({ seasons, activeSeasonId, onSeasonChange, accentColor = "lime-400" }) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {seasons.map((s) => (
        <button
          key={s.id}
          onClick={() => onSeasonChange(s.id)}
          className={`flex-shrink-0 text-xs font-bold px-3.5 py-2 rounded-lg transition-all ${
            activeSeasonId === s.id
              ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
          }`}
        >
          {s.label || `Season ${s.id}`}
        </button>
      ))}
    </div>
  );
}

function EpisodeGrid({ episodes, activeEpisode, onEpisodeSelect, accentColor = "lime-400" }) {
  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-neutral-500 text-sm text-center py-8">Chưa có tập nào</div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-2">
      {episodes.map((ep) => {
        const isActive = ep.number === activeEpisode;
        const isUnavailable = ep.isAvailable === false;
        return (
          <button
            key={ep.number}
            disabled={isUnavailable}
            onClick={() => !isUnavailable && onEpisodeSelect(ep.number)}
            className={`relative aspect-square rounded-lg text-sm font-bold transition-all duration-200 ${
              isUnavailable
                ? "bg-neutral-800/50 text-neutral-700 cursor-not-allowed opacity-40"
                : isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-105"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 hover:scale-105"
            }`}
          >
            <span className="absolute inset-0 flex items-center justify-center">
              {isUnavailable ? "—" : ep.number}
            </span>
            {isActive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-400 rounded-full flex items-center justify-center">
                <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CommentItem({ comment, accentColor = "lime-400" }) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="flex gap-3">
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(comment.username)} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-lg`}>
        {comment.avatar || comment.username?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-neutral-200 text-sm font-semibold">{comment.username}</span>
          <span className="text-neutral-600 text-[11px]">{timeAgo(comment.time)}</span>
        </div>
        <p className="text-neutral-400 text-sm leading-relaxed mb-2">{comment.content}</p>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 text-neutral-600 hover:text-violet-400 text-xs transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" /> {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>
          <button className="flex items-center gap-1 text-neutral-600 hover:text-violet-400 text-xs transition-colors">
            <ThumbsDown className="w-3.5 h-3.5" /> {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
          </button>
          <button className="text-neutral-600 hover:text-violet-400 text-xs transition-colors">Trả lời</button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors mb-2"
            >
              {showReplies ? "Ẩn trả lời" : `Xem ${comment.replies.length} trả lời`}
            </button>
            {showReplies && (
              <div className="ml-2 pl-3 border-l-2 border-neutral-800 space-y-3">
                {comment.replies.map((reply, idx) => (
                  <div key={reply.id || idx} className="flex gap-2">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(reply.username)} flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold`}>
                      {reply.avatar || reply.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-neutral-200 text-xs font-semibold">{reply.username}</span>
                        <span className="text-neutral-600 text-[10px]">{timeAgo(reply.time)}</span>
                      </div>
                      <p className="text-neutral-400 text-xs leading-relaxed">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentSection({ comments = [], isLoggedIn = false, accentColor = "lime-400" }) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [sortBy, setSortBy] = useState("newest");

  const sortedComments = useMemo(() => {
    const list = [...localComments];
    if (sortBy === "newest") return list.reverse();
    if (sortBy === "top") return list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return list;
  }, [localComments, sortBy]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || !isLoggedIn) return;
    setLocalComments([
      ...localComments,
      {
        id: Date.now(),
        username: "Bạn",
        avatar: "B",
        time: new Date().toISOString(),
        content: newComment.trim(),
        likes: 0,
        dislikes: 0,
        replies: [],
      },
    ]);
    setNewComment("");
  }

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-3 border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-violet-400" />
          <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">Bình Luận</h3>
          <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{localComments.length}</span>
        </div>
        <div className="flex items-center gap-1 bg-neutral-800/60 rounded-lg p-0.5">
          {["newest", "top"].map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
                sortBy === key ? "bg-violet-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {key === "newest" ? "Mới nhất" : "Top bình luận"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-neutral-800/40">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">B</div>
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                rows={2}
                className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-3 py-2 text-neutral-300 text-sm placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-neutral-800 transition-all resize-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="absolute bottom-2 right-2 p-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-neutral-800/40 rounded-xl p-4 text-center">
            <p className="text-neutral-500 text-sm mb-2">Đăng nhập để tham gia bình luận</p>
            <button className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              Đăng nhập
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-neutral-800/40">
        {sortedComments.map((comment) => (
          <div key={comment.id} className="p-4 hover:bg-neutral-800/20 transition-colors">
            <CommentItem comment={comment} accentColor={accentColor} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedMovies({ movies = [], onMovieClick, accentColor = "lime-400" }) {
  const scRef = useRef(null);

  function scroll(dir) {
    scRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">Phim Liên Quan</h3>
      </div>
      <div className="relative">
        <div
          ref={scRef}
          className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((m) => (
            <div
              key={m.id}
              onClick={() => onMovieClick && onMovieClick(m.id)}
              className="shrink-0 w-28 cursor-pointer group/card"
            >
              <div className="relative overflow-hidden rounded-xl aspect-[2/3] mb-2 bg-neutral-800">
                <img
                  src={m.thumbnail}
                  alt={m.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://placehold.co/300x420/1f2937/6b7280?text=${encodeURIComponent(m.title?.slice(0,6)||"Anime")}`;
                  }}
                />
                {m.rating && (
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 text-[10px] font-bold">{m.rating}</span>
                  </div>
                )}
              </div>
              <p className="text-neutral-300 text-xs font-medium line-clamp-2 group-hover/card:text-violet-300 transition-colors">{m.title}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll(-1)}
          className="absolute -left-3 top-[80px] w-7 h-7 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black z-10 shadow-lg rounded-full"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => scroll(1)}
          className="absolute -right-3 top-[80px] w-7 h-7 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black z-10 shadow-lg rounded-full"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN MOVIE DETAIL COMPONENT ─────────────────────────────────────────────

export default function MovieDetail({
  movie,
  isLoggedIn = false,
  onEpisodeSelect,
  onMovieClick,
  onWatchMovie,
  accentColor = "lime-400",
}) {
  const [activeSeasonId, setActiveSeasonId] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);

  useEffect(() => {
    if (movie?.seasons && movie.seasons.length > 0) {
      const latest = movie.seasons.reduce((best, s) => {
        const avail = s.episodes?.filter((e) => e.isAvailable !== false) || [];
        if (avail.length > 0 && (!best || avail.length > (best.episodes?.filter(e => e.isAvailable !== false).length || 0))) return s;
        return best;
      }, null);
      setActiveSeasonId(latest?.id || movie.seasons[0].id);
    }
  }, [movie]);

  const activeSeason = movie?.seasons?.find((s) => s.id === activeSeasonId);
  const seasonEpisodes = activeSeason?.episodes || [];

  function handleEpisodeSelect(epNumber) {
    setActiveEpisode(epNumber);
    if (onEpisodeSelect) {
      onEpisodeSelect(activeSeasonId, epNumber);
    }
  }

  // Defensive: wrap entire render in try-catch to prevent white screen
  try {
    // Validate required fields to prevent crashes
    const safeMovie = {
      ...movie,
      title: movie.title || "Đang cập nhật",
      coverImage: movie.coverImage || "",
      rating: movie.rating || 0,
      viewCount: movie.viewCount || 0,
      seasons: movie.seasons || [],
      comments: movie.comments || [],
      relatedMovies: movie.relatedMovies || [],
      genres: movie.genres || [],
    };

    if (!movie) {
      return (
        <div className="flex items-center justify-center py-20 text-neutral-500">
          <p>Không có dữ liệu phim</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display:none; }
          .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
          .line-clamp-3 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        `}</style>

        {/* Mobile layout (< 1024px): stacked vertically */}
        <div className="lg:hidden space-y-6">
          <MovieBanner src={safeMovie.coverImage} title={safeMovie.title} accentColor={accentColor} />
          <div className="px-4">
            <MovieInfo movie={safeMovie} accentColor={accentColor} onWatchMovie={onWatchMovie} />
          </div>

          {safeMovie.seasons && safeMovie.seasons.length > 0 && (
            <div className="px-4 space-y-3">
              <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-violet-400" /> Tập Phim
              </h3>
              <SeasonTabs seasons={safeMovie.seasons} activeSeasonId={activeSeasonId} onSeasonChange={setActiveSeasonId} accentColor={accentColor} />
              <EpisodeGrid episodes={seasonEpisodes} activeEpisode={activeEpisode} onEpisodeSelect={handleEpisodeSelect} accentColor={accentColor} />
            </div>
          )}

          <div className="px-4">
            <CommentSection comments={safeMovie.comments} isLoggedIn={isLoggedIn} accentColor={accentColor} />
          </div>

          <div className="px-4 pb-6">
            <RelatedMovies movies={safeMovie.relatedMovies} onMovieClick={onMovieClick} accentColor={accentColor} />
          </div>
        </div>

        {/* Desktop layout (>= 1024px): 2-column grid */}
        <div className="hidden lg:block max-w-[1400px] mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <MovieBanner src={safeMovie.coverImage} title={safeMovie.title} accentColor={accentColor} />
              <MovieInfo movie={safeMovie} accentColor={accentColor} onWatchMovie={onWatchMovie} />
              <CommentSection comments={safeMovie.comments} isLoggedIn={isLoggedIn} accentColor={accentColor} />
            </div>

            <div className="col-span-4">
              <div className="sticky top-20 space-y-6">
                {safeMovie.seasons && safeMovie.seasons.length > 0 && (
                  <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-4 space-y-3">
                    <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Play className="w-4 h-4 text-violet-400" /> Tập Phim
                    </h3>
                    <SeasonTabs seasons={safeMovie.seasons} activeSeasonId={activeSeasonId} onSeasonChange={setActiveSeasonId} accentColor={accentColor} />
                    <EpisodeGrid episodes={seasonEpisodes} activeEpisode={activeEpisode} onEpisodeSelect={handleEpisodeSelect} accentColor={accentColor} />
                  </div>
                )}

                <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-4">
                  <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider mb-3">Phim Liên Quan</h3>
                  <div className="space-y-3">
                    {(safeMovie.relatedMovies || []).slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        onClick={() => onMovieClick && onMovieClick(m.id)}
                        className="flex items-center gap-2.5 group cursor-pointer"
                      >
                        <div className="w-10 h-14 overflow-hidden rounded-lg flex-shrink-0 bg-neutral-800">
                          <img
                            src={m.thumbnail}
                            alt={m.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = `https://placehold.co/300x420/1f2937/6b7280?text=${encodeURIComponent(m.title?.slice(0,4)||"N/A")}`; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-300 group-hover:text-violet-300 text-xs font-medium line-clamp-2 transition-colors leading-tight">{m.title}</p>
                          {m.rating && <p className="text-yellow-400 text-[10px] mt-0.5">★ {m.rating}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (renderError) {
    console.error("🔴 MovieDetail render error:", renderError);
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-400">Lỗi hiển thị phim</h2>
          <p className="text-neutral-500 text-sm mb-4">
            {renderError.message || "Có lỗi xảy ra khi hiển thị thông tin phim."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        </div>
      </div>
    );
  }
}