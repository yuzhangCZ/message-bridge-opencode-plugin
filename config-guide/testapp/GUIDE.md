
# 🚀 Quick Start --- TestApp (Mock Server)

TestApp is a mock server adapter for testing and development purposes. It connects to a WebSocket-based mock server to simulate messaging platform interactions.

---

## ⚙️ Opencode Configuration (`opencode.json`)

> **Note:** It is strongly recommended to use the **String** type for all configuration items to avoid parsing issues.

### WebSocket Mode

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
        "mock_server_url": "ws://localhost:8179"
      }
    }
  }
}
```

---

## 📋 Configuration Options

| Option | Required | Type | Default | Description |
|--------|----------|------|---------|-------------|
| `app_id` | Yes | String | - | Application identifier |
| `ak` | Yes | String | - | Access Key for authentication |
| `sk` | Yes | String | - | Secret Key for authentication |
| `mock_server_url` | No | String | `ws://localhost:8179` | WebSocket URL of the mock server |

**Note:** TestApp only supports **WebSocket mode** (`mode: 'ws'`). This is set automatically and does not need to be configured.

---

## 🚀 Launching Opencode

1. Ensure your mock server is running and accessible at the configured `mock_server_url`.

2. Start **opencode**:

```bash
opencode web
```

3. The adapter will automatically connect to the mock server using WebSocket and authenticate with the provided `ak` and `sk`.

4. Once connected, you can send messages through the mock server to test your integration.

---

## 🔧 Mock Server Setup

The TestApp adapter expects a mock server that:

- Supports WebSocket connections
- Requires authentication via `ak` and `sk`
- Sends messages in the following format:
  ```json
  {
    "event_type": "im.message.receive_v1",
    "message": {
      "message_id": "msg_id",
      "chat_id": "chat_id",
      "message_type": "text",
      "content": "{\"text\": \"Hello\"}"
    },
    "sender": {
      "sender_id": {
        "open_id": "user_id"
      }
    }
  }
  ```

### Quick Mock Server (Python Example)

```python
import asyncio
import websockets
import json

async def handle(websocket, path):
    # Wait for login
    login_msg = await websocket.recv()
    login_data = json.loads(login_msg)
    
    if login_data.get('type') == 'login':
        # Verify ak/sk
        if login_data.get('ak') == 'test_ak' and login_data.get('sk') == 'test_sk':
            await websocket.send(json.dumps({
                'type': 'login_response',
                'status': 'success'
            }))
            print('Client authenticated')
        else:
            await websocket.send(json.dumps({
                'type': 'login_response',
                'status': 'failed',
                'error': 'Invalid credentials'
            }))
            return
    
    # Handle messages
    async for message in websocket:
        data = json.loads(message)
        print(f'Received: {data}')

start_server = websockets.serve(handle, 'localhost', 8179)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

---

## 📝 Notes

- TestApp only supports **WebSocket mode**.
- The adapter will automatically attempt to login upon connection using the provided credentials.
- Connection failures will be logged with detailed error messages.
- All message content is rendered through the TestApp renderer before sending.

---

## 🐛 Troubleshooting

### Connection Failed

**Symptom:** Unable to connect to mock server

**Solutions:**
1. Verify the mock server is running at the specified `mock_server_url`
2. Check network connectivity to the mock server
3. Verify the WebSocket URL format (should start with `ws://` or `wss://`)

### Authentication Failed

**Symptom:** Login rejected by mock server

**Solutions:**
1. Verify `ak` and `sk` are correct
2. Check that credentials are properly configured in `opencode.json`
3. Ensure the mock server recognizes the provided credentials

### Message Not Received

**Symptom:** Messages sent through mock server not appearing

**Solutions:**
1. Verify the mock server is sending messages in the expected format
2. Check opencode logs for parsing errors
3. Ensure the `app_id` matches between client and server
