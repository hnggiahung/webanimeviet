import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Play, Star, Eye, Heart, Bell, MessageCircle, Film, Clock,
  ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Send, Info,
  Server, AlertTriangle, RefreshCw, Loader2, Share2, Flag,
  Volume2, Maximize, SkipBack, SkipForward, Pause
} from "lucide-react";
import { fetchMovieDetail, extractEpisodes, getVideoUrl, isEmbedUrl, normalizeMovieData } from "../services/ophimApi";

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

function LazyImg({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const fallback = `https://placehold.co/300x420/1f2937/6b7280?text=${encodeURIComponent(alt?.slice(0, 8) || "N/A")}`;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-neutral-800 animate-pulse" />}
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

// ─── VIDEO PLAYER WITH HLS SUPPORT ──────────────────────────────────────────

function VideoPlayer({ videoSrc, poster, title, episodeName, onError }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);

  // Detect if this is an embed URL (iframe) vs video
  useEffect(() => {
    if (!videoSrc) {
      setIsLoading(false);
      setHasError(true);
      return;
    }
    // Embed URLs are non-video URLs (not m3u8, not mp4, not webm, etc.)
    const isEmbed = !videoSrc.includes(".m3u8") && !videoSrc.includes(".mp4") && !videoSrc.includes(".webm") && !videoSrc.includes(".mkv");
    setIsEmbedMode(isEmbed);
    if (isEmbed) {
      setIsLoading(false);
      setHasError(false);
    }
  }, [videoSrc]);

  // Initialize HLS when videoSrc changes (only for non-embed)
  useEffect(() => {
    if (isEmbedMode) return; // Skip HLS for embed URLs
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!videoSrc) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Check if it's an m3u8 URL (HLS stream)
    const isHls = videoSrc.includes(".m3u8");

    if (isHls) {
      // Try HLS.js first
      import("hls.js").then((HlsModule) => {
        const Hls = HlsModule.default || HlsModule;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              setHasError(true);
              setIsLoading(false);
              if (onError) onError("HLS playback error");
            }
          });
        } else {
          // Fallback: try native HLS (Safari)
          video.src = videoSrc;
          video.addEventListener("loadedmetadata", () => {
            setIsLoading(false);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
          video.addEventListener("error", () => {
            setHasError(true);
            setIsLoading(false);
            if (onError) onError("Video load error");
          });
        }
      }).catch(() => {
        // HLS.js failed to load, try native
        video.src = videoSrc;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
        });
        video.addEventListener("error", () => {
          setHasError(true);
          setIsLoading(false);
          if (onError) onError("Video load error");
        });
      });
    } else if (videoSrc.includes(".mp4") || videoSrc.includes(".webm") || videoSrc.includes(".mkv")) {
      // Direct video source (mp4, webm, etc.)
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        setDuration(video.duration);
      });
      video.addEventListener("error", () => {
        setHasError(true);
        setIsLoading(false);
        if (onError) onError("Video load error");
      });
    } else {
      // Unknown type, try as direct video
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
      });
      video.addEventListener("error", () => {
        // If native video fails for this type, try embed fallback
        setIsEmbedMode(true);
        setIsLoading(false);
        setHasError(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoSrc, onError, isEmbedMode]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    const ct = video.currentTime;
    const dur = video.duration || 0;
    setCurrentTime(ct);
    setDuration(dur);
    setProgress(dur > 0 ? (ct / dur) * 100 : 0);
  }

  function handleSeek(e) {
    const video = videoRef.current;
    if (!video || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    video.currentTime = pct * duration;
  }

  function formatTime(t) {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      container.requestFullscreen();
      setIsFullscreen(true);
    }
  }

  useEffect(() => {
    function onFSChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden group shadow-2xl shadow-black/50"
    >
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <span className="text-gray-500 text-xs">Đang tải video...</span>
            </div>
          </div>
        )}

        {/* Embed mode (iframe) - render iframe instead of video */}
        {isEmbedMode && videoSrc && (
          <iframe
            src={videoSrc}
            className="w-full h-full absolute inset-0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
            referrerPolicy="no-referrer"
            style={{ border: "none" }}
            title={episodeName || "Video player"}
          />
        )}

        {/* Error overlay */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-20">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
              <span className="text-gray-400 text-sm">Không thể tải video</span>
              <span className="text-gray-600 text-xs">Có thể server đang bảo trì hoặc link phim bị lỗi</span>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Video element - hidden in embed mode */}
        <video
          ref={videoRef}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (video) setDuration(video.duration);
          }}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={`w-full h-full object-contain bg-black ${isEmbedMode ? "hidden" : ""}`}
          playsInline
          preload="metadata"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Top overlay - episode info */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          {episodeName && (
            <span className="bg-violet-600/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
              {episodeName}
            </span>
          )}
          {title && (
            <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-[10px] md:text-xs px-2.5 py-1 rounded-lg max-w-[200px] truncate">
              {title}
            </span>
          )}
        </div>

        {/* Center play button when paused */}
        {!isPlaying && !isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-10" onClick={togglePlay}>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-violet-500/40 transition-transform hover:scale-110">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <div className="pointer-events-auto">
            {/* Progress bar */}
            <div
              className="w-full h-1.5 bg-gray-700/60 rounded-full cursor-pointer mb-3 hover:h-2 transition-all group/progress"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-violet-500 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-400 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg shadow-violet-500/50" />
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <button onClick={togglePlay} className="text-white hover:text-violet-300 transition-colors">
                  {isPlaying ? (
                    <Pause className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                  )}
                </button>
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {isMuted ? (
                    <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  )}
                </button>
                <span className="text-white/60 text-[10px] md:text-xs font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button onClick={handleFullscreen} className="text-white/70 hover:text-white transition-colors">
                  <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SERVER SELECTOR ─────────────────────────────────────────────────────────

function ServerSelector({ servers, activeServer, onServerChange }) {
  if (!servers || servers.length === 0) return null;

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-violet-400" />
        <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">Chọn Server</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {servers.map((server) => {
          const isActive = server.server_name === activeServer?.server_name;
          return (
            <button
              key={server.server_name}
              onClick={() => onServerChange(server)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 scale-105"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 border border-neutral-700/50"
              }`}
            >
              {server.server_name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── EPISODE GRID ────────────────────────────────────────────────────────────

function EpisodeGrid({ episodes, currentEpisode, onEpisodeSelect, isLoading }) {
  const [viewMode, setViewMode] = useState("grid");

  if (isLoading) {
    return (
      <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Film className="w-4 h-4 text-violet-400" />
          <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">Danh Sách Tập</h3>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Film className="w-4 h-4 text-violet-400" />
          <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">Danh Sách Tập</h3>
        </div>
        <div className="text-neutral-500 text-sm text-center py-8">Chưa có tập nào</div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-violet-400" />
          <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">Danh Sách Tập</h3>
          <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {episodes.length}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-neutral-800/60 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
              viewMode === "list"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            DS
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
              viewMode === "grid"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Ô
          </button>
        </div>
      </div>

      {/* Current episode indicator */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/40">
        <span className="text-neutral-500 text-[10px]">
          Đang xem: <span className="text-violet-400 font-semibold">Tập {currentEpisode}</span>
        </span>
      </div>

      {/* Episode list/grid */}
      <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
        {viewMode === "list" ? (
          <div className="divide-y divide-neutral-800/40">
            {episodes.map((ep, idx) => {
              const epNum = idx + 1;
              const isActive = epNum === currentEpisode;
              return (
                <div
                  key={ep.slug || idx}
                  onClick={() => onEpisodeSelect(ep, idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-violet-600/10 border-l-2 border-violet-500"
                      : "hover:bg-neutral-800/40 border-l-2 border-transparent"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-400 text-xs font-bold">
                    {epNum}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      isActive ? "text-violet-300" : "text-neutral-300"
                    }`}>
                      {ep.name || `Tập ${epNum}`}
                    </p>
                  </div>
                  {isActive ? (
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <Play className="w-3 h-3 text-neutral-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-2 p-4">
            {episodes.map((ep, idx) => {
              const epNum = idx + 1;
              const isActive = epNum === currentEpisode;
              return (
                <button
                  key={ep.slug || idx}
                  onClick={() => onEpisodeSelect(ep, idx)}
                  className={`relative aspect-square rounded-lg text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-105 ring-2 ring-violet-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 hover:scale-105"
                  }`}
                >
                  <span className="absolute inset-0 flex items-center justify-center">
                    {epNum}
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
        )}
      </div>
    </div>
  );
}

// ─── MOVIE INFO PANEL ────────────────────────────────────────────────────────

function MovieInfoPanel({ movie, movieData }) {
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  if (!movieData) return null;

  const {
    name = movie?.title || "Đang tải...",
    origin_name = "",
    content = "",
    thumb_url = movie?.coverImage || "",
    year = "",
    quality = "",
    lang = "",
    time = "",
    episode_current = "",
    episode_total = "",
    status = "",
    category = [],
    country = [],
    rating = movie?.rating || 0,
  } = movieData;

  const synopsis = content || movie?.synopsis || "";
  const synopsisLong = synopsis.length > 200;
  const genres = category.map((c) => c.name).slice(0, 6);
  const countries = country.map((c) => c.name).join(", ");

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-4 md:p-5">
      {/* Title + poster row */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
        {/* Poster */}
        <div className="w-24 h-32 md:w-28 md:h-38 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/40">
          <LazyImg src={thumb_url} alt={name} className="w-full h-full" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg md:text-2xl leading-tight mb-1">{name}</h1>
          {origin_name && (
            <p className="text-neutral-500 text-xs mb-3">{origin_name}</p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {rating > 0 && (
              <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2 py-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold">{rating}</span>
              </div>
            )}
            {episode_current && (
              <span className="text-neutral-400 text-xs">{episode_current}/{episode_total || "??"} tập</span>
            )}
            {year && (
              <>
                <span className="text-neutral-600 text-xs">•</span>
                <span className="text-neutral-400 text-xs">{year}</span>
              </>
            )}
            {quality && (
              <span className="bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">{quality}</span>
            )}
            {lang && (
              <span className="bg-neutral-700 text-neutral-300 text-[10px] px-2 py-0.5 rounded">{lang}</span>
            )}
          </div>

          {/* Status */}
          {status && (
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold ${status === "ongoing" ? "text-green-400" : "text-neutral-400"}`}>
                {status === "ongoing" ? "Đang phát sóng" : status === "completed" ? "Hoàn thành" : status}
              </span>
            </div>
          )}

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {genres.map((g) => (
                <span
                  key={g}
                  className="bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px] px-2 py-0.5 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Country + Time */}
          <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
            {countries && <span>🌍 {countries}</span>}
            {time && <span>⏱ {time}</span>}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105">
          <Play className="w-3.5 h-3.5 fill-white" /> Xem Ngay
        </button>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all border border-white/10">
          <Heart className="w-3.5 h-3.5" /> Yêu thích
        </button>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all border border-white/10">
          <Share2 className="w-3.5 h-3.5" /> Chia sẻ
        </button>
      </div>

      {/* Synopsis */}
      {synopsis && (
        <div className="border-t border-neutral-800/60 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-neutral-300 text-xs font-semibold uppercase tracking-wider">Nội Dung</span>
          </div>
          <p className={`text-neutral-400 text-xs leading-relaxed ${showFullSynopsis ? "" : "line-clamp-3"}`}>
            {synopsis}
          </p>
          {synopsisLong && (
            <button
              onClick={() => setShowFullSynopsis(!showFullSynopsis)}
              className="text-violet-400 hover:text-violet-300 text-[10px] font-medium mt-1 transition-colors"
            >
              {showFullSynopsis ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COMMENT SECTION ─────────────────────────────────────────────────────────

function CommentSection({ comments: propComments, isLoggedIn = false }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(propComments || []);
  const [sortBy, setSortBy] = useState("newest");

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortBy === "newest") return list.reverse();
    if (sortBy === "top") return list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return list;
  }, [comments, sortBy]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || !isLoggedIn) return;
    setComments([
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
      ...comments,
    ]);
    setNewComment("");
  }

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-violet-400" />
          <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">Bình Luận</h3>
          <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-neutral-800/60 rounded-lg p-0.5">
          {[
            { key: "newest", label: "Mới nhất" },
            { key: "top", label: "Top bình luận" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
                sortBy === key
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input form */}
      <div className="p-4 border-b border-neutral-800/40">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              B
            </div>
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                rows={2}
                className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-3 py-2 text-neutral-300 text-xs placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-neutral-800 transition-all resize-none"
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

      {/* Comments list */}
      <div className="divide-y divide-neutral-800/40">
        {sortedComments.length === 0 ? (
          <div className="p-8 text-center text-neutral-600 text-sm">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-neutral-800/20 transition-colors">
              <div className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(comment.username)} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-lg shadow-violet-500/20`}
                >
                  {comment.avatar || comment.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-neutral-200 text-xs font-semibold">{comment.username}</span>
                    <span className="text-neutral-600 text-[10px]">{timeAgo(comment.time)}</span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed mb-2">{comment.content}</p>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-neutral-600 hover:text-violet-400 text-[10px] transition-colors">
                      <ThumbsUp className="w-3 h-3" />{" "}
                      {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    <button className="flex items-center gap-1 text-neutral-600 hover:text-violet-400 text-[10px] transition-colors">
                      <ThumbsDown className="w-3 h-3" />{" "}
                      {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
                    </button>
                    <button className="text-neutral-600 hover:text-violet-400 text-[10px] transition-colors">
                      Trả lời
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies?.length > 0 && (
                    <div className="mt-3 ml-2 pl-3 border-l-2 border-neutral-800/60 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(reply.username)} flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold`}
                          >
                            {reply.avatar || reply.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-neutral-200 text-[11px] font-semibold">{reply.username}</span>
                              <span className="text-neutral-600 text-[9px]">{timeAgo(reply.time)}</span>
                            </div>
                            <p className="text-neutral-400 text-[11px] leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR WIDGET ──────────────────────────────────────────────────────────

function SidebarWidget({ title, icon: Icon, children }) {
  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-800/60">
        {Icon && <Icon className="w-4 h-4 text-violet-400" />}
        <h3 className="text-neutral-100 font-bold text-sm uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── AD BANNER ───────────────────────────────────────────────────────────────

function AdBanner({ size = "normal" }) {
  return (
    <div
      className={`bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/60 rounded-2xl overflow-hidden ${
        size === "large" ? "h-64" : "h-28"
      }`}
    >
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="text-center">
          <p className="text-neutral-600 text-[10px] uppercase tracking-wider mb-1">Quảng Cáo</p>
          <div className="w-8 h-8 mx-auto rounded-lg bg-neutral-700/50 flex items-center justify-center">
            <span className="text-neutral-500 text-xs">Ad</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RECOMMENDED MOVIES SIDEBAR ──────────────────────────────────────────────

function RecommendedSidebar({ movies = [], onMovieClick }) {
  if (!movies || movies.length === 0) {
    return (
      <SidebarWidget title="Đề Xuất" icon={Star}>
        <div className="text-neutral-500 text-xs text-center py-4">Đang cập nhật...</div>
      </SidebarWidget>
    );
  }

  return (
    <SidebarWidget title="Đề Xuất Cho Bạn" icon={Star}>
      <div className="space-y-3">
        {movies.slice(0, 6).map((movie, idx) => (
          <div
            key={movie._id || movie.slug || idx}
            onClick={() => onMovieClick && onMovieClick(movie)}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
              <LazyImg
                src={movie.thumb_url || movie.poster_url}
                alt={movie.name || movie.title}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-neutral-300 group-hover:text-violet-300 text-xs font-medium line-clamp-2 transition-colors leading-tight">
                {movie.name || movie.title}
              </p>
              {movie.rating && (
                <p className="text-yellow-400 text-[10px] mt-0.5">★ {movie.rating}</p>
              )}
              {movie.episode_current && (
                <p className="text-neutral-600 text-[10px] mt-0.5">Tập {movie.episode_current}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SidebarWidget>
  );
}

// ─── MAIN WATCH PAGE ─────────────────────────────────────────────────────────

export default function WatchPage({
  slug,
  onBack,
  onMovieClick,
  isLoggedIn = false,
}) {
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [activeServer, setActiveServer] = useState(null);
  const [videoError, setVideoError] = useState(null);

  // Fetch movie detail from Ophim API
  const {
    data: movieData,
    isLoading: isMovieLoading,
    isError: isMovieError,
    error: movieError,
    refetch: refetchMovie,
  } = useQuery({
    queryKey: ["movieDetail", slug],
    queryFn: () => fetchMovieDetail(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
  });

  // Extract & normalize movie info from Ophim API
  const rawMovie = movieData?.movie || {};
  const episodes = movieData?.episodes || [];
  const recommendList = movieData?.recommend || [];

  // Normalize movie data for consistent display
  const movie = useMemo(() => normalizeMovieData(rawMovie), [rawMovie]);

  // Set active server on data load - prioritize Vietsub
  useEffect(() => {
    if (episodes.length > 0 && !activeServer) {
      // Try to find Vietsub first
      const vietsub = episodes.find(
        (ep) => ep.server_name?.toLowerCase() === "vietsub"
      );
      setActiveServer(vietsub || episodes[0]);
    }
  }, [episodes, activeServer]);

  // Get current episode list from active server using server_data
  const currentEpisodes = useMemo(() => {
    if (!activeServer || !activeServer.server_data) return [];
    // Ophim returns server_data as array of { name, slug, filename, link_embed, link_m3u8, link_direct }
    return activeServer.server_data;
  }, [activeServer]);

  // Get current episode data
  const currentEpisode = currentEpisodes[currentEpisodeIndex] || null;

  // Get video URL
  const videoUrl = useMemo(() => {
    return getVideoUrl(currentEpisode);
  }, [currentEpisode]);

  // Handle episode selection
  function handleEpisodeSelect(episode, index) {
    setCurrentEpisodeIndex(index);
    setVideoError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle server change
  function handleServerChange(server) {
    setActiveServer(server);
    setCurrentEpisodeIndex(0);
    setVideoError(null);
  }

  // Handle video error
  function handleVideoError(err) {
    setVideoError(err);
  }

  // Loading state
  if (isMovieLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 space-y-5">
              <div className="bg-neutral-900 rounded-2xl animate-pulse" style={{ aspectRatio: "16/9" }} />
              <div className="bg-neutral-900/60 rounded-2xl p-5 space-y-3">
                <div className="h-6 bg-neutral-800 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-neutral-800 rounded w-1/2 animate-pulse" />
                <div className="h-20 bg-neutral-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
              <div className="bg-neutral-900/60 rounded-2xl p-4 space-y-3">
                <div className="h-5 bg-neutral-800 rounded w-1/2 animate-pulse" />
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-neutral-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isMovieError) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không thể tải phim</h2>
          <p className="text-neutral-500 text-sm mb-6">
            {movieError?.message || "Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại sau."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => refetchMovie()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Thử lại
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!movieData) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500">Không tìm thấy dữ liệu phim</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors mx-auto"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          )}
        </div>
      </div>
    );
  }

  const episodeName = currentEpisode?.name || `Tập ${currentEpisodeIndex + 1}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .line-clamp-3 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#0a0a0a; }
        ::-webkit-scrollbar-thumb { background:#4c1d95; border-radius:4px; }
      `}</style>

      {/* Back button bar */}
      <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/60">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          )}
          <div className="flex items-center gap-2 ml-4">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-black text-sm tracking-tight">
              Anime<span className="text-violet-400">VietSub</span>
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* ─── 2-COLUMN LAYOUT ─── */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Video Player */}
            <VideoPlayer
              videoSrc={videoUrl}
              poster={movie.thumb_url || movie.poster_url}
              title={movie.name}
              episodeName={episodeName}
              onError={handleVideoError}
            />

            {/* Video error message */}
            {videoError && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 text-sm font-semibold">Lỗi phát video</p>
                  <p className="text-neutral-500 text-xs mt-1">
                    Không thể phát video từ server này. Vui lòng thử chọn server khác hoặc tập khác.
                  </p>
                </div>
              </div>
            )}

            {/* Server Selector (Mobile: show before episodes) */}
            <div className="lg:hidden">
              <ServerSelector
                servers={episodes}
                activeServer={activeServer}
                onServerChange={handleServerChange}
              />
            </div>

            {/* Episode List (Mobile) */}
            <div className="lg:hidden">
              <EpisodeGrid
                episodes={currentEpisodes}
                currentEpisode={currentEpisodeIndex + 1}
                onEpisodeSelect={handleEpisodeSelect}
                isLoading={isMovieLoading}
              />
            </div>

            {/* Movie Info */}
            <MovieInfoPanel movie={movie} movieData={movie} />

            {/* Comments */}
            <CommentSection
              comments={movieData?.comments || []}
              isLoggedIn={isLoggedIn}
            />
          </div>

          {/* RIGHT COLUMN (Desktop sidebar) */}
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Ad Banner */}
              <AdBanner size="normal" />

              {/* Server Selector */}
              <ServerSelector
                servers={episodes}
                activeServer={activeServer}
                onServerChange={handleServerChange}
              />

              {/* Episode List */}
              <EpisodeGrid
                episodes={currentEpisodes}
                currentEpisode={currentEpisodeIndex + 1}
                onEpisodeSelect={handleEpisodeSelect}
                isLoading={isMovieLoading}
              />

              {/* Ad Banner */}
              <AdBanner size="large" />

              {/* Recommended */}
              <RecommendedSidebar
                movies={recommendList}
                onMovieClick={(m) => onMovieClick && onMovieClick(m.slug || m._id)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}