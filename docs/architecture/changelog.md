# Architecture Changelog

## 2026-03-04 - v1.9 Config Decoupling Docs Baseline (TestApp-first)

### Summary
新增“配置解耦（TestApp 基线）”文档包，冻结独立配置文件主路径、完整配置契约（最小/完整模板）、以及 Unit + E2E 测试计划，作为后续实现与回归依据。

### Changed Files
- `docs/architecture/requirements/message-bridge-config-decoupling.zh.md`
- `docs/architecture/design/message-bridge-config-decoupling.zh.md`
- `docs/architecture/testing/message-bridge-config-decoupling-testplan.zh.md`
- `config-guide/message-bridge/GUIDE.zh.md`
- `docs/architecture/README.zh.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Documentation baseline added
- No runtime behavior change
- No external API change

### Compatibility
- Backward compatible (docs-only change)

### Follow-up
- 后续实现阶段按该文档包落地配置加载器、校验器、脱敏日志与测试用例。

## 2026-03-04 - v1.8 Route Miss Noise Classification

### Summary
优化 `route.miss` 日志分级：外部/非托管会话路由缺失降级为 debug，Bridge 托管会话缺失映射仍保留 warning；复验通过且可用性指标无回退。

### Changed Files
- `src/handler/event/dispatch.ts`
- `docs/architecture/flows/event-subscribe-repro-report.zh.md`
- `.sisyphus/evidence/hook-only-validation-2026-03-04.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Runtime logging behavior refined
- No business flow change
- No external API change

### Compatibility
- Backward compatible; only log severity/classification adjusted.

### Follow-up
- 若后续需要进一步降噪，可引入按事件类型的采样 debug 输出。

## 2026-03-04 - v1.7 Event Unknown Noise Reduction (`message.part.delta`)

### Summary
执行最小修复：将 `message.part.delta` 归入 `KNOWN_EVENT_TYPES`，避免高频 `event.unknown` warning 噪声；复验确认告警消失且主链路可用性不回退。

### Changed Files
- `src/handler/event/utils.ts`
- `docs/architecture/flows/event-subscribe-repro-report.zh.md`
- `.sisyphus/evidence/hook-only-validation-2026-03-04.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Runtime logging behavior changed
- No business flow change
- No external API change

### Compatibility
- Backward compatible; only log classification adjusted.

### Follow-up
- 若后续出现其它高频未处理事件，优先按“已知未处理（debug）/未知异常（warn）”分类治理。

## 2026-03-04 - v1.6 Hook-Only Validation Execution

### Summary
执行 Hook-only 可用性验证流程（A/B/C + 单轮复检）：均满足 `session_has_output=true`、`timed_out=false`、`idle_seen=true`，并在插件日志观察到 `part.updated` 分发迹象。

### Changed Files
- `docs/architecture/flows/event-subscribe-repro-report.zh.md`
- `.sisyphus/evidence/hook-only-validation-2026-03-04.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Validation evidence only
- No runtime behavior change
- No API contract change

### Compatibility
- Compatible with current `hook-only` strategy

### Follow-up
- 评估 `message.part.delta` 高频 `event.unknown` 日志降噪（不影响当前可用性结论）。

## 2026-03-04 - v1.5 Hook Health Scope Reduction (Availability First)

### Summary
按“可用性优先”收敛方案：移除静默异常状态机与相关告警阈值逻辑；去除 global 观察链路指标要求；保留 Hook-only 主链路和最小健康快照。

### Changed Files
- `src/handler/event/hook.health.ts`
- `src/handler/index.ts`
- `src/handler/flow/incoming.ts`
- `src/handler/command.ts`
- `src/global.state.ts`
- `index.ts`
- `docs/architecture/README.zh.md`
- `docs/architecture/flows/core-message-flow.zh.md`
- `docs/architecture/flows/event-subscribe-repro-report.zh.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Runtime behavior changed (health monitoring semantics)
- No external adapter API change
- No slash-command contract change

### Compatibility
- `BRIDGE_EVENT_SOURCE_MODE` 继续仅支持 `hook-only`
- SSE/global listener 保留代码但不接入运行主链路

### Follow-up
- 复现阶段按 A/B/C + 人工对账规则判定异常，不依赖静默自动告警。

## 2026-03-04 - v1.4 Hook-Only Event Ingress (Minimal Health Monitoring)

### Summary
实现 Hook 优先主链路：插件事件消费改为 `hooks.event` 驱动，SSE 主链路停用；新增最小健康监控（会话 armed、首次事件超时告警、`/status` 健康快照）。

### Changed Files
- `index.ts`
- `src/handler/index.ts`
- `src/handler/event/hook.health.ts`
- `src/handler/flow/incoming.ts`
- `src/handler/command.ts`
- `src/global.state.ts`

### Impact Scope
- Runtime behavior changed (event source mode)
- No external adapter API change
- No slash-command contract change

### Compatibility
- 默认 `BRIDGE_EVENT_SOURCE_MODE=hook-only`
- 其他模式当前仅保留配置占位并回落到 `hook-only`

### Follow-up
- 若后续引入 SSE 回退，必须复用统一 ingress 与健康监控，不允许旁路 dispatch。

## 2026-03-04 - v1.3 SDK Upgrade Validation (1.2.15)

### Summary
执行 `@opencode-ai/sdk` 升级到 `1.2.15` 的单轮验证：外部订阅仍可接收业务事件，但当前插件本体对账不一致现象未消失；同时观察到 SDK 与 plugin 版本未对齐导致的构建类型冲突。

### Changed Files
- `docs/architecture/flows/event-subscribe-repro-report.zh.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Documentation + dependency change
- No runtime behavior fix

### Compatibility
- 仅升级 SDK 会引入构建期类型冲突风险（需与 `@opencode-ai/plugin` 版本协同升级）。

### Follow-up
- 后续若继续验证版本因素，建议采用 `@opencode-ai/plugin` 与 `@opencode-ai/sdk` 同版本矩阵验证。

## 2026-03-04 - v1.2 Plugin-In-Situ Repro Validation

### Summary
按“基于当前插件本体”的复现计划完成 A/B/C 三轮验证：在真实插件运行态下出现稳定对账不一致（服务端发布与会话输出存在，但插件侧 `event.observed`/分发信号缺失）。

### Changed Files
- `docs/architecture/flows/event-subscribe-repro-report.zh.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Documentation only
- No runtime behavior change
- No API runtime change

### Compatibility
- Fully backward compatible (docs only)

### Follow-up
- 已满足进入架构修复讨论条件：优先评估主备通道方案，再决定是否升级到并行多通道。

## 2026-03-04 - v1.1 Event Subscribe Repro Phase

### Summary
完成 `event.subscribe` 复现优先阶段：在真实 OpenCode 环境执行两轮实验，建立服务端发布与订阅侧对账证据，新增复现报告文档。

### Changed Files
- `docs/architecture/flows/event-subscribe-repro-report.zh.md`
- `docs/architecture/README.zh.md`
- `docs/architecture/changelog.md`

### Impact Scope
- Documentation only
- No runtime behavior change
- No API runtime change

### Compatibility
- Fully backward compatible (docs only)

### Follow-up
- 若后续在插件运行时上下文可稳定复现 `main=0`，再进入架构修复设计阶段（主备/并行权衡）。

## 2026-03-04 - v1.0 Baseline Initialized

### Summary
初始化持续演进型架构文档基线，建立 `docs/architecture/` 目录和统一模板。

### Changed Files
- `docs/architecture/README.zh.md`
- `docs/architecture/interfaces/bridge-adapter.zh.md`
- `docs/architecture/interfaces/opencode-sdk.zh.md`
- `docs/architecture/interfaces/testapp-protocol.zh.md`
- `docs/architecture/flows/core-message-flow.zh.md`
- `docs/architecture/adr/README.zh.md`
- `docs/architecture/adr/0001-doc-governance.zh.md`

### Impact Scope
- Documentation only
- No runtime behavior change
- No API runtime change

### Compatibility
- Fully backward compatible (docs only)

### Follow-up
- 后续每次架构变更必须同步更新本文件。
