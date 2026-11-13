import { useEffect, useState, useCallback, useRef } from 'react'
import { socket } from '../../../helpers/socket'
import { webrtc, InputEvent } from '../../../helpers/webrtc'
import RemoteViewer from './RemoteViewer'
import {
  AnyDeskLogo,
  MonitorIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  DownloadTrayIcon,
  MenuIcon,
  InfoIcon,
  DeskBadgeIcon,
  CopyIcon,
  CheckIcon,
  ShareInviteIcon,
  InstallComputerIcon,
  KeyLockIcon,
  SparklesNewsIcon,
  GridViewIcon,
  ListViewIcon,
  TilesViewIcon,
  StarIcon,
  MoreVerticalIcon,
  CloseIcon
} from './Icons'

const MOCK_SESSIONS = [
  { id: '', color: '#2196a6', label: 'Monitor' },
  { id: '', color: '#5b7c3e', label: 'Monitor' },
  { id: '', color: '#c0603b', label: 'Monitor' },
  { id: '', color: '#8b6914', label: 'Monitor' },
  { id: '', color: '#4472a8', label: 'Monitor' },
]

const DevicePage = () => {
  const [deviceId, setDeviceId] = useState('')
  const [targetDeviceId, setTargetDeviceId] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [incomingRequest, setIncomingRequest] = useState<{ fromId: string } | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [activePartnerId, setActivePartnerId] = useState<string>('')
  const [isHostingScreen, setIsHostingScreen] = useState(false)
  const [callStatus, setCallStatus] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [hostResolution, setHostResolution] = useState({ width: 1920, height: 1080 })
  const [recentSessions, setRecentSessions] = useState<{ id: string; color: string; ts: number }[]>([])
  const [activeTab, setActiveTab] = useState<'home' | 'session'>('home')
  const inputRef = useRef<HTMLInputElement>(null)

  const copyId = () => {
    if (!deviceId) return
    navigator.clipboard.writeText(deviceId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDisconnect = useCallback(() => {
    if (activePartnerId) socket.sendSignal(activePartnerId, { action: 'disconnect' })
    webrtc.close()
    setRemoteStream(null)
    setIsHostingScreen(false)
    setActivePartnerId('')
    setCallStatus('')
  }, [activePartnerId])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('duck-recent') || '[]')
      setRecentSessions(saved)
    } catch { }

    webrtc.onInputEvent = async (event: InputEvent) => {
      try {
        switch (event.type) {
          case 'mousemove':
            await window.api.remoteMouseMove({ x: event.x, y: event.y }); break
          case 'mousedown':
            await window.api.remoteMouseClick({ button: event.button }); break
          case 'mouseup': break
          case 'dblclick':
            await window.api.remoteMouseClick({ button: event.button, double: true }); break
          case 'wheel':
            await window.api.remoteMouseScroll({ deltaY: event.deltaY }); break
          case 'keydown':
            await window.api.remoteKeyPress({ key: event.key, modifiers: event.modifiers }); break
          case 'text':
            await window.api.remoteTypeText({ text: event.value }); break
        }
      } catch (err) { console.error('[RemoteControl]', err) }
    }

    webrtc.init(
      (stream) => {
        console.log('🎉 [Renderer] Received stream, switching to session tab!')
        setRemoteStream(stream)
        setCallStatus('')
        setActiveTab('session')
      },
      () => {
        setRemoteStream(null)
        setIsHostingScreen(false)
        setActivePartnerId('')
        setCallStatus('')
        setActiveTab('home')
      }
    )

    window.api.getMyDevice().then((device) => {
      setDeviceId(device.deviceId)
      socket.connect(device.deviceId, async (fromId, payload) => {
        if (payload.action === 'request-connect') setIncomingRequest({ fromId })
        if (payload.action === 'accept-connect') {
          setCallStatus(`Connecting to ${fromId}...`)
          setActivePartnerId(fromId)
          await webrtc.startCalling(fromId)
        }
        if (payload.action === 'reject-connect') { setCallStatus(''); setActivePartnerId('') }
          if (payload.action === 'webrtc-offer') {
            setIsHostingScreen(true)
            setActivePartnerId(fromId)
            await webrtc.handleOfferAndSendAnswer(fromId, payload.sdp)
          }
        if (payload.action === 'webrtc-answer') await webrtc.handleAnswer(payload.sdp)
        if (payload.action === 'webrtc-candidate') await webrtc.handleCandidate(payload.candidate)
        if (payload.action === 'disconnect') {
          webrtc.close(); setRemoteStream(null); setIsHostingScreen(false)
          setActivePartnerId(''); setCallStatus('')
        }
      }, (online) => setIsOnline(online))
    })

    return () => { socket.disconnect() }
  }, [])

  const handleConnect = async (id?: string) => {
    const target = (id || targetDeviceId).replace(/\s/g, '')
    if (!target || !isOnline || target === deviceId) return
    setCallStatus(`Requesting connection to ${target}...`)
    setActivePartnerId(target)
    socket.sendSignal(target, { action: 'request-connect' })

    const colors = ['#2196a6', '#5b7c3e', '#c0603b', '#8b6914', '#4472a8', '#7b4a8b', '#c06038']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const updated = [{ id: target, color, ts: Date.now() }, ...recentSessions.filter(s => s.id !== target)].slice(0, 10)
    setRecentSessions(updated)
    localStorage.setItem('duck-recent', JSON.stringify(updated))
  }

  const handleAccept = async () => {
    if (!incomingRequest) return
    const fromId = incomingRequest.fromId
    setIncomingRequest(null)
    socket.sendSignal(fromId, { action: 'accept-connect' })
  }

  const handleReject = () => {
    if (!incomingRequest) return
    socket.sendSignal(incomingRequest.fromId, { action: 'reject-connect' })
    setIncomingRequest(null)
  }

  if (activeTab === 'session' && remoteStream) {
    return (
      <RemoteViewer
        stream={remoteStream}
        remoteId={activePartnerId || targetDeviceId || 'Remote Desk'}
        hostResolution={hostResolution}
        onResolutionReceived={(w, h) => setHostResolution({ width: w, height: h })}
        onDisconnect={() => {
          handleDisconnect()
          setActiveTab('home')
        }}
        onSwitchToHome={() => setActiveTab('home')}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] text-gray-800 select-none overflow-hidden" style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}>

      <div className="bg-white border-b border-gray-200 app-drag-region">
        <div className="h-10 flex items-center px-4 gap-2">
          <div className="flex items-center gap-2 no-drag">
            <AnyDeskLogo size={20} />
            <span className="font-bold text-gray-800 text-[13px] tracking-tight">AnyDesk</span>

            <div
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 ml-2 border rounded-t px-3 py-1 text-xs font-medium cursor-pointer transition ${
                activeTab === 'home'
                  ? 'bg-[#f3f4f6] border-gray-300 border-b-white text-gray-800'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <MonitorIcon size={14} className="text-gray-500" />
              <span>New Connection</span>
            </div>

            {remoteStream && (
              <div
                onClick={() => setActiveTab('session')}
                className={`flex items-center gap-2 border rounded-t px-3 py-1 text-xs font-medium cursor-pointer transition ${
                  activeTab === 'session'
                    ? 'bg-[#f3f4f6] border-gray-300 border-b-white text-gray-800 font-semibold'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono">{activePartnerId || targetDeviceId || 'Remote Desk'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDisconnect()
                    setActiveTab('home')
                  }}
                  className="text-gray-400 hover:text-red-600 rounded p-0.5 ml-1 transition"
                  title="Disconnect"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            )}

            <button className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-100 text-xs transition">
              <PlusIcon size={12} />
            </button>
          </div>
        </div>

        {/* Search / Connect bar */}
        <div className="h-11 flex items-center px-4 gap-2 border-t border-gray-100 no-drag">
          {/* Status Indicator */}
          <div className="flex items-center justify-center shrink-0">
            {isOnline ? (
              <CheckCircleIcon size={18} />
            ) : (
              <span className="w-4 h-4 rounded-full border-2 border-gray-300 bg-gray-100 inline-block" />
            )}
          </div>

          {/* Search Box with Connect Arrow */}
          <div className="flex-1 max-w-xl flex items-center bg-[#f9fafb] border border-gray-300 focus-within:border-blue-500 focus-within:bg-white rounded transition">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 h-8 bg-transparent px-3 text-sm font-mono outline-none placeholder:font-sans placeholder:text-gray-400"
              placeholder="Enter Remote Desk ID or Alias"
              value={targetDeviceId}
              onChange={(e) => setTargetDeviceId(e.target.value.replace(/\s/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConnect() }}
              maxLength={9}
            />

            <button
              onClick={() => handleConnect()}
              disabled={!targetDeviceId || !isOnline || targetDeviceId === deviceId || !!callStatus}
              className="h-8 px-2.5 flex items-center justify-center text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Connect"
            >
              <ArrowRightIcon size={15} />
            </button>
          </div>

          <div className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400">
            <MonitorIcon size={14} />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <TopBtn title="History">
              <ClockIcon size={16} />
            </TopBtn>
            <TopBtn title="Download">
              <DownloadTrayIcon size={16} />
            </TopBtn>
            <TopBtn title="Main Menu">
              <MenuIcon size={16} />
            </TopBtn>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Call status notification */}
        {callStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-2 rounded flex items-center gap-2 animate-pulse">
            <span className="inline-block w-3.5 h-3.5 border-2 border-blue-400 border-t-blue-700 rounded-full animate-spin" />
            <span>{callStatus}</span>
          </div>
        )}

        {/* Hosting screen indicator */}
        {isHostingScreen && (
          <div className="bg-amber-50 border border-amber-300 text-amber-700 text-xs px-4 py-2 rounded flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Sharing your screen with <strong className="font-mono">{activePartnerId}</strong></span>
            <button onClick={handleDisconnect} className="ml-auto text-xs text-red-600 hover:underline font-semibold">Stop sharing</button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded shadow-xs border border-gray-200 border-l-4 border-l-red-500 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-800">This Desk</span>
              <span className="text-gray-400 hover:text-gray-600 cursor-help" title="Your Desk ID">
                <InfoIcon size={14} />
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Your Desk can be accessed with this address.</p>

            <div
              className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 cursor-pointer hover:bg-gray-100 transition group"
              onClick={copyId}
              title="Click to copy address"
            >
              <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-white shrink-0">
                <DeskBadgeIcon size={13} className="text-white" />
              </div>
              <span className="font-mono text-sm font-bold text-gray-800 flex-1 tracking-wider">
                {deviceId
                  ? deviceId.replace(/(.{3})(.{3})(.{3})/, '$1 $2 $3')
                  : 'Loading...'}
              </span>
              <span className={`transition ${copied ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              </span>
            </div>

            <button className="flex items-center gap-1.5 text-left text-[11px] text-blue-600 hover:underline mt-0.5">
              <ShareInviteIcon size={13} />
              <span>Invitation email...</span>
            </button>
          </div>

          <div className="bg-[#e65c00] rounded shadow-xs p-4 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer hover:brightness-105 transition">
            <div className="relative z-10">
              <p className="font-bold text-sm">Install AnyDesk</p>
              <p className="text-[11px] text-white/90 mt-1 leading-relaxed">Install AnyDesk on this computer...</p>
            </div>
            <div className="absolute right-2 bottom-1 opacity-25 text-white pointer-events-none">
              <InstallComputerIcon size={64} />
            </div>
          </div>

          <div className="bg-[#e02424] rounded shadow-xs p-4 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer hover:brightness-105 transition">
            <div className="relative z-10">
              <p className="font-bold text-sm">Set password for unattended access...</p>
              <p className="text-[11px] text-white/90 mt-1 leading-relaxed">This enables you to access your desk, no matter where you are.</p>
            </div>
            <div className="absolute right-3 bottom-1 opacity-25 text-white pointer-events-none">
              <KeyLockIcon size={60} />
            </div>
          </div>

          <div className="bg-[#1a56db] rounded shadow-xs p-4 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer hover:brightness-105 transition">
            <div className="relative z-10">
              <p className="font-bold text-sm">What's new in AnyDesk 6.0?</p>
              <p className="text-[11px] text-white/90 mt-1 leading-relaxed">Check out the most interesting new features in this release.</p>
            </div>
            <div className="flex items-center justify-between mt-2 relative z-10">
              <span className="text-[11px] font-semibold flex items-center gap-1 hover:underline">
                Learn more <ArrowRightIcon size={11} />
              </span>
            </div>
            <div className="absolute right-2 bottom-1 opacity-20 text-white pointer-events-none">
              <SparklesNewsIcon size={64} />
            </div>
          </div>

        </div>

        {recentSessions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Favorites</span>
              <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">Show all</span>
              <div className="flex items-center gap-1 ml-auto text-gray-400">
                <ViewBtn><GridViewIcon size={13} /></ViewBtn>
                <ViewBtn><ListViewIcon size={13} /></ViewBtn>
                <ViewBtn><TilesViewIcon size={13} /></ViewBtn>
              </div>
            </div>
            <div className="flex gap-2">
              {recentSessions.slice(0, 3).map((s) => (
                <FavoriteItem key={s.id} session={s} onConnect={() => handleConnect(s.id)} />
              ))}
            </div>
          </section>
        )}

        <section className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Recent Sessions</span>
            <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
              {recentSessions.length > 0 ? 'Show less' : ''}
            </span>
            <div className="flex items-center gap-1 ml-auto text-gray-400">
              <ViewBtn><GridViewIcon size={13} /></ViewBtn>
              <ViewBtn><ListViewIcon size={13} /></ViewBtn>
              <ViewBtn><TilesViewIcon size={13} /></ViewBtn>
            </div>
          </div>

          {recentSessions.length === 0 ? (
            <div className="bg-white rounded shadow-xs border border-gray-200 flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <MonitorIcon size={44} className="text-gray-300 stroke-1" />
              <p className="text-sm text-gray-500">No recent sessions yet</p>
              <p className="text-xs text-gray-400">Connect to a remote device to see it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {recentSessions.map((s) => (
                <SessionCard key={s.id} session={s} onConnect={() => handleConnect(s.id)} />
              ))}
              {MOCK_SESSIONS.slice(recentSessions.length, 10).map((m, i) => (
                <SessionCard key={`mock-${i}`} session={{ id: '', color: m.color, ts: 0 }} onConnect={() => { }} isMock />
              ))}
            </div>
          )}
        </section>

      </div>

      {incomingRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-xs w-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <MonitorIcon size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Incoming Connection Request</p>
                <p className="text-xs text-gray-500">Wants to view and control screen</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-center border border-gray-200">
              <p className="font-mono text-lg font-bold text-gray-800 tracking-widest">
                {incomingRequest.fromId.replace(/(.{3})(.{3})(.{3})/, '$1 $2 $3')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CloseIcon size={14} />
                <span>Decline</span>
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckIcon size={14} />
                <span>Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TopBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
    >
      {children}
    </button>
  )
}

function ViewBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition">
      {children}
    </button>
  )
}

function FavoriteItem({ session, onConnect }: { session: { id: string; color: string; ts: number }; onConnect: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer transition group w-48 shadow-2xs">
      <div
        className="w-8 h-6 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: session.color }}
      >
        <MonitorIcon size={14} className="text-white/80" />
      </div>
      <span className="font-mono text-xs font-bold text-gray-700 flex-1 truncate tracking-wider">
        {session.id.replace(/(.{3})(.{3})(.{3})/, '$1 $2 $3')}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onConnect() }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition"
        title="Connect"
      >
        <ArrowRightIcon size={13} />
      </button>
      <button className="text-gray-300 hover:text-gray-500">
        <MoreVerticalIcon size={13} />
      </button>
    </div>
  )
}

function SessionCard({
  session, onConnect, isMock = false
}: {
  session: { id: string; color: string; ts: number }
  onConnect: () => void
  isMock?: boolean
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded shadow-xs overflow-hidden group hover:shadow-md transition cursor-pointer ${isMock ? 'opacity-35 pointer-events-none' : ''}`}>
      {/* Thumbnail */}
      <div
        className="h-28 flex flex-col items-center justify-center relative select-none"
        style={{ backgroundColor: session.color }}
        onClick={onConnect}
      >
        {/* Status dot */}
        <div className="absolute top-2 left-2 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
        </div>

        {/* Star */}
        <div className="absolute top-2 right-2 text-yellow-300 drop-shadow-xs">
          <StarIcon size={14} filled={false} />
        </div>

        {/* Monitor outline */}
        <MonitorIcon size={52} className="text-white/40 stroke-1" />
      </div>

      {/* Footer */}
      <div className="px-2.5 py-1.5 flex items-center justify-between gap-1 border-t border-gray-100">
        <span className="font-mono text-[11px] text-gray-700 truncate font-semibold tracking-wide">
          {session.id
            ? session.id.replace(/(.{3})(.{3})(.{3})/, '$1 $2 $3')
            : '— — —'}
        </span>
        <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition shrink-0">
          <MoreVerticalIcon size={13} />
        </button>
      </div>
    </div>
  )
}

export default DevicePage
