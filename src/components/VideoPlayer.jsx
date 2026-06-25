import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react";

export default function VideoPlayer({ videoSrc, poster, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    const ct = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(ct);
    setDuration(dur);
    setProgress(dur > 0 ? (ct / dur) * 100 : 0);
  }

  function handleSeek(e) {
    if (!videoRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    videoRef.current.currentTime = pct * duration;
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleFullscreen() {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.parentElement.requestFullscreen();
    }
  }

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden group shadow-2xl shadow-black/50">
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain bg-black"
          playsInline
        />

        {/* Gradient overlay at bottom for controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Center play button when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-violet-500/40 transition-transform hover:scale-110">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
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
                  {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-white" />}
                </button>
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
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