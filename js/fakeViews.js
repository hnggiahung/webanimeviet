/**
 * fakeViews.js - Fake lượt xem với dao động ngẫu nhiên
 * Lưu vào sessionStorage để giữ ổn định trong session
 */

export function getFakeViews(animeId, baseViews) {
  const key = `views_${animeId}`;
  const stored = sessionStorage.getItem(key);
  if (stored) return parseInt(stored);

  // Dao động ±2%
  const variance = baseViews * 0.02;
  const views = Math.floor(baseViews + (Math.random() - 0.5) * variance);
  sessionStorage.setItem(key, views);
  return views;
}

export function formatViews(views) {
  if (views >= 1000000) 
    return (views / 1000000).toFixed(1) + 'tr lượt xem';
  if (views >= 1000) 
    return Math.floor(views / 1000) + 'k lượt xem';
  return views + ' lượt xem';
}

// Views cơ bản theo anime
window.ANIME_BASE_VIEWS = {
  'dr-stone-4th-season': 10278522,
  'rezero-kara-hajimeru-isekai-seikatsu-4th': 1349931,
  'chao-mung-den-voi-lop-hoc-de-cao-thuc-luc-4': 542371,
  'class-de-2banme-ni-kawaii-onnanoko': 1473472,
  'mai-moi-cho-doc-su': 820300,
  'cuoc-song-nong-dan-o-the-gioi-khac-2': 650000,
  'haibara-kun-no-tsuyokute-seishun-new-game': 538765,
  'awajima-hyakkei': 220802,
  'buc-tuong-bang': 493640,
  'canh-hoa-luan-hoi': 180000
};

// Apply formatViews to global use
window.getFakeViews = function(animeId, baseViews) {
  const key = `views_${animeId}`;
  const stored = sessionStorage.getItem(key);
  if (stored) return parseInt(stored);
  const variance = baseViews * 0.02;
  const views = Math.floor(baseViews + (Math.random() - 0.5) * variance);
  sessionStorage.setItem(key, views);
  return views;
};

window.formatViews = function(views) {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'tr lượt xem';
  if (views >= 1000) return Math.floor(views / 1000) + 'k lượt xem';
  return views + ' lượt xem';
};