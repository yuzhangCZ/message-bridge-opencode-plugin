import type { BridgeAdapter, TestAppConfig, IncomingMessageHandler } from './testApp.types';
import { TestAppClient } from './testApp.client';
import { TestAppRenderer } from './testApp.renderer';
import { bridgeLogger } from '../logger';

export class TestAppAdapter implements BridgeAdapter {
  private client: TestAppClient;
  private renderer: TestAppRenderer;
  private config: TestAppConfig;

  constructor(config: TestAppConfig) {
    this.config = config;
    this.client = new TestAppClient(config.server_url, config.ak, config.sk);
    this.renderer = new TestAppRenderer();
  }

  async start(onMessage: IncomingMessageHandler): Promise<void> {
    await this.client.connect(onMessage);
    bridgeLogger.info('[TestApp] Adapter started');
  }

  async stop(): Promise<void> {
    this.client.disconnect();
    bridgeLogger.info('[TestApp] Adapter stopped');
  }

  async sendMessage(chatId: string, text: string): Promise<string | null> {
    const renderedText = this.renderer.render(text);
    return this.client.sendMessage(chatId, renderedText);
  }

  async editMessage(chatId: string, messageId: string, text: string): Promise<boolean> {
    const renderedText = this.renderer.render(text);
    return this.client.editMessage(chatId, messageId, renderedText);
  }
}
