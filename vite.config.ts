import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // 判断是否是生产环境构建
    const isProduction = mode === 'production';
    
    // ✨✨✨ 核心修改：设置 CDN 地址 ✨✨✨
    // 如果是开发环境(npm run dev)，用 '/'
    // 如果是生产环境(npm run build)，用你的 CDN 地址
    const cdnBase = isProduction ? 'https://cdn.dolphindb.cn/dolphinmind/' : '/';

    return {
      // 设置基础路径
      base: cdnBase, 
      
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['dev.dolphindb.cloud', 'chat.dolphindb.cloud'],
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // 可选：为了配合 CDN，构建时可以开启 manifest，方便运维工具抓取文件列表
      build: {
        manifest: true, 
      }
    };
});