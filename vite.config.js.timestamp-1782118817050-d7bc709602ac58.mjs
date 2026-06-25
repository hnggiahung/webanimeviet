// vite.config.js
import { defineConfig } from "file:///C:/Users/Hoang%20Hung%20ART/Documents/web%20phim%20ho%E1%BA%A1t%20h%C3%ACnh%202026%20t%E1%BB%91i%20%C6%B0u/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Hoang%20Hung%20ART/Documents/web%20phim%20ho%E1%BA%A1t%20h%C3%ACnh%202026%20t%E1%BB%91i%20%C6%B0u/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/Hoang%20Hung%20ART/Documents/web%20phim%20ho%E1%BA%A1t%20h%C3%ACnh%202026%20t%E1%BB%91i%20%C6%B0u/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: "https://ophim1.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/v1/api"),
        secure: false
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIb2FuZyBIdW5nIEFSVFxcXFxEb2N1bWVudHNcXFxcd2ViIHBoaW0gaG9cdTFFQTF0IGhcdTAwRUNuaCAyMDI2IHRcdTFFRDFpIFx1MDFCMHVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhvYW5nIEh1bmcgQVJUXFxcXERvY3VtZW50c1xcXFx3ZWIgcGhpbSBob1x1MUVBMXQgaFx1MDBFQ25oIDIwMjYgdFx1MUVEMWkgXHUwMUIwdVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSG9hbmclMjBIdW5nJTIwQVJUL0RvY3VtZW50cy93ZWIlMjBwaGltJTIwaG8lRTElQkElQTF0JTIwaCVDMyVBQ25oJTIwMjAyNiUyMHQlRTElQkIlOTFpJTIwJUM2JUIwdS92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9vcGhpbTEuY29tJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcvdjEvYXBpJyksXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFzYSxTQUFTLG9CQUFvQjtBQUNuYyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsVUFBVSxTQUFTO0FBQUEsUUFDbkQsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
