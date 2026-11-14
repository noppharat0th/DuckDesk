import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * DuckDesk dev launcher.
 *
 * Two environment-specific fixes are applied here so `npm run dev` works from
 * terminals that were started inside DSH or other Electron host processes:
 *
 * 1. ELECTRON_RUN_AS_NODE makes Electron start as plain Node (no window).
 * 2. Some Windows sessions cannot initialize Chromium's sandbox; `--noSandbox`
 *    is the same flag used by the packaged launcher.
 */
const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const electronViteCli = join(appRoot, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(
  process.execPath,
  [electronViteCli, 'dev', '--noSandbox', ...process.argv.slice(2)],
  {
    cwd: appRoot,
    stdio: 'inherit',
    env
  }
)

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
