import axios from "axios";

// Use proxy in dev, direct URL in production
const API_BASE = import.meta.env.DEV ? "/api" : "https://ophim1.com/v1/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Accept": "application/json, text/plain, */*",
  },
});

// CDN image base URL from API response
const DEFAULT_CDN = "https://img.ophim.live";
const IMAGE_PATH = "/uploads/movies/";

/**
 * Construct full image URL from filename + CDN domain
 * API returns thumb_url/poster_url as just filenames, need to prepend CDN domain + path
 */
export function getFullImageUrl(filename, cdnDomain) {
  if (!filename) return "";
  // If already a full URL, return as-is
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  const base = cdnDomain || DEFAULT_CDN;
  return `${base}${IMAGE_PATH}${filename}`;
}

export async function fetchMovieList(page = 1) {
  // Sử dụng danh-sach/hoat-hinh để lấy đúng phim hoạt hình (category=hoat-hinh)
  // Kết hợp lọc theo quốc gia Nhật Bản để chỉ lấy anime Nhật
  try {
    const { data } = await apiClient.get("/danh-sach/hoat-hinh", { params: { page } });
    if (data?.data?.items && data.data.items.length > 0) {
      const apiData = data.data;
      const cdn = apiData.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
      const items = (apiData.items || []).map(item => normalizeMovieData(item, cdn));
      // Log cấu trúc country của item đầu tiên để debug
      if (items.length > 0) {
        console.log("✅ fetchMovieList[hoat-hinh]: first item country =", JSON.stringify(items[0].country));
        console.log("✅ fetchMovieList[hoat-hinh]: first item category =", JSON.stringify(items[0].category));
      }
      return {
        items: items,
        pagination: apiData.params || {},
        APP_DOMAIN_CDN_IMAGE: cdn,
      };
    }
  } catch (e) {
    console.warn("danh-sach/hoat-hinh failed, falling back:", e.message);
  }
  // Fallback: lấy danh sách chung (không lọc category)
  try {
    const { data } = await apiClient.get("/danh-sach", { params: { page } });
    const apiData = data.data;
    const cdn = apiData.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    return {
      items: (apiData.items || []).map(item => normalizeMovieData(item, cdn)),
      pagination: apiData.params || {},
      APP_DOMAIN_CDN_IMAGE: cdn,
    };
  } catch (e) {
    console.warn("danh-sach fallback also failed:", e.message);
    throw e;
  }
}

export async function fetchMovieDetail(slug) {
  const { data } = await apiClient.get(`/phim/${slug}`);
  const apiData = data.data;
  if (!apiData) return null;

  const cdn = apiData.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
  const item = apiData.item || {};
  // Episodes are INSIDE item
  const episodes = item.episodes || [];

  return {
    movie: normalizeMovieData(item, cdn),
    episodes: episodes, // raw episodes - links are already full URLs
    recommend: (apiData.recommend || []).map(r => normalizeMovieData(r, cdn)),
    comments: apiData.comments || [],
    seoOnPage: apiData.seoOnPage || {},
    breadCrumb: apiData.breadCrumb || [],
    params: apiData.params || {},
    APP_DOMAIN_CDN_IMAGE: cdn,
  };
}

export function isJapaneseAnime(movie) {
  // Kiểm tra: phim có quốc gia Nhật Bản (slug="nhat-ban") và ngôn ngữ Vietsub
  if (!movie || !movie.country || !Array.isArray(movie.country)) return false;
  const isJapan = movie.country.some((c) => c.slug === "nhat-ban");
  const isVietsub = movie?.lang === "Vietsub";
  return isJapan && isVietsub;
}

export function filterAnimeList(items) {
  if (!items || !Array.isArray(items)) return [];
  // Chỉ giữ lại anime Nhật Bản có Vietsub
  return items
    .filter((movie) => isJapaneseAnime(movie))
    .map((movie) => ({ ...movie, isVietsub: true }));
}

export function extractEpisodes(episodes, preferredLang = "Vietsub") {
  if (!episodes || !Array.isArray(episodes) || episodes.length === 0) return [];
  const preferred = episodes.find(
    (ep) => ep.server_name?.toLowerCase() === preferredLang.toLowerCase()
  );
  const server = preferred || episodes[0];
  if (!server || !server.server_data || !Array.isArray(server.server_data)) return [];
  return server.server_data.map((ep, index) => ({
    name: ep.name || `Tập ${index + 1}`,
    slug: ep.slug || "",
    filename: ep.filename || "",
    link_embed: ep.link_embed || "",
    link_m3u8: ep.link_m3u8 || "",
    link_direct: ep.link_direct || "",
  }));
}

export function getVideoUrl(episode) {
  if (!episode) return null;
  return episode.link_m3u8 || episode.link_direct || episode.link_embed || null;
}

export function isEmbedUrl(url) {
  if (!url) return false;
  return !url.includes(".m3u8") && !url.includes(".mp4");
}

export function normalizeMovieData(movie, cdnDomain) {
  if (!movie) return null;
  const thumbRaw = movie.thumb_url || movie.poster_url || "";
  const posterRaw = movie.poster_url || movie.thumb_url || "";
  return {
    id: movie._id || movie.slug,
    slug: movie.slug,
    name: movie.name || "Đang cập nhật",
    origin_name: movie.origin_name || "",
    content: movie.content || "",
    thumb_url: getFullImageUrl(thumbRaw, cdnDomain),
    poster_url: getFullImageUrl(posterRaw, cdnDomain),
    year: movie.year || "",
    quality: movie.quality || "",
    lang: movie.lang || "",
    time: movie.time || "",
    episode_current: movie.episode_current || "",
    episode_total: movie.episode_total || "",
    status: movie.status || "",
    category: movie.category || [],
    country: movie.country || [],
    rating: movie.tmdb?.vote_average || movie.rating || 0,
    isVietsub: movie.lang === "Vietsub",
  };
}