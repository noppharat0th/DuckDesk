import { useCallback, useEffect, useRef, useState } from 'react'
import { webrtc, type InputEvent } from '../../../helpers/webrtc'
import { cn } from '../lib/cn'
import { DuckMark } from './Brand'
import { CloseIcon, SpinnerIcon } from './Icons'
import { Button } from './ui/Button'

interface Props {
  stream: MediaStream
  remoteId: string
  hostResolution: { width: number; height: number }
  onResolutionReceived: (width: number, height: number) => void
  onDisconnect: () => void
}

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

  const scaleCoords = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>): { x: number; y: number } => {
      const video = videoRef.current
      if (!video) return { x: 0, y: 0 }

      const rect = video.getBoundingClientRect()
      const videoWidth = video.videoWidth || hostResolution.width
      const videoHeight = video.videoHeight || hostResolution.height

      // object-cover: scale up until the whole viewport is covered, then crop
      // the overflow equally on both sides. Coordinates use the same transform.
      const scale = Math.max(rect.width / videoWidth, rect.height / videoHeight)
      const drawWidth = videoWidth * scale
      const drawHeight = videoHeight * scale
      const offsetX = (rect.width - drawWidth) / 2
      const offsetY = (rect.height - drawHeight) / 2

      const relativeX = event.clientX - rect.left - offsetX
      const relativeY = event.clientY - rect.top - offsetY
      const x = Math.round((relativeX / drawWidth) * hostResolution.width)
      const y = Math.round((relativeY / drawHeight) * hostResolution.height)

      return {
        x: Math.max(0, Math.min(x, hostResolution.width)),
        y: Math.max(0, Math.min(y, hostResolution.height))
      }
    },
    [hostResolution]
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>): void => {
      const now = Date.now()
      if (now - moveThrottle.current < 16) return
      moveThrottle.current = now

      const { x, y } = scaleCoords(event)
      webrtc.sendInput({ type: 'mousemove', x, y })
    },
    [scaleCoords]
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>): void => {
      event.preventDefault()
      containerRef.current?.focus()

      const { x, y } = scaleCoords(event)
      const button = event.button === 2 ? 'right' : event.button === 1 ? 'middle' : 'left'
      lastClickButton.current = button

      webrtc.sendInput({ type: 'mousemove', x, y })
      webrtc.sendInput({ type: 'mousedown', button })
    },
    [scaleCoords]
  )

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLVideoElement>): void => {
    event.preventDefault()
    webrtc.sendInput({ type: 'mouseup', button: lastClickButton.current })
  }, [])

  const handleWheel = useCallback((event: React.WheelEvent<HTMLVideoElement>): void => {
    event.preventDefault()
    webrtc.sendInput({ type: 'wheel', deltaY: event.deltaY })
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'F12') return

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
  }, [])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex h-screen select-none flex-col overflow-hidden bg-[#0b0a09] text-ink focus:outline-none"
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

        <div className="ml-auto">
          <Button variant="danger" size="sm" onClick={onDisconnect}>
            <CloseIcon size={13} />
            <span>Disconnect</span>
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0b0a09]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label={`Remote desktop stream from ${remoteId}`}
          className="h-full w-full object-cover"
          style={{ cursor: 'default' }}
          onLoadedData={() => setHasVideo(true)}
          onPlaying={() => setHasVideo(true)}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onContextMenu={(event) => event.preventDefault()}
          onWheel={handleWheel}
        />

        {!hasVideo ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b0a09]/90 px-6 text-center text-white">
            <span className="grid size-12 place-items-center rounded-full bg-white/10">
              <SpinnerIcon size={22} className="animate-spin text-white/80" />
            </span>
            <p className="text-sm font-medium">
              Waiting for the screen from{' '}
              <span className="font-mono font-semibold">{remoteId}</span>…
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
