import { TestAppAdapter } from './testApp.adapter';
import type { TestAppConfig } from './testApp.types';

async function main() {
  const config: TestAppConfig = {
    app_id: 'test_app_123',
    ak: 'test_access_key',
    sk: 'test_secret_key',
    mode: 'ws',
    mock_server_url: 'ws://localhost:8179',
  };

  const adapter = new TestAppAdapter(config);

  // 启动适配器
  await adapter.start(async (chatId, text, messageId, senderId) => {
    console.log(`[Handler] Received message: chat=${chatId} text=${text} from=${senderId}`);
    
    // 回复消息
    const reply = `Echo: ${text}`;
    await adapter.sendMessage(chatId, reply);
  });

  console.log('[TestApp] Press Ctrl+C to exit');

  // 保持进程运行
  process.stdin.resume();

  // 处理退出
  process.on('SIGINT', async () => {
    console.log('\n[TestApp] Shutting down...');
    await adapter.stop();
    process.exit(0);
  });
}

main().catch(console.error);
