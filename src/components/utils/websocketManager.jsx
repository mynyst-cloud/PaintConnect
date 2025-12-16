// websocketManager.js
// Native WebSocket implementation for PaintConnect, replacing socket.io-client.
// This manager handles connection, authentication, automatic reconnection, and heartbeats.

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.listeners = new Map();
  }

  // Initialize and connect
  connect() {
    // Prevent multiple connections
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Use the browser's origin to construct the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`; // No token needed in URL, auth is cookie-based

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('[WebSocket] Connection established.');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connect');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle pong from heartbeat
        if (data.type === 'pong') {
          clearTimeout(this.heartbeatTimeout);
          return;
        }

        this.emit(data.type, data.payload);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.warn(`[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
      this.stopHeartbeat();
      this.emit('disconnect');

      // Reconnect logic with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(
          this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
          this.maxReconnectDelay
        );

        console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
        this.reconnectAttempts++;
      } else {
        console.error('[WebSocket] Max reconnect attempts reached.');
      }
    };

    this.socket.onerror = (error) => {
      console.error('[WebSocket] An error occurred:', error);
      // The onclose event will automatically fire after an error, triggering reconnection logic.
    };
  }

  // Keep the connection alive and detect dead connections
  startHeartbeat() {
    this.stopHeartbeat(); // Ensure no multiple heartbeats are running
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        
        // Expect a pong response within 2 seconds
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('[WebSocket] Pong not received, connection might be stale. Closing to reconnect.');
          this.socket.close();
        }, 2000);

      }
    }, 25000); // Send a ping every 25 seconds
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatInterval);
    clearTimeout(this.heartbeatTimeout);
  }

  // Send data to the server
  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send message, socket is not open.');
    }
  }

  // Event listener methods (on, off, emit)
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const filteredListeners = this.listeners.get(eventName).filter(cb => cb !== callback);
      this.listeners.set(eventName, filteredListeners);
    }
  }

  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => callback(data));
    }
  }

  // Disconnect manually
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'User initiated disconnect.');
    }
  }
}

// Singleton instance to be used across the app
export const websocketManager = new WebSocketManager();

// Initialize the connection automatically when the module is loaded
if (typeof window !== 'undefined') {
  websocketManager.connect();
}