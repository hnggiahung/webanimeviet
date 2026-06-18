/**
 * firebase.js - Cấu hình Firebase và Google Authentication
 * 
 * HƯỚNG DẪN:
 * 1. Vào https://console.firebase.google.com/ tạo project
 * 2. Vào Authentication > Sign-in method > Bật Google
 * 3. Vào Project Settings > Your apps > Thêm Web App
 * 4. Copy firebaseConfig bên dưới và thay vào chỗ "THAY_ME"
 * 5. Thêm domain "localhost" và "127.0.0.1" vào Authorized domains
 */

// ====== CẤU HÌNH FIREBASE - ĐÃ CẬP NHẬT ======
const firebaseConfig = {
    apiKey: "AIzaSyCP90orOkuf_jEh0oeL2v_fW5-8MarPY_k",
    authDomain: "web-amini.firebaseapp.com",
    projectId: "web-amini",
    storageBucket: "web-amini.firebasestorage.app",
    messagingSenderId: "625272342701",
    appId: "1:625272342701:web:320276a3f674e6f6635e24",
    measurementId: "G-YXDSWM9B8M"
};

// ====== KIỂM TRA CẤU HÌNH ======
function isFirebaseConfigured() {
    return firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10 && firebaseConfig.projectId && firebaseConfig.projectId.length > 3;
}

// ====== KHỞI TẠO FIREBASE ======
let firebaseApp = null;
let auth = null;

function initFirebase() {
    if (!isFirebaseConfigured()) {
        console.warn('⚠️ Firebase chưa được cấu hình. Bỏ qua đăng nhập.');
        return false;
    }
    try {
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK chưa được tải.');
            return false;
        }
        // Tránh khởi tạo nhiều lần
        if (firebase.apps && firebase.apps.length > 0) {
            firebaseApp = firebase.apps[0];
            auth = firebase.auth(firebaseApp);
            console.log('✅ Firebase already initialized');
            return true;
        }
        firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        auth.useDeviceLanguage(); // Tự động dùng ngôn ngữ trình duyệt
        console.log('✅ Firebase initialized');
        return true;
    } catch (e) {
        console.error('⚠️ Firebase init error:', e.message);
        return false;
    }
}

// ====== ĐĂNG NHẬP GOOGLE ======
window.signInWithGoogle = function() {
    if (!auth) {
        if (!initFirebase()) {
            alert('Firebase chưa được cấu hình. Vui lòng thiết lập Firebase trước.');
            return;
        }
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log('✅ Đăng nhập thành công:', user.displayName);
            
            // Lưu thông tin user vào localStorage
            const userData = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLogin: Date.now()
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Cập nhật UI
            updateUIForLoggedInUser(userData);
        })
        .catch((error) => {
            console.error('⚠️ Đăng nhập thất bại:', error.code, error.message);
            if (error.code === 'auth/popup-blocked') {
                alert('Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này.');
            } else if (error.code === 'auth/unauthorized-domain') {
                alert('Domain chưa được ủy quyền. Vui lòng thêm domain này vào Firebase Console.');
            }
        });
};

// ====== ĐĂNG XUẤT ======
window.signOut = function() {
    if (!auth) return;
    
    auth.signOut().then(() => {
        console.log('✅ Đã đăng xuất');
        localStorage.removeItem('currentUser');
        updateUIForLoggedOutUser();
    }).catch((error) => {
        console.error('⚠️ Đăng xuất thất bại:', error.message);
    });
};

// ====== CẬP NHẬT UI KHI ĐĂNG NHẬP ======
function updateUIForLoggedInUser(user) {
    // Desktop login button -> avatar
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = `
            <span class="user-avatar-btn" onclick="signOut()" title="Đăng xuất">
                <img src="${user.photoURL || '/logo.jpg.jpg'}" alt="${user.displayName || 'User'}" 
                     onerror="this.src='/logo.jpg.jpg'">
                <span class="avatar-name">${user.displayName || 'User'}</span>
            </span>
        `;
        loginBtn.className = 'ml-2 inline-flex items-center';
        loginBtn.href = '#';
    }
    
    // Mobile login button -> avatar
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    if (loginBtnMobile) {
        loginBtnMobile.innerHTML = `
            <img src="${user.photoURL || '/logo.jpg.jpg'}" alt="${user.displayName || 'User'}" 
                 class="w-6 h-6 rounded-full object-cover"
                 onerror="this.src='/logo.jpg.jpg'">
        `;
        loginBtnMobile.className = 'p-0.5 bg-transparent hover:bg-transparent';
        loginBtnMobile.onclick = signOut;
    }
    
    // Cập nhật tất cả nút "Đăng nhập" trong sidebar thành avatar
    document.querySelectorAll('.sidebar-sticky a[href*="accounts.google.com"]').forEach(el => {
        if (el.textContent.includes('Đăng nhập')) {
            el.textContent = `👤 ${user.displayName || 'User'}`;
            el.href = '#';
            el.onclick = (e) => { e.preventDefault(); signOut(); };
            el.className = 'px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-lg shadow-green-600/20 whitespace-nowrap';
        }
    });
}

// ====== CẬP NHẬT UI KHI ĐĂNG XUẤT ======
function updateUIForLoggedOutUser() {
    // Desktop login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Đăng nhập
        `;
        loginBtn.className = 'ml-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors duration-200 inline-flex items-center gap-1.5';
        loginBtn.onclick = (e) => { e.preventDefault(); window.signInWithGoogle(); };
    }
    
    // Mobile login button
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    if (loginBtnMobile) {
        loginBtnMobile.innerHTML = 'Đăng nhập';
        loginBtnMobile.className = 'px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition';
        loginBtnMobile.onclick = window.signInWithGoogle;
    }
    
    // Sidebar login buttons
    document.querySelectorAll('.sidebar-sticky a[href*="accounts.google.com"]').forEach(el => {
        if (el.textContent.includes('Đăng nhập') || el.textContent.includes('@') || el.textContent.includes('👤')) {
            el.textContent = 'Đăng nhập';
            el.href = 'https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=email%20profile';
            el.onclick = null;
            el.className = 'px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-lg shadow-red-600/20 whitespace-nowrap';
        }
    });
}

// ====== KHỞI TẠO KHI TRANG TẢI XONG ======
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra xem có user đã lưu trong localStorage không
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            updateUIForLoggedInUser(userData);
        } catch (e) {
            localStorage.removeItem('currentUser');
        }
    }
    
    // Khởi tạo Firebase nếu đã cấu hình
    if (isFirebaseConfigured()) {
        initFirebase();
    }
    
    // Gắn sự kiện cho các nút đăng nhập
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            if (loginBtn.textContent.includes('Đăng nhập')) {
                e.preventDefault();
                window.signInWithGoogle();
            }
        });
    }
    
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    if (loginBtnMobile) {
        loginBtnMobile.addEventListener('click', (e) => {
            if (loginBtnMobile.textContent.includes('Đăng nhập')) {
                e.preventDefault();
                window.signInWithGoogle();
            }
        });
    }
});