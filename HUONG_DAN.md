# 🚀 HƯỚNG DẪN NHANH - AnimeStream

## 1️⃣ MỞ NGAY

**Cách đơn giản nhất để xem giao diện:**

1. Tìm file `start.html` trong thư mục dự án
2. **Double-click** file này để mở trên trình duyệt
3. Click vào nút **"Vào Trang Chủ"** hoặc **"Xem Phim (Demo)"**

---

## 2️⃣ GIAO DIỆN ĐÃ ĐƯỢC TẠO

### 📱 Trang Chủ (index.html)
- Thanh header với logo & navigation
- **Hero section** với gradient nền anime đẹp
- **Thanh tìm kiếm** dạng vuông bo (như animevietsub)
- **Nút lọc danh mục** (Action, Adventure, Drama, Superhero)
- **Grid card phim** 4 cột (desktop), 2 cột (mobile)
- Mỗi card có: ảnh cover, overlay play button, tên phim, danh mục, thời lượng
- **Section tính năng** với 6 feature boxes
- **Footer** chuyên nghiệp

### 🎬 Trang Xem Phim (watch.html)
- **Layout 2 cột** trên PC (video + mục lục bên cạnh)
- **Layout 1 cột** trên mobile
- **Video player** (iframe nhúng)
- **Mục lục tập (Timestamps)**
  - Hiển thị danh sách các tập của phim
  - Click vào mục lục → video tự động tua đến đoạn đó
  - Highlight active episode
- **Thông tin phim**: tiêu đề, mô tả, danh mục, thời lượng
- **Nút Rạp Chiếu Phim** (Cinema Mode)
- **Auto-save Bookmark** (lưu lại vị trí đang xem)

---

## 3️⃣ CẤU TRÚC DỮ LIỆU

### File data/data.json chứa 5 phim demo:
1. **Naruto Shippuden** - 480 phút
2. **One Piece** - 480 phút
3. **Attack on Titan** - 360 phút
4. **Demon Slayer** - 420 phút
5. **My Hero Academia** - 450 phút

Mỗi phim có:
- `id` - ID duy nhất
- `title` - Tên phim
- `description` - Mô tả
- `cover_image` - Link ảnh bìa
- `category` - Danh mục
- `duration` - Thời lượng
- `video_url` - Link YouTube/Drive embed
- `timestamps` - Mảng các tập (time, episode_title)

---

## 4️⃣ THÊM PHIM MỚI

1. Mở file `data/data.json`
2. Thêm object mới vào mảng `movies`:

```json
{
  "id": 6,
  "title": "Tên Phim Mới",
  "description": "Mô tả ngắn về phim",
  "cover_image": "https://ảnh.com/image.jpg",
  "category": "Action",
  "duration": "480 min",
  "video_url": "https://www.youtube.com/embed/VIDEO_ID",
  "timestamps": [
    { "time_in_seconds": 0, "episode_title": "Tập 1" },
    { "time_in_seconds": 5400, "episode_title": "Tập 2" },
    { "time_in_seconds": 10800, "episode_title": "Tập 3" }
  ]
}
```

3. **Refresh** trang web để thấy phim mới

---

## 5️⃣ NHÚNG VIDEO

### Từ YouTube:
```
https://www.youtube.com/embed/dQw4w9WgXcQ
```
(Lấy VIDEO_ID từ URL: youtube.com/watch?v=**VIDEO_ID**)

### Từ Google Drive:
```
https://drive.google.com/file/d/FILE_ID/preview
```

### Từ Terabox / OneDrive:
- Tạo link share công khai
- Tạo iframe manual hoặc dùng link direct

---

## 6️⃣ TÙYCHỈNH GÀO DIỆN

### Thay Màu Sắc
Mở file `css/style.css`, tìm phần `:root`:

```css
:root {
  --primary-color: #ff6b00;      /* Màu cam (orange) */
  --accent-color: #e94560;       /* Màu nhấn (pink) */
  --secondary-color: #1a1a2e;    /* Màu tối */
  /* ... màu khác ... */
}
```

### Thay Font Chữ
Tìm trong `css/style.css` và sửa:
```css
font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;
```

### Thay Hình Nền
Tìm `background:` trong `css/style.css`

---

## 7️⃣ DEPLOY LÊN INTERNET (MIỄN PHÍ)

### ✅ GitHub Pages
1. Tạo repo trên GitHub
2. Push code lên: `git push origin main`
3. Settings → Pages → Main branch → Save
4. Link: `https://username.github.io/repo-name`

### ✅ Netlify
1. Vào [netlify.com](https://netlify.com)
2. Kéo thả thư mục dự án → Deploy
3. Link auto-generated

### ✅ Vercel
1. Vào [vercel.com](https://vercel.com)
2. Import từ GitHub
3. Auto-deploy mỗi khi push code

---

## 8️⃣ JAVASCRIPT CHÍNH

### **main.js** (Trang chủ)
- `loadMovies()` - Tải dữ liệu từ data.json
- `renderMovies()` - Hiển thị danh sách phim
- `searchMovies()` - Tìm kiếm phim
- `filterByCategory()` - Lọc theo danh mục

### **watch.js** (Trang xem phim)
- `loadMovieData()` - Tải info phim
- `renderWatchPage()` - Render trang xem
- `jumpToTimestamp()` - Click mục lục → tua video
- `saveBookmark()` - Lưu vị trí xem
- `loadBookmark()` - Tải bookmark & hiển thị thông báo
- `toggleCinemaMode()` - Bật/tắt chế độ rạp chiếu

---

## 9️⃣ THÊM ICON SEARCH

Trang chủ đã có icon search (magnifying glass) ở thanh tìm kiếm.

**Để thêm icon chibi:**
1. Download SVG icons từ [heroicons.com](https://heroicons.com) hoặc [feathericons.com](https://feathericons.com)
2. Thêm vào thư mục `assets/`
3. Sửa HTML để hiển thị icon

---

## 🔟 TROUBLESHOOTING

| Vấn Đề | Giải Pháp |
|--------|-----------|
| Phim không hiển thị | Kiểm tra JSON syntax, mở DevTools xem lỗi |
| Video không phát | Kiểm tra video_url, YouTube ID có đúng không |
| Bookmark không lưu | Refresh với Ctrl+Shift+R, kiểm tra localStorage |
| CSS không load | Refresh browser, kiểm tra đường dẫn tương đối |
| Mobile không responsive | Kiểm tra meta viewport tag |

---

## 🎨 HỌC THÊM

- 📖 [Tailwind CSS Docs](https://tailwindcss.com/docs)
- 📖 [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- 📖 [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## 📞 GHI CHÚ QUAN TRỌNG

✅ Web hoàn toàn **tĩnh** (không cần server)  
✅ Tất cả data lưu trong **data.json**  
✅ Bookmark lưu trong **localStorage** (local storage)  
✅ Video được nhúng từ **YouTube/Drive** (không up trực tiếp)  
✅ **Responsive** trên mọi thiết bị  
✅ **Chuyên nghiệp** và **hiện đại**  

---

**Made with ❤️ using HTML5, Tailwind CSS & Vanilla JavaScript**

Chúc bạn xây dựng thành công! 🚀
