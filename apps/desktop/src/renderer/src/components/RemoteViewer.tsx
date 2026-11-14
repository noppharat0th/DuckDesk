import { useCallback, useEffect, useRef, useState } from 'react'
import { webrtc, type InputEvent } from '../../../helpers/webrtc'
import { cn } from '../lib/cn'
import { DuckMark } from './Brand'
import {
  CloseIcon,
  KeyboardIcon,
  MaximizeIcon,
  MinimizeIcon,
  MonitorIcon,
  MousePointerIcon,
  ShieldCheckIcon,
  SpinnerIcon
} from './Icons'
import { Button } from './ui/Button'

interface Props {
  stream: MediaStream
  remoteId: string
  hostResolution: { width: number; height: number }
  onResolutionReceived: (width: number, height: number) => void
  onDisconnect: () => void
}

type FitMode = 'contain' | 'fill'

export default function RemoteViewer({
  stream,
  remoteId,
  hostResolution,
  onResolutionReceived,
  onDisconnect
}: Props): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const moveThrottle = useRef(0)
  const lastClickButton = useRef<'left' | 'right' | 'middle'>('left')

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlEnabled, setControlEnabled] = useState(true)
  const [fitMode, setFitMode] = useState<FitMode>('contain')
  const [fps, setFps] = useState(0)
  const [hasVideo, setHasVideo] = useState(false)

  const onResolutionRef = useRef(onResolutionReceived)

  useEffect(() => {
    onResolutionRef.current = onResolutionReceived
  }, [onResolutionReceived])

  useEffect(() => {
    const previousHandler = webrtc.onInputEvent

    webrtc.onInputEvent = (event: InputEvent) => {
      if (event.type === 'screen-resolution') {
        onResolutionRef.current(event.width, event.height)
      }
      previousHandler?.(event)
    }

    return () => {
      webrtc.onInputEvent = previousHandler
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setHasVideo(false)

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    video.muted = true

    const tryPlay = (): void => {
      video.play().catch(() => {})
    }

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) videoTrack.onunmute = tryPlay
    video.onloadedmetadata = tryPlay
    tryPlay()

    containerRef.current?.focus()

    return () => {
      if (videoTrack) videoTrack.onunmute = null
      video.onloadedmetadata = null
    }
  }, [stream])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let frames = 0
    let handle = 0
    const supportsVideoFrameCallback = 'requestVideoFrameCallback' in video

    const onFrame = (): void => {
      frames += 1
      handle = video.requestVideoFrameCallback(onFrame)
    }

    if (supportsVideoFrameCallback) handle = video.requestVideoFrameCallback(onFrame)

    const timer = window.setInterval(() => {
      setFps(frames)
      frames = 0
    }, 1000)

    return () => {
      window.clearInterval(timer)
      if (supportsVideoFrameCallback) video.cancelVideoFrameCallback(handle)
    }
  }, [stream])

  useEffect(() => {
    const onFullscreenChange = (): void => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const scaleCoords = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>): { x: number; y: number } => {
      const video = videoRef.current
      if (!video) return { x: 0, y: 0 }

      const rect = video.getBoundingClientRect()
      let offsetX = 0
      let offsetY = 0
      let drawWidth = rect.width
      let drawHeight = rect.height

      if (fitMode === 'contain') {
        const videoWidth = video.videoWidth || hostResolution.width
        const videoHeight = video.videoHeight || hostResolution.height
        const videoAspect = videoWidth / videoHeight
        const elementAspect = rect.width / rect.height

        if (videoAspect > elementAspect) {
          drawHeight = rect.width / videoAspect
          offsetY = (rect.height - drawHeight) / 2
        } else {
          drawWidth = rect.height * videoAspect
          offsetX = (rect.width - drawWidth) / 2
        }
      }

      const relativeX = event.clientX - rect.left - offsetX
      const relativeY = event.clientY - rect.top - offsetY
      const x = Math.round((relativeX / drawWidth) * hostResolution.width)
      const y = Math.round((relativeY / drawHeight) * hostResolution.height)

      return {
        x: Math.max(0, Math.min(x, hostResolution.width)),
        y: Math.max(0, Math.min(y, hostResolution.height))
      }
    },
    [fitMode, hostResolution]
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>): void => {
      if (!controlEnabled) return

      const now = Date.now()
      if (now - moveThrottle.current < 16) return
      moveThrottle.current = now

      const { x, y } = scaleCoords(event)
      webrtc.sendInput({ type: 'mousemove', x, y })
    },
    [controlEnabled, scaleCoords]
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>): void => {
      if (!controlEnabled) return
      event.preventDefault()
      containerRef.current?.focus()

      const { x, y } = scaleCoords(event)
      const button = event.button === 2 ? 'right' : event.button === 1 ? 'middle' : 'left'
      lastClickButton.current = button

      webrtc.sendInput({ type: 'mousemove', x, y })
      webrtc.sendInput({ type: 'mousedown', button })
    },
    [controlEnabled, scaleCoords]
  )

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>): void => {
      if (!controlEnabled) return
      event.preventDefault()
      webrtc.sendInput({ type: 'mouseup', button: lastClickButton.current })
    },
    [controlEnabled]
  )

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLVideoElement>): void => {
      if (!controlEnabled) return
      event.preventDefault()
      webrtc.sendInput({ type: 'wheel', deltaY: event.deltaY })
    },
    [controlEnabled]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (!controlEnabled || event.key === 'F12') return

      const target = event.target as HTMLElement | null
      if (target?.closest('button, a, input, textarea, select')) return

      event.preventDefault()

      const modifiers: string[] = []
      if (event.ctrlKey) modifiers.push('ctrl')
      if (event.altKey) modifiers.push('alt')
      if (event.shiftKey) modifiers.push('shift')

      if (event.key.length === 1 && modifiers.length === 0) {
        webrtc.sendInput({ type: 'text', value: event.key })
      } else {
        webrtc.sendInput({ type: 'keydown', key: event.key, modifiers })
      }
    },
    [controlEnabled]
  )

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex h-screen select-none flex-col overflow-hidden bg-canvas text-ink focus:outline-none"
    >
      <div className="drag-strip h-10 shrink-0" aria-hidden="true" />

      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <div className="flex shrink-0 items-center gap-2.5">
          <DuckMark className="size-8 rounded-xl" />
          <span className="hidden text-[15px] font-extrabold tracking-[-0.04em] lg:block">
            Duck<span className="text-amber-500">Desk</span>
          </span>
        </div>

        <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-2 shrink-0">
            <span
              className={cn(
                'absolute inline-flex size-full rounded-full opacity-60',
                hasVideo ? 'animate-ping bg-emerald-400' : 'bg-amber-400'
              )}
            />
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                hasVideo ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
          </span>
          <span className="hidden text-[11px] font-medium text-stone-500 md:inline">
            Connected to
          </span>
          <span className="max-w-[140px] truncate font-mono text-[12px] font-semibold tracking-[0.04em] text-ink sm:max-w-none">
            {remoteId}
          </span>
        </div>

        <span className="hidden rounded-full border border-line bg-canvas/70 px-2.5 py-1 font-mono text-[10px] text-stone-500 lg:inline">
          {hostResolution.width} × {hostResolution.height}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setControlEnabled((enabled) => !enabled)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-semibold transition',
              controlEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-line bg-white text-stone-500 hover:bg-canvas'
            )}
            title="Toggle remote mouse & keyboard control"
            aria-pressed={controlEnabled}
          >
            <MousePointerIcon size={14} />
            <KeyboardIcon size={13} className="hidden sm:block" />
            <span className="hidden xl:inline">{controlEnabled ? 'Control on' : 'View only'}</span>
          </button>

          <button
            type="button"
            onClick={() => setFitMode((mode) => (mode === 'contain' ? 'fill' : 'contain'))}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 text-[11px] font-semibold text-stone-500 transition hover:bg-canvas hover:text-ink"
            title="Toggle display scaling"
          >
            <MonitorIcon size={14} />
            <span className="hidden lg:inline">{fitMode === 'contain' ? 'Fit' : 'Stretch'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="grid size-9 place-items-center rounded-xl border border-line bg-white text-stone-500 transition hover:bg-canvas hover:text-ink"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <MinimizeIcon size={15} /> : <MaximizeIcon size={15} />}
          </button>

          <Button variant="danger" size="sm" onClick={onDisconnect} className="ml-1">
            <CloseIcon size={13} />
            <span className="hidden sm:inline">Disconnect</span>
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-stone-800/70 bg-[#0b0a09] shadow-float">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label={`Remote desktop stream from ${remoteId}`}
            className={cn('h-full w-full', fitMode === 'contain' ? 'object-contain' : 'object-fill')}
            style={{ cursor: controlEnabled ? 'default' : 'not-allowed' }}
            onLoadedData={() => setHasVideo(true)}
            onPlaying={() => setHasVideo(true)}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onContextMenu={(event) => event.preventDefault()}
            onWheel={handleWheel}
          />

          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm">
            <span
              className={cn(
                'size-1.5 rounded-full',
                hasVideo ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'
              )}
            />
            {hasVideo ? 'Live' : 'Connecting'}
          </div>

          {!hasVideo ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b0a09]/90 px-6 text-center text-white">
              <span className="grid size-12 place-items-center rounded-full bg-white/10">
                <SpinnerIcon size={22} className="animate-spin text-white/80" />
              </span>
              <p className="text-sm font-medium">
                Waiting for the screen from{' '}
                <span className="font-mono font-semibold">{remoteId}</span>…
              </p>
              <p className="max-w-sm text-[11px] leading-relaxed text-white/50">
                A secure peer-to-peer connection is being established.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-line bg-surface px-4 text-[10px] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheckIcon size={12} className="text-emerald-600" />
          Encrypted peer-to-peer stream
        </span>
        <div className="flex items-center gap-3 font-mono">
          <span className="hidden sm:inline">
            {hostResolution.width} × {hostResolution.height}
          </span>
          <span>{fps > 0 ? `${fps} fps` : '— fps'}</span>
          <span className={hasVideo ? 'text-emerald-600' : 'text-amber-600'}>
            {hasVideo ? 'Live' : 'Connecting'}
          </span>
        </div>
      </footer>
    </div>
  )
}
