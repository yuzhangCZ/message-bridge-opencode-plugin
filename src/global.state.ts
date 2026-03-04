import type { AdapterMux } from './handler/mux';
import type { BridgeAdapter } from './types';

export type BridgeSendErrorFn = (chatId: string, content: string) => Promise<void>;
export type BridgeHookHealthSnapshot = {
  sourceMode: string;
  ingestedTotal: number;
  lastEventAt?: number;
  lastEventType?: string;
};

type BridgeRuntimeState = {
  __bridge_mux?: AdapterMux;
  __bridge_adapter_instances?: Map<string, BridgeAdapter>;
  __bridge_started_adapters?: Set<string>;
  __bridge_starting_adapters?: Set<string>;
  __bridge_listener_started?: boolean;
  __bridge_send_error_message?: BridgeSendErrorFn;
  __bridge_progress_msg_ids?: Map<string, string>;
  __bridge_max_file_size?: Map<string, number>;
  __bridge_max_file_retry?: Map<string, number>;
  __bridge_hook_health_snapshot?: () => BridgeHookHealthSnapshot;
};

export type BridgeGlobalState = typeof globalThis & BridgeRuntimeState;
