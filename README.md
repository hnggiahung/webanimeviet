# 🎬 AnimeStream - Web Phim Anime Tĩnh Chuyên Nghiệp

Một nền tảng xem phim anime chất lượng cao, xây dựng trên kiến trúc **Jamstack** (JavaScript, APIs, Markup).

## 📋 Cấu Trúc Dự Án

```
web phim hoạt hình 2026 tối ưu/
├── index.html          # Trang chủ (danh sách phim, tìm kiếm, lọc)
├── watch.html          # Trang xem phim (player, mục lục, bookmark)
├── css/
│   └── style.css       # Tất cả CSS tùy chỉnh (animations, responsive)
├── js/
│   ├── main.js         # Logic trang chủ (search, filter, render)
│   └── watch.js        # Logic trang xem phim (player, bookmark, timestamps)
├── data/
│   └── data.json       # Dữ liệu tất cả phim (JSON)
└── assets/             # Ảnh, icon, media khác
```

## ✨ Tính Năng Chính

### 🎯 Trang Chủ (index.html)
- ✅ **Dark Mode hiện đại** với gradient nền anime
- ✅ **Thanh tìm kiếm** thông minh với icon chibi
- ✅ **Bộ lọc danh mục** (Action, Adventure, Drama, Superhero)
- ✅ **Grid Card** hiển thị phim với overlay hiệu ứng
- ✅ **Responsive Mobile-First** (90%+ chiếm không gian trên mobile)
- ✅ **Section tính năng** giới thiệu những điểm nổi bật
- ✅ **Footer chuyên nghiệp** với link social

### 🎬 Trang Xem Phim (watch.html)
- ✅ **Layout 2 cột** (PC) / 1 cột (Mobile)
  - Cột chính: Video player (iframe)
  - Cột phụ: Danh sách mục lục tập phim
- ✅ **Mục lục tập (Timestamps)**
  - Click vào một mốc thời gian tự động tua đến đoạn đó
  - Hiển thị tên tập + giờ phút
  - Highlight mục lục active
- ✅ **Lưu dấu trang tự động (Bookmark)**
  - Lưu vị trí xem vào localStorage mỗi 5 giây
  - Lần tới vào lại sẽ có thông báo "Xem tiếp từ phút X"
  - Nút "Xem Tiếp" và "Bỏ Qua"
- ✅ **Chế độ Rạp Chiếu Phim (Cinema Mode)**
  - Click nút "Rạp Chiếu" → toàn bộ màn hình cho video
  - Nhấn ESC để thoát chế độ
- ✅ **Giao diện info phim**
  - Tiêu đề, mô tả, danh mục, thời lượng
  - Nút Chia Sẻ, Thích (placeholder)

## 🚀 Hướng Dẫn Sử Dụng

### 1️⃣ Mở Trang Web Cục Bộ
- Mở file `index.html` bằng trình duyệt (double-click hoặc kéo vào trình duyệt)
- Hoặc dùng Live Server extension trong VS Code

### 2️⃣ Thêm Phim Mới
1. Mở file `data/data.json`
2. Thêm object phim vào mảng `movies`:

```json
{
  "id": 6,
  "title": "Tên Phim",
  "description": "Mô tả phim",
  "cover_image": "URL ảnh cover",
  "category": "Action",
  "duration": "480 min",
  "video_url": "https://www.youtube.com/embed/VIDEO_ID",
  "timestamps": [
    { "time_in_seconds": 0, "episode_title": "Phần 1" },
    { "time_in_seconds": 5400, "episode_title": "Phần 2" }
  ]
}
```

### 3️⃣ Tùy Chỉnh Giao Diện
- **Màu sắc**: Chỉnh `--primary-color`, `--secondary-color` trong `css/style.css`
- **Font chữ**: Sửa font-family trong `css/style.css` (hiện dùng Segoe UI)
- **Hình nền**: Thay đổi `background` trong `style.css`

### 4️⃣ Deploy Lên Internet
#### Option A: GitHub Pages (Miễn Phí)
```bash
# 1. Tạo repo trên GitHub
# 2. Push code lên
git add .
git commit -m "Deploy AnimeStream"
git push origin main

# 3. Settings → Pages → Main branch → Save
# Truy cập: https://username.github.io/repo-name
```

#### Option B: Netlify (Miễn Phí)
1. Vào [netlify.com](https://netlify.com)
2. Kéo thả thư mục dự án
3. Xong! Link auto-generated

#### Option C: Vercel (Miễn Phí)
1. Vào [vercel.com](https://vercel.com)
2. Import dự án từ GitHub
3. Xong!

## 🔗 Cách Nhúng Video

### YouTube
```
https://www.youtube.com/embed/VIDEO_ID
```

### Google Drive
```
https://drive.google.com/file/d/FILE_ID/preview
```

### Terabox / OneDrive
Lấy link share rồi tạo iframe manually

## 📱 Responsive Design

| Device | Breakpoint | Grid |
|--------|-----------|------|
| Desktop | 1024px+ | 4-5 cột |
| Tablet | 768px-1023px | 2-3 cột |
| Mobile | <768px | 1-2 cột |

## 🎨 Tùy Chỉnh Màu Sắc

Mở `css/style.css`, tìm phần `:root` và sửa:

```css
:root {
  --primary-color: #ff6b00;        /* Màu cam chính */
  --secondary-color: #1a1a2e;      /* Màu tối */
  --tertiary-color: #16213e;       /* Màu tối sáng */
  --accent-color: #e94560;         /* Màu nhấn */
  --text-primary: #ffffff;         /* Chữ trắng */
  --text-secondary: #b0b0b0;       /* Chữ xám */
  --border-color: #333333;         /* Đường kẻ */
}
```

## 🔐 Bảo Mật & SEO

### SEO Cơ Bản
File `index.html` đã có:
- `meta description`
- `meta keywords`
- Semantic HTML5
- Structured Data (có thể thêm JSON-LD)

### Tối Ưu Hóa
1. **Tối ưu ảnh**: Compress ảnh cover (TinyPNG)
2. **Lazy Loading**: Thêm `loading="lazy"` vào `<img>`
3. **Minify CSS/JS**: Dùng tool như [Minifier.org](https://minifier.org)

## 🐛 Troubleshooting

### Phim không hiển thị
- Kiểm tra file `data/data.json` có hợp lệ (validate JSON)
- Check console (F12) xem có lỗi gì

### Video không phát
- Kiểm tra `video_url` có chính xác
- Nếu YouTube: kiểm tra VIDEO_ID
- Nếu Drive: file phải share công khai

### Bookmark không lưu
- Kiểm tra localStorage có bị disable
- Trong Chrome DevTools → Storage → LocalStorage

### CSS không load
- Refresh browser (Ctrl+Shift+R hoặc Cmd+Shift+R)
- Kiểm tra đường dẫn file CSS tương đối (`css/style.css`)

## 📚 Tài Liệu Thêm

- [Tailwind CSS](https://tailwindcss.com/docs)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [iframe postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

## 💡 Tips Nâng Cao

### Thêm Dark/Light Mode Toggle
Thêm button trong header để toggle class `dark-mode` toàn trang

### Service Worker (Offline Mode)
Thêm `service-worker.js` để web hoạt động offline

### Progressive Web App (PWA)
Thêm `manifest.json` để web có thể "cài đặt" như app

### Analytics
Thêm Google Analytics hoặc Plausible để tracking

## 📄 License

Dự án này có thể sử dụng tự do cho mục đích cá nhân.

---

**Made with ❤️ using HTML5, Tailwind CSS & Vanilla JavaScript**
