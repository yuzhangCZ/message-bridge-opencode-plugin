import WebSocket from 'ws';
import { IncomingMessageHandler } from './testApp.types';
import { bridgeLogger } from '../logger';

export interface MockServerMessage {
  event_id: string;
  token: string;
  create_time: string;
  event_type: string;
  tenant_key: string;
  ts: number;
  uuid: string;
  type: string;
  app_id: string;
  sender: {
    sender_id: {
      union_id: string;
      user_id: string;
      open_id: string;
    };
    sender_type: string;
    tenant_key: string;
  };
  message: {
    message_id: string;
    root_id: string;
    parent_id: string | null;
    create_time: string;
    update_time: string;
    chat_id: string;
    thread_id: string | null;
    chat_type: string;
    message_type: string;
    content: string;
    mentions?: Array<{
      key: string;
      id: {
        union_id?: string;
        user_id?: string;
        open_id?: string;
      };
      name: string;
      tenant_key?: string;
    }>;
    user_agent?: string;
  };
}

export interface LoginResponse {
  type: 'login_response';
  status: 'success' | 'failed';
  error?: string;
}

export class TestAppClient {
  private ws: WebSocket | null = null;
  private onMessageHandler?: IncomingMessageHandler;
  private url: string;
  private ak: string;
  private sk: string;
  private isAuthenticated: boolean = false;

  constructor(url: string, ak: string, sk: string) {
    this.url = url;
    this.ak = ak;
    this.sk = sk;
  }

  public connect(onMessage: IncomingMessageHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onMessageHandler = onMessage;
      this.ws = new WebSocket(this.url);

      this.ws.on('open', async () => {
        bridgeLogger.info('[TestApp] Connected to mock server');
        try {
          await this.login();
          bridgeLogger.info('[TestApp] Login successful');
          this.isAuthenticated = true;
          resolve();
        } catch (error) {
          bridgeLogger.error('[TestApp] Login failed:', error);
          this.disconnect();
          reject(error);
        }
      });

      this.ws.on('error', (error: Error) => {
        bridgeLogger.error('[TestApp] WebSocket error:', error);
        reject(error);
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('close', () => {
        bridgeLogger.info('[TestApp] Disconnected from mock server');
        this.isAuthenticated = false;
      });
    });
  }

  private async login(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const loginMessage = {
        type: 'login',
        ak: this.ak,
        sk: this.sk,
      };

      bridgeLogger.info('[TestApp] Sending login request');
      this.ws.send(JSON.stringify(loginMessage));

      // Wait for login response
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response: LoginResponse = JSON.parse(data.toString());
          if (response.type === 'login_response') {
            this.ws?.off('message', messageHandler);
            if (response.status === 'success') {
              resolve();
            } else {
              reject(new Error(response.error || 'Login failed'));
            }
          }
        } catch {
          // Ignore non-JSON messages during login
        }
      };

      this.ws.on('message', messageHandler);

      // Timeout after 10 seconds
      setTimeout(() => {
        this.ws?.off('message', messageHandler);
        reject(new Error('Login timeout'));
      }, 10000);
    });
  }

  private async handleMessage(data: WebSocket.Data) {
    try {
      const message: MockServerMessage = JSON.parse(data.toString());
      bridgeLogger.debug('[TestApp] Received:', message);

      if (message.event_type === 'im.message.receive_v1' || message.type === 'message') {
        await this.handleIncomingMessage(message);
      }
    } catch (error) {
      bridgeLogger.error('[TestApp] Failed to parse message:', error);
    }
  }

  private async handleIncomingMessage(message: MockServerMessage) {
    if (!this.onMessageHandler) return;

    const { message: msg, sender } = message;
    const messageId = msg.message_id;
    const chatId = msg.chat_id;
    const senderId = sender.sender_id.open_id || sender.sender_id.user_id || sender.sender_id.union_id;

    // 解析消息内容
    let text = '';
    if (msg.message_type === 'text') {
      const content = JSON.parse(msg.content);
      text = content.text || '';
    }

    bridgeLogger.info(`[TestApp] Incoming message: chat=${chatId} msg=${messageId} sender=${senderId} text=${text}`);

    try {
      await this.onMessageHandler(chatId, text, messageId, senderId);
    } catch (error) {
      bridgeLogger.error('[TestApp] Failed to handle incoming message:', error);
    }
  }

  public async sendMessage(chatId: string, text: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        bridgeLogger.error('[TestApp] WebSocket is not connected');
        resolve(null);
        return;
      }

      const message = {
        receive_id_type: 'chat_id',
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text }),
      };

      bridgeLogger.debug('[TestApp] Sending message:', message);
      this.ws.send(JSON.stringify(message));

      const messageId = `msg_${Date.now()}`;
      resolve(messageId);
    });
  }

  public async editMessage(chatId: string, messageId: string, text: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        bridgeLogger.error('[TestApp] WebSocket is not connected');
        resolve(false);
        return;
      }

      const message = {
        message_id: messageId,
        content: JSON.stringify({ text }),
      };

      bridgeLogger.debug('[TestApp] Editing message:', message);
      this.ws.send(JSON.stringify(message));
      resolve(true);
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
