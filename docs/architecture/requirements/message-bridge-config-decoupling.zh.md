# Message Bridge 配置入口解耦需求（TestApp 基线）

Doc Version: v1.0
Last Updated: 2026-03-04

## Purpose（目的）
将 Message Bridge 插件配置主路径从 `opencode.json -> agent.*.options` 解耦为插件独立配置文件，避免配置语义与 Agent 概念耦合；当前阶段以 TestApp 配置契约为冻结基线。

## Scope（范围）
覆盖以下内容：
- 插件独立配置文件位置与优先级。
- TestApp 最小配置与完整配置契约。
- 字段约束、默认值、错误处理要求。
- 单元测试与端到端测试验收要求。

不覆盖以下内容：
- Lark / Telegram / QQ 配置契约扩展。
- OpenCode 核心 schema / 插件系统改造。
- 混合方案（同时以独立配置 + `agent.*.options` 作为主路径）。

## Background（背景）
现有 TestApp 配置由 `index.testapp.ts` 的 `parseTestAppConfig` 从 `agent.testapp.options` 读取，核心字段为 `app_id / ak / sk / server_url`，并固定 `mode='ws'`。

该方式在工程上可用，但会带来两个问题：
1. 配置承载位置属于 Agent 语义域，不利于后续插件能力扩展。
2. 在部分 UI/TUI 场景会出现配置节点与可切换 Agent 概念混淆。

## Goals（目标）
1. 主路径切换到独立配置文件：`.opencode/message-bridge.jsonc` 与 `~/.config/opencode/message-bridge.jsonc`。
2. 配置契约以 TestApp 为基线冻结，保证可实现、可测试、可回归。
3. 验证链路明确：文档中的配置样例可直接驱动单元测试与 E2E 测试用例。

## Non-Goals（非目标）
1. 不实现多平台统一契约（当前仅 TestApp）。
2. 不引入 `agent.*.options` 兼容回退路径。
3. 不修改 OpenCode 源码。

## Configuration File Location（配置文件位置）
1. 项目级：`.opencode/message-bridge.jsonc`
2. 用户级：`~/.config/opencode/message-bridge.jsonc`

## Minimal Configuration（最小配置，需求基线）
```jsonc
{
  "config_version": 1,
  "platform": "testapp",
  "testapp": {
    "app_id": "your_app_id",
    "ak": "your_access_key",
    "sk": "your_secret_key"
  }
}
```

## Full Configuration Contract（完整配置契约）
```jsonc
{
  "config_version": 1,
  "enabled": true,
  "platform": "testapp",
  "runtime": {
    "file_store_dir": "bridge_files",
    "auto_send_local_files": false,
    "auto_send_local_files_max_mb": 20,
    "auto_send_local_files_allow_absolute": false
  },
  "testapp": {
    "mode": "ws",
    "app_id": "your_app_id",
    "ak": "your_access_key",
    "sk": "your_secret_key",
    "server_url": "ws://localhost:8179"
  }
}
```

## Field Constraints（字段约束，冻结）
1. `platform` 必须为 `testapp`。
2. `testapp.mode` 固定为 `ws`，不接受其他值。
3. `testapp.app_id` / `testapp.ak` / `testapp.sk` 必填。
4. `testapp.server_url` 可选，默认值为 `ws://localhost:8179`。
5. `runtime.*` 可选，默认值按完整契约回填。
6. 敏感字段（`ak` / `sk`）日志必须脱敏。

## Priority Rules（优先级规则）
配置值优先级为：
`ENV > 项目级配置 > 用户级配置 > 默认值`

主路径不依赖 `opencode.json agent.*.options`。

## Acceptance Criteria（验收标准）
1. 最小配置可通过配置解析并启动 TestApp 适配器。
2. 完整配置可通过配置解析并正确回填/应用 runtime 选项。
3. 缺失 `app_id/ak/sk` 时返回明确错误信息（文案与现有 `parseTestAppConfig` 语义对齐）。
4. `mode != ws` 时触发失败（或被显式归一，行为需在设计文档冻结唯一策略）。
5. 启动日志不输出 `ak/sk` 明文。
6. 不配置 `agent.*` 节点时，主方案不引入额外 Agent 切换项。

## Test Coverage Requirements（测试覆盖要求）
### Unit
1. 最小配置解析通过。
2. 完整配置解析通过。
3. 缺 `app_id/ak/sk` 解析失败。
4. `mode` 非 `ws` 行为符合设计。
5. `server_url` 默认值回填。
6. `runtime` 默认值回填。
7. 敏感字段脱敏验证。

### End-to-End
1. 使用最小配置启动插件并连接 mock server 成功。
2. 入站消息 -> 创建会话 -> 回传消息闭环成功。
3. 错误配置（缺 `sk`）启动失败并输出可读错误。
4. `server_url` 不可达时输出连接失败诊断日志。
5. 主方案下不依赖 `agent.*` 节点。

## Assumptions（假设）
1. 当前不存在存量用户迁移压力。
2. 当前阶段配置契约仅冻结 TestApp。
3. 后续扩展平台时通过 `config_version` 进行演进。
