import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'recharts', test: /\/node_modules\/recharts\// },
            { name: 'calendar', test: /\/node_modules\/(react-day-picker|date-fns)\// },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
})
