# Feishu 配置项详解

## 配置结构

```typescript
interface FeishuConfig {
  // 必需配置项
  app_id: string;
  app_secret: string;
  mode: 'ws' | 'webhook';
  
  // 可选配置项
  callback_url?: string;
  file_store_dir?: string;
  encrypt_key?: string;
  auto_send_local_files?: boolean;
  auto_send_local_files_max_mb?: number;
  auto_send_local_files_allow_absolute?: boolean;
}
```

## 配置项说明

### 必需配置项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `app_id` | `string` | 飞书应用ID |
| `app_secret` | `string` | 飞书应用密钥 |
| `mode` | `'ws' \| 'webhook'` | 连接模式：<br>- `ws`: WebSocket模式<br>- `webhook`: Webhook模式，默认为`ws` |

### 可选配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `callback_url` | `string` | - | Webhook回调地址，仅在`webhook`模式下需要 |
| `file_store_dir` | `string` | - | 文件存储目录 |
| `encrypt_key` | `string` | - | 加密密钥，用于解密事件数据 |
| `auto_send_local_files` | `boolean` | `false` | 是否自动发送本地文件 |
| `auto_send_local_files_max_mb` | `number` | `20` | 自动发送本地文件的最大大小(MB) |
| `auto_send_local_files_allow_absolute` | `boolean` | `false` | 是否允许发送绝对路径的本地文件 |

## 配置示例

### WebSocket 模式（推荐）

```json
{
  "agent": {
    "lark": {
      "options": {
        "app_id": "cli_abc123456789",
        "app_secret": "your_app_secret_here",
        "mode": "ws",
        "file_store_dir": "./files",
        "auto_send_local_files": true,
        "auto_send_local_files_max_mb": 50,
        "auto_send_local_files_allow_absolute": false
      }
    }
  }
}
```

### Webhook 模式

```json
{
  "agent": {
    "lark": {
      "options": {
        "app_id": "cli_abc123456789",
        "app_secret": "your_app_secret_here",
        "mode": "webhook",
        "callback_url": "https://your-domain.com/feishu/callback",
        "encrypt_key": "your_encrypt_key_here",
        "file_store_dir": "./files",
        "auto_send_local_files": true,
        "auto_send_local_files_max_mb": 50,
        "auto_send_local_files_allow_absolute": false
      }
    }
  }
}
```

## 注意事项

1. **必需项验证**：`app_id` 和 `app_secret` 为必需项，缺失时会抛出错误。
2. **Webhook 模式**：在 `webhook` 模式下，若未提供 `callback_url` 会发出警告。
3. **回调URL格式**：`callback_url` 如果不是以 `http` 开头，会自动添加 `http://` 前缀。
4. **文件大小限制**：`auto_send_local_files_max_mb` 若未设置或无效，则默认为 20MB。
5. **布尔值处理**：`auto_send_local_files` 和 `auto_send_local_files_allow_absolute` 支持字符串 `'true'` 和布尔值 `true`。

## 配置解析逻辑

配置解析通过 `parseFeishuConfig` 函数完成，主要逻辑如下：

1. 从 `cfg.agent.lark.options` 提取配置项
2. 验证必需项 `app_id` 和 `app_secret`
3. 设置默认值和类型转换
4. 返回标准化的 `FeishuConfig` 对象
