## 🚀 快速开始 --- TestApp (Mock Server)

TestApp 是一个用于测试和开发的 Mock 服务器适配器。它通过 WebSocket 连接到模拟服务器，模拟消息平台的交互。

---

## ⚙️ Opencode 配置 (`opencode.json`)

> **注意：** 强烈建议所有配置项均使用 **字符串类型**，以避免解析问题。

### WebSocket 模式

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["message-bridge-opencode-plugin"],
  "agent": {
    "testapp": {
      "disable": false,
      "description": "TestApp Mock Server Bridge",
      "options": {
        "app_id": "your_app_id",
        "ak": "your_access_key",
        "sk": "your_secret_key",
        "server_url": "ws://localhost:8179"
      }
    }
  }
}
```

---

## 📋 配置选项说明

| 配置项 | 必填 | 类型 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `app_id` | 是 | 字符串 | - | 应用标识符 |
| `ak` | 是 | 字符串 | - | 认证密钥（Access Key） |
| `sk` | 是 | 字符串 | - | 密钥（Secret Key） |
| `server_url` | 否 | 字符串 | `ws://localhost:8179` | Mock 服务器的 WebSocket URL |

**注意：** TestApp 仅支持 **WebSocket 模式**（`mode: 'ws'`），该值会自动设置，无需手动配置。

---

## 🚀 启动 Opencode

1. 确保你的 Mock 服务器已运行，并且可以通过配置的 `server_url` 访问。

2. 启动 **opencode**：

```bash
opencode web
```

3. 适配器会自动通过 WebSocket 连接到 Mock 服务器，并使用提供的 `ak` 和 `sk` 进行认证。

4. 连接成功后，你可以通过 Mock 服务器发送消息来测试你的集成。

---

## 🔧 Mock 服务器设置

TestApp 适配器期望的 Mock 服务器需要：

- 支持 WebSocket 连接
- 通过 `ak` 和 `sk` 进行认证
- 发送以下格式的消息：
  ```json
  {
    "event_type": "im.message.receive_v1",
    "message": {
      "message_id": "msg_id",
      "chat_id": "chat_id",
      "message_type": "text",
      "content": "{\"text\": \"你好\"}"
    },
    "sender": {
      "sender_id": {
        "open_id": "user_id"
      }
    }
  }
  ```

### 快速搭建 Mock 服务器（Python 示例）

```python
import asyncio
import websockets
import json

async def handle(websocket, path):
    # 等待登录
    login_msg = await websocket.recv()
    login_data = json.loads(login_msg)
    
    if login_data.get('type') == 'login':
        # 验证 ak/sk
        if login_data.get('ak') == 'test_ak' and login_data.get('sk') == 'test_sk':
            await websocket.send(json.dumps({
                'type': 'login_response',
                'status': 'success'
            }))
            print('客户端认证成功')
        else:
            await websocket.send(json.dumps({
                'type': 'login_response',
                'status': 'failed',
                'error': '凭据无效'
            }))
            return
    
    # 处理消息
    async for message in websocket:
        data = json.loads(message)
        print(f'收到消息: {data}')

start_server = websockets.serve(handle, 'localhost', 8179)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

---

## 📝 注意事项

- TestApp 仅支持 **WebSocket 模式**。
- 适配器会在连接成功后自动尝试使用提供的凭据登录。
- 连接失败会记录详细的错误信息。
- 所有消息内容在发送前都会通过 TestApp 渲染器进行处理。

---

## 🐛 常见问题排查

### 连接失败

**现象：** 无法连接到 Mock 服务器

**解决方案：**
1. 确认 Mock 服务器在指定的 `server_url` 上运行
2. 检查与 Mock 服务器的网络连通性
3. 验证 WebSocket URL 格式（应以 `ws://` 或 `wss://` 开头）

### 认证失败

**现象：** Mock 服务器拒绝登录

**解决方案：**
1. 确认 `ak` 和 `sk` 正确无误
2. 检查 `opencode.json` 中的凭据配置是否正确
3. 确保 Mock 服务器识别提供的凭据

### 消息未收到

**现象：** 通过 Mock 服务器发送的消息未显示

**解决方案：**
1. 确认 Mock 服务器发送的消息格式符合预期
2. 检查 opencode 日志中的解析错误
3. 确保客户端和服务器的 `app_id` 匹配
