```
{
  event_id?: string;
  token?: string;
  create_time?: string;
  event_type?: string;
  tenant_key?: string;
  ts?: string;
  uuid?: string;
  type?: string;
  app_id?: string;
  sender: {
    sender_id?: {
      union_id?: string;
      user_id?: string;
      open_id?: string;
    };
    sender_type: string;
    tenant_key?: string;
  };
  message: {
    message_id: string;
    root_id?: string;
    parent_id?: string;
    create_time: string;
    update_time?: string;
    chat_id: string;
    thread_id?: string;
    chat_type: string;
    message_type: string;
    content: string;
    mentions?: Array<{
      key: string;
      id: {
        union_id?: string;
        user_id?: string;
        open_id?: string;
      };
      name: string;
      tenant_key?: string;
    }>;
    user_agent?: string;
  };
}
```

im.message.receive_v1 事件数据结构及字段含义
事件头 (Header)
- event_id: 事件ID，用于唯一标识该事件。
- token: 事件令牌，用于验证事件的真实性。
- create_time: 事件创建时间，格式为ISO 8601。
- event_type: 事件类型，例如im.message.receive_v1表示接收到消息的事件。
- tenant_key: 租户密钥，用于标识租户。
发送者 (Sender)
- sender_id: 发送者的ID，可以是用户ID、开放ID或联合ID。
  - union_id: 联合ID，用于唯一标识用户。
  - user_id: 用户ID，用于标识用户。
  - open_id: 开放ID，用于标识用户。
- sender_type: 发送者类型，例如user表示用户。
- tenant_key: 租户密钥，用于标识租户。
消息 (Message)
- message_id: 消息ID，用于唯一标识该消息。
- root_id: 根消息ID，用于标识消息的根消息。
- parent_id: 父消息ID，用于标识消息的父消息。
- create_time: 消息创建时间，格式为ISO 8601。
- update_time: 消息更新时间，格式为ISO 8601。
- chat_id: 会话ID，用于标识会话。
- thread_id: 主题ID，用于标识主题。
- chat_type: 会话类型，例如group表示群聊。
- message_type: 消息类型，例如text表示文本消息。
- content: 消息内容，具体格式取决于消息类型。
- mentions: 提及的用户列表。
  - key: 提及用户的键，用于标识提及的用户。
  - id: 提及用户的ID，可以是用户ID、开放ID或联合ID。
    - union_id: 联合ID，用于唯一标识用户。
    - user_id: 用户ID，用于标识用户。
    - open_id: 开放ID，用于标识用户。
  - name: 提及用户的名称。
  - tenant_key: 租户密钥，用于标识租户。
- user_agent: 用户代理，用于标识发送消息的客户端。
示例报文
以下是im.message.receive_v1事件的一个示例报文：
{
  event_id: ev_1234567890abcdef,
  token: token_1234567890abcdef,
  create_time: 2023-10-01T12:00:00.000+0000,
  event_type: im.message.receive_v1,
  tenant_key: tenant_1234567890abcdef,
  ts: 1633072800000,
  uuid: uuid_1234567890abcdef,
  type: message,
  app_id: app_1234567890abcdef,
  sender: {
    sender_id: {
      union_id: union_1234567890abcdef,
      user_id: user_1234567890abcdef,
      open_id: open_1234567890abcdef
    },
    sender_type: user,
    tenant_key: tenant_1234567890abcdef
  },
  message: {
    message_id: msg_1234567890abcdef,
    root_id: msg_1234567890abcdef,
    parent_id: ,
    create_time: 2023-10-01T12:00:00.000+0000,
    update_time: 2023-10-01T12:00:00.000+0000,
    chat_id: chat_1234567890abcdef,
    thread_id: ,
    chat_type: group,
    message_type: text,
    content: {"text":"Hello, Feishu!"},
    mentions: [
      {
        key: user_1234567890abcdef,
        id: {
          union_id: union_1234567890abcdef,
          user_id: user_1234567890abcdef,
          open_id: open_1234567890abcdef
        },
        name: John Doe,
        tenant_key: tenant_1234567890abcdef
      }
    ],
    user_agent: Feishu/4.0.0 (Mac)
  }
}