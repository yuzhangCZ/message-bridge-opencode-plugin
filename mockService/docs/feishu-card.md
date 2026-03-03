# Feishu Card 数据结构解析

## 概述

`@src/feishu/feishu.renderer.ts` 文件中定义了如何将 Markdown 内容解析为飞书卡片的详细流程。以下是详细的解析步骤和数据结构。

## 数据结构

### `FeishuCard` 对象

```typescript
type FeishuCard = {
  config?: { wide_screen_mode?: boolean };
  header?: { title: { tag: 'plain_text'; content: string }; template?: string };
  elements: FeishuCardElement[];
};
```

- **config**:
  - `wide_screen_mode`: 布尔值，表示是否启用宽屏模式。

- **header**:
  - `title`: 标题对象，包含以下属性：
    - `tag`: 字符串，固定为 `'plain_text'`。
    - `content`: 标题内容。
  - `template`: 可选，模板字符串，用于设置标题的颜色。

- **elements**: 数组，包含多个 `FeishuCardElement` 对象。

### `FeishuCardElement` 对象

`FeishuCardElement` 是一个通用的对象类型，可以包含多种元素，例如文本、分割线、可折叠面板等。

## 解析Markdown内容的流程

1. **读取Markdown内容**：传入的Markdown内容将被传递给 `renderFeishuCardFromHandlerMarkdown` 函数。
2. **解析Markdown内容**：使用 `parseSections` 函数将Markdown内容解析为多个部分（如命令、错误、思考过程等）。
3. **生成卡片元素**：根据解析出的部分，生成相应的卡片元素（如文本、分割线、可折叠面板等）。
4. **组装最终卡片**：将生成的卡片元素组装成一个完整的 `FeishuCard` 对象，并返回JSON字符串。

## 示例Markdown内容

假设传入的Markdown内容如下：

```markdown
## 思考
这是一些思考过程。

## 工具
- 工具1
- 工具2

## 文件
- 文件1 (text/plain)
- 文件2 (image/png)

## 状态
处理中...
```

## 解析步骤

1. **提取思考部分**：
   ```markdown
   ## 思考
   这是一些思考过程。
   ```

2. **提取工具部分**：
   ```markdown
   ## 工具
   - 工具1
   - 工具2
   ```

3. **提取文件部分**：
   ```markdown
   ## 文件
   - 文件1 (text/plain)
   - 文件2 (image/png)
   ```

4. **提取状态部分**：
   ```markdown
   ## 状态
   处理中...
   ```

## 生成卡片元素

1. **思考部分**：
   - 使用 `collapsiblePanel` 函数生成一个可折叠面板。
   ```json
   {
     "tag": "collapsible_panel",
     "expanded": false,
     "background_style": "grey",
     "header": {
       "title": { "tag": "plain_text", "content": "💭 Thinking" }
     },
     "border": {
       "top": true,
       "bottom": true
     },
     "elements": [
       {
         "tag": "div",
         "text": { "tag": "lark_md", "content": "这是一些思考过程。" }
       }
     ]
   }
   ```

2. **工具部分**：
   - 使用 `splitToolsIntoExecutionPanels` 函数将工具部分拆分为多个执行面板。
   ```json
   [
     {
       "tag": "collapsible_panel",
       "expanded": false,
       "background_style": "grey",
       "header": {
         "title": { "tag": "plain_text", "content": "⚙️ Execution #1" }
       },
       "border": {
         "top": true,
         "bottom": true,
         "color": "turquoise"
       },
       "elements": [
         {
           "tag": "div",
           "text": { "tag": "lark_md", "content": "- 工具1\n- 工具2" }
         }
       ]
     }
   ]
   ```

3. **文件部分**：
   - 使用 `collapsiblePanel` 函数生成一个可折叠面板。
   ```json
   {
     "tag": "collapsible_panel",
     "expanded": false,
     "background_style": "grey",
     "header": {
       "title": { "tag": "plain_text", "content": "🖼️ Files" }
     },
     "border": {
       "top": true,
       "bottom": true
     },
     "elements": [
       {
         "tag": "div",
         "text": { "tag": "lark_md", "content": "- 文件1 (text/plain)\n- 文件2 (image/png)" }
       }
     ]
   }
   ```

4. **状态部分**：
   - 使用 `getStatusWithEmoji` 和 `splitStatusPaths` 函数生成状态部分。
   ```json
   {
     "tag": "note",
     "elements": [
       { "tag": "plain_text", "content": "⏳ 处理中..." }
     ]
   }
   ```

## 组装最终卡片

将生成的卡片元素组装成一个完整的 `FeishuCard` 对象，并返回JSON字符串。

```json
{
  "config": {
    "wide_screen_mode": true
  },
  "header": {
    "template": "turquoise",
    "title": { "tag": "plain_text", "content": "🤔 Thinking Process" }
  },
  "elements": [
    {
      "tag": "collapsible_panel",
      "expanded": false,
      "background_style": "grey",
      "header": {
        "title": { "tag": "plain_text", "content": "💭 Thinking" }
      },
      "border": {
        "top": true,
        "bottom": true
      },
      "elements": [
        {
          "tag": "div",
          "text": { "tag": "lark_md", "content": "这是一些思考过程。" }
        }
      ]
    },
    {
      "tag": "div",
      "text": { "tag": "lark_md", "content": " " }
    },
    {
      "tag": "collapsible_panel",
      "expanded": false,
      "background_style": "grey",
      "header": {
        "title": { "tag": "plain_text", "content": "⚙️ Execution #1" }
      },
      "border": {
        "top": true,
        "bottom": true,
        "color": "turquoise"
      },
      "elements": [
        {
          "tag": "div",
          "text": { "tag": "lark_md", "content": "- 工具1\n- 工具2" }
        }
      ]
    },
    {
      "tag": "div",
      "text": { "tag": "lark_md", "content": " " }
    },
    {
      "tag": "collapsible_panel",
      "expanded": false,
      "background_style": "grey",
      "header": {
        "title": { "tag": "plain_text", "content": "🖼️ Files" }
      },
      "border": {
        "top": true,
        "bottom": true
      },
      "elements": [
        {
          "tag": "div",
          "text": { "tag": "lark_md", "content": "- 文件1 (text/plain)\n- 文件2 (image/png)" }
        }
      ]
    },
    {
      "tag": "hr"
    },
    {
      "tag": "note",
      "elements": [
        { "tag": "plain_text", "content": "⏳ 处理中..." }
      ]
    }
  ]
}
```
