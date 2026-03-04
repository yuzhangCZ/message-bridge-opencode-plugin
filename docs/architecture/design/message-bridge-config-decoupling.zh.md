# Message Bridge 配置解耦设计（TestApp-first）

Doc Version: v1.0
Last Updated: 2026-03-04

## Purpose（目的）
定义 Message Bridge 在 TestApp 场景下的独立配置加载与消费设计，保证配置行为与当前 `parseTestAppConfig` 语义一致，并满足可测试、可观测、可演进要求。

## Scope（范围）
覆盖以下内容：
- 配置加载器结构与数据流。
- 配置契约类型定义与标准化规则。
- 错误处理、脱敏日志与来源追踪。
- 与现有 TestApp 适配器初始化的对接方式。

不覆盖以下内容：
- 多平台配置模型统一。
- OpenCode 核心插件系统改造。

## High-Level Design（总体设计）
### Core Flow
1. `BridgeConfigLoader` 读取用户级与项目级配置文件。
2. `BridgeConfigResolver` 按优先级合并 ENV / 文件配置 / 默认值。
3. `BridgeConfigNormalizer` 执行校验与标准化。
4. 输出 `BridgePluginConfig` 给插件入口，供 TestApp 适配器初始化消费。

### Runtime Integration
1. 插件入口读取独立配置主路径。
2. TestApp 初始化逻辑仍复用既有语义：
- 必填字段：`app_id/ak/sk`
- `mode` 固定 `ws`
- `server_url` 默认 `ws://localhost:8179`

## Public Interfaces / Types（公开接口与类型）
```ts
interface BridgeRuntimeOptions {
  file_store_dir?: string;
  auto_send_local_files?: boolean;
  auto_send_local_files_max_mb?: number;
  auto_send_local_files_allow_absolute?: boolean;
}

interface BridgeTestAppConfig {
  mode?: 'ws';
  app_id: string;
  ak: string;
  sk: string;
  server_url?: string;
}

interface BridgePluginConfig {
  config_version: 1;
  enabled?: boolean;
  platform: 'testapp';
  runtime?: BridgeRuntimeOptions;
  testapp: BridgeTestAppConfig;
}

interface ConfigSourceMeta {
  source: 'env' | 'project' | 'user' | 'default';
  path?: string;
}

interface ConfigLoadResult {
  config: BridgePluginConfig;
  sources: ConfigSourceMeta[];
  warnings: string[];
}
```

## Normalization Rules（标准化规则）
1. 若 `enabled` 缺省，回填为 `true`。
2. 若 `testapp.mode` 缺省，回填为 `ws`。
3. 若 `testapp.server_url` 缺省，回填为 `ws://localhost:8179`。
4. `runtime` 缺省字段按需求文档完整契约默认值回填。
5. 若 `platform != testapp`，立即失败并返回结构化错误。

## Validation Rules（校验规则）
1. `config_version` 必须为 `1`。
2. `testapp.app_id` / `testapp.ak` / `testapp.sk` 必须为非空字符串。
3. `testapp.mode` 仅允许 `ws`。
4. `testapp.server_url` 若存在，必须是 `ws://` 或 `wss://`。
5. 类型错误统一映射为可读错误项，包含字段路径。

## Error Model（错误模型）
```ts
interface ConfigValidationIssue {
  path: string;
  code: 'missing_required' | 'invalid_type' | 'invalid_value';
  message: string;
}

interface ConfigValidationError {
  name: 'ConfigValidationError';
  sourcePath?: string;
  issues: ConfigValidationIssue[];
}
```

错误文案要求：
- TestApp 必填字段缺失需对齐现有语义：`Missing options for testapp: app_id/ak/sk`。

## Source Priority（来源优先级）
固定优先级：
`ENV > 项目级配置 > 用户级配置 > 默认值`

## Logging and Redaction（日志与脱敏）
1. 启动日志输出：
- 配置来源列表
- `platform`
- `enabled`
- `server_url`（可明文）
2. 脱敏字段：
- `ak` / `sk` 必须掩码输出（如 `ab***yz`）
3. 错误日志输出字段路径与修复建议，不输出明文密钥。

## Adapter Consumption Contract（适配器消费契约）
TestApp 适配器只消费标准化后的配置对象，不直接访问原始配置源。

约束：
1. 初始化输入必须满足 `BridgePluginConfig` 校验。
2. 适配器内部不再重复实现优先级合并逻辑。
3. 适配器保留现有连接与认证流程。

## Compatibility Strategy（兼容策略）
1. 主路径为独立配置文件。
2. 不提供 `agent.*.options` 兼容回退。
3. 后续平台扩展通过提升 `config_version`（例如 `2`）演进。

## Testability by Design（可测试性设计）
1. 将 `discover / resolve / normalize / validate` 拆为纯函数层。
2. 文件 I/O 与纯函数解耦，便于 fixture 驱动 unit test。
3. `ConfigLoadResult.sources` 作为断言点，支持覆盖优先级测试。

## Risks and Mitigations（风险与缓解）
1. 风险：运行时日志泄露密钥。
- 缓解：强制统一脱敏函数，测试覆盖脱敏行为。

## Acceptance Mapping（设计到验收映射）
1. 必填字段规则 -> Unit: 缺字段失败。
2. 默认值规则 -> Unit: 默认值回填。
3. 连接链路 -> E2E: 最小配置闭环。
4. 可观测性 -> E2E: 错误日志可读。
