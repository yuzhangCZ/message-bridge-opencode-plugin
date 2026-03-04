import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { WebSocketServer } from 'ws';
import { TestAppAdapter } from '../../dist/src/testApp/testApp.adapter.js';
import { loadBridgeConfig } from '../../dist/src/config/bridge.config.js';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('testapp adapter can connect/login/send/edit against mock ws server', async () => {
  const received = [];
  const wss = new WebSocketServer({ port: 0 });
  const port = wss.address().port;

  wss.on('connection', ws => {
    ws.on('message', raw => {
      const text = raw.toString();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        return;
      }
      received.push(payload);
      if (payload.type === 'login') {
        ws.send(JSON.stringify({ type: 'login_response', status: 'success' }));
      }
    });
  });

  const adapter = new TestAppAdapter({
    app_id: 'app_test',
    ak: 'ak_test',
    sk: 'sk_test',
    mode: 'ws',
    server_url: `ws://127.0.0.1:${port}`,
  });

  try {
    await adapter.start(async () => {});
    const msgId = await adapter.sendMessage('chat_1', 'hello');
    assert.ok(typeof msgId === 'string');

    const edited = await adapter.editMessage('chat_1', 'msg_1', 'edited');
    assert.equal(edited, true);

    await wait(100);
    const login = received.find(x => x.type === 'login');
    assert.ok(login, 'expected login payload');
    const sentText = received.find(x => x.msg_type === 'text');
    assert.ok(sentText, 'expected sendMessage payload');
    const editPayload = received.find(x => x.message_id === 'msg_1');
    assert.ok(editPayload, 'expected editMessage payload');
  } finally {
    await adapter.stop();
    await new Promise(resolve => wss.close(resolve));
  }
});

test('missing sk fails during config loading', () => {
  const dir = makeTempDir('bridge-e2e-missing-sk-');
  const cfgDir = path.join(dir, '.opencode');
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(
    path.join(cfgDir, 'message-bridge.jsonc'),
    JSON.stringify({
      config_version: 1,
      platform: 'testapp',
      testapp: {
        app_id: 'app_test',
        ak: 'ak_test',
      },
    }),
  );

  assert.throws(() => loadBridgeConfig(dir), /Missing options for testapp: app_id\/ak\/sk/);
});

test('unreachable server_url fails adapter startup with connection error', async () => {
  const adapter = new TestAppAdapter({
    app_id: 'app_test',
    ak: 'ak_test',
    sk: 'sk_test',
    mode: 'ws',
    server_url: 'ws://127.0.0.1:65535',
  });

  await assert.rejects(
    () => adapter.start(async () => {}),
    err => {
      assert.ok(err instanceof Error);
      return true;
    },
  );
});
