# OpenCode SDK 接口面说明（Bridge 调用）

Doc Version: v1.0
Last Updated: 2026-03-04

## Purpose（目的）
说明桥接层对 OpenCode SDK 的实际调用面，作为联调、回归与兼容设计依据。

## Scope（范围）
- 会话、命令、事件、问题、权限相关接口
- 典型请求结构、返回使用方式、兼容策略

## Interface/Flow Definition（定义）
### Session APIs
- `api.session.create({ body: { title } })`
- `api.session.prompt({ path: { id }, body: { parts, agent?, model? } })`
- `api.session.messages({ path: { id }, query: { limit } })`
- `api.session.status()`
- `api.session.abort({ path: { id } })`
- `api.session.list({})`
- `api.session.update({ path: { id }, body: { title } })`
- `api.session.delete({ path: { id } })`

### Command/Config APIs
- `api.command.list()`
- `api.session.command({ path: { id }, body: { command, arguments } })`
- `api.config.providers()`
- `api.app.agents()`

### Session Capability APIs
- `api.session.share({ path: { id } })`
- `api.session.unshare({ path: { id } })`
- `api.session.summarize({ path: { id } })`
- `api.session.init({ path: { id } })`

### Event APIs
- `api.event.subscribe()`
- `api.global.event()`（主流降级时兜底）

### Question / Permission APIs
- 优先：`api.question.reply({ path: { requestID }, body: { answers } })`
- 优先：`api.permission.reply({ path: { requestID }, body: { reply } })`
- 兼容 fallback：`postSessionIdPermissionsPermissionId(...)`

## Examples（调用示例 + 报文示例）
Prompt 提交：
```ts
await api.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [
      {
        type: 'text',
        text: '请总结这次改动',
        metadata: {
          bridge: true,
          source: 'bridge.incoming',
          adapter_key: 'testapp',
          chat_id: 'chat_9001',
          sender_id: 'user_open_1',
          session_id: sessionId,
          routed_at: '2026-03-04T00:00:00.000Z'
        }
      }
    ],
    agent: 'build'
  }
});
```

Question 回复：
```ts
await api.question.reply({
  path: { requestID: 'req_abc' },
  body: {
    answers: [
      ['workspace-prod-001']
    ]
  }
});
```

Permission 回复：
```ts
await api.permission.reply({
  path: { requestID: 'perm_456' },
  body: { reply: 'once' }
});
```

## Failure Modes（失败场景）
- `question.reply` 不可用：回退 resume prompt 注入。
- `permission.reply` 不可用：回退 session permission endpoint。
- `session.prompt` 被权限阻塞：进入 pending authorization。
- `session.status/messages` 查询失败：监控日志记录并尽量回放已有内容。

## Compatibility（兼容性）
- 通过 `toApiRecord/toApiArray` 适配响应 envelope 差异。
- 通过 v2 优先 + v1 fallback 维持跨版本可用。

## Open Questions（未决事项）
- 是否将全部 fallback 收敛到独立 gateway，移除业务层 `as unknown as`。
