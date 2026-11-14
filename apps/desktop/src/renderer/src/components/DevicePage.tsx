import { useCallback, useEffect, useRef, useState } from 'react'
import { socket } from '../../../helpers/socket'
import { webrtc, type InputEvent } from '../../../helpers/webrtc'
import {
  clearRecentConnections,
  formatDeviceId,
  isValidDeviceId,
  loadRecentConnections,
  normalizeDeviceId,
  removeRecentConnection,
  upsertRecentConnection,
  type RecentConnection
} from '../lib/recent-connections'
import { AppSidebar } from './AppSidebar'
import { IncomingRequestDialog } from './IncomingRequestDialog'
import RemoteViewer from './RemoteViewer'
import { Toast } from './ui/Toast'
import type { ConnectPanelProps } from './dashboard/ConnectPanel'
import { ComputersView } from './views/ComputersView'
import { HomeView } from './views/HomeView'
import { RecentSessionsView } from './views/RecentSessionsView'
import { RemoteControlView } from './views/RemoteControlView'
import { SettingsView } from './views/SettingsView'
import type { AppView } from './types'

function DevicePage(): React.JSX.Element {
  const [view, setView] = useState<AppView>('home')
  const [deviceId, setDeviceId] = useState('')
  const [targetDeviceId, setTargetDeviceId] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [incomingRequest, setIncomingRequest] = useState<{ fromId: string } | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [activePartnerId, setActivePartnerId] = useState('')
  const [isHostingScreen, setIsHostingScreen] = useState(false)
  const [callStatus, setCallStatus] = useState('')
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState(false)
  const [hostResolution, setHostResolution] = useState({ width: 1920, height: 1080 })
  const [recentSessions, setRecentSessions] = useState<RecentConnection[]>(loadRecentConnections)
  const [toast, setToast] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<number | null>(null)
  const toastTimer = useRef<number | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3400)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const copyId = useCallback(async () => {
    if (!deviceId) return

    try {
      await navigator.clipboard.writeText(deviceId)
      setCopied(true)
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Could not copy automatically. Select the ID and copy it manually.')
    }
  }, [deviceId, showToast])

  const handleDisconnect = useCallback(() => {
    if (activePartnerId) socket.sendSignal(activePartnerId, { action: 'disconnect' })
    webrtc.close()
    setRemoteStream(null)
    setIsHostingScreen(false)
    setActivePartnerId('')
    setCallStatus('')
    setView('home')
  }, [activePartnerId])

  const connectTo = useCallback(
    (rawTarget: string): boolean => {
      const target = normalizeDeviceId(rawTarget)
      setFormError('')

      if (!isOnline) {
        showToast('DuckDesk is offline. Reconnecting…')
        return false
      }

      if (callStatus) {
        showToast('A connection is already in progress.')
        return false
      }

      if (!isValidDeviceId(target)) {
        setFormError('Enter a 9-digit device ID.')
        return false
      }

      if (target === deviceId) {
        setFormError('That is this computer. Enter your partner’s ID.')
        return false
      }

      setTargetDeviceId(formatDeviceId(target))
      setCallStatus(`Requesting connection to ${formatDeviceId(target)}…`)
      setActivePartnerId(target)
      socket.sendSignal(target, { action: 'request-connect' })
      setRecentSessions((previous) => upsertRecentConnection(previous, target))

      return true
    },
    [callStatus, deviceId, isOnline, showToast]
  )

  const connectFromLibrary = useCallback(
    (id: string) => {
      const started = connectTo(id)
      if (started) setView('remote')
    },
    [connectTo]
  )

  const handleTargetChange = useCallback((value: string) => {
    setTargetDeviceId(formatDeviceId(normalizeDeviceId(value)))
    setFormError('')
  }, [])

  const pasteId = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      const id = normalizeDeviceId(clipboardText)

      if (!isValidDeviceId(id)) {
        setFormError('The clipboard does not contain a 9-digit device ID.')
        return
      }

      setTargetDeviceId(formatDeviceId(id))
      setFormError('')
    } catch {
      setFormError('Clipboard access is unavailable. Type the ID instead.')
    }
  }, [])

  const handleClearHistory = useCallback(() => {
    clearRecentConnections()
    setRecentSessions([])
    showToast('Connection history cleared.')
  }, [showToast])

  const handleRemoveRecent = useCallback((id: string) => {
    setRecentSessions((previous) => removeRecentConnection(previous, id))
  }, [])

  useEffect(() => {
    webrtc.onInputEvent = async (event: InputEvent) => {
      try {
        switch (event.type) {
          case 'mousemove':
            await window.api.remoteMouseMove({ x: event.x, y: event.y })
            break
          case 'mousedown':
            await window.api.remoteMouseClick({ button: event.button })
            break
          case 'mouseup':
            break
          case 'dblclick':
            await window.api.remoteMouseClick({ button: event.button, double: true })
            break
          case 'wheel':
            await window.api.remoteMouseScroll({ deltaY: event.deltaY })
            break
          case 'keydown':
            await window.api.remoteKeyPress({ key: event.key, modifiers: event.modifiers })
            break
          case 'text':
            await window.api.remoteTypeText({ text: event.value })
            break
        }
      } catch (error) {
        console.error('[RemoteControl]', error)
      }
    }

    webrtc.init(
      (stream) => {
        setRemoteStream(stream)
        setCallStatus('')
      },
      () => {
        setRemoteStream(null)
        setIsHostingScreen(false)
        setActivePartnerId('')
        setCallStatus('')
      }
    )

    window.api
      .getMyDevice()
      .then((device) => {
        setDeviceId(device.deviceId)

        socket.connect(
          device.deviceId,
          async (fromId, payload) => {
            try {
              if (payload.action === 'request-connect') {
                setIncomingRequest({ fromId })
              }

              if (payload.action === 'accept-connect') {
                setCallStatus(`Connecting to ${formatDeviceId(fromId)}…`)
                setActivePartnerId(fromId)
                setView('remote')
                await webrtc.startCalling(fromId)
              }

              if (payload.action === 'reject-connect') {
                setCallStatus('')
                setActivePartnerId('')
                showToast('The connection request was declined.')
              }

              if (payload.action === 'webrtc-offer' && payload.sdp) {
                setIsHostingScreen(true)
                setActivePartnerId(fromId)
                setView('remote')
                await webrtc.handleOfferAndSendAnswer(fromId, payload.sdp)
              }

              if (payload.action === 'webrtc-answer' && payload.sdp) {
                await webrtc.handleAnswer(payload.sdp)
              }

              if (payload.action === 'webrtc-candidate' && payload.candidate) {
                await webrtc.handleCandidate(payload.candidate)
              }

              if (payload.action === 'disconnect') {
                webrtc.close()
                setRemoteStream(null)
                setIsHostingScreen(false)
                setActivePartnerId('')
                setCallStatus('')
                setView('home')
              }
            } catch (error) {
              console.error('[Signaling]', error)
              setCallStatus('')
              showToast('Could not establish the session. Please try again.')
            }
          },
          (online) => setIsOnline(online),
          (message) => {
            setCallStatus('')
            showToast(message)
          }
        )
      })
      .catch((error) => {
        console.error('[Device]', error)
        setFormError('Unable to load this device. Check the DuckDesk server and try again.')
      })

    return () => {
      socket.disconnect()
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    }
  }, [showToast])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [view])

  useEffect(() => {
    if (!callStatus.startsWith('Requesting')) return

    const timeout = window.setTimeout(() => {
      setCallStatus('')
      setActivePartnerId('')
      showToast('No response from the remote computer. Please try again.')
    }, 30_000)

    return () => window.clearTimeout(timeout)
  }, [callStatus, showToast])

  const handleAccept = (): void => {
    if (!incomingRequest) return

    const fromId = incomingRequest.fromId
    socket.sendSignal(fromId, { action: 'accept-connect' })
    setRecentSessions((previous) => upsertRecentConnection(previous, fromId))
    setIncomingRequest(null)
  }

  const handleDecline = (): void => {
    if (!incomingRequest) return
    socket.sendSignal(incomingRequest.fromId, { action: 'reject-connect' })
    setIncomingRequest(null)
  }

  const handleResolution = useCallback((width: number, height: number) => {
    setHostResolution({ width, height })
  }, [])

  if (remoteStream) {
    return (
      <RemoteViewer
        stream={remoteStream}
        remoteId={formatDeviceId(activePartnerId) || 'Remote computer'}
        hostResolution={hostResolution}
        onResolutionReceived={handleResolution}
        onDisconnect={handleDisconnect}
      />
    )
  }

  const deviceProps = {
    deviceId,
    copied,
    onCopy: copyId
  }

  const connectProps: Omit<ConnectPanelProps, 'autoFocus'> = {
    value: targetDeviceId,
    onChange: handleTargetChange,
    onSubmit: () => connectTo(targetDeviceId),
    onPaste: pasteId,
    isOnline,
    status: callStatus,
    error: formError,
    isHosting: isHostingScreen,
    activePartnerId: activePartnerId ? formatDeviceId(activePartnerId) : '',
    onStopSharing: handleDisconnect
  }

  const renderView = (): React.JSX.Element => {
    switch (view) {
      case 'remote':
        return (
          <RemoteControlView
            device={deviceProps}
            connect={connectProps}
            recent={recentSessions}
            onConnectRecent={connectFromLibrary}
            onViewAll={() => setView('computers')}
            onBrowseComputers={() => setView('computers')}
          />
        )

      case 'computers':
        return (
          <ComputersView
            connections={recentSessions}
            onConnect={connectFromLibrary}
            onAddComputer={() => setView('remote')}
          />
        )

      case 'sessions':
        return (
          <RecentSessionsView
            connections={recentSessions}
            onConnect={connectFromLibrary}
            onRemove={handleRemoveRecent}
            onClear={handleClearHistory}
            onBrowse={() => setView('remote')}
          />
        )

      case 'settings':
        return (
          <SettingsView
            device={deviceProps}
            isOnline={isOnline}
            recentCount={recentSessions.length}
            onClearHistory={handleClearHistory}
          />
        )

      case 'home':
      default:
        return (
          <HomeView
            device={deviceProps}
            connect={connectProps}
            recent={recentSessions}
            onConnectRecent={connectFromLibrary}
            onViewAll={() => setView('computers')}
          />
        )
    }
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-gray-50 text-ink">
      <div className="drag-strip absolute inset-x-0 top-0 z-40 h-10" aria-hidden="true" />

      <AppSidebar
        activeView={view}
        onNavigate={setView}
        recentCount={recentSessions.length}
      />

      <main ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-6 pt-11 sm:px-6 lg:px-6">
          {renderView()}
        </div>
      </main>

      <IncomingRequestDialog
        request={incomingRequest}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}

export default DevicePage
