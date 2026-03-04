# TestApp WebSocket 协议说明

Doc Version: v1.0
Last Updated: 2026-03-04

## Purpose（目的）
定义 TestApp 与桥接层之间的 WS 协议，用于联调和 mock 验证。

## Scope（范围）
- 登录握手
- 入站消息协议
- 出站发送/编辑协议
- 成功与失败报文样例

## Interface/Flow Definition（定义）
连接地址：`ws://localhost:8179`（可配置）

握手：
1. Bridge 发送登录请求（`type=login`）。
2. Server 返回登录响应（`type=login_response`）。
3. 登录成功后收发业务消息。

## Examples（调用示例 + 报文示例）
### 1) 登录请求（Bridge -> MockServer）
```json
{
  "type": "login",
  "ak": "test_ak",
  "sk": "test_sk"
}
```

### 2) 登录响应成功（MockServer -> Bridge）
```json
{
  "type": "login_response",
  "status": "success"
}
```

### 3) 登录响应失败（MockServer -> Bridge）
```json
{
  "type": "login_response",
  "status": "failed",
  "error": "Invalid credentials"
}
```

### 4) 入站消息（MockServer -> Bridge）
```json
{
  "event_type": "im.message.receive_v1",
  "sender": {
    "sender_id": {
      "open_id": "user_open_1",
      "user_id": "user_1",
      "union_id": "u_1"
    },
    "sender_type": "user"
  },
  "message": {
    "message_id": "msg_1001",
    "chat_id": "chat_9001",
    "message_type": "text",
    "content": "{\"text\":\"/help\"}"
  }
}
```

### 5) 出站发送（Bridge -> MockServer）
```json
{
  "receive_id_type": "chat_id",
  "receive_id": "chat_9001",
  "msg_type": "text",
  "content": "{\"text\":\"## Command\\n### Help\"}"
}
```

### 6) 出站编辑（Bridge -> MockServer）
```json
{
  "message_id": "msg_1741132800000",
  "content": "{\"text\":\"## Answer\\nstreaming...\"}"
}
```

## Failure Modes（失败场景）
- 登录超时（10s）：客户端断开并抛错。
- 非 JSON 消息：忽略并记录错误。
- WS 未连接时发送：返回失败并记录日志。

## Compatibility（兼容性）
- 该协议为测试适配器协议，不代表所有平台最终协议。
- 新平台需通过 `BridgeAdapter` 契约对齐，而不是复制 TestApp 报文。

## Open Questions（未决事项）
- 是否为 TestApp 增加显式 ack，保证消息送达可确认。
