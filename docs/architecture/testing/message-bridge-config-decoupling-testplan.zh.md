# Message Bridge 配置解耦测试计划（TestApp 基线）

Doc Version: v1.0
Last Updated: 2026-03-04

## Purpose（目的）
为“独立配置文件主路径 + TestApp 配置契约”提供可执行测试基线，确保需求条目均有 Unit 或 E2E 覆盖，并可在后续平台扩展时复用。

## Scope（范围）
覆盖以下内容：
- 配置解析、校验、默认值与脱敏日志的单元测试。
- TestApp 消息主链路与关键失败场景的端到端测试。

不覆盖以下内容：
- Lark / Telegram / QQ 的 E2E。
- OpenCode 核心 UI/TUI 自动化测试。

## Test Levels（测试层级）
1. Unit Tests：配置契约正确性。
2. Integration/E2E Tests：插件启动、连接、消息闭环与失败路径。

## Unit Test Plan（单元测试计划）
### U1 - Minimal Config Pass
- 输入：最小配置（含 `app_id/ak/sk`）
- 期望：解析通过，`mode` 回填为 `ws`，`server_url` 回填默认值

### U2 - Full Config Pass
- 输入：完整配置契约
- 期望：解析通过，`runtime` 字段值保持不变

### U3 - Missing Required Fields
- 输入：缺 `app_id` / `ak` / `sk` 的配置
- 期望：返回失败，错误语义包含 `Missing options for testapp: app_id/ak/sk`

### U4 - Invalid Mode
- 输入：`testapp.mode='http'`
- 期望：失败（或被固定归一，需与设计文档保持唯一策略）

### U5 - Default server_url
- 输入：未配置 `server_url`
- 期望：回填 `ws://localhost:8179`

### U6 - Runtime Defaults
- 输入：未配置 `runtime`
- 期望：回填默认值：
  - `file_store_dir='bridge_files'`
  - `auto_send_local_files=false`
  - `auto_send_local_files_max_mb=20`
  - `auto_send_local_files_allow_absolute=false`

### U7 - Secret Redaction
- 输入：包含真实 `ak/sk`
- 期望：日志中出现掩码值，不出现明文

### U8 - Source Priority
- 输入：用户级、项目级、ENV 同时提供冲突值
- 期望：最终值遵循 `ENV > 项目 > 用户 > 默认`

## End-to-End Test Plan（端到端测试计划）
### E1 - Minimal Startup and Connect
- 前置：mock server 运行在 `ws://localhost:8179`
- 输入：最小配置
- 步骤：启动插件 -> 连接 mock server
- 期望：启动成功，连接成功，认证成功日志可见

### E2 - Message Round Trip
- 前置：E1 成功
- 步骤：mock server 注入入站消息 -> 插件触发会话 -> 回传消息
- 期望：链路闭环成功（入站、会话、回传日志完整）

### E3 - Missing sk Failure
- 输入：缺少 `sk`
- 期望：启动失败，错误可读且包含字段提示

### E4 - Unreachable server_url
- 输入：`server_url=ws://localhost:65535`
- 期望：连接失败，输出可诊断日志（地址、失败原因）

### E5 - No agent node dependency
- 输入：`opencode.json` 不含 `agent.testapp`
- 期望：主路径仍可启动，且不依赖且不读取 agent 节点配置

## Test Data and Fixtures（测试数据与夹具）
1. `fixtures/config/minimal.jsonc`
2. `fixtures/config/full.jsonc`
3. `fixtures/config/missing-sk.jsonc`
4. `fixtures/config/invalid-mode.jsonc`
5. `fixtures/config/priority/*.jsonc`

## Quality Gates（质量门槛）
1. 配置模块行覆盖率 >= 90%。
2. 配置模块分支覆盖率 >= 85%。
3. E2E 至少 1 条成功主链路 + 2 条失败路径。

## Requirement Mapping（需求映射）
1. 必填字段冻结 -> U3 / E3
2. 默认值规则 -> U1 / U5 / U6
3. 优先级规则 -> U8
4. 脱敏要求 -> U7
5. 启动可用性与闭环 -> E1 / E2

## Execution Strategy（执行策略）
1. Unit 作为 PR 必跑。
2. E2E 作为分层流水线：
- 快速 E2E（E1/E3）每次变更触发。
- 完整 E2E（E1~E5）在合并前或夜间任务触发。

## Exit Criteria（退出标准）
满足以下条件可判定配置解耦测试通过：
1. Unit 计划全部通过且满足覆盖率门槛。
2. E2E 主链路稳定通过。
3. E2E 失败路径报错可读且无密钥泄露。
