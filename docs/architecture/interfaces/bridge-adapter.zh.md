# BridgeAdapter 对外契约说明

Doc Version: v1.0
Last Updated: 2026-03-04

## Purpose（目的）
定义消息平台适配器需要实现的统一接口，保证平台侧可无侵入接入桥接主流程。

## Scope（范围）
- 接口定义：`BridgeAdapter`、`IncomingMessageHandler`
- 输入输出约束、幂等语义、失败处理
- 调用示例与平台报文映射

## Interface/Flow Definition（定义）
来源：`src/types.ts`

```ts
import type { FilePartInput, TextPartInput } from '@opencode-ai/sdk';

export type IncomingMessageHandler = (
  chatId: string,
  text: string,
  messageId: string,
  senderId: string,
  parts?: Array<TextPartInput | FilePartInput>
) => Promise<void>;

export interface BridgeAdapter {
  start(onMessage: IncomingMessageHandler): Promise<void>;
  stop?(): Promise<void>;
  sendMessage(chatId: string, text: string): Promise<string | null>;
  editMessage(chatId: string, messageId: string, text: string): Promise<boolean>;
  addReaction?(messageId: string, emojiType: string): Promise<string | null>;
  removeReaction?(messageId: string, reactionId: string): Promise<void>;
  sendLocalFile?(chatId: string, localPath: string): Promise<boolean>;
}
```

字段约束：
- `chatId`: 平台会话标识，必须稳定。
- `messageId`: 平台消息标识，必须可用于后续编辑/反应。
- `sendMessage` 返回值：成功返回可追踪消息 ID，失败返回 `null`。
- `editMessage` 返回值：成功 `true`，失败 `false`，不抛异常更优。

## Examples（调用示例 + 报文示例）
调用示例：
```ts
await adapter.start(onMessage);

const mid = await adapter.sendMessage('chat_9001', '## Status\nready');
if (mid) {
  const ok = await adapter.editMessage('chat_9001', mid, '## Status\nupdated');
  if (!ok) {
    await adapter.sendMessage('chat_9001', '## Status\nedit failed, fallback sent');
  }
}
```

入站回调示例：
```ts
await onMessage('chat_9001', '/models', 'msg_1001', 'user_open_1', []);
```

## Failure Modes（失败场景）
- `start` 未完成即接收消息：应在适配器内部缓存或丢弃并记录日志。
- `sendMessage` 返回 `null`：桥接层应记录失败，不可假设消息已送达。
- `editMessage` 失败：桥接层 fallback `sendMessage`。
- 网络抖动：适配器应处理重连，保持 `onMessage` 语义不变。

## Compatibility（兼容性）
- 新增平台时必须兼容该接口，不允许直接耦合 `incoming.ts` 内部细节。
- 可选能力（reaction/sendLocalFile）缺失时，桥接层应按 capability degrade。

## Open Questions（未决事项）
- `sendMessage` 是否需要标准化错误对象（而非 `null`）。
- 是否需要新增 `supports` 能力协商接口。
