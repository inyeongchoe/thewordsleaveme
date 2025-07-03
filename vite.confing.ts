import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',                     // 프로젝트 루트에서 html 불러오기
  publicDir: 'public',           // 정적 자원(public) 폴더

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // '@/...'로 src 접근
    },
  },

  build: {
    outDir: 'dist',              // 빌드 산출물 디렉터리
    rollupOptions: {
      input: 'index.html',       // 엔트리 HTML 파일
    },
  },

  server: {
    port: 5173,                 // 개발 서버 포트
    open: true,                 // 서버 시작 시 브라우저 자동 오픈
  },
});