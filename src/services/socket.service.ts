import { io, Socket } from 'socket.io-client';

type EventHandler = (...args: unknown[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private maxDelay = 30000;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private lastReceivedTimestamp: string | null = null;
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  connect(): void {
    const token = localStorage.getItem('token') || localStorage.getItem('candidateToken');
    if (!token || this.socket?.connected) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Strip /api suffix if present for socket connection
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');

    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection manually with exponential backoff
    });

    this.socket.on('connect', () => {
      this._connected = true;
      this.reconnectAttempts = 0;
      this.reattachHandlers();

      // Fetch missed messages on reconnect
      if (this.lastReceivedTimestamp) {
        this.emit('request_missed_messages', { since: this.lastReceivedTimestamp });
      }
    });

    this.socket.on('disconnect', () => {
      this._connected = false;
      this.scheduleReconnect();
    });

    this.socket.on('connect_error', () => {
      this._connected = false;
      this.scheduleReconnect();
    });

    // Track last received message timestamp
    this.socket.on('new_message', (data: { message: { createdAt: string } }) => {
      if (data?.message?.createdAt) {
        this.lastReceivedTimestamp = data.message.createdAt;
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );
    this.reconnectAttempts++;

    setTimeout(() => {
      if (!this._connected) {
        this.socket?.close();
        this.socket = null;
        this.connect();
      }
    }, delay);
  }

  private reattachHandlers(): void {
    if (!this.socket) return;
    this.handlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.socket?.off(event, handler);
        this.socket?.on(event, handler);
      });
    });
  }

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    this.socket?.on(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
    this.socket?.off(event, handler);
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  disconnect(): void {
    this.handlers.clear();
    this.socket?.close();
    this.socket = null;
    this._connected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent auto-reconnect
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
