import { Client } from 'stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private messageCallbacks: ((message: any) => void)[] = [];
  private notificationCallbacks: ((notification: any) => void)[] = [];

  connect(userId: string) {
    if (this.connected) return;

    const socket = new SockJS('http://localhost:8080/ws');
    this.client = new Client();
    this.client.webSocketFactory = () => socket;

    this.client.onConnect = () => {
      console.log('WebSocket connected');
      this.connected = true;

      // Subscribe to personal message queue
      this.client?.subscribe(`/user/${userId}/queue/messages`, (message) => {
        const messageData = JSON.parse(message.body);
        this.messageCallbacks.forEach(callback => callback(messageData));
      });

      // Subscribe to personal notification queue
      this.client?.subscribe(`/user/${userId}/queue/notifications`, (notification) => {
        const notificationData = JSON.parse(notification.body);
        this.notificationCallbacks.forEach(callback => callback(notificationData));
      });
    };

    this.client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    };

    this.client.onStompError = (frame) => {
      console.error('WebSocket error:', frame);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  sendMessage(senderId: string, receiverId: string, message: string) {
    if (this.client && this.connected) {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify({
          senderId,
          receiverId,
          message
        })
      });
    }
  }

  onMessage(callback: (message: any) => void) {
    this.messageCallbacks.push(callback);
  }

  onNotification(callback: (notification: any) => void) {
    this.notificationCallbacks.push(callback);
  }

  removeMessageCallback(callback: (message: any) => void) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  removeNotificationCallback(callback: (notification: any) => void) {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
  }

  isConnected() {
    return this.connected;
  }
}

export const webSocketService = new WebSocketService();