import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'github' ? '/onboarding-eng/' : '/',
  plugins: [react()],
  server: {
    allowedHosts: ['.onamp.dev'],
  },
}))
