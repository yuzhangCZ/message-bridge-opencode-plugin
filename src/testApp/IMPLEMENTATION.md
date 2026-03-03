# TestApp 平台接入实现总结

## 已完成的工作

### 1. 目录结构

```
src/
└── testApp/
    ├── index.ts              # 模块导出
    ├── testApp.types.ts      # 类型定义
    ├── testApp.client.ts     # WebSocket 客户端（封装与 mock server 通信）
    ├── testApp.renderer.ts   # 消息渲染器
    ├── testApp.adapter.ts    # 适配器（实现 BridgeAdapter 接口）
    ├── example.ts            # 使用示例
    └── README.md             # 使用文档

mockService/
├── mock-server.js            # Mock WebSocket 服务器
├── config.js                 # 配置文件
├── package.json              # npm 包配置
└── README.md                 # 使用文档
```

### 2. 核心实现

#### TestAppClient (`src/testApp/testApp.client.ts`)
- 封装 WebSocket 连接逻辑
- 处理消息收发
- 解析 `im.message.receive_v1` 事件
- 外层不感知具体通信细节

#### TestAppAdapter (`src/testApp/testApp.adapter.ts`)
- 实现 `BridgeAdapter` 接口
- 提供统一的 API：`start`, `stop`, `sendMessage`, `editMessage`
- 使用 `TestAppClient` 进行通信
- 使用 `TestAppRenderer` 进行消息渲染

#### TestAppRenderer (`src/testApp/testApp.renderer.ts`)
- 当前仅支持文本消息
- 可扩展支持富文本或卡片消息

### 3. Mock Server (`mockService/mock-server.js`)

- 运行在 `ws://localhost:8179`
- 支持从控制台输入文本消息并发送给客户端
- 接收客户端消息并打印
- 消息格式符合 `im.message.receive_v1` 事件规范

### 4. 使用方法

#### 启动 Mock Server
```bash
cd mockService
npm start
```

#### 启动 TestApp 示例
```bash
npx ts-node src/testApp/example.ts
```

#### 或使用启动脚本
```bash
./start-testapp.sh
```

### 5. 配置选项

```typescript
interface TestAppConfig {
  mode: 'ws';                              // 仅支持 WebSocket
  mock_server_url: string;                 // Mock Server 地址
  file_store_dir?: string;                 // 文件存储目录
  auto_send_local_files?: boolean;         // 自动发送本地文件
  auto_send_local_files_max_mb?: number;   // 文件大小限制
  auto_send_local_files_allow_absolute?: boolean; // 允许绝对路径
}
```

### 6. 消息格式

#### 接收消息（从 Mock Server）
```json
{
  "event_type": "im.message.receive_v1",
  "sender": {
    "sender_id": {
      "open_id": "open_xxx"
    }
  },
  "message": {
    "message_id": "msg_xxx",
    "chat_id": "chat_xxx",
    "message_type": "text",
    "content": "{\"text\":\"Hello\"}"
  }
}
```

#### 发送消息（到 Mock Server）
```json
{
  "receive_id_type": "chat_id",
  "receive_id": "chat_xxx",
  "msg_type": "text",
  "content": "{\"text\":\"Hello\"}"
}
```

## 特性

- ✅ 支持文本消息
- ✅ WebSocket 连接
- ✅ 通信逻辑单独封装
- ✅ 外层不感知具体实现
- ✅ 独立的 npm 包（mockService）
- ✅ TypeScript 支持
- ✅ 完整的类型定义

## 后续扩展

1. 支持文件消息
2. 支持消息编辑
3. 支持消息反应（emoji）
4. 支持更多的消息类型
5. 添加单元测试
6. 添加集成测试
