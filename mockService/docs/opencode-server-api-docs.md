# opencode-server API 文档

## TL;DR

> **快速概览**: OpenCode Server 提供了完整的REST API，用于管理AI会话、文件操作、项目配置、终端控制等功能。API基于Hono框架构建，支持OpenAPI 3.1.1规范。
>
> **核心功能**:
>
> - 会话管理（创建、查询、更新、删除会话）
> - 文件操作（读取、搜索、状态查询）
> - 项目管理（项目列表、当前项目、配置）
> - 伪终端（PTY）会话管理
> - MCP（Model Context Protocol）服务器集成
> - 权限和问题处理
> - 终端用户界面（TUI）控制
>
> **认证**: 支持基本认证（可选）和OAuth授权
> **事件**: 支持SSE（Server-Sent Events）实时事件订阅
> **客户端**: 提供TypeScript SDK (`@opencode-ai/sdk`)

---

## 概述

OpenCode Server 是一个基于Hono框架的API服务器，为OpenCode AI开发工具提供后端服务。它支持完整的REST API，并通过OpenAPI规范进行文档化。

### 认证

- **基本认证**: 可选，通过`OPENCODE_SERVER_USERNAME`和`OPENCODE_SERVER_PASSWORD`环境变量配置
- **OAuth**: 支持各种AI提供商的OAuth授权流程

### 请求格式

- **Content-Type**: `application/json`
- **Query Parameters**: 用于过滤和分页
- **Path Parameters**: 用于资源标识（如sessionID, ptyID等）

### 响应格式

- **Success**: HTTP 200，返回JSON数据
- **Error**: HTTP 4xx/5xx，返回错误对象
- **Events**: SSE流 (`text/event-stream`)

### 错误处理

- **400 Bad Request**: 请求参数错误
- **404 Not Found**: 资源不存在
- **500 Internal Server Error**: 服务器内部错误

---

## 核心API端点

### 全局API (`/global`)

#### GET /global/health

获取服务器健康状态

**响应**:

```json
{
  "healthy": true,
  "version": "1.1.53"
}
```

#### GET /global/config

获取全局配置

**响应**:

```json
{
  // Config对象
}
```

#### PATCH /global/config

更新全局配置

**请求体**:

```json
{
  // Config对象
}
```

#### POST /global/dispose

清理所有OpenCode实例

**响应**: `true`

#### GET /global/event

订阅全局事件（SSE）

**响应格式**: `text/event-stream`

```json
{
  "payload": {
    "type": "event.type",
    "properties": {}
  }
}
```

### 会话管理 (`/session`)

#### GET /session

列出所有会话

**Query Parameters**:

- `directory`: 过滤指定目录的会话
- `roots`: 只返回根会话（无parentID）
- `start`: 过滤更新时间戳之后的会话
- `search`: 按标题搜索（不区分大小写）
- `limit`: 限制返回数量

**响应**:

```json
[
  // Session对象数组
]
```

#### POST /session

创建新会话

**请求体**:

```json
{
  "parentID": "ses_...",
  "title": "会话标题",
  "permission": {
    // 权限规则
  }
}
```

**响应**:

```json
// Session对象
```

#### GET /session/{sessionID}

获取指定会话详情

**路径参数**:

- `sessionID`: 会话ID

**响应**:

```json
// Session对象
```

#### DELETE /session/{sessionID}

删除指定会话

**路径参数**:

- `sessionID`: 会话ID

**响应**: `true`

#### PATCH /session/{sessionID}

更新会话属性

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  "title": "新标题",
  "time": {
    "archived": 1234567890
  }
}
```

**响应**:

```json
// 更新后的Session对象
```

#### GET /session/{sessionID}/children

获取会话的子会话

**路径参数**:

- `sessionID`: 会话ID

**响应**:

```json
[
  // Session对象数组
]
```

#### GET /session/{sessionID}/todo

获取会话的待办事项列表

**路径参数**:

- `sessionID`: 会话ID

**响应**:

```json
[
  // Todo对象数组
]
```

#### POST /session/{sessionID}/init

初始化会话（创建AGENTS.md配置）

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  // 初始化参数
}
```

**响应**: `true`

#### POST /session/{sessionID}/fork

从指定会话派生新会话

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  // fork参数
}
```

**响应**:

```json
// 新的Session对象
```

#### POST /session/{sessionID}/abort

中止会话

**路径参数**:

- `sessionID`: 会话ID

**响应**: `true`

#### POST /session/{sessionID}/share

分享会话

**路径参数**:

- `sessionID`: 会话ID

**响应**:

```json
// 更新后的Session对象
```

#### DELETE /session/{sessionID}/share

取消分享会话

**路径参数**:

- `sessionID`: 会话ID

**响应**:

```json
// 更新后的Session对象
```

#### POST /session/{sessionID}/summarize

总结会话

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  "providerID": "anthropic",
  "modelID": "claude-3-5-sonnet",
  "auto": false
}
```

**响应**: `true`

#### GET /session/{sessionID}/message

获取会话消息

**路径参数**:

- `sessionID`: 会话ID

**Query Parameters**:

- `limit`: 限制返回消息数量

**响应**:

```json
[
  // Message对象数组
]
```

#### POST /session/{sessionID}/message

发送消息到会话

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  // 消息内容
}
```

**响应**:

```json
// 返回的消息对象
```

#### POST /session/{sessionID}/prompt_async

异步发送消息到会话

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  // 消息内容
}
```

**响应**: HTTP 204 (No Content)

#### POST /session/{sessionID}/command

向会话发送命令

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  // 命令内容
}
```

**响应**:

```json
// 返回的消息对象
```

#### POST /session/{sessionID}/shell

在会话中执行Shell命令

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  // Shell命令
}
```

**响应**:

```json
// 返回的消息对象
```

#### POST /session/{sessionID}/revert

回滚会话消息

**路径参数**:

- `sessionID`: 会话ID

**请求体**:

```json
{
  // 回滚参数
}
```

**响应**:

```json
// 更新后的Session对象
```

#### POST /session/{sessionID}/unrevert

恢复已回滚的消息

**路径参数**:

- `sessionID`: 会话ID

**响应**:

```json
// 更新后的Session对象
```

### 文件操作 (`/file`)

#### GET /find

全文搜索

**Query Parameters**:

- `pattern`: 搜索模式

**响应**:

```json
[
  // 匹配结果数组
]
```

#### GET /find/file

文件搜索

**Query Parameters**:

- `query`: 搜索查询
- `dirs`: 是否包含目录
- `type`: 文件类型（file/directory）
- `limit`: 限制结果数量

**响应**:

```json
[
  // 文件路径数组
]
```

#### GET /find/symbol

符号搜索（LSP）

**Query Parameters**:

- `query`: 搜索查询

**响应**:

```json
[
  // 符号数组
]
```

#### GET /file

列出文件和目录

**Query Parameters**:

- `path`: 路径

**响应**:

```json
[
  // 文件节点数组
]
```

#### GET /file/content

读取文件内容

**Query Parameters**:

- `path`: 文件路径

**响应**:

```json
// 文件内容对象
```

#### GET /file/status

获取文件Git状态

**响应**:

```json
[
  // 文件信息数组
]
```

### 项目管理 (`/project`)

#### GET /project

列出所有项目

**响应**:

```json
[
  // Project对象数组
]
```

#### GET /project/current

获取当前项目

**响应**:

```json
// Project对象
```

#### PATCH /project/{projectID}

更新项目

**路径参数**:

- `projectID`: 项目ID

**请求体**:

```json
{
  "name": "项目名称",
  "icon": {
    "url": "图标URL",
    "override": "覆盖图标",
    "color": "颜色"
  },
  "commands": {
    "start": "启动脚本"
  }
}
```

**响应**:

```json
// 更新后的Project对象
```

### 伪终端 (`/pty`)

#### GET /pty

列出PTY会话

**响应**:

```json
[
  // Pty对象数组
]
```

#### POST /pty

创建PTY会话

**请求体**:

```json
{
  "command": "bash",
  "args": [],
  "cwd": "/path/to/dir",
  "title": "终端标题",
  "env": {
    "ENV_VAR": "value"
  }
}
```

**响应**:

```json
// Pty对象
```

#### GET /pty/{ptyID}

获取PTY会话详情

**路径参数**:

- `ptyID`: PTY会话ID

**响应**:

```json
// Pty对象
```

#### PUT /pty/{ptyID}

更新PTY会话

**路径参数**:

- `ptyID`: PTY会话ID

**请求体**:

```json
{
  "title": "新标题",
  "size": {
    "rows": 24,
    "cols": 80
  }
}
```

**响应**:

```json
// 更新后的Pty对象
```

#### DELETE /pty/{ptyID}

删除PTY会话

**路径参数**:

- `ptyID`: PTY会话ID

**响应**: `true`

#### GET /pty/{ptyID}/connect

连接到PTY会话（WebSocket）

**路径参数**:

- `ptyID`: PTY会话ID

**响应**: `true`

### 配置管理 (`/config`)

#### GET /config

获取配置

**响应**:

```json
// Config对象
```

#### PATCH /config

更新配置

**请求体**:

```json
// Config对象
```

**响应**:

```json
// Config对象
```

#### GET /config/providers

列出配置的提供商

**响应**:

```json
{
  "providers": [
    // Provider对象数组
  ],
  "default": {
    // 默认模型映射
  }
}
```

### 实验性功能 (`/experimental`)

#### GET /experimental/tool/ids

列出工具ID

**响应**:

```json
[
  // 工具ID字符串数组
]
```

#### GET /experimental/tool

列出工具

**Query Parameters**:

- `provider`: 提供商ID
- `model`: 模型ID

**响应**:

```json
[
  // Tool对象数组
]
```

#### POST /experimental/worktree

创建工作树

**请求体**:

```json
{
  // Worktree创建参数
}
```

**响应**:

```json
// Worktree对象
```

#### GET /experimental/worktree

列出工作树

**响应**:

```json
[
  // 工作树目录路径数组
]
```

#### DELETE /experimental/worktree

删除工作树

**请求体**:

```json
{
  // Worktree删除参数
}
```

**响应**: `true`

#### POST /experimental/worktree/reset

重置工作树

**请求体**:

```json
{
  // Worktree重置参数
}
```

**响应**: `true`

#### GET /experimental/resource

获取MCP资源

**响应**:

```json
{
  // MCP资源映射
}
```

### MCP管理 (`/mcp`)

#### GET /mcp

获取MCP状态

**响应**:

```json
{
  // MCP状态映射
}
```

#### POST /mcp

添加MCP服务器

**请求体**:

```json
{
  "name": "mcp-server-name",
  "config": {
    // MCP配置
  }
}
```

**响应**:

```json
// MCP状态
```

#### POST /mcp/{name}/auth

开始MCP OAuth

**路径参数**:

- `name`: MCP服务器名称

**响应**:

```json
{
  "authorizationUrl": "https://..."
}
```

#### POST /mcp/{name}/auth/callback

完成MCP OAuth

**路径参数**:

- `name`: MCP服务器名称

**请求体**:

```json
{
  "code": "oauth-code"
}
```

**响应**:

```json
// MCP状态
```

#### POST /mcp/{name}/connect

连接MCP服务器

**路径参数**:

- `name`: MCP服务器名称

**响应**: `true`

#### POST /mcp/{name}/disconnect

断开MCP服务器

**路径参数**:

- `name`: MCP服务器名称

**响应**: `true`

### 权限管理 (`/permission`)

#### POST /permission/{requestID}/reply

响应权限请求

**路径参数**:

- `requestID`: 权限请求ID

**请求体**:

```json
{
  "reply": "approve|deny",
  "message": "可选消息"
}
```

**响应**: `true`

#### GET /permission

列出待处理权限

**响应**:

```json
[
  // PermissionRequest对象数组
]
```

### 问题处理 (`/question`)

#### GET /question

列出待处理问题

**响应**:

```json
[
  // QuestionRequest对象数组
]
```

#### POST /question/{requestID}/reply

回答问题

**路径参数**:

- `requestID`: 问题请求ID

**请求体**:

```json
{
  "answers": [
    // 答案数组
  ]
}
```

**响应**: `true`

#### POST /question/{requestID}/reject

拒绝问题

**路径参数**:

- `requestID`: 问题请求ID

**响应**: `true`

### TUI控制 (`/tui`)

#### POST /tui/append-prompt

追加提示

**请求体**:

```json
{
  // 提示内容
}
```

**响应**: `true`

#### POST /tui/open-help

打开帮助对话框

**响应**: `true`

#### POST /tui/open-sessions

打开会话对话框

**响应**: `true`

#### POST /tui/open-models

打开模型对话框

**响应**: `true`

#### POST /tui/submit-prompt

提交提示

**响应**: `true`

#### POST /tui/clear-prompt

清除提示

**响应**: `true`

#### POST /tui/execute-command

执行TUI命令

**请求体**:

```json
{
  "command": "command-name"
}
```

**响应**: `true`

#### POST /tui/show-toast

显示Toast通知

**请求体**:

```json
{
  // Toast内容
}
```

**响应**: `true`

#### POST /tui/publish

发布TUI事件

**请求体**:

```json
{
  "type": "event-type",
  "properties": {
    // 事件属性
  }
}
```

**响应**: `true`

#### POST /tui/select-session

选择会话

**请求体**:

```json
{
  "sessionID": "ses_..."
}
```

**响应**: `true`

### 其他API

#### PUT /auth/{providerID}

设置认证凭证

**路径参数**:

- `providerID`: 提供商ID

**请求体**:

```json
// Auth信息
```

**响应**: `true`

#### DELETE /auth/{providerID}

移除认证凭证

**路径参数**:

- `providerID`: 提供商ID

**响应**: `true`

#### GET /path

获取路径信息

**响应**:

```json
{
  "home": "/home/user",
  "state": "/home/user/.opencode",
  "config": "/home/user/.config/opencode",
  "worktree": "/path/to/worktree",
  "directory": "/path/to/project"
}
```

#### GET /vcs

获取VCS信息

**响应**:

```json
{
  "branch": "main"
}
```

#### GET /command

列出命令

**响应**:

```json
[
  // Command对象数组
]
```

#### POST /log

写入日志

**请求体**:

```json
{
  "service": "service-name",
  "level": "debug|info|error|warn",
  "message": "日志消息",
  "extra": {
    // 额外元数据
  }
}
```

**响应**: `true`

#### GET /agent

列出代理

**响应**:

```json
[
  // Agent对象数组
]
```

#### GET /skill

列出技能

**响应**:

```json
[
  // Skill对象数组
]
```

#### GET /lsp

获取LSP状态

**响应**:

```json
[
  // LSP状态数组
]
```

#### GET /formatter

获取格式化器状态

**响应**:

```json
[
  // 格式化器状态数组
]
```

#### GET /event

订阅事件（SSE）

**响应格式**: `text/event-stream`

```json
{
  "type": "event.type",
  "properties": {}
}
```

#### POST /instance/dispose

清理实例

**响应**: `true`

---

## 客户端SDK

OpenCode提供TypeScript SDK (`@opencode-ai/sdk`) 用于与API交互：

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient()

// 示例：创建会话
const session = await client.session.create({
  title: "My Session",
})

// 示例：发送消息
await client.session.message({
  sessionID: session.id,
  content: "Hello, OpenCode!",
})
```

## WebSocket连接

某些端点（如PTY连接）使用WebSocket协议：

- **Endpoint**: `/pty/{ptyID}/connect`
- **Protocol**: 标准WebSocket
- **Messages**: 文本消息（终端输入/输出）

## Server-Sent Events (SSE)

事件端点使用SSE协议：

- **Endpoints**: `/global/event`, `/event`
- **Format**: `text/event-stream`
- **Event Format**: JSON对象包含`type`和`properties`

## 错误响应格式

### BadRequestError (400)

```json
{
  "data": {},
  "errors": [],
  "success": false
}
```

### NotFoundError (404)

```json
{
  "message": "Resource not found",
  "name": "NotFoundError"
}
```

## 认证头

当启用了基本认证时，需要在请求头中包含：

```
Authorization: Basic base64(username:password)
```

或者通过查询参数：

```
?username=...&password=...
```

## 目录上下文

大多数API端点支持通过以下方式指定项目目录：

- **Query Parameter**: `?directory=/path/to/project`
- **Header**: `x-opencode-directory: /path/to/project`

## 版本信息

- **API Version**: 1.0.0
- **OpenAPI Version**: 3.1.1
- **Server Version**: 1.1.53

## 生成OpenAPI规范

要生成完整的OpenAPI规范：

```bash
cd packages/opencode
bun dev generate > openapi.json
```

这将输出完整的OpenAPI 3.1.1规范，可用于生成客户端代码、文档等。
