# event.subscribe 复现报告（真实 OpenCode 环境）

Doc Version: v1.2
Last Updated: 2026-03-04

## Purpose（目的）
验证并复现 `event.subscribe` 订阅消息无法收到问题，形成证据链并输出下一阶段架构设计输入。

## Scope（范围）
- 真实 OpenCode 环境复现实验。
- 服务端发布、主订阅（`/event`）、全局订阅（`/global/event`）三侧对账。
- 本阶段不做代码修复。

## Interface/Flow Definition（定义）
### 实验环境
- OpenCode CLI: `1.2.15`
- SDK: `@opencode-ai/sdk@1.1.48`
- Node: `v24.14.0`
- OS: `Darwin 25.0.0 arm64`
- Server: `opencode serve --hostname 127.0.0.1 --port 39123`
- 工作目录: `/Users/zy/Code/opencode/message-bridge-opencode-plugin`
- 日志文件: `/Users/zy/.local/share/opencode/log/2026-03-03T174909.log`

### 复现实验步骤（A/C 两轮）
1. 并行建立两路订阅：
- 主通道：`client.event.subscribe()`
- 全局通道：`client.global.event()`
2. 创建会话并发送 prompt：`session.create -> session.prompt`
3. 等待 `message.updated/message.part.updated/session.idle` 或超时。
4. 查询 `session.messages` 验证会话输出。
5. 删除会话清理。

## Examples（调用示例 + 报文示例）
最小调用代码（复现脚本核心）：
```ts
const client = createOpencodeClient({
  baseUrl: 'http://127.0.0.1:39123',
  directory: '/Users/zy/Code/opencode/message-bridge-opencode-plugin',
  responseStyle: 'data'
});

const main = await client.event.subscribe({ signal: mainController.signal });
const global = await client.global.event({ signal: globalController.signal });

const created = await client.session.create({ body: { title: 'repro-A' } });
await client.session.prompt({
  path: { id: created.id },
  body: { parts: [{ type: 'text', text: 'Say hello in one short sentence.' }] }
});
```

### 统一采样字段结果
#### Run A
```json
{
  "run_id": "A",
  "session_id": "ses_34b2bbbfeffekEI6slsVo8nBJ3",
  "prompt_sent_at": "2026-03-03T17:52:15.886Z",
  "server_published_count_by_type": {
    "session.created": 1,
    "session.updated": 4,
    "tui.toast.show": 50,
    "message.updated": 5,
    "message.part.updated": 7,
    "session.status": 4,
    "session.diff": 1,
    "message.part.delta": 35,
    "session.idle": 1,
    "session.deleted": 1
  },
  "main_subscribed_count_by_type": {
    "server.connected": 1,
    "session.created": 1,
    "session.updated": 4,
    "tui.toast.show": 50,
    "message.updated": 5,
    "message.part.updated": 7,
    "session.status": 4,
    "session.diff": 1,
    "message.part.delta": 35,
    "server.heartbeat": 1,
    "session.idle": 1,
    "session.deleted": 1
  },
  "global_subscribed_count_by_type": {
    "server.connected": 1,
    "session.created": 1,
    "session.updated": 4,
    "tui.toast.show": 50,
    "message.updated": 5,
    "message.part.updated": 7,
    "session.status": 4,
    "session.diff": 1,
    "message.part.delta": 35,
    "server.heartbeat": 1,
    "session.idle": 1,
    "session.deleted": 1
  },
  "last_main_event_type": "session.deleted",
  "last_global_event_type": "session.deleted",
  "idle_seen": true,
  "timed_out": false,
  "error_summary": []
}
```

#### Run C
```json
{
  "run_id": "C",
  "session_id": "ses_34b2b8fefffe6hEnMS2LfaVi3K",
  "prompt_sent_at": "2026-03-03T17:52:27.154Z",
  "server_published_count_by_type": {
    "session.created": 1,
    "session.updated": 4,
    "message.updated": 5,
    "message.part.updated": 7,
    "session.status": 4,
    "session.diff": 1,
    "message.part.delta": 20,
    "session.idle": 1,
    "session.deleted": 1
  },
  "main_subscribed_count_by_type": {
    "server.connected": 1,
    "session.created": 1,
    "session.updated": 4,
    "message.updated": 5,
    "message.part.updated": 7,
    "session.status": 4,
    "session.diff": 1,
    "message.part.delta": 20,
    "session.idle": 1,
    "session.deleted": 1
  },
  "global_subscribed_count_by_type": {
    "server.connected": 1,
    "session.created": 1,
    "session.updated": 4,
    "message.updated": 5,
    "message.part.updated": 7,
    "session.status": 4,
    "session.diff": 1,
    "message.part.delta": 20,
    "session.idle": 1,
    "session.deleted": 1
  },
  "last_main_event_type": "session.deleted",
  "last_global_event_type": "session.deleted",
  "idle_seen": true,
  "timed_out": false,
  "error_summary": []
}
```

## Failure Modes（失败场景）
本次实验未复现 `main=0` 的失败症状。主要观察到：
- 主订阅与全局订阅都可稳定收到 `message.updated/message.part.updated/session.idle`。
- 会话输出存在，非“业务无输出导致无事件”场景。

## Compatibility（兼容性）
结论只覆盖本次组合：
- OpenCode `1.2.15`
- SDK `1.1.48`
- `createOpencodeClient({...directory...})` 直连 server 方式

不等价于插件运行时内置 client 的全部版本组合结论。

## Open Questions（未决事项）
1. 插件运行时 `ctx.client` 在不同 OpenCode 版本下的 SSE 链路是否与 SDK 直连完全一致。
2. 是否存在“插件上下文 + 特定参数形状 + 特定模型流”触发的条件性漏收。
3. 是否需要增加“主订阅健康度探测”以尽早识别 heartbeat-only 异常。

---

## 基于当前插件本体验证（A/B/C 三轮）

### 验证前置
- 启动命令：`BRIDGE_DEBUG=true BRIDGE_LOG_STDOUT=true opencode serve --hostname 127.0.0.1 --port 39123`
- 当前插件由同仓库路径加载（日志含 `loading plugin path=file:///Users/zy/Code/opencode/message-bridge-opencode-plugin`）。
- 不新增测试插件文件，不修改运行时代码。

### 触发方式
- 外部 SDK 调用触发会话：`session.create -> session.prompt -> session.messages -> session.delete`。
- 同时采集三侧：
1. 服务端日志：`~/.local/share/opencode/log/2026-03-03T180025.log`
2. 当前插件日志：`logs/bridge.log`
3. 会话输出：`session.messages`

### A/B/C 结果摘要（当前插件本体）
```json
{
  "runs": [
    {
      "run_id": "A",
      "session_id": "ses_34b22af00ffeGPR1YvAjIujdq4",
      "server_published_count_by_type": {
        "message.updated": 6,
        "message.part.updated": 7,
        "session.idle": 1
      },
      "plugin_observed_count_by_type": {},
      "plugin_dispatch_signals": {
        "part_updated": 0,
        "session_idle": 0,
        "route_miss": 0
      },
      "idle_seen": true,
      "timed_out": false,
      "session_has_output": true
    },
    {
      "run_id": "B",
      "session_id": "ses_34b227300ffezoxQ3sv9k30Dlv",
      "server_published_count_by_type": {
        "message.updated": 6,
        "message.part.updated": 7,
        "session.idle": 1
      },
      "plugin_observed_count_by_type": {},
      "plugin_dispatch_signals": {
        "part_updated": 0,
        "session_idle": 0,
        "route_miss": 0
      },
      "idle_seen": true,
      "timed_out": false,
      "session_has_output": true
    },
    {
      "run_id": "C",
      "session_id": "ses_34b225935ffennx5apm7WgO0M3",
      "server_published_count_by_type": {
        "message.updated": 10,
        "message.part.updated": 16,
        "session.idle": 1
      },
      "plugin_observed_count_by_type": {},
      "plugin_dispatch_signals": {
        "part_updated": 0,
        "session_idle": 0,
        "route_miss": 0
      },
      "idle_seen": true,
      "timed_out": false,
      "session_has_output": true
    }
  ]
}
```

### 对账结论
1. 服务端侧：`message.updated/message.part.updated/session.idle` 均有发布。
2. 会话侧：`session.messages` 可见 assistant 输出（非“业务无输出”）。
3. 当前插件侧：`[BridgeFlow] event.observed` 与 `part.updated` 对应日志为 0。

该现象满足“服务端有发布 + 会话有输出 + 插件订阅未观察到业务事件”的异常条件。

---

## 结论分级（更新）
### Confirmed（已证实）
1. 在“当前插件本体”A/B/C 三轮实验中，存在稳定对账不一致：
   - 服务端有 `message.updated/message.part.updated/session.idle` 发布；
   - 会话有 assistant 输出；
   - 插件日志无 `event.observed`/`part.updated` 证据。
2. 该异常已重复出现（>=2 轮），符合进入架构修复讨论的触发条件。

### Suspected（待证实）
1. 可能与插件运行时 `ctx.client` 的订阅链路语义有关（与外部 SDK 直连表现不同）。
2. 可能与目录/上下文过滤条件相关（`event` 与 `global event` 在插件上下文中的行为差异）。

### Ruled Out（已排除）
1. “服务端没有发布事件”已排除。
2. “会话无输出导致没有事件”已排除。

---

## 下一阶段触发条件
仅当满足以下条件，才进入架构修复设计：
1. 在插件运行时上下文中，至少 2 轮稳定复现 `main=0`（或同类漏收）且证据闭环。
2. 可明确定位落点：连接层、解包过滤层、生命周期重连窗口或分发链路。
3. 形成量化目标（到达率、漏收率、超时率）。

---

## SDK 升级单轮验证（`@opencode-ai/sdk` 1.2.15）

### 目的
验证 “opencode 与 `@opencode-ai/sdk` 版本差异” 是否直接导致该问题。

### 操作
1. 将仓库 devDependency 从 `@opencode-ai/sdk@1.1.48` 升级到 `1.2.15`。
2. 在相同环境执行 1 轮复现（`run_id=sdk-1.2.15-A`）。
3. 继续按三侧对账：服务端发布、外部订阅、当前插件日志。

### 结果摘要
```json
{
  "run_id": "sdk-1.2.15-A",
  "sdk_version": "1.2.15",
  "session_id": "ses_34b1c77ddffeTaucJhsFAt30iK",
  "main_subscribed_count_by_type": {
    "message.updated": 6,
    "message.part.updated": 7,
    "session.idle": 1
  },
  "global_subscribed_count_by_type": {
    "message.updated": 6,
    "message.part.updated": 7,
    "session.idle": 1
  },
  "idle_seen": true,
  "timed_out": false,
  "session_has_output": true
}
```

### 对账结论
1. 服务端侧：仍有稳定 `bus publishing`（`message.updated/message.part.updated/session.idle`）。
2. 订阅侧（外部 SDK 1.2.15）：main/global 均能收到业务事件。
3. 当前插件日志侧：仍未观察到 `event.observed/part.updated` 对应日志。

结论：仅升级仓库本地 `@opencode-ai/sdk` 到 `1.2.15`，未改变“当前插件本体对账不一致”现象。

### 附加观察（兼容性风险）
仅升级 `@opencode-ai/sdk` 后，`npm run build` 出现类型冲突（`@opencode-ai/plugin` 仍在 `1.1.48`）：
- `OpencodeClient` 类型来自不同版本路径，导致不兼容。
- 这属于依赖版本对齐问题，不是本次订阅问题根因证明。

---

## v1.5 验证口径收敛（Hook-only + 最小健康监控）

### 本期口径
1. 仅验证 Hook 主链路，不纳入 global 观察链路指标。
2. 去除静默异常状态机，采用人工对账判定。
3. 异常成立规则：连续 N 轮（建议 N=2）出现
   - `session_has_output=true`
   - 但关键 Hook 事件缺失或未进入 dispatch。

### `/status` 健康字段（固定）
- `eventSourceMode`
- `hookIngestedTotal`
- `hookLastEventType`
- `hookLastEventAt`

---

## v1.6 Hook-only 可用性验证执行记录（A/B/C）

### 环境
1. `opencode`：`1.2.15`
2. `@opencode-ai/plugin`：`1.2.15`
3. `@opencode-ai/sdk`：`1.2.15`
4. 验证时间：2026-03-04（Asia/Shanghai）

### 结果摘要
1. A/B/C 三轮均满足：
   - `session_has_output=true`
   - `timed_out=false`
   - `idle_seen=true`
2. 单轮复检（`sdk-1.2.15-A`）同样满足上述条件。
3. 插件日志出现 `part.updated` 调试迹象，说明 Hook ingress 与分发链路可达。

### 证据路径
- `.sisyphus/evidence/hook-only-validation-2026-03-04.md`

---

## v1.7 日志噪声修复验证（`message.part.delta`）

### 变更
最小修复：将 `message.part.delta` 纳入 `KNOWN_EVENT_TYPES`，避免落入 `event.unknown` 告警分支。

### 验证
1. 单轮复验结果：
   - `session_has_output=true`
   - `timed_out=false`
   - `idle_seen=true`
   - `message.part.delta` 事件正常出现（计数 > 0）
2. 在独立日志文件检索：
   - `event.unknown type=message.part.delta`
   - `event.unknown`
   均无命中。

### 结论
`message.part.delta` 高频 warning 噪声已消除，不影响 Hook-only 主链路可用性。

---

## v1.8 `route.miss` 告警分级优化验证

### 变更
对 `route.miss` 增加会话归属判定：
1. Bridge 托管会话缺失映射：保留 `warn`。
2. 外部/非托管会话缺失映射：降级为 `debug` 并标注 `external/unmanaged session`。

### 验证
1. 单轮外部会话复验通过（有输出、无超时、`idle_seen=true`）。
2. 日志中 `route.miss` 为 debug 级别，且不再产生对应 warning 噪声。

### 结论
在不改变业务链路的前提下，`route.miss` 噪声进一步收敛，异常告警信号更聚焦。
