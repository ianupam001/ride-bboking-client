// src/services/socketService.ts
import { io, type Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private readonly NAMESPACE = '/ride-booking'
  private readonly SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3000'

  // Connects socket without auth token
  connect(): Socket {
    if (this.socket && this.socket.connected) return this.socket

    this.disconnect() // Disconnect any existing socket

    this.socket = io(`${this.SERVER_URL}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.registerCoreListeners()

    return this.socket
  }

  // Disconnect the socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Core listeners for debug/logging
  private registerCoreListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason)
    })

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })
  }

  getSocket(): Socket | null {
    return this.socket
  }

  // Emit event
  emit<T>(event: string, data?: T): void {
    if (this.socket) {
      this.socket.emit(event, data)
    } else {
      console.error(`[Socket] Cannot emit, socket not connected: ${event}`)
    }
  }

  // Listen to event
  on<T>(event: string, callback: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    } else {
      console.error(`[Socket] Cannot listen, socket not connected: ${event}`)
    }
  }

  // Remove listener
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event)
    }
  }
}

export const socketService = new SocketService()
