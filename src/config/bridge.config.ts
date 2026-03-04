import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { TestAppConfig } from '../testApp/testApp.types';

const DEFAULT_SERVER_URL = 'ws://localhost:8179';

const DEFAULT_RUNTIME = {
  file_store_dir: 'bridge_files',
  auto_send_local_files: false,
  auto_send_local_files_max_mb: 20,
  auto_send_local_files_allow_absolute: false,
};

type RuntimeConfig = {
  file_store_dir: string;
  auto_send_local_files: boolean;
  auto_send_local_files_max_mb: number;
  auto_send_local_files_allow_absolute: boolean;
};

type SourceTag = 'env' | 'project' | 'user' | 'default';

type RawBridgeConfig = {
  config_version?: unknown;
  enabled?: unknown;
  platform?: unknown;
  runtime?: unknown;
  testapp?: unknown;
};

export type ConfigValidationIssue = {
  path: string;
  code: 'missing_required' | 'invalid_type' | 'invalid_value';
  message: string;
};

export class ConfigValidationError extends Error {
  name = 'ConfigValidationError';
  sourcePath?: string;
  issues: ConfigValidationIssue[];

  constructor(input: { message: string; sourcePath?: string; issues: ConfigValidationIssue[] }) {
    super(input.message);
    this.sourcePath = input.sourcePath;
    this.issues = input.issues;
  }
}

export type BridgeLoadResult = {
  enabled: boolean;
  runtime: RuntimeConfig;
  testapp?: TestAppConfig;
  sources: SourceTag[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stripJsonComments(text: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (inString) {
      result += c;
      if (escaped) {
        escaped = false;
      } else if (c === '\\') {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      result += c;
      continue;
    }
    if (c === '/' && n === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
      result += '\n';
      continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }
    result += c;
  }
  return result;
}

function stripTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, '$1');
}

function parseJsonc(text: string, sourcePath: string): RawBridgeConfig {
  const sanitized = stripTrailingCommas(stripJsonComments(text));
  try {
    const parsed = JSON.parse(sanitized);
    if (!isRecord(parsed)) {
      throw new ConfigValidationError({
        message: '[Plugin] Invalid bridge config: root must be object',
        sourcePath,
        issues: [{ path: '$', code: 'invalid_type', message: 'config root must be object' }],
      });
    }
    return parsed as RawBridgeConfig;
  } catch (e) {
    if (e instanceof ConfigValidationError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new ConfigValidationError({
      message: `[Plugin] Invalid bridge config file path=${sourcePath} error=${msg}`,
      sourcePath,
      issues: [{ path: '$', code: 'invalid_value', message: msg }],
    });
  }
}

function parseBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function readConfigFile(filepath: string): RawBridgeConfig | undefined {
  if (!fs.existsSync(filepath)) return undefined;
  const text = fs.readFileSync(filepath, 'utf8');
  return parseJsonc(text, filepath);
}

function mergeRecord(
  base: Record<string, unknown>,
  next: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(next)) {
    if (isRecord(merged[k]) && isRecord(v)) {
      merged[k] = mergeRecord(merged[k] as Record<string, unknown>, v);
      continue;
    }
    merged[k] = v;
  }
  return merged;
}

function normalizeRuntime(value: unknown): RuntimeConfig {
  const node = isRecord(value) ? value : {};
  return {
    file_store_dir:
      typeof node.file_store_dir === 'string' && node.file_store_dir.trim()
        ? node.file_store_dir
        : DEFAULT_RUNTIME.file_store_dir,
    auto_send_local_files:
      parseBool(node.auto_send_local_files) ?? DEFAULT_RUNTIME.auto_send_local_files,
    auto_send_local_files_max_mb:
      parseNumber(node.auto_send_local_files_max_mb) ?? DEFAULT_RUNTIME.auto_send_local_files_max_mb,
    auto_send_local_files_allow_absolute:
      parseBool(node.auto_send_local_files_allow_absolute) ??
      DEFAULT_RUNTIME.auto_send_local_files_allow_absolute,
  };
}

function parseEnabled(raw: unknown): boolean {
  return parseBool(raw) ?? true;
}

function validateWsUrl(value: string): boolean {
  return value.startsWith('ws://') || value.startsWith('wss://');
}

function throwIssue(path: string, code: ConfigValidationIssue['code'], message: string): never {
  throw new ConfigValidationError({
    message: `[Plugin] ${message}`,
    issues: [{ path, code, message }],
  });
}

function buildTestAppConfig(raw: Record<string, unknown>): TestAppConfig {
  const app_id = typeof raw.app_id === 'string' ? raw.app_id : '';
  const ak = typeof raw.ak === 'string' ? raw.ak : '';
  const sk = typeof raw.sk === 'string' ? raw.sk : '';
  const modeRaw = raw.mode;
  const mode = modeRaw == null ? 'ws' : modeRaw;
  if (mode !== 'ws') {
    throwIssue('testapp.mode', 'invalid_value', 'Invalid options for testapp: mode must be ws');
  }
  if (!app_id || !ak || !sk) {
    throwIssue('testapp', 'missing_required', 'Missing options for testapp: app_id/ak/sk');
  }
  const server_url =
    typeof raw.server_url === 'string' && raw.server_url.trim()
      ? raw.server_url
      : DEFAULT_SERVER_URL;
  if (!validateWsUrl(server_url)) {
    throwIssue('testapp.server_url', 'invalid_value', 'Invalid options for testapp: server_url must be ws:// or wss://');
  }
  return {
    app_id,
    ak,
    sk,
    mode: 'ws',
    server_url,
    file_store_dir:
      typeof raw.file_store_dir === 'string' && raw.file_store_dir.trim() ? raw.file_store_dir : undefined,
    auto_send_local_files: parseBool(raw.auto_send_local_files),
    auto_send_local_files_max_mb: parseNumber(raw.auto_send_local_files_max_mb),
    auto_send_local_files_allow_absolute: parseBool(raw.auto_send_local_files_allow_absolute),
  };
}

export function redactSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '*'.repeat(value.length);
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function readEnvOverrides(): Record<string, unknown> {
  const runtime: Record<string, unknown> = {};
  const testapp: Record<string, unknown> = {};

  if (process.env.BRIDGE_FILE_STORE_DIR) runtime.file_store_dir = process.env.BRIDGE_FILE_STORE_DIR;
  if (process.env.BRIDGE_AUTO_SEND_LOCAL_FILES)
    runtime.auto_send_local_files = process.env.BRIDGE_AUTO_SEND_LOCAL_FILES;
  if (process.env.BRIDGE_AUTO_SEND_LOCAL_FILES_MAX_MB)
    runtime.auto_send_local_files_max_mb = process.env.BRIDGE_AUTO_SEND_LOCAL_FILES_MAX_MB;
  if (process.env.BRIDGE_AUTO_SEND_LOCAL_FILES_ALLOW_ABSOLUTE)
    runtime.auto_send_local_files_allow_absolute = process.env.BRIDGE_AUTO_SEND_LOCAL_FILES_ALLOW_ABSOLUTE;

  if (process.env.BRIDGE_TESTAPP_APP_ID) testapp.app_id = process.env.BRIDGE_TESTAPP_APP_ID;
  if (process.env.BRIDGE_TESTAPP_AK) testapp.ak = process.env.BRIDGE_TESTAPP_AK;
  if (process.env.BRIDGE_TESTAPP_SK) testapp.sk = process.env.BRIDGE_TESTAPP_SK;
  if (process.env.BRIDGE_TESTAPP_SERVER_URL)
    testapp.server_url = process.env.BRIDGE_TESTAPP_SERVER_URL;

  const root: Record<string, unknown> = {};
  if (process.env.BRIDGE_CONFIG_VERSION) root.config_version = process.env.BRIDGE_CONFIG_VERSION;
  if (process.env.BRIDGE_ENABLED) root.enabled = process.env.BRIDGE_ENABLED;
  if (process.env.BRIDGE_PLATFORM) root.platform = process.env.BRIDGE_PLATFORM;
  if (Object.keys(runtime).length > 0) root.runtime = runtime;
  if (Object.keys(testapp).length > 0) root.testapp = testapp;
  return root;
}

export function loadBridgeConfig(directory: string): BridgeLoadResult {
  const userFile = path.join(os.homedir(), '.config', 'opencode', 'message-bridge.jsonc');
  const projectFile = path.join(directory, '.opencode', 'message-bridge.jsonc');

  const sources: SourceTag[] = [];
  let merged: Record<string, unknown> = {};

  const userCfg = readConfigFile(userFile);
  if (userCfg) {
    merged = mergeRecord(merged, userCfg as Record<string, unknown>);
    sources.push('user');
  }
  const projectCfg = readConfigFile(projectFile);
  if (projectCfg) {
    merged = mergeRecord(merged, projectCfg as Record<string, unknown>);
    sources.push('project');
  }

  const envCfg = readEnvOverrides();
  if (Object.keys(envCfg).length > 0) {
    merged = mergeRecord(merged, envCfg);
    sources.push('env');
  }

  if (!userCfg && !projectCfg && Object.keys(envCfg).length === 0) {
    return {
      enabled: false,
      runtime: { ...DEFAULT_RUNTIME },
      sources: ['default'],
    };
  }

  const config_version = parseNumber(merged.config_version) ?? 1;
  if (config_version !== 1) {
    throwIssue('config_version', 'invalid_value', `Invalid bridge config: config_version must be 1, got=${config_version}`);
  }

  const platform = typeof merged.platform === 'string' ? merged.platform : 'testapp';
  if (platform !== 'testapp') {
    throwIssue('platform', 'invalid_value', `Invalid bridge config: platform must be testapp, got=${platform}`);
  }

  const enabled = parseEnabled(merged.enabled);
  const runtime = normalizeRuntime(merged.runtime);
  const testapp = enabled
    ? buildTestAppConfig(isRecord(merged.testapp) ? merged.testapp : {})
    : undefined;

  if (sources.length === 0) sources.push('default');
  return {
    enabled,
    runtime,
    testapp,
    sources,
  };
}
