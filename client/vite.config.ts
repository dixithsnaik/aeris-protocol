import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { readFileSync, watch } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

function tunnelLogger() {
  const file = resolve(dirname(fileURLToPath(import.meta.url)), "src/config/tunnel.json")
  return {
    name: "tunnel-logger",
    configureServer(server) {
      watch(file, () => {
        try {
          const { baseUrl } = JSON.parse(readFileSync(file, "utf8"))
          if (baseUrl) server.config.logger.info(`  ➜  Public:  ${baseUrl}`)
        } catch {
          // ignore bad json while the file is being rewritten
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const api = env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      tunnelLogger(),
    ],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"],
      proxy: {
        "/auth": api,
        "/health": api,
        "/properties": api,
        "/passport/verify": api,
        "/static": api,
      },
    },
  }
})
