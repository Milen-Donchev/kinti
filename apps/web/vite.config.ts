import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss() as PluginOption],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          calendar: ['date-fns', 'react-day-picker'],
          forms: ['@hookform/resolvers', 'react-hook-form', 'zod'],
          query: ['@tanstack/react-query'],
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: [
            '@radix-ui/react-popover',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'lucide-react',
            'tailwind-merge',
          ],
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      react: fileURLToPath(new URL('../../node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(
        new URL('../../node_modules/react-dom', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
  },
})
