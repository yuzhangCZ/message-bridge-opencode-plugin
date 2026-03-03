# TestApp Platform Adapter

基于 `@src/feishu/` 实现逻辑新增的平台接入，与 mock server 服务对接。

## 目录结构

```
src/testApp/
├── index.ts              # 导出文件
├── testApp.adapter.ts    # 适配器实现
├── testApp.client.ts     # WebSocket 客户端
├── testApp.renderer.ts   # 消息渲染器
├── testApp.types.ts      # 类型定义
└── example.ts            # 使用示例
```

## 功能特性

- ✅ 支持文本消息
- ✅ WebSocket 连接
- ✅ **登录认证**：连接后自动发送 ak/sk 进行身份验证
- ✅ 与 mock server 通信逻辑单独封装
- ✅ 外层不感知具体实现细节

## 使用方法

### 1. 启动 Mock Server

```bash
cd mockService
npm start
```

Mock Server 将运行在 `ws://localhost:8179`

### 2. 使用 TestApp Adapter

```typescript
import { TestAppAdapter } from './testApp';
import type { TestAppConfig } from './testApp';

const config: TestAppConfig = {
  mode: 'ws',
  mock_server_url: 'ws://localhost:8179',
};

const adapter = new TestAppAdapter(config);

// 启动适配器
await adapter.start(async (chatId, text, messageId, senderId) => {
  console.log(`Received: ${text}`);
  await adapter.sendMessage(chatId, `Echo: ${text}`);
});

// 发送消息
await adapter.sendMessage('chat_123', 'Hello, TestApp!');

// 停止适配器
await adapter.stop();
```

## 配置选项

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| mode | 'ws' | 是 | 连接模式，仅支持 WebSocket |
| mock_server_url | string | 是 | Mock Server 的 WebSocket 地址 |
| file_store_dir | string | 否 | 文件存储目录 |
| auto_send_local_files | boolean | 否 | 是否自动发送本地文件 |
| auto_send_local_files_max_mb | number | 否 | 自动发送文件的最大大小 (MB) |
| auto_send_local_files_allow_absolute | boolean | 否 | 是否允许绝对路径 |

## 消息格式

### 接收消息 (从 Mock Server)

```json
{
  "event_id": "ev_1234567890",
  "token": "token_1234567890",
  "create_time": "2024-01-01T12:00:00.000Z",
  "event_type": "im.message.receive_v1",
  "tenant_key": "tenant_1234567890",
  "ts": 1704110400000,
  "uuid": "uuid_1234567890",
  "type": "message",
  "app_id": "app_1234567890",
  "sender": {
    "sender_id": {
      "union_id": "union_1234567890",
      "user_id": "user_1234567890",
      "open_id": "open_1234567890"
    },
    "sender_type": "user",
    "tenant_key": "tenant_1234567890"
  },
  "message": {
    "message_id": "msg_1234567890",
    "root_id": "msg_1234567890",
    "parent_id": null,
    "create_time": "2024-01-01T12:00:00.000Z",
    "update_time": "2024-01-01T12:00:00.000Z",
    "chat_id": "chat_1234567890",
    "thread_id": null,
    "chat_type": "group",
    "message_type": "text",
    "content": "{\"text\":\"Hello\"}",
    "mentions": [],
    "user_agent": "TestApp/1.0.0"
  }
}
```

### 发送消息 (到 Mock Server)

```json
{
  "receive_id_type": "chat_id",
  "receive_id": "chat_1234567890",
  "msg_type": "text",
  "content": "{\"text\":\"Hello\"}"
}
```

## 运行示例

```bash
# 终端 1: 启动 Mock Server
cd mockService
npm start

# 终端 2: 运行 TestApp 示例
npx ts-node src/testApp/example.ts
```
