import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Scan every source file at startup, not just what index.html reaches eagerly. Otherwise the
    // lazily loaded lesson page discovers its dependencies on first visit and Vite reloads the page.
    entries: ['index.html', 'src/**/*.{ts,tsx}'],
  },
})
