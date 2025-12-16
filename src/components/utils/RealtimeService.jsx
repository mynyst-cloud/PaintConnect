// Simulates a stable, centralized real-time update service (e.g., WebSockets)
class RealtimeService {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(channel, callback) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel).push(callback);
  }

  unsubscribe(channel, callback) {
    if (this.listeners.has(channel)) {
      const channelListeners = this.listeners.get(channel);
      this.listeners.set(channel, channelListeners.filter(cb => cb !== callback));
    }
  }

  // Called by other services when data changes
  publish(channel, data) {
    if (this.listeners.has(channel)) {
      this.listeners.get(channel).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in realtime subscriber for channel ${channel}:`, error);
        }
      });
    }
  }
}

const realtimeService = new RealtimeService();
export default realtimeService;