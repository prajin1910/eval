import { Client } from 'stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private messageCallbacks: ((message: any) => void)[] = [];
  private notificationCallbacks: ((notification: any) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string) {
    if (this.connected) return;

    try {
      const socket = new SockJS('http://localhost:8080/ws');
      this.client = new Client();
      this.client.webSocketFactory = () => socket;

      this.client.onConnect = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Subscribe to personal message queue
        this.client?.subscribe(`/user/${userId}/queue/messages`, (message) => {
          try {
            const messageData = JSON.parse(message.body);
            this.messageCallbacks.forEach(callback => {
              try {
                callback(messageData);
              } catch (error) {
                console.error('Error in message callback:', error);
              }
            });
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });

        // Subscribe to personal notification queue
        this.client?.subscribe(`/user/${userId}/queue/notifications`, (notification) => {
          try {
            const notificationData = JSON.parse(notification.body);
            this.notificationCallbacks.forEach(callback => {
              try {
                callback(notificationData);
              } catch (error) {
                console.error('Error in notification callback:', error);
              }
            });
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });
      };

      this.client.onDisconnect = () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        this.attemptReconnect(userId);
      };

      this.client.onStompError = (frame) => {
        console.error('WebSocket error:', frame);
        this.connected = false;
        this.attemptReconnect(userId);
      };

      this.client.activate();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect(userId);
    }
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(userId);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
    }
    this.reconnectAttempts = 0;
  }

  sendMessage(senderId: string, receiverId: string, message: string) {
    if (this.client && this.connected) {
      try {
        this.client.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify({
            senderId,
            receiverId,
            message
          })
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message');
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