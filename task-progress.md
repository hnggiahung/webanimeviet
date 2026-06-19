# Task Progress - Tối ưu Performance ✅

- [x] Step 1: Fix default tab = "Tất cả" (was Anime)
- [x] Step 2: Simplify hover card (dark theme #1e1e1e, no buttons, pointer-events: none, debounce 100ms)
- [x] Step 3: Simplify sidebar Đề Xuất (text only, 13px, #f5c518, truncate 1 dòng, no images)
- [x] Step 4: Lazy load ảnh trending row (Intersection Observer, data-src, placeholder #1a1a1a)
- [x] Step 5: Fix banner min-height: 400px + background fallback #1a1a1a
- [x] Step 6: Xóa animation phức tạp, tối ưu trending overlay (chỉ opacity transition)
- [x] Step 7: Tất cả thay đổi đã hoàn tất

## Tổng kết thay đổi:

### js/main.js:
- `setDefaultAnimeTab()`: Đổi từ tab "Anime" → "Tất cả"
- `renderBannerSidebar()`: Bỏ ảnh thumbnail, chỉ text + số tập
- `renderTopAnimeRow()`: Giới hạn 10 item, dùng data-src + Intersection Observer lazy load
- `setupHoverInfoCard()`: Debounce 100ms, đơn giản hóa
- `setupTrendingLazyLoad()`: Hàm mới cho lazy load ảnh trending

### css/style.css:
- `.hover-info-card`: Background #1e1e1e, border 1px rgba(255,255,255,0.15), pointer-events: none, ẩn footer/buttons
- `.banner-sidebar-item`: Text-only, #f5c518, no thumbnails
- `.top-anime-overlay`: Chỉ opacity transition, bỏ scale animation
- `.top-anime-play-btn`: Bỏ transform/opacity animation phức tạp