# message-bridge-open-code 架构设计文档（持续演进基线）

Doc Version: v1.0
Last Updated: 2026-03-05

## Purpose（目的）
本目录用于沉淀 `message-bridge-open-code`（仓库包名 `message-bridge-opencode-plugin`）的长期架构设计基线，支持后续按统一规范持续演进。

## Scope（范围）
覆盖以下内容：
- 总体架构分层与边界。
- 对外接口契约（Adapter / OpenCode SDK / 平台协议）。
- 核心消息流（入站、事件回流、Question/Permission、文件链路）。
- 架构变更记录与 ADR 决策记录。

不覆盖以下内容：
- 业务功能使用手册。
- 平台配置细节（由 `config-guide/*` 维护）。

## Interface/Flow Definition（定义）
### 分层架构
1. 插件入口层（Plugin Bootstrap）
- 入口文件：`index.ts`
- 职责：读取配置、注册适配器、接入 Hook 事件入口。

2. 业务编排层（Flow Orchestration）
- `src/handler/flow/incoming.ts`
- `src/handler/command.ts`
- `src/handler/event/dispatch.ts`
- 职责：消息路由、命令处理、事件分发、状态推进。

3. 代理能力层（Proxy Layer）
- `src/handler/event/interaction.ts`
- `src/handler/proxy/*`
- 职责：Question/Permission 代理、回复解析、超时与去重。

4. 基础设施层（Infra Layer）
- `src/bridge/buffer.ts`
- `src/bridge/file.store.ts`
- `src/logger.ts`
- 职责：流式缓冲、文件落盘、日志与可观测性。

### 文档索引（一跳到达）
- 配置解耦需求（TestApp 基线）：[message-bridge-config-decoupling.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/requirements/message-bridge-config-decoupling.zh.md)
- 配置解耦设计（TestApp-first）：[message-bridge-config-decoupling.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/design/message-bridge-config-decoupling.zh.md)
- 配置解耦测试计划（Unit + E2E）：[message-bridge-config-decoupling-testplan.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/testing/message-bridge-config-decoupling-testplan.zh.md)
- Adapter 契约：[bridge-adapter.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/interfaces/bridge-adapter.zh.md)
- OpenCode SDK 接口面：[opencode-sdk.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/interfaces/opencode-sdk.zh.md)
- TestApp 协议：[testapp-protocol.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/interfaces/testapp-protocol.zh.md)
- 核心消息流：[core-message-flow.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/flows/core-message-flow.zh.md)
- 飞书直接调用链路：[feishu-direct-call-flow.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/flows/feishu-direct-call-flow.zh.md)
- 事件订阅复现报告：[event-subscribe-repro-report.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/flows/event-subscribe-repro-report.zh.md)
- 架构变更日志：[changelog.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/changelog.md)
- ADR 入口：[adr/README.zh.md](/Users/zy/Code/opencode/message-bridge-opencode-plugin/docs/architecture/adr/README.zh.md)

## Examples（调用示例 + 报文示例）
最小调用链路：
```ts
// Adapter -> IncomingHandler
await onMessage(chatId, text, messageId, senderId, parts);

// IncomingHandler -> OpenCode
await api.session.prompt({
  path: { id: sessionId },
  body: { parts }
});
```

## Failure Modes（失败场景）
- 事件链路异常：通过 Hook 事件计数与 dispatch 日志对账定位问题。
- 平台编辑失败：`editMessage` 失败后 fallback `sendMessage`。
- 权限阻塞：进入授权等待态，超时后清理状态。
- Question 超时：超时取消该轮问题并提示用户。

## Compatibility（兼容性）
- 文档描述以当前仓库代码为准，不提前描述未实现行为。
- 涉及 OpenCode API 的版本差异由 `opencode-sdk.zh.md` 兼容章节说明。

## Open Questions（未决事项）
- 是否将 `BridgeAdapter` 的重复类型定义收敛为单一导出源。
- 是否引入独立 `OpenCodeGateway` 统一封装 v1/v2 fallback。
