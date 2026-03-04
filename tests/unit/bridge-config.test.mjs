import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ConfigValidationError, loadBridgeConfig, redactSecret } from '../../dist/src/config/bridge.config.js';

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.BRIDGE_TESTAPP_APP_ID;
  delete process.env.BRIDGE_TESTAPP_AK;
  delete process.env.BRIDGE_TESTAPP_SK;
  delete process.env.BRIDGE_TESTAPP_SERVER_URL;
  delete process.env.BRIDGE_PLATFORM;
  delete process.env.BRIDGE_ENABLED;
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('returns disabled when no independent config sources exist', () => {
  resetEnv();
  const dir = makeTempDir('bridge-config-none-');
  const result = loadBridgeConfig(dir);
  assert.equal(result.enabled, false);
  assert.equal(result.testapp, undefined);
  assert.deepEqual(result.sources, ['default']);
});

test('loads project config and applies defaults', () => {
  resetEnv();
  const dir = makeTempDir('bridge-config-project-');
  const cfgDir = path.join(dir, '.opencode');
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(
    path.join(cfgDir, 'message-bridge.jsonc'),
    `{
      // minimal testapp config
      "config_version": 1,
      "platform": "testapp",
      "testapp": {
        "app_id": "app_x",
        "ak": "ak_x",
        "sk": "sk_x"
      }
    }`,
  );

  const result = loadBridgeConfig(dir);
  assert.equal(result.enabled, true);
  assert.equal(result.testapp?.server_url, 'ws://localhost:8179');
  assert.equal(result.testapp?.mode, 'ws');
  assert.equal(result.runtime.file_store_dir, 'bridge_files');
  assert.equal(result.runtime.auto_send_local_files, false);
  assert.ok(result.sources.includes('project'));
});

test('env has highest priority over file config', () => {
  resetEnv();
  const dir = makeTempDir('bridge-config-env-');
  const cfgDir = path.join(dir, '.opencode');
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(
    path.join(cfgDir, 'message-bridge.jsonc'),
    JSON.stringify({
      config_version: 1,
      platform: 'testapp',
      testapp: {
        app_id: 'app_file',
        ak: 'ak_file',
        sk: 'sk_file',
        server_url: 'ws://file:8179',
      },
    }),
  );

  process.env.BRIDGE_TESTAPP_SERVER_URL = 'ws://env:9988';
  process.env.BRIDGE_TESTAPP_AK = 'ak_env';

  const result = loadBridgeConfig(dir);
  assert.equal(result.testapp?.server_url, 'ws://env:9988');
  assert.equal(result.testapp?.ak, 'ak_env');
  assert.ok(result.sources.includes('env'));
});

test('enabled=false skips required credential validation', () => {
  resetEnv();
  const dir = makeTempDir('bridge-config-disabled-');
  const cfgDir = path.join(dir, '.opencode');
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(
    path.join(cfgDir, 'message-bridge.jsonc'),
    JSON.stringify({
      config_version: 1,
      platform: 'testapp',
      enabled: false,
      testapp: {},
    }),
  );

  const result = loadBridgeConfig(dir);
  assert.equal(result.enabled, false);
  assert.equal(result.testapp, undefined);
});

test('throws for invalid platform', () => {
  resetEnv();
  const dir = makeTempDir('bridge-config-invalid-platform-');
  const cfgDir = path.join(dir, '.opencode');
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(
    path.join(cfgDir, 'message-bridge.jsonc'),
    JSON.stringify({
      config_version: 1,
      platform: 'telegram',
      testapp: { app_id: 'a', ak: 'b', sk: 'c' },
    }),
  );

  assert.throws(() => loadBridgeConfig(dir), err => {
    assert.ok(err instanceof ConfigValidationError);
    assert.equal(err.name, 'ConfigValidationError');
    assert.equal(err.issues[0]?.path, 'platform');
    return /platform must be testapp/.test(err.message);
  });
});

test('throws for invalid server_url protocol', () => {
  resetEnv();
  const dir = makeTempDir('bridge-config-invalid-url-');
  const cfgDir = path.join(dir, '.opencode');
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(
    path.join(cfgDir, 'message-bridge.jsonc'),
    JSON.stringify({
      config_version: 1,
      platform: 'testapp',
      testapp: { app_id: 'a', ak: 'b', sk: 'c', server_url: 'http://localhost:8179' },
    }),
  );

  assert.throws(() => loadBridgeConfig(dir), err => {
    assert.ok(err instanceof ConfigValidationError);
    assert.equal(err.issues[0]?.path, 'testapp.server_url');
    return /server_url must be ws:\/\/ or wss:\/\//.test(err.message);
  });
});

test('redacts secret values for log-safe output', () => {
  assert.equal(redactSecret(''), '');
  assert.equal(redactSecret('abcd'), '****');
  assert.equal(redactSecret('abcdef'), 'ab***ef');
  assert.equal(redactSecret('my-secret-key'), 'my***ey');
});
