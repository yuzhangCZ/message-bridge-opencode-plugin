## 🚀 快速开始 --- Message Bridge（TestApp 基线）

本指南采用“独立配置文件主路径”，以 TestApp 作为当前冻结契约。

---

## ⚙️ OpenCode 主配置（`opencode.json`）

`opencode.json` 仅保留插件声明，不作为 TestApp 业务配置主入口。

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["message-bridge-opencode-plugin"]
}
```

---

## ⚙️ Message Bridge 独立配置（项目级）

文件路径：`.opencode/message-bridge.jsonc`

### 最小可运行配置

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

### 完整配置模板

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

---

## 📋 字段说明

| 字段 | 必填 | 类型 | 默认值 | 说明 |
|------|------|------|--------|------|
| `config_version` | 是 | number | - | 当前固定为 `1` |
| `enabled` | 否 | boolean | `true` | 插件是否启用 |
| `platform` | 是 | string | - | 当前固定为 `testapp` |
| `runtime.file_store_dir` | 否 | string | `bridge_files` | 文件存储目录 |
| `runtime.auto_send_local_files` | 否 | boolean | `false` | 是否自动发送本地文件 |
| `runtime.auto_send_local_files_max_mb` | 否 | number | `20` | 自动发送文件体积上限 |
| `runtime.auto_send_local_files_allow_absolute` | 否 | boolean | `false` | 是否允许绝对路径 |
| `testapp.mode` | 否 | string | `ws` | 固定 WebSocket 模式 |
| `testapp.app_id` | 是 | string | - | 应用 ID |
| `testapp.ak` | 是 | string | - | Access Key |
| `testapp.sk` | 是 | string | - | Secret Key |
| `testapp.server_url` | 否 | string | `ws://localhost:8179` | Mock Server WebSocket 地址 |

---

## 🚀 启动与验证

### 1. 启动 mock server

```bash
cd mockService
npm start
```

### 2. 启动 OpenCode

```bash
opencode web
```

### 3. 观察日志

期望出现：
1. 配置加载成功日志（来源、platform）。
2. TestApp 连接成功日志。
3. 认证成功日志。

---

## ✅ 验证链路（建议）

1. 通过 mock server 发送一条入站消息。
2. 确认插件创建会话并向 mock server 回传消息。
3. 检查日志中未出现 `ak/sk` 明文。

---

## 🐛 常见问题排查

### 配置未生效
1. 检查 `.opencode/message-bridge.jsonc` 文件路径是否正确。
2. 检查 JSONC 语法是否正确（逗号、注释位置）。
3. 检查 `config_version` 是否为 `1`。

### 连接失败
1. 检查 `testapp.server_url` 是否可访问。
2. 检查 mock server 是否已启动。
3. 检查 WebSocket 协议前缀是否为 `ws://` 或 `wss://`。

### 认证失败
1. 检查 `app_id` / `ak` / `sk` 是否与 mock server 侧一致。
2. 检查日志中的认证失败原因。

---

## 配置原则

插件仅支持独立配置文件主路径，不支持 `opencode.json -> agent.*.options` 兼容回退。
