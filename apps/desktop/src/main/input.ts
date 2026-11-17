import { app } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

let helper: ChildProcess | null = null
let lastSpawnAttempt = 0

function inputHelperPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'input-helper.exe')
    : join(app.getAppPath(), 'resources', 'input-helper.exe')
}

function ensureHelper(): ChildProcess | null {
  if (helper && helper.exitCode === null && !helper.killed) return helper

  const now = Date.now()
  if (now - lastSpawnAttempt < 1500) return null
  lastSpawnAttempt = now

  const executable = inputHelperPath()
  if (!existsSync(executable)) {
    console.error('[Input] input-helper.exe not found at', executable)
    return null
  }

  try {
    const child = spawn(executable, [], {
      windowsHide: true,
      stdio: ['pipe', 'ignore', 'ignore']
    })

    child.on('error', (error) => {
      console.error('[Input] helper error:', error)
      if (helper === child) helper = null
    })

    child.on('exit', (code) => {
      console.warn('[Input] helper exited with code', code)
      if (helper === child) helper = null
    })

    helper = child
    return child
  } catch (error) {
    console.error('[Input] could not start helper:', error)
    return null
  }
}

function send(command: string): void {
  const child = ensureHelper()
  if (!child?.stdin) return

  try {
    child.stdin.write(`${command}\n`)
  } catch (error) {
    console.error('[Input] could not write command:', error)
  }
}

export function mouseMove(x: number, y: number): void {
  send(`M|${Math.round(x)}|${Math.round(y)}`)
}

export function mouseButton(button: 'left' | 'right' | 'middle', down: boolean): void {
  send(`B|${button}|${down ? 1 : 0}`)
}

export function mouseClick(button: 'left' | 'right' | 'middle', doubleClick = false): void {
  send(`C|${button}|${doubleClick ? 1 : 0}`)
}

export function mouseScroll(deltaY: number): void {
  // DOM wheel delta is positive when scrolling down; Win32 uses the opposite.
  send(`S|${Math.round(-deltaY)}`)
}

export function keyPress(key: string, modifiers: string[] = []): void {
  send(`K|${key}|${modifiers.join(',')}`)
}

export function typeText(text: string): void {
  send(`T|${Buffer.from(text, 'utf8').toString('hex')}`)
}

export function disposeInputHelper(): void {
  if (!helper) return
  helper.kill()
  helper = null
}
