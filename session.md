# Message Bridge Plugin Debug Session

## Goal

Debug and fix the message-bridge-opencode-plugin's testApp adapter to properly communicate with a mock WebSocket server. The plugin should:
1. Connect to the mock WebSocket server at `ws://localhost:8179`
2. Receive messages from the mock server
3. Forward messages to OpenCode for AI processing
4. Return AI responses back to the mock server

## Instructions

- Debug why mock server communication appears unresponsive after the plugin runs
- Understand why testApp appears as an "agent" in TUI (answered: it's an adapter key, not an AI agent)
- The testApp adapter uses WebSocket mode to connect to a mock server at `ws://localhost:8179`

## Discoveries

### Critical Issue Identified: OpenCode Event Subscription Problem
The plugin successfully connects to OpenCode's event stream but receives **zero events** for its sessions. Evidence from logs:
- Plugin logs: `[Listener] connected to OpenCode event stream`
- Plugin creates session and sends prompt: `prompt-sent adapter=testapp session=ses_353bfd15bffeqjqBRj2QLjjbrn`
- **NO** `[BridgeFlow] event.observed` logs appear - no events being received
- TUI session (`ses_35d4aeb8cffensxjwZ1CmRpRdO`) receives all events normally
- Watchdog timeout triggers after 20 seconds: `session-reply-timeout sid=ses_353bfd15bffeqjqBRj2QLjjbrn`

### Root Cause Hypothesis
The `api.event.subscribe()` call may filter events by client/session context. The plugin's sessions may not be included in the event stream because:
- Session-to-subscriber binding may be required
- Events may be filtered by directory or client ID
- The subscription may need query parameters to include plugin sessions

### Configuration Issue Fixed
Plugin wasn't loading because `opencode.json` was missing the plugin path. Fixed by adding:
```json
"plugin": [
  "oh-my-opencode@latest",
  "/Users/zhangyu/code/opencode/message-bridge-opencode-plugin"
]
```

### Architecture Understanding
- `testapp` in `agent.testapp` config is a **bridge adapter key**, not an AI agent
- Sessions use `DEFAULT_AGENT_ID = 'build'` as the AI agent
- Event routing uses `sessionToCtx` and `sessionToAdapterKey` maps to route events back to correct adapter

## Accomplished

1. ✅ Fixed plugin loading issue by updating `opencode.json`
2. ✅ Verified plugin loads and connects to mock server successfully
3. ✅ Verified authentication with mock server works
4. ✅ Verified session creation and prompt sending works
5. ❌ **Unresolved**: Events not being delivered to plugin's event stream

## Relevant files / directories

### Configuration
- `/Users/zhangyu/.config/opencode/opencode.json` - OpenCode configuration (modified to add plugin path)

### Plugin Source Files
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/index.ts` - Main plugin entry, initializes adapters
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/index.testapp.ts` - TestApp config parser
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/src/testApp/testApp.client.ts` - WebSocket client with login auth
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/src/testApp/testApp.adapter.ts` - TestApp adapter implementation
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/src/handler/event/flow.ts` - Event subscription via `api.event.subscribe()`
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/src/handler/event/dispatch.ts` - Event dispatching and session routing
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/src/handler/flow/incoming.ts` - Incoming message handling, session creation

### Mock Server
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/mockService/mock-server.js` - WebSocket mock server on port 8179

### Logs
- `/Users/zhangyu/code/opencode/message-bridge-opencode-plugin/logs/bridge.log` - Plugin logs
- `~/.local/share/opencode/log/*.log` - OpenCode main logs

### SDK Reference
- `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts` - SDK types for understanding event subscription API

## Next Steps

1. **Investigate OpenCode event subscription mechanism**:
   - Check if `api.event.subscribe()` filters events by client/session
   - Check if there's a session-to-subscriber binding requirement
   - Review SDK types for subscription options

2. **Verify with working adapters**:
   - Check if feishu/telegram adapters have the same issue
   - Look for differences in how they handle event subscription

3. **Possible solutions to explore**:
   - Pass session ID or directory to `event.subscribe({ query: { directory } })`
   - Check if plugin needs to use a different API for event subscription
   - Verify metadata passing in `session.create` or `session.prompt` for event routing