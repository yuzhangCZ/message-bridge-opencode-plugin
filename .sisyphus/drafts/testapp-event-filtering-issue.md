# TestApp Event Filtering Issue Analysis

## Key Findings from Session Analysis:

### Current Problem:
- Plugin successfully connects to OpenCode's event stream 
- Plugin creates session and sends prompt successfully
- BUT NO events are delivered to plugin's event stream for its own sessions
- The same TUI session on OpenCode receives all events normally
- Watchdog timeout triggers after 20 seconds with no event delivery

### Root Cause Hypothesis:
The `api.event.subscribe()` call in `src/handler/event/flow.ts` likely filters events by directory context or session/client, meaning the plugin's sessions may not be included in the filtered event stream.

### Evidence:
- Plugin logs `[Listener] connected to OpenCode event stream`
- Creates session and sends prompt: `[Incoming] prompt-sent adapter=testapp session=ses_353bfd15bffeqjqBRj2QLjjbrn` 
- NO `[BridgeFlow] event.observed` logs appear from the flow.ts event handlers
- TUI session `ses_35d4aeb8cffensxjwZ1CmRpRdO` receives all events normally
- Leads to watchdog timeout: `session-reply-timeout sid=ses_353bfd15bffeqjqBRj2QLjjbrn`

### Relevant Files to Investigate:
- `src/handler/event/flow.ts` - Main event subscription logic
- `src/handler/event/dispatch.ts` - Event dispatch and routing 
- `src/handler/flow/incoming.ts` - Session creation and prompt submission
- `src/testApp/testApp.client.ts` - WebSocket client implementation
- `start-testapp.sh` - TestApp startup script

## Todo Items Identified:
1. Fix event subscription filtering in flow.ts
2. Analyze session-to-context mapping in dispatch.ts 
3. Update testApp config with proper credentials
4. Verify authentication mechanism with mock server

## Requirements for Solution:
- Event stream needs to include events for plugin-managed sessions
- Authentication mechanism must be reliable  
- Changes should maintain compatibility with other adapters
- Should not affect event delivery for other adapters like TUI
