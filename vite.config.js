import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Automatically sets correct base URL for GitHub Pages
// Locally: '/'   |   On GitHub Pages: '/tikflow/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
})
