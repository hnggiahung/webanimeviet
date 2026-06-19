# Hướng dẫn thiết lập Firebase cho Google Login

## Bước 1: Tạo Firebase Project

1. Truy cập https://console.firebase.google.com/
2. Đăng nhập bằng tài khoản Google của bạn
3. Nhấn **"Tạo dự án"** (Create a project)
4. Đặt tên dự án: **"AniVietSub"** (hoặc tên bạn muốn)
5. **Tắt** Google Analytics (không cần thiết cho dự án nhỏ)
6. Nhấn **"Tạo dự án"** và chờ vài giây

## Bước 2: Kích hoạt Google Authentication

1. Trong Firebase Console, vào menu trái chọn **"Authentication"** > **"Sign-in method"**
2. Nhấn **"Thêm nhà cung cấp mới"** (Add new provider)
3. Chọn **"Google"**
4. **Bật** công tắc "Enabled"
5. Trong mục "Project support email", chọn email của bạn
6. Nhấn **"Lưu"** (Save)

## Bước 3: Thêm Authorized Domain (cho localhost)

1. Trong Firebase Console, vào **"Authentication"** > **"Settings"** (tab Settings)
2. Trong mục **"Authorized domains"**, nhấn **"Add domain"**
3. Thêm: `localhost`
4. Nhấn **"Add"**

## Bước 4: Lấy thông tin cấu hình Firebase

1. Trong Firebase Console, vào **"Project Settings"** (biểu tượng bánh răng ⚙️ > Project settings)
2. Kéo xuống mục **"Your apps"** > Nhấn **"Web"** (biểu tượng `</>`)
3. **Đặt tên app**: "AniVietSub Web"
4. Nhấn **"Register app"**
5. Một hộp thoại hiện ra với đoạn code cấu hình, **copy lại** vì bạn sẽ cần nó.

Đoạn code cấu hình trông như thế này:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

## Bước 5: Gửi thông tin cho Cline

Sau khi hoàn thành các bước trên, hãy copy đoạn `firebaseConfig` và gửi lại cho tôi. Tôi sẽ tích hợp nó vào code của bạn.

---

> **Lưu ý quan trọng**: 
> - Khi deploy lên Netlify, bạn cần thêm domain Netlify vào "Authorized domains" trong Firebase Console.
> - Nếu bạn chạy ở local (127.0.0.1:5500), cũng cần thêm `127.0.0.1` vào Authorized domains.