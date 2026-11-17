import { socket } from './socket'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
}

export async function captureScreen(): Promise<MediaStream> {
  let displaySize = { width: 1920, height: 1080 }
  try {
    displaySize = await window.api.getScreenResolution()
  } catch {
    // Keep the common 1080p fallback if the display query fails.
  }

  try {
    return await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: displaySize.width },
        height: { ideal: displaySize.height },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: false
    })
  } catch {
    // Fall through to the desktopCapturer-based fallback below.
  }

  const sources = await window.api.getScreenSources()
  const source = sources[0]
  if (!source) throw new Error('No screen source found')

  const mediaDevices = navigator.mediaDevices as MediaDevices & {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>
  }

  return await mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
        maxFrameRate: 30
      }
    }
  } as unknown as MediaStreamConstraints)
}

export type InputEvent =
  | { type: 'mousemove'; x: number; y: number }
  | { type: 'mousedown'; button: 'left' | 'right' | 'middle' }
  | { type: 'mouseup'; button: 'left' | 'right' | 'middle' }
  | { type: 'dblclick'; button: 'left' | 'right' | 'middle' }
  | { type: 'wheel'; deltaY: number }
  | { type: 'keydown'; key: string; modifiers: string[] }
  | { type: 'text'; value: string }
  | { type: 'screen-resolution'; width: number; height: number }

const DISCONNECT_GRACE_MS = 5000

class WebRTCManager {
  private peer: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private onRemoteStreamCallback?: (stream: MediaStream) => void
  private onDisconnectCallback?: () => void
  private candidateQueue: RTCIceCandidateInit[] = []
  private dropTimer: ReturnType<typeof setTimeout> | undefined
  public onInputEvent?: (event: InputEvent) => void
  public hostResolution: { width: number; height: number } = { width: 1920, height: 1080 }

  init(onRemoteStream: (stream: MediaStream) => void, onDisconnect: () => void): void {
    this.onRemoteStreamCallback = onRemoteStream
    this.onDisconnectCallback = onDisconnect
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    this.dataChannel = dc
    dc.onmessage = (event) => {
      try {
        const msg: InputEvent = JSON.parse(event.data)
        this.onInputEvent?.(msg)
      } catch {
        // Ignore malformed input events from a remote peer.
      }
    }
    dc.onopen = () => {
      // Channel is ready; input can flow.
    }
    dc.onclose = () => {
      // Connection state watcher owns teardown.
    }
  }

  sendInput(event: InputEvent): void {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event))
    }
  }

  private async drainCandidates(): Promise<void> {
    if (!this.peer || !this.peer.remoteDescription) return
    while (this.candidateQueue.length > 0) {
      const candidateInit = this.candidateQueue.shift()
      if (candidateInit) {
        try {
          await this.peer.addIceCandidate(new RTCIceCandidate(candidateInit))
        } catch {
          // A stale ICE candidate is harmless; continue draining.
        }
      }
    }
  }

  private watchConnection(peer: RTCPeerConnection): void {
    peer.onconnectionstatechange = () => {
      if (this.peer !== peer) return
      const state = peer.connectionState

      clearTimeout(this.dropTimer)
      if (state === 'failed') {
        this.close()
      } else if (state === 'disconnected') {
        this.dropTimer = setTimeout(() => {
          if (this.peer === peer && peer.connectionState === 'disconnected') {
            this.close()
          }
        }, DISCONNECT_GRACE_MS)
      }
    }
  }

  private async tuneVideoSender(peer: RTCPeerConnection): Promise<void> {
    const sender = peer.getSenders().find((s) => s.track?.kind === 'video')
    if (!sender) return
    try {
      const params = sender.getParameters()
      // Screen content needs resolution more than a stable frame rate. Without
      // this, WebRTC often downscales 1080p to a blurry 720p/540p stream.
      const sendParams = params as RTCRtpSendParameters & {
        degradationPreference?: RTCDegradationPreference
      }
      sendParams.degradationPreference = 'maintain-resolution'

      params.encodings = params.encodings?.length ? params.encodings : [{}]
      params.encodings[0].maxBitrate = 8_000_000
      params.encodings[0].maxFramerate = 30
      params.encodings[0].scaleResolutionDownBy = 1
      await sender.setParameters(params)
    } catch {
      // Sender tuning is best-effort; the stream still works without it.
    }
  }

  async startCalling(targetId: string): Promise<void> {
    this.close(false)

    const peer = new RTCPeerConnection(RTC_CONFIG)
    this.peer = peer

    const dc = peer.createDataChannel('input', { ordered: true })
    this.setupDataChannel(dc)

    peer.addTransceiver('video', { direction: 'recvonly' })

    let notifiedStream: MediaStream | null = null
    peer.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track])
      if (notifiedStream === stream) return
      notifiedStream = stream
      this.onRemoteStreamCallback?.(stream)
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.sendSignal(targetId, {
          action: 'webrtc-candidate',
          candidate: event.candidate
        })
      }
    }

    this.watchConnection(peer)

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)

    socket.sendSignal(targetId, {
      action: 'webrtc-offer',
      sdp: offer
    })
  }

  async handleOfferAndSendAnswer(
    fromId: string,
    offerSdp: RTCSessionDescriptionInit
  ): Promise<void> {
    this.close(false)

    const stream = await captureScreen()
    this.localStream = stream

    stream.getVideoTracks().forEach((track) => {
      track.contentHint = 'detail'
    })

    const peer = new RTCPeerConnection(RTC_CONFIG)
    this.peer = peer

    peer.ondatachannel = (event) => {
      this.setupDataChannel(event.channel)
      window.api.getScreenResolution().then((resolution) => {
        this.hostResolution = resolution
        setTimeout(() => {
          if (this.dataChannel?.readyState === 'open') {
            this.dataChannel.send(
              JSON.stringify({
                type: 'screen-resolution',
                width: resolution.width,
                height: resolution.height
              })
            )
          }
        }, 300)
      })
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.sendSignal(fromId, {
          action: 'webrtc-candidate',
          candidate: event.candidate
        })
      }
    }

    this.watchConnection(peer)

    await peer.setRemoteDescription(new RTCSessionDescription(offerSdp))
    await this.drainCandidates()

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream)
    })

    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    await this.tuneVideoSender(peer)

    socket.sendSignal(fromId, {
      action: 'webrtc-answer',
      sdp: answer
    })
  }

  async handleAnswer(answerSdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peer) return
    await this.peer.setRemoteDescription(new RTCSessionDescription(answerSdp))
    await this.drainCandidates()
  }

  async handleCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this.peer || !this.peer.remoteDescription) {
      this.candidateQueue.push(candidateInit)
      return
    }

    try {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidateInit))
    } catch {
      // Ignore invalid remote candidates; ICE will retry.
    }
  }

  close(notify = true): void {
    clearTimeout(this.dropTimer)
    this.dropTimer = undefined
    this.candidateQueue = []
    this.localStream?.getTracks().forEach((track) => track.stop())
    this.localStream = null
    this.dataChannel?.close()
    this.dataChannel = null
    this.peer?.close()
    this.peer = null
    if (notify) this.onDisconnectCallback?.()
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }
}

export const webrtc = new WebRTCManager()
