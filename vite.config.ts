import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
      react()
  ],
  resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@lib': path.resolve(__dirname, 'src/lib'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@plugin-shared': path.resolve(__dirname, 'src/plugins/shared'),
        '@plugin-forum': path.resolve(__dirname, 'src/plugins/forum-builder'),
        '@plugin-community': path.resolve(__dirname, 'src/plugins/community'),
        '@plugin-course': path.resolve(__dirname, 'src/plugins/course-builder'),
        '@plugin-classroom': path.resolve(__dirname, 'src/plugins/classroom'),
        '@plugin-calendar': path.resolve(__dirname, 'src/plugins/calendar'),
        '@plugin-members': path.resolve(__dirname, 'src/plugins/members'),
        '@plugin-merchandise': path.resolve(__dirname, 'src/plugins/merchandise'),
        '@plugin-about': path.resolve(__dirname, 'src/plugins/about'),
        '@plugin-community-about': path.resolve(__dirname, 'src/plugins/community-about'),
        '@plugin-community-dashboard': path.resolve(__dirname, 'src/plugins/community-dashboard')
      },
    },
})
