
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 🌟 ทำให้แอปอัปเดตเวอร์ชันใหม่เบื้องหลังอัตโนมัติ
      manifest: {
        name: 'Admin บ้านเรา', 
        short_name: 'ban rao',
        description: 'ระบบบริริหารชุมชน บริหารประปา, บริหารเงินกอนทุน และอื่นๆ ',
        theme_color: '#dc2626', // 🌟 สีขอบด้านบนของแอปบนมือถือ (ใช้สีแดง)
        background_color: '#ffffff',
        display: 'standalone', // 🌟 บังคับให้แสดงเต็มจอ ไม่มีแท็บ URL ของเบราว์เซอร์
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});
