import { WSS_URL } from '../config'

type SignalCallback = (fromId: string, payload: any) => void
type StatusCallback = (isConnected: boolean, host?: string) => void

class SignalingService {
  private ws: WebSocket | null = null
  private deviceId: string = ''
  private onSignal?: SignalCallback
  private onStatusChange?: StatusCallback
  private reconnectTimer: any = null

  connect(deviceId: string, onSignal?: SignalCallback, onStatusChange?: StatusCallback) {
    this.deviceId = deviceId
    this.onSignal = onSignal
    this.onStatusChange = onStatusChange
    this.initSocket()
  }

  private initSocket() {
    clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.onmessage = null
      this.ws.close()
      this.ws = null
    }


    try {
      const ws = new WebSocket(WSS_URL)
      this.ws = ws

      ws.onopen = () => {
        this.onStatusChange?.(true, 'Cloud')
        this.send({ type: 'register', deviceId: this.deviceId })
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'signal') {
            this.onSignal?.(data.fromId, data.payload)
          } else if (data.type === 'error') {
            alert(data.message)
          }
        } catch (err) {
          console.error('Socket message parse error:', err)
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err)
      }

      ws.onclose = () => {
        this.onStatusChange?.(false)
        this.reconnectTimer = setTimeout(() => this.initSocket(), 2000)
      }
    } catch (err) {
      console.error('WebSocket exception:', err)
      this.onStatusChange?.(false)
      this.reconnectTimer = setTimeout(() => this.initSocket(), 2000)
    }
  }

  sendSignal(targetId: string, payload: any) {
    this.send({
      type: 'signal',
      targetId,
      payload
    })
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }
}

export const socket = new SignalingService()
