
import { useEffect, useRef, useState, useCallback } from 'react'
import { webrtc, InputEvent } from '../../../helpers/webrtc'
import {
  AnyDeskLogo,
  MonitorIcon,
  PlusIcon,
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  MousePointerIcon,
  KeyboardIcon,
  ShieldLockIcon
} from './Icons'

interface Props {
  stream: MediaStream
  remoteId: string
  hostResolution: { width: number; height: number }
  onResolutionReceived: (w: number, h: number) => void
  onDisconnect: () => void
  onSwitchToHome?: () => void
}

export default function RemoteViewer({
  stream,
  remoteId,
  hostResolution,
  onResolutionReceived,
  onDisconnect,
  onSwitchToHome
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlEnabled, setControlEnabled] = useState(true)
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'original'>('contain')
  const [fps, setFps] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('Connected')

  const moveThrottle = useRef(0)
  const lastClickBtn = useRef<'left' | 'right' | 'middle'>('left')

  const onResolutionRef = useRef(onResolutionReceived)

  useEffect(() => {
    onResolutionRef.current = onResolutionReceived
  }, [onResolutionReceived])

  useEffect(() => {
    const prevHandler = webrtc.onInputEvent
    webrtc.onInputEvent = (event: InputEvent) => {
      if (event.type === 'screen-resolution') {
        onResolutionRef.current(event.width, event.height)
      }
      prevHandler?.(event)
    }
    return () => {
      webrtc.onInputEvent = prevHandler
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    video.muted = true

    setConnectionStatus('Streaming')

    const tryPlay = () => {
      video.play().catch(() => { })
    }

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.onunmute = () => {
        tryPlay()
      }
    }

    video.onloadedmetadata = () => {
      tryPlay()
    }

    tryPlay()

    return () => {
      if (videoTrack) videoTrack.onunmute = null
      video.onloadedmetadata = null
    }
  }, [stream])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    let frames = 0
    let handle = 0
    const hasRVFC = 'requestVideoFrameCallback' in video

    const onFrame = () => {
      frames++
      handle = video.requestVideoFrameCallback(onFrame)
    }
    if (hasRVFC) handle = video.requestVideoFrameCallback(onFrame)

    const timer = setInterval(() => {
      setFps(frames)
      frames = 0
    }, 1000)

    return () => {
      clearInterval(timer)
      if (hasRVFC) video.cancelVideoFrameCallback(handle)
    }
  }, [stream])

  const scaleCoords = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (!videoRef.current) return { x: 0, y: 0 }

      const video = videoRef.current
      const rect = video.getBoundingClientRect()

      let offsetX = 0
      let offsetY = 0
      let drawW = rect.width
      let drawH = rect.height

      if (fitMode === 'contain') {
        const vw = video.videoWidth || hostResolution.width
        const vh = video.videoHeight || hostResolution.height
        const videoAspect = vw / vh
        const elemAspect = rect.width / rect.height

        if (videoAspect > elemAspect) {
          drawH = rect.width / videoAspect
          offsetY = (rect.height - drawH) / 2
        } else {
          drawW = rect.height * videoAspect
          offsetX = (rect.width - drawW) / 2
        }
      }

      const relX = e.clientX - rect.left - offsetX
      const relY = e.clientY - rect.top - offsetY

      const x = Math.round((relX / drawW) * hostResolution.width)
      const y = Math.round((relY / drawH) * hostResolution.height)

      return {
        x: Math.max(0, Math.min(x, hostResolution.width)),
        y: Math.max(0, Math.min(y, hostResolution.height))
      }
    },
    [hostResolution, fitMode]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (!controlEnabled) return
      const now = Date.now()
      if (now - moveThrottle.current < 16) return
      moveThrottle.current = now

      const { x, y } = scaleCoords(e)
      webrtc.sendInput({ type: 'mousemove', x, y })
    },
    [controlEnabled, scaleCoords]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (!controlEnabled) return
      e.preventDefault()
      const { x, y } = scaleCoords(e)
      const btn = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left'
      lastClickBtn.current = btn

      webrtc.sendInput({ type: 'mousemove', x, y })
      webrtc.sendInput({ type: 'mousedown', button: btn })
    },
    [controlEnabled, scaleCoords]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (!controlEnabled) return
      e.preventDefault()
      webrtc.sendInput({ type: 'mouseup', button: lastClickBtn.current })
    },
    [controlEnabled]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLVideoElement>) => {
      if (!controlEnabled) return
      e.preventDefault()
      webrtc.sendInput({ type: 'wheel', deltaY: e.deltaY })
    },
    [controlEnabled]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!controlEnabled) return
      if (e.key === 'F12') return

      e.preventDefault()
      const modifiers: string[] = []
      if (e.ctrlKey) modifiers.push('ctrl')
      if (e.altKey) modifiers.push('alt')
      if (e.shiftKey) modifiers.push('shift')

      if (e.key.length === 1 && modifiers.length === 0) {
        webrtc.sendInput({ type: 'text', value: e.key })
      } else {
        webrtc.sendInput({ type: 'keydown', key: e.key, modifiers })
      }
    },
    [controlEnabled]
  )

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-[#f3f4f6] text-gray-800 select-none overflow-hidden"
      style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white border-b border-gray-200 app-drag-region shrink-0">
        <div className="h-10 flex items-center px-4 gap-2">
          <div className="flex items-center gap-2 no-drag">
            <AnyDeskLogo size={20} />
            <span className="font-bold text-gray-800 text-[13px] tracking-tight">AnyDesk</span>

            <button
              onClick={onSwitchToHome}
              className="flex items-center gap-1.5 ml-2 border border-transparent rounded-t px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
            >
              <MonitorIcon size={14} className="text-gray-500" />
              <span>New Connection</span>
            </button>

            <div className="flex items-center gap-2 bg-[#f3f4f6] border border-gray-300 border-b-white rounded-t px-3 py-1 text-xs text-gray-800 font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">{remoteId}</span>
              <button
                onClick={onDisconnect}
                className="text-gray-400 hover:text-red-600 rounded p-0.5 ml-1 transition"
                title="Disconnect"
              >
                <CloseIcon size={12} />
              </button>
            </div>

            <button
              onClick={onSwitchToHome}
              className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-100 text-xs transition"
              title="Open New Tab"
            >
              <PlusIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="h-10 bg-white border-b border-gray-200 px-4 flex items-center justify-between text-xs text-gray-700 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-500">Connected:</span>
            <span className="font-mono font-bold text-gray-800">{remoteId}</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <span className="font-mono text-[11px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
            {hostResolution.width} × {hostResolution.height}
          </span>

          <span className="font-mono text-[11px] text-gray-500">
            {fps} FPS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setControlEnabled(!controlEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition cursor-pointer ${controlEnabled
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            title="Toggle Remote Mouse & Keyboard Control"
          >
            <MousePointerIcon size={13} />
            <KeyboardIcon size={13} />
            <span>{controlEnabled ? 'Control Active' : 'View Only'}</span>
          </button>

          <button
            onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium transition cursor-pointer"
            title="Toggle Display Scaling"
          >
            <MonitorIcon size={13} />
            <span>{fitMode === 'contain' ? 'Fit Screen' : 'Stretch'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <MinimizeIcon size={14} /> : <MaximizeIcon size={14} />}
          </button>

          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-3 py-1 rounded transition shadow-2xs cursor-pointer"
          >
            <CloseIcon size={12} />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#18181b] relative overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-fill'
            }`}
          style={{
            cursor: controlEnabled ? 'default' : 'not-allowed',
            imageRendering: 'auto'
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
        />

        {connectionStatus === 'Connected' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-3 text-white">
            <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-sm font-medium">Waiting for video stream from {remoteId}...</p>
          </div>
        )}
      </div>

      <div className="h-6 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldLockIcon size={12} className="text-emerald-600" />
          <span>WebRTC P2P Direct Stream · TLS Encrypted</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>{hostResolution.width}×{hostResolution.height}</span>
          <span>{connectionStatus}</span>
        </div>
      </div>
    </div>
  )
}
