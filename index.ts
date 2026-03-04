// index.ts
import type { Plugin } from '@opencode-ai/plugin';

import { globalState, runtimeInstanceId } from './src/utils';
import { bridgeLogger, getBridgeLogFilePath } from './src/logger';

import { AdapterMux } from './src/handler/mux';
import { createIncomingHandler, handleHookEvent } from './src/handler';
import { setBridgeFileStoreDir } from './src/bridge/file.store';
import { ConfigValidationError, loadBridgeConfig, redactSecret } from './src/config/bridge.config';

import type { BridgeAdapter } from './src/types';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export const BridgePlugin: Plugin = async ctx => {
  const { client, directory } = ctx;
  const sourceMode = process.env.BRIDGE_EVENT_SOURCE_MODE || 'hook-only';
  if (sourceMode !== 'hook-only') {
    bridgeLogger.warn(
      `[Plugin] BRIDGE_EVENT_SOURCE_MODE=${sourceMode} is reserved; fallback=hook-only`,
    );
  }
  bridgeLogger.info(
    `[Plugin] bridge entry initializing logFile=${getBridgeLogFilePath()} pid=${process.pid} instance=${runtimeInstanceId}`,
  );
  const mux: AdapterMux = globalState.__bridge_mux || new AdapterMux();
  globalState.__bridge_mux = mux;

  const bootstrap = async () => {
    try {
      const bridgeConfig = loadBridgeConfig(directory);
      const adapterInstances: Map<string, BridgeAdapter> =
        globalState.__bridge_adapter_instances || new Map<string, BridgeAdapter>();
      const startedAdapters: Set<string> =
        globalState.__bridge_started_adapters || new Set<string>();
      const startingAdapters: Set<string> =
        globalState.__bridge_starting_adapters || new Set<string>();
      globalState.__bridge_adapter_instances = adapterInstances;
      globalState.__bridge_started_adapters = startedAdapters;
      globalState.__bridge_starting_adapters = startingAdapters;

      const adaptersToStart: Array<{ key: string; create: () => Promise<BridgeAdapter> }> = [];
      if (bridgeConfig.enabled && bridgeConfig.testapp) {
        const { TestAppAdapter } = await import('./src/testApp/testApp.adapter.js');
        const testAppCfg = bridgeConfig.testapp;
        if (bridgeConfig.runtime.file_store_dir) {
          setBridgeFileStoreDir(bridgeConfig.runtime.file_store_dir);
        }
        if (testAppCfg.file_store_dir) {
          setBridgeFileStoreDir(testAppCfg.file_store_dir);
        }
        bridgeLogger.info(
          `[Plugin] loaded bridge config platform=testapp enabled=${bridgeConfig.enabled} server_url=${testAppCfg.server_url} sources=${bridgeConfig.sources.join('|')} ak=${redactSecret(testAppCfg.ak)} sk=${redactSecret(testAppCfg.sk)}`,
        );
        adaptersToStart.push({
          key: 'testapp',
          create: async () => new TestAppAdapter(testAppCfg),
        });
      }

      if (adaptersToStart.length === 0) {
        bridgeLogger.info('[Plugin] no bridge enabled');
        return;
      }

      const startTimeoutMsRaw = Number(process.env.BRIDGE_ADAPTER_START_TIMEOUT_MS);
      const startTimeoutMs =
        Number.isFinite(startTimeoutMsRaw) && startTimeoutMsRaw > 0 ? startTimeoutMsRaw : 45000;
      for (const { key, create } of adaptersToStart) {
        const adapter = adapterInstances.get(key) || await create();
        adapterInstances.set(key, adapter);
        mux.register(key, adapter);
        if (startedAdapters.has(key)) {
          bridgeLogger.info(`[Plugin] adapter already started, skip start adapter=${key}`);
          continue;
        }
        if (startingAdapters.has(key)) {
          bridgeLogger.info(`[Plugin] adapter is starting, skip duplicate start adapter=${key}`);
          continue;
        }
        startingAdapters.add(key);
        const incoming = createIncomingHandler(client, mux, key);
        try {
          await withTimeout(
            adapter.start(incoming),
            startTimeoutMs,
            `[Plugin] start adapter=${key}`,
          );
          startedAdapters.add(key);
          bridgeLogger.info(`[Plugin] started adapter=${key}`);
        } finally {
          startingAdapters.delete(key);
        }
      }

      // Hook-first mode: do not start SSE listeners as main processing path.
      bridgeLogger.info('[Plugin] event source mode=hook-only (SSE listener not started)');

      bridgeLogger.info('[Plugin] BridgePlugin ready');
    } catch (e) {
      if (e instanceof ConfigValidationError) {
        bridgeLogger.error('[Plugin] bridge config validation failed', {
          sourcePath: e.sourcePath,
          issues: e.issues,
        });
      }
      bridgeLogger.error('[Plugin] bootstrap error', e);
    }
  };

  bootstrap();
  return {
    event: async ({ event }) => {
      await handleHookEvent(client, mux, event).catch(err => {
        bridgeLogger.error('[Plugin] hook event dispatch failed', err);
      });
    },
  };
};
