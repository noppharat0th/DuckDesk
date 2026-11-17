export interface SignalingPayload {
  action:
    | 'request-connect'
    | 'accept-connect'
    | 'reject-connect'
    | 'webrtc-offer'
    | 'webrtc-answer'
    | 'webrtc-candidate'
    | 'disconnect'
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

type SignalCallback = (fromId: string, payload: SignalingPayload) => void
type StatusCallback = (isConnected: boolean, host?: string) => void
type ErrorCallback = (message: string) => void

interface SignalingMessage {
  type?: 'register' | 'signal' | 'error'
  fromId?: string
  payload?: SignalingPayload
  message?: string
}

type OutgoingMessage =
  | { type: 'register'; deviceId: string }
  | { type: 'signal'; targetId: string; payload: SignalingPayload }

class SignalingService {
  private ws: WebSocket | null = null
  private url = ''
  private deviceId = ''
  private onSignal?: SignalCallback
  private onStatusChange?: StatusCallback
  private onError?: ErrorCallback
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect(
    deviceId: string,
    url: string,
    onSignal?: SignalCallback,
    onStatusChange?: StatusCallback,
    onError?: ErrorCallback
  ): void {
    this.deviceId = deviceId
    this.url = url
    this.onSignal = onSignal
    this.onStatusChange = onStatusChange
    this.onError = onError
    this.initSocket()
  }

  private initSocket(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.onopen = null
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.onmessage = null
      this.ws.close()
      this.ws = null
    }

    try {
      if (!this.url) {
        this.onStatusChange?.(false)
        return
      }

      const ws = new WebSocket(this.url)
      this.ws = ws

      ws.onopen = () => {
        this.onStatusChange?.(true, 'Cloud')
        this.send({ type: 'register', deviceId: this.deviceId })
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as SignalingMessage

          if (message.type === 'signal' && message.fromId && message.payload) {
            this.onSignal?.(message.fromId, message.payload)
            return
          }

          if (message.type === 'error') {
            const errorMessage = message.message ?? 'The signaling server reported an error.'
            if (this.onError) this.onError(errorMessage)
            else console.error('[Signaling]', errorMessage)
          }
        } catch (error) {
          console.error('Socket message parse error:', error)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
      }

      ws.onclose = () => {
        this.onStatusChange?.(false)
        this.reconnectTimer = setTimeout(() => this.initSocket(), 2000)
      }
    } catch (error) {
      console.error('WebSocket exception:', error)
      this.onStatusChange?.(false)
      this.reconnectTimer = setTimeout(() => this.initSocket(), 2000)
    }
  }

  sendSignal(targetId: string, payload: SignalingPayload): void {
    this.send({ type: 'signal', targetId, payload })
  }

  private send(message: OutgoingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }
}

export const socket = new SignalingService()
