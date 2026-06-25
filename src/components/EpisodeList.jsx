import { useState } from "react";
import { Play, Check, Clock, Film } from "lucide-react";

export default function EpisodeList({ episodes, currentEp, onSelectEpisode }) {
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"

  // Default mock episode data if none provided
  const episodeData = episodes || Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Tập ${i + 1}`,
    duration: `${23 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}`,
    thumbnail: `https://placehold.co/320x180/1e1e2e/6366f1?text=EP+${i + 1}`,
    isWatched: i < 5,
    releaseDate: i === 0 ? "Hôm nay" : i === 1 ? "Hôm qua" : `${i} ngày trước`,
  }));

  const currentEpisode = currentEp || 1;

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-violet-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Danh Sách Tập</h3>
          <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {episodeData.length}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
              viewMode === "list"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            DS
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
              viewMode === "grid"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Ô
          </button>
        </div>
      </div>

      {/* Sort & filter */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/40">
        <span className="text-gray-500 text-[10px]">
          Đang xem: <span className="text-violet-400 font-semibold">Tập {currentEpisode}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button className="text-gray-500 hover:text-violet-400 text-[10px] transition-colors px-2 py-0.5 bg-gray-800/40 rounded-md">
            Mới nhất
          </button>
          <button className="text-gray-500 hover:text-violet-400 text-[10px] transition-colors px-2 py-0.5 bg-gray-800/40 rounded-md">
            Chưa xem
          </button>
        </div>
      </div>

      {/* Episode list */}
      <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
        {viewMode === "list" ? (
          <div className="divide-y divide-gray-800/40">
            {episodeData.map((ep) => {
              const isActive = ep.number === currentEpisode;
              return (
                <div
                  key={ep.id}
                  onClick={() => onSelectEpisode?.(ep.number)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-violet-600/10 border-l-2 border-violet-500"
                      : "hover:bg-gray-800/40 border-l-2 border-transparent"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                    <img
                      src={ep.thumbnail}
                      alt={`Tập ${ep.number}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {ep.isWatched && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      isActive ? "text-violet-300" : "text-gray-300"
                    }`}>
                      {ep.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-gray-600 text-[10px]">
                        <Clock className="w-2.5 h-2.5" />
                        {ep.duration}
                      </span>
                      <span className="text-gray-600 text-[10px]">{ep.releaseDate}</span>
                    </div>
                  </div>

                  {/* Play button / status */}
                  {isActive ? (
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </div>
                  ) : ep.isWatched ? (
                    <div className="w-7 h-7 rounded-full bg-green-600/20 border border-green-600/40 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600/20 transition-colors">
                      <Play className="w-3 h-3 text-gray-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-3 gap-2 p-4">
            {episodeData.map((ep) => {
              const isActive = ep.number === currentEpisode;
              return (
                <div
                  key={ep.id}
                  onClick={() => onSelectEpisode?.(ep.number)}
                  className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer group transition-all duration-200 ${
                    isActive ? "ring-2 ring-violet-500" : ""
                  }`}
                >
                  <img
                    src={ep.thumbnail}
                    alt={`Tập ${ep.number}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center">
                    {isActive ? (
                      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    ) : (
                      <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {ep.number}
                      </span>
                    )}
                  </div>
                  {/* Episode number badge */}
                  <div className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : ep.isWatched
                      ? "bg-green-600/80 text-white"
                      : "bg-black/60 text-gray-300"
                  }`}>
                    {ep.number}
                  </div>
                  {/* Duration */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded">
                    {ep.duration}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}