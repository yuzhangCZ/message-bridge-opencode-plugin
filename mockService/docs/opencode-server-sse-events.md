# opencode-server SSE (Server-Sent Events) API 文档

## TL;DR

> **快速概览**: OpenCode Server 提供了两套SSE（Server-Sent Events）事件订阅API，用于实时接收系统状态变更和业务事件通知。
>
> **核心功能**:
>
> - **实例级别事件**: `/event` - 接收当前项目实例的事件
> - **全局事件**: `/global/event` - 接收所有项目的全局事件
> - **事件类型**: 46+种不同类型的事件，覆盖会话、文件、终端、权限等所有核心功能
> - **自动心跳**: 每30秒发送心跳事件，防止连接超时
> - **连接管理**: 自动处理连接建立和断开
>
> **使用方式**: 标准SSE客户端连接，data字段包含JSON格式的事件报文
> **事件格式**: 统一的事件结构，包含`type`和`properties`字段
> **开发者友好**: 提供完整的TypeScript类型定义和OpenAPI规范

---

## 概述

OpenCode Server 通过Server-Sent Events (SSE) 提供实时事件通知机制。SSE是一种基于HTTP的单向通信协议，允许服务器向客户端推送实时事件。

### 两种事件端点

1. **实例级别事件** (`/event`)
   - 仅接收当前项目目录的事件
   - 适用于特定项目监控
2. **全局事件** (`/global/event`)
   - 接收所有项目的事件
   - 包含额外的`directory`字段标识事件来源
   - 适用于全局监控和管理

### 连接管理

- **自动心跳**: 每30秒发送`server.heartbeat`事件，防止WKWebView等客户端60秒超时
- **连接建立**: 连接成功后立即发送`server.connected`事件
- **连接断开**: 客户端断开连接时自动清理资源
- **实例销毁**: 当实例被销毁时，会发送`server.instance.disposed`事件并关闭连接

---

## SSE端点详情

### GET /event

**描述**: 订阅当前项目实例的事件流

**响应格式**: `text/event-stream`

**事件结构**:

```json
{
  "type": "event.type.name",
  "properties": {
    // 事件特定属性
  }
}
```

**示例**:

```javascript
// JavaScript客户端示例
const eventSource = new EventSource("/event")

eventSource.onmessage = function (event) {
  const eventData = JSON.parse(event.data)
  console.log("Event type:", eventData.type)
  console.log("Event properties:", eventData.properties)
}

eventSource.onerror = function (error) {
  console.error("Event source error:", error)
}
```

### GET /global/event

**描述**: 订阅全局事件流（包含所有项目）

**响应格式**: `text/event-stream`

**事件结构**:

```json
{
  "directory": "/path/to/project",
  "payload": {
    "type": "event.type.name",
    "properties": {
      // 事件特定属性
    }
  }
}
```

**示例**:

```javascript
// JavaScript客户端示例
const eventSource = new EventSource("/global/event")

eventSource.onmessage = function (event) {
  const eventData = JSON.parse(event.data)
  console.log("Project directory:", eventData.directory)
  console.log("Event type:", eventData.payload.type)
  console.log("Event properties:", eventData.payload.properties)
}
```

---

## 事件类型分类

### 🎯 会话事件 (Session Events)

#### session.created

**触发时机**: 创建新会话时
**报文格式**:

```json
{
  "type": "session.created",
  "properties": {
    "info": {
      "id": "ses_...",
      "slug": "session-slug",
      "projectID": "proj_...",
      "directory": "/path/to/project",
      "title": "Session Title",
      "version": "1.1.53",
      "time": {
        "created": 1700000000000,
        "updated": 1700000000000
      }
    }
  }
}
```

#### session.updated

**触发时机**: 会话信息更新时（如标题修改、存档等）
**报文格式**: 同`session.created`，但包含更新后的信息

#### session.deleted

**触发时机**: 删除会话时
**报文格式**: 同`session.created`

#### session.diff

**触发时机**: 会话中产生文件差异时（AI修改文件后）
**报文格式**:

```json
{
  "type": "session.diff",
  "properties": {
    "sessionID": "ses_...",
    "diff": [
      {
        "file": "src/file.ts",
        "additions": 5,
        "deletions": 2,
        "hunks": [...]
      }
    ]
  }
}
```

#### session.error

**触发时机**: 会话中发生错误时
**报文格式**:

```json
{
  "type": "session.error",
  "properties": {
    "sessionID": "ses_...",
    "error": {
      "name": "ErrorName",
      "message": "Error message",
      "stack": "Error stack trace"
    }
  }
}
```

#### session.compacted

**触发时机**: 会话被压缩（总结）时
**报文格式**:

```json
{
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_..."
  }
}
```

#### session.status

**触发时机**: 会话状态变更时（活跃、空闲等）
**报文格式**:

```json
{
  "type": "session.status",
  "properties": {
    "sessionID": "ses_...",
    "status": {
      "active": true,
      "idle": false,
      "completed": false
    }
  }
}
```

#### session.idle

**触发时机**: 会话变为空闲状态时
**报文格式**:

```json
{
  "type": "session.idle",
  "properties": {
    "sessionID": "ses_..."
  }
}
```

### 💬 消息事件 (Message Events)

#### message.updated

**触发时机**: 消息内容更新时
**报文格式**:

```json
{
  "type": "message.updated",
  "properties": {
    "info": {
      "id": "msg_...",
      "sessionID": "ses_...",
      "role": "user|assistant",
      "content": "Message content",
      "time": 1700000000000
    }
  }
}
```

#### message.removed

**触发时机**: 消息被删除时
**报文格式**:

```json
{
  "type": "message.removed",
  "properties": {
    "sessionID": "ses_...",
    "messageID": "msg_..."
  }
}
```

#### message.part.updated

**触发时机**: 消息部分内容更新时（如流式响应）
**报文格式**:

```json
{
  "type": "message.part.updated",
  "properties": {
    "part": {
      "id": "part_...",
      "messageID": "msg_...",
      "sessionID": "ses_...",
      "content": "Part content",
      "type": "text|code|tool"
    },
    "delta": "新增的内容片段（可选）"
  }
}
```

#### message.part.removed

**触发时机**: 消息部分被删除时
**报文格式**:

```json
{
  "type": "message.part.removed",
  "properties": {
    "sessionID": "ses_...",
    "messageID": "msg_...",
    "partID": "part_..."
  }
}
```

### ✅ 待办事项事件 (Todo Events)

#### todo.updated

**触发时机**: 会话待办事项列表更新时
**报文格式**:

```json
{
  "type": "todo.updated",
  "properties": {
    "sessionID": "ses_...",
    "todos": [
      {
        "id": "todo_...",
        "content": "Todo description",
        "status": "pending|in_progress|completed|cancelled",
        "priority": "high|medium|low"
      }
    ]
  }
}
```

### 🔐 权限事件 (Permission Events)

#### permission.asked

**触发时机**: AI请求权限时
**报文格式**:

```json
{
  "type": "permission.asked",
  "properties": {
    "requestID": "perm_...",
    "sessionID": "ses_...",
    "permission": {
      "resource": "file_write",
      "description": "Write to file",
      "allowDeny": true
    }
  }
}
```

#### permission.replied

**触发时机**: 用户响应回权限请求时
**报文格式**:

```json
{
  "type": "permission.replied",
  "properties": {
    "sessionID": "ses_...",
    "requestID": "perm_...",
    "reply": "approve|deny"
  }
}
```

#### permission.updated

**触发时机**: 权限规则更新时
**报文格式**:

```json
{
  "type": "permission.updated",
  "properties": {
    // Permission.Info 对象
  }
}
```

### ❓ 问题事件 (Question Events)

#### question.asked

**触发时机**: AI提出问题需要用户回答时
**报文格式**:

```json
{
  "type": "question.asked",
  "properties": {
    "requestID": "quest_...",
    "sessionID": "ses_...",
    "questions": [
      {
        "question": "What is your preference?",
        "header": "Preference",
        "options": [
          {
            "label": "Option A",
            "description": "Description A"
          }
        ]
      }
    ]
  }
}
```

#### question.replied

**触发时机**: 用户回答问题时
**报文格式**:

```json
{
  "type": "question.replied",
  "properties": {
    "sessionID": "ses_...",
    "requestID": "quest_...",
    "answers": ["Selected option"]
  }
}
```

#### question.rejected

**触发时机**: 用户拒绝回答问题时
**报文格式**:

```json
{
  "type": "question.rejected",
  "properties": {
    "sessionID": "ses_...",
    "requestID": "quest_..."
  }
}
```

### 🖥️ 伪终端事件 (PTY Events)

#### pty.created

**触发时机**: 创建新的PTY会话时
**报文格式**:

```json
{
  "type": "pty.created",
  "properties": {
    "info": {
      "id": "pty_...",
      "command": "bash",
      "cwd": "/path/to/dir",
      "title": "Terminal Title"
    }
  }
}
```

#### pty.updated

**触发时机**: PTY会话信息更新时
**报文格式**: 同`pty.created`

#### pty.exited

**触发时机**: PTY进程退出时
**报文格式**:

```json
{
  "type": "pty.exited",
  "properties": {
    "id": "pty_...",
    "exitCode": 0
  }
}
```

#### pty.deleted

**触发时机**: 删除PTY会话时
**报文格式**:

```json
{
  "type": "pty.deleted",
  "properties": {
    "id": "pty_..."
  }
}
```

### 📁 文件事件 (File Events)

#### file.edited

**触发时机**: 文件被编辑时
**报文格式**:

```json
{
  "type": "file.edited",
  "properties": {
    "file": "/path/to/file.ts"
  }
}
```

#### file.watcher.updated

**触发时机**: 文件系统监视器检测到文件变更时
**报文格式**:

```json
{
  "type": "file.watcher.updated",
  "properties": {
    "file": "/path/to/file.ts",
    "event": "add|change|unlink"
  }
}
```

### 🔧 LSP事件 (LSP Events)

#### lsp.updated

**触发时机**: LSP服务器状态更新时
**报文格式**:

```json
{
  "type": "lsp.updated",
  "properties": {}
}
```

#### lsp.client.diagnostics

**触发时机**: LSP客户端收到诊断信息时
**报文格式**:

```json
{
  "type": "lsp.client.diagnostics",
  "properties": {
    "serverID": "typescript",
    "path": "/path/to/file.ts"
  }
}
```

### 🏗️ 项目事件 (Project Events)

#### project.updated

**触发时机**: 项目信息更新时
**报文格式**:

```json
{
  "type": "project.updated",
  "properties": {
    // Project.Info 对象
  }
}
```

#### vcs.branch.updated

**触发时机**: Git分支变更时
**报文格式**:

```json
{
  "type": "vcs.branch.updated",
  "properties": {
    "branch": "main"
  }
}
```

### 📦 安装事件 (Installation Events)

#### installation.updated

**触发时机**: OpenCode版本更新时
**报文格式**:

```json
{
  "type": "installation.updated",
  "properties": {
    "version": "1.1.53"
  }
}
```

#### installation.update-available

**触发时机**: 有新版本可用时
**报文格式**:

```json
{
  "type": "installation.update-available",
  "properties": {
    "version": "1.1.54"
  }
}
```

### 🔌 MCP事件 (MCP Events)

#### mcp.tools.changed

**触发时机**: MCP服务器工具列表变更时
**报文格式**:

```json
{
  "type": "mcp.tools.changed",
  "properties": {
    "server": "mcp-server-name"
  }
}
```

#### mcp.browser.open.failed

**触发时机**: MCP浏览器打开失败时
**报文格式**:

```json
{
  "type": "mcp.browser.open.failed",
  "properties": {
    "mcpName": "mcp-server-name",
    "url": "https://example.com"
  }
}
```

### 🌳 工作树事件 (Worktree Events)

#### worktree.ready

**触发时机**: 工作树准备就绪时
**报文格式**:

```json
{
  "type": "worktree.ready",
  "properties": {
    "name": "worktree-name",
    "branch": "feature-branch"
  }
}
```

#### worktree.failed

**触发时机**: 工作树创建失败时
**报文格式**:

```json
{
  "type": "worktree.failed",
  "properties": {
    "message": "Error message"
  }
}
```

### 🖥️ TUI事件 (TUI Events)

#### tui.prompt.append

**触发时机**: 终端提示符追加文本时
**报文格式**:

```json
{
  "type": "tui.prompt.append",
  "properties": {
    "text": "appended text"
  }
}
```

#### tui.command.execute

**触发时机**: 执行TUI命令时
**报文格式**:

```json
{
  "type": "tui.command.execute",
  "properties": {
    "command": "session.list|session.new|prompt.submit|..."
  }
}
```

#### tui.toast.show

**触发时机**: 显示Toast通知时
**报文格式**:

```json
{
  "type": "tui.toast.show",
  "properties": {
    "title": "Toast Title",
    "message": "Toast message",
    "variant": "info|success|warning|error",
    "duration": 5000
  }
}
```

#### tui.session.select

**触发时机**: 选择会话时
**报文格式**:

```json
{
  "type": "tui.session.select",
  "properties": {
    "sessionID": "ses_..."
  }
}
```

### 💻 IDE事件 (IDE Events)

#### ide.installed

**触发时机**: IDE插件安装完成时
**报文格式**:

```json
{
  "type": "ide.installed",
  "properties": {
    "ide": "vscode|vim|..."
  }
}
```

### ⚡ 命令事件 (Command Events)

#### command.executed

**触发时机**: 执行命令时
**报文格式**:

```json
{
  "type": "command.executed",
  "properties": {
    "name": "command-name",
    "sessionID": "ses_...",
    "arguments": "command arguments",
    "messageID": "msg_..."
  }
}
```

### 🖥️ 服务器事件 (Server Events)

#### server.connected

**触发时机**: SSE连接建立时（自动发送）
**报文格式**:

```json
{
  "type": "server.connected",
  "properties": {}
}
```

#### server.heartbeat

**触发时机**: 心跳检测（每30秒自动发送）
**报文格式**:

```json
{
  "type": "server.heartbeat",
  "properties": {}
}
```

#### server.instance.disposed

**触发时机**: 实例被销毁时
**报文格式**:

```json
{
  "type": "server.instance.disposed",
  "properties": {
    "directory": "/path/to/project"
  }
}
```

#### global.disposed

**触发时机**: 全局实例被销毁时
**报文格式**:

```json
{
  "type": "global.disposed",
  "properties": {}
}
```

---

## 事件订阅最佳实践

### 1. 错误处理

```javascript
const eventSource = new EventSource("/event")

eventSource.onerror = function (error) {
  console.error("SSE connection error:", error)
  // 实现重连逻辑
  setTimeout(() => {
    eventSource.close()
    // 重新创建连接
  }, 5000)
}
```

### 2. 连接关闭

```javascript
// 清理资源
eventSource.onclose = function () {
  console.log("SSE connection closed")
  // 清理相关资源
}

// 手动关闭
eventSource.close()
```

### 3. 事件过滤

```javascript
eventSource.onmessage = function (event) {
  const eventData = JSON.parse(event.data)

  // 只处理特定类型的事件
  if (eventData.type === "session.created") {
    handleSessionCreated(eventData.properties)
  } else if (eventData.type.startsWith("message.")) {
    handleMessageEvent(eventData)
  }
}
```

### 4. 全局事件处理

```javascript
// 使用全局事件端点
const globalEventSource = new EventSource("/global/event")

globalEventSource.onmessage = function (event) {
  const eventData = JSON.parse(event.data)
  const { directory, payload } = eventData

  console.log(`Event from ${directory}:`, payload.type)
  handleEvent(payload.type, payload.properties, directory)
}
```

---

## TypeScript类型定义

OpenCode提供了完整的TypeScript类型定义，可以通过以下方式使用：

```typescript
import type { BusEvent } from "@opencode-ai/opencode/src/bus/bus-event"

// 事件载荷类型
type EventPayload = z.infer<ReturnType<typeof BusEvent.payloads>>

// 特定事件类型
type SessionCreatedEvent = {
  type: "session.created"
  properties: {
    info: Session.Info
  }
}

// 事件处理器
function handleEvent(event: EventPayload) {
  switch (event.type) {
    case "session.created":
      // TypeScript 知道 properties 是 Session.Info
      console.log("New session:", event.properties.info.title)
      break
    // ... 其他事件类型
  }
}
```

---

## OpenAPI规范

SSE端点在OpenAPI规范中的定义：

### /event

```yaml
/event:
  get:
    operationId: event.subscribe
    summary: Subscribe to events
    description: Get events
    responses:
      200:
        description: Event stream
        content:
          text/event-stream:
            schema:
              $ref: "#/components/schemas/Event"
```

### /global/event

```yaml
/global/event:
  get:
    operationId: global.event
    summary: Get global events
    description: Subscribe to global events from the OpenCode system using server-sent events.
    responses:
      200:
        description: Event stream
        content:
          text/event-stream:
            schema:
              $ref: "#/components/schemas/GlobalEvent"
```

事件Schema定义：

```yaml
components:
  schemas:
    Event:
      oneOf:
        - type: object
          properties:
            type:
              type: string
              enum: [session.created]
            properties:
              $ref: "#/components/schemas/SessionCreatedProperties"
        # ... 其他事件类型

    GlobalEvent:
      type: object
      properties:
        directory:
          type: string
        payload:
          $ref: "#/components/schemas/Event"
```

---

## 调试和测试

### 1. 使用curl测试

```bash
# 测试实例事件
curl -N http://localhost:4096/event

# 测试全局事件
curl -N http://localhost:4096/global/event
```

### 2. 查看事件日志

OpenCode服务器会在控制台输出事件发布日志：

```
[INFO] [event] publishing {"type":"session.created"}
[INFO] [bus] subscribing {"type":"session.created"}
```

### 3. 事件监听测试

可以使用浏览器开发者工具的Network面板查看SSE连接和事件流。

---

## 性能和限制

### 1. 内存使用

- 每个SSE连接会保持一个HTTP连接
- 事件处理器会占用内存，确保及时清理不需要的监听器

### 2. 连接数量

- 服务器支持多个并发SSE连接
- 建议客户端合理管理连接数量

### 3. 事件频率

- 高频事件（如文件变更）可能会产生大量事件
- 考虑在客户端实现事件去重或节流

### 4. 网络稳定性

- SSE是单向连接，网络中断需要客户端重连
- 心跳机制帮助检测连接状态

---

## 常见问题

### Q: 如何区分不同会话的事件？

A: 每个事件的`properties`中都包含相关的ID（如`sessionID`、`messageID`等），可以通过这些ID进行关联。

### Q: SSE连接会自动重连吗？

A: 标准EventSource API会自动重连，但OpenCode的实现建议手动处理重连逻辑以确保状态一致性。

### Q: 如何只监听特定类型的事件？

A: 在客户端接收所有事件后，通过`event.type`进行过滤，或者使用`Bus.subscribe()`方法（服务端内部使用）。

### Q: 全局事件和实例事件有什么区别？

A: 全局事件包含`directory`字段标识来源项目，实例事件只包含当前项目的事件，没有`directory`字段。

### Q: 心跳事件的作用是什么？

A: 心跳事件防止某些客户端（如WKWebView）在60秒无数据传输后自动关闭连接。
