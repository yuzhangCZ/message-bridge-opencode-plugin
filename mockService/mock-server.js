const WebSocket = require('ws');
const config = require('./config');

const wss = new WebSocket.Server({ port: config.port });

// Store authenticated clients
const authenticatedClients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  let isAuthenticated = false;
  
  ws.send(JSON.stringify({ type: 'welcome', message: 'Welcome to the mock testApp server' }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received:', message);

      // Handle login message
      if (message.type === 'login') {
        handleLogin(ws, message);
        return;
      }

      // For other messages, check if client is authenticated
      if (!isAuthenticated) {
        console.log('[MockServer] Rejected message from unauthenticated client');
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Client not authenticated'
        }));
        return;
      }

      // Handle other message types here (if needed)
      console.log('[MockServer] Received message from authenticated client:', message);
    } catch (error) {
      console.error('[MockServer] Failed to parse message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });

  function handleLogin(ws, message) {
    const { ak, sk } = message;

    // Validate that ak and sk are provided
    if (!ak || !sk) {
      console.log('[MockServer] Login failed: missing ak or sk');
      ws.send(JSON.stringify({
        type: 'login_response',
        status: 'failed',
        error: 'Missing ak or sk'
      }));
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Simple validation - in production, this should check against a database
    if (ak.length < 3 || sk.length < 3) {
      console.log('[MockServer] Login failed: invalid ak or sk format');
      ws.send(JSON.stringify({
        type: 'login_response',
        status: 'failed',
        error: 'Invalid ak or sk format'
      }));
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Login successful
    isAuthenticated = true;
    authenticatedClients.add(ws);
    console.log(`[MockServer] Login successful for ak: ${ak.substring(0, 3)}...`);
    ws.send(JSON.stringify({
      type: 'login_response',
      status: 'success'
    }));
  }

  // Handle console input to broadcast messages to all authenticated clients
  process.stdin.on('data', (input) => {
    if (!isAuthenticated) {
      return; // Don't send messages to unauthenticated clients
    }

    const trimmedInput = input.toString().trim();
    if (trimmedInput) {
      const message = {
        event_id: `ev_${Date.now()}`,
        token: `token_${Date.now()}`,
        create_time: new Date().toISOString(),
        event_type: 'im.message.receive_v1',
        tenant_key: `tenant_${Date.now()}`,
        ts: Date.now(),
        uuid: `uuid_${Date.now()}`,
        type: 'message',
        app_id: `app_${Date.now()}`,
        sender: {
          sender_id: {
            union_id: `union_${Date.now()}`,
            user_id: `user_${Date.now()}`,
            open_id: `open_test_id`
          },
          sender_type: 'user',
          tenant_key: `tenant_${Date.now()}`
        },
        message: {
          message_id: `msg_${Date.now()}`,
          root_id: `msg_${Date.now()}`,
          parent_id: null,
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
          chat_id: `chat_${Date.now()}`,
          thread_id: null,
          chat_type: 'group',
          message_type: 'text',
          content: JSON.stringify({ text: trimmedInput }),
          mentions: [],
          user_agent: 'Feishu/4.0.0 (Mac)'
        }
      };
      ws.send(JSON.stringify(message));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    authenticatedClients.delete(ws);
    isAuthenticated = false;
  });
});

console.log(`WebSocket server is running on port ${config.port}`);
console.log('Waiting for clients to connect and authenticate...');
