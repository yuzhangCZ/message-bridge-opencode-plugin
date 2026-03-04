// index.testapp.ts
import type { Config } from '@opencode-ai/sdk';
import type { TestAppConfig } from './src/testApp/testApp.types';
import { asRecord } from './src/utils';

export function parseTestAppConfig(cfg: Config | undefined): TestAppConfig {
  const node = cfg?.agent?.testapp;
  const options = asRecord(node?.options);

  const app_id = typeof options.app_id === 'string' ? options.app_id : '';
  const ak = typeof options.ak === 'string' ? options.ak : '';
  const sk = typeof options.sk === 'string' ? options.sk : '';
  const serverUrl =
    typeof options.server_url === 'string' ? options.server_url : 'ws://localhost:8179';

  if (!app_id || !ak || !sk) {
    throw new Error('[Plugin] Missing options for testapp: app_id/ak/sk');
  }

  // 仅支持 ws 模式
  const mode = 'ws';

  return {
    app_id,
    ak,
    sk,
    mode,
    server_url: serverUrl,
  };
};
