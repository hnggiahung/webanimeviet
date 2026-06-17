# 📚 DOCUMENTATION - AnimeStream Web Phim Anime

> Một nền tảng xem phim anime chuyên nghiệp, xây dựng trên kiến trúc **Jamstack** với HTML5, Tailwind CSS, và Vanilla JavaScript.

---

## 🎯 Mục Tiêu Dự Án

✅ Tạo web phim anime **tĩnh** (không cần server)  
✅ Hỗ trợ phim dài **4-8 tiếng** (compilation)  
✅ **Lưu dấu trang thông minh** (bookmark)  
✅ **Mục lục tập phim** (timestamps)  
✅ **Chế độ rạp chiếu phim** (cinema mode)  
✅ **Responsive** trên mọi thiết bị  
✅ **Chuyên nghiệp** và **hiện đại**  

---

## 📁 Cấu Trúc Thư Mục

```
web phim hoạt hình 2026 tối ưu/
│
├── index.html              # 🏠 Trang Chủ
├── watch.html              # 📺 Trang Xem Phim
├── start.html              # 🚀 Trang Khởi Động (Demo)
│
├── css/
│   └── style.css           # 🎨 CSS Chính & Animations
│
├── js/
│   ├── main.js             # ⚙️ Logic Trang Chủ
│   └── watch.js            # ⚙️ Logic Trang Xem Phim
│
├── data/
│   └── data.json           # 📊 Dữ Liệu Phim (JSON)
│
├── assets/                 # 🖼️ Ảnh & Media
│
├── README.md               # 📖 Readme
├── HUONG_DAN.md           # 🚀 Hướng Dẫn Nhanh
├── manifest.json           # 📱 PWA Configuration
├── schema.json             # 🔍 JSON-LD (SEO)
├── sitemap.xml             # 🗺️ Sitemap
├── robots.txt              # 🤖 Robots.txt
└── .htaccess               # ⚙️ Apache Config
```

---

## 🎬 Tính Năng Chi Tiết

### 1. 🏠 Trang Chủ (index.html)

#### UI/UX
- **Header Sticky** với logo & navigation
- **Hero Section** với gradient nền + search bar
- **Thanh Tìm Kiếm** dạng vuông bo (như animevietsub)
- **Nút Lọc Danh Mục** (All, Action, Adventure, Drama, Superhero)
- **Grid Card Phim** responsive 4→2→1 cột
- **Feature Section** với 6 tính năng nổi bật
- **Footer** chuyên nghiệp

#### Tính Năng
```javascript
// main.js chứa:
- loadMovies()           // Tải data từ JSON
- renderMovies()         // Render card phim
- searchMovies(query)    // Tìm kiếm real-time
- filterByCategory()     // Lọc theo danh mục
```

#### Responsive Design
| Screen | Layout | Grid |
|--------|--------|------|
| PC (1024px+) | Header + Hero + Filter + Grid | 4 cột |
| Tablet (768px-1023px) | Rút gọn | 2-3 cột |
| Mobile (<768px) | Stack | 1-2 cột |

---

### 2. 📺 Trang Xem Phim (watch.html)

#### Layout
```
┌─────────────────────────────────────────┐
│  Header (sticky)                        │
├─────────────────────┬───────────────────┤
│                     │                   │
│  Video Player       │  Timestamps       │
│  (iframe 16:9)      │  (Mục Lục)        │
│                     │                   │
├─────────────────────┴───────────────────┤
│  Video Info (tiêu đề, mô tả, stats)    │
└─────────────────────────────────────────┘

Mobile: Stack 1 cột
```

#### Tính Năng

**🎥 Video Player**
- Iframe nhúng YouTube/Drive
- Nút Cinema Mode (fullscreen tùy chỉnh)
- Controls mặc định của player

**📚 Mục Lục (Timestamps)**
```
Tập 1: 00:00
Tập 2: 01:30  ← Click → video tua tới
Tập 3: 03:00
...
```
- Click → tua video tới mốc đó
- Highlight active episode
- Max-height 600px, overflow scroll

**🔖 Bookmark (Auto-Save)**
- Lưu mỗi 5 giây vào localStorage
- Lần tới vào: "Bạn có muốn xem tiếp từ phút X?"
- 2 button: "Xem Tiếp" / "Bỏ Qua"

**🎬 Cinema Mode**
- Click "Rạp Chiếu" → fullscreen tùy chỉnh
- Nhấn ESC để thoát
- Toàn bộ màn hình cho video

#### Logic (watch.js)
```javascript
- getMovieIdFromURL()      // Lấy ID từ URL
- loadMovieData()          // Tải info phim
- renderWatchPage()        // Render giao diện
- jumpToTimestamp()        // Click tập → tua video
- saveBookmark()           // Lưu vị trí
- loadBookmark()           // Tải & show notification
- toggleCinemaMode()       // Bật/tắt fullscreen
- startAutoSaveBookmark()  // Auto-save mỗi 5s
```

---

## 📊 Cấu Trúc Data (data.json)

```json
{
  "movies": [
    {
      "id": 1,
      "title": "Naruto Shippuden",
      "description": "Mô tả ngắn",
      "cover_image": "https://...",
      "category": "Action",
      "duration": "480 min",
      "video_url": "https://www.youtube.com/embed/...",
      "timestamps": [
        {
          "time_in_seconds": 0,
          "episode_title": "Phần 1: Khởi Đầu"
        },
        {
          "time_in_seconds": 5400,
          "episode_title": "Phần 2: Pain's Attack"
        }
      ]
    }
  ]
}
```

### Quy Tắc Dữ Liệu
- `id` - Số nguyên duy nhất (1, 2, 3...)
- `title` - Tên phim (string)
- `description` - Mô tả 50-100 ký tự
- `cover_image` - URL ảnh (https://)
- `category` - Action|Adventure|Drama|Superhero
- `duration` - Format "480 min"
- `video_url` - Link embed YouTube/Drive
- `timestamps` - Array các tập
  - `time_in_seconds` - Thời gian (0, 5400, 10800...)
  - `episode_title` - Tên tập

---

## 🎨 CSS & Animations

File `css/style.css` chứa:

### Variables
```css
:root {
  --primary-color: #ff6b00;     /* Orange */
  --secondary-color: #1a1a2e;   /* Dark */
  --tertiary-color: #16213e;    /* Dark Light */
  --accent-color: #e94560;      /* Pink */
  --text-primary: #ffffff;      /* White */
  --text-secondary: #b0b0b0;    /* Gray */
  --border-color: #333333;      /* Border */
}
```

### Animations
```css
@keyframes fadeIn        /* Fade in từ bottom */
@keyframes slideInLeft   /* Slide từ trái */
@keyframes slideInRight  /* Slide từ phải */
@keyframes pulse         /* Pulse effect */
@keyframes glow          /* Glow effect */
```

### Components
- `.movie-card` - Card phim (hover: translateY + shadow)
- `.search-box` - Thanh tìm kiếm (focus: border color)
- `.filter-btn` - Nút lọc (active: background color)
- `.timestamp-item` - Mục lục (active: highlight)
- `.bookmark-notification` - Thông báo bookmark
- `.cinema-mode` - Fullscreen custom

---

## 🔧 Customization Guide

### 1. Thay Màu Sắc

**Option A: Global Colors**
```css
/* css/style.css */
:root {
  --primary-color: #6366f1;      /* Indigo */
  --accent-color: #ec4899;       /* Pink */
  --secondary-color: #0f172a;    /* Dark Slate */
}
```

**Option B: Per-Component**
```css
/* Thay màu các button */
.filter-btn:hover {
  background: #6366f1;           /* Indigo */
  border-color: #6366f1;
}
```

### 2. Thay Gradient Hero

```css
/* Trong style.css hoặc inline */
.hero-pattern {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
}
```

### 3. Thay Font Chữ

```css
html, body {
  font-family: 'Inter', 'Roboto', sans-serif;
}

h1, h2, h3 {
  font-family: 'Poppins', sans-serif;
}
```

### 4. Thay Logo & Icon

```html
<!-- Trong header -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
  <!-- Thay SVG icon ở đây -->
</svg>
```

### 5. Thêm Phim Mới

1. Mở `data/data.json`
2. Thêm object:
```json
{
  "id": 6,
  "title": "One Punch Man",
  "description": "...",
  "cover_image": "https://...",
  "category": "Action",
  "duration": "360 min",
  "video_url": "https://www.youtube.com/embed/...",
  "timestamps": [
    { "time_in_seconds": 0, "episode_title": "Tập 1" }
  ]
}
```

---

## 🚀 Deployment

### GitHub Pages (Miễn Phí)
```bash
# 1. Tạo repo: animestream
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/animestream.git
git push -u origin main

# 2. Settings → Pages → Source: main → Save
# 3. URL: https://username.github.io/animestream/
```

### Netlify (Miễn Phí)
1. Đăng nhập [netlify.com](https://netlify.com)
2. Kéo thả thư mục dự án
3. Auto-deploy

### Vercel (Miễn Phí)
1. Đăng nhập [vercel.com](https://vercel.com)
2. Import từ GitHub
3. Deploy

### Custom Server (Hosting)
1. Upload tất cả file via FTP
2. Cấu hình `.htaccess` (Apache)
3. Update sitemap.xml với domain

---

## 🔍 SEO Optimization

### ✅ Đã Implement
- [x] Meta tags (title, description, keywords)
- [x] Semantic HTML5
- [x] sitemap.xml
- [x] robots.txt
- [x] schema.json (JSON-LD)
- [x] Open Graph tags (có thể thêm)
- [x] Mobile-first responsive

### 📝 TODO: Thêm

**Open Graph Tags**
```html
<meta property="og:title" content="AnimeStream" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://..." />
<meta property="og:url" content="https://..." />
<meta property="og:type" content="website" />
```

**Twitter Card**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="AnimeStream" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://..." />
```

---

## 📱 Progressive Web App (PWA)

### Đã Setup
- [x] manifest.json
- [x] Icons (SVG)
- [x] Theme color
- [x] Start URL

### Tính Năng
- 📦 Có thể "cài đặt" như app
- 🔄 Offline support (thêm service-worker.js)
- ⚡ Fast loading
- 📱 Mobile-friendly

### Service Worker (Optional)
```javascript
// sw.js - Offline support
const CACHE_NAME = 'animestream-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/watch.html',
  '/css/style.css',
  '/js/main.js',
  '/js/watch.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

---

## 🐛 Troubleshooting

### ❌ Phim không hiển thị
**Nguyên nhân:** JSON có lỗi syntax  
**Giải pháp:**
```bash
# Check JSON validity
# https://jsonlint.com/
# Hoặc DevTools → Console xem lỗi
```

### ❌ Video không phát
**Nguyên nhân:** video_url sai  
**Giải pháp:**
```
YouTube: https://www.youtube.com/embed/VIDEO_ID
Google Drive: https://drive.google.com/file/d/FILE_ID/preview
```

### ❌ Bookmark không lưu
**Nguyên nhân:** localStorage bị disable  
**Giải pháp:**
- Chrome: DevTools → Settings → Privacy → Cookies allowed
- Hoặc: Disable incognito mode

### ❌ CSS không load trên server
**Nguyên nhân:** Đường dẫn tương đối sai  
**Giải pháp:**
```html
<!-- ❌ Sai -->
<link rel="stylesheet" href="/css/style.css">

<!-- ✅ Đúng -->
<link rel="stylesheet" href="css/style.css">
```

---

## 🎓 Learning Resources

| Topic | Resource |
|-------|----------|
| HTML5 | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML) |
| CSS | [CSS-Tricks](https://css-tricks.com/) |
| Tailwind | [Tailwind Docs](https://tailwindcss.com/docs) |
| JavaScript | [JavaScript.info](https://javascript.info/) |
| localStorage | [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) |
| Fetch API | [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) |

---

## 💡 Advanced Features (TODO)

- [ ] Dark/Light Mode Toggle
- [ ] User accounts & watchlist
- [ ] Comments system
- [ ] Rating system
- [ ] Search suggestions
- [ ] Continue watching list
- [ ] Favorite movies
- [ ] Export/Import bookmarks
- [ ] Analytics
- [ ] Multi-language support

---

## 📄 License

Dự án này có thể sử dụng tự do cho mục đích cá nhân và học tập.

---

## 👨‍💻 Contributor Notes

- **Created:** 2026-06-17
- **Framework:** Vanilla JS + Tailwind CSS
- **Architecture:** Jamstack (Static)
- **Browser Support:** Chrome, Firefox, Safari, Edge (mới nhất)

---

**Made with ❤️ for anime lovers** 🎬✨
