export type HookHealthSnapshot = {
  sourceMode: string;
  ingestedTotal: number;
  lastEventAt?: number;
  lastEventType?: string;
};

export type HookHealthTracker = {
  recordEvent: (eventType: string, sessionId?: string) => void;
  snapshot: () => HookHealthSnapshot;
};

export function createHookHealthTracker(sourceMode: string): HookHealthTracker {
  let ingestedTotal = 0;
  let lastEventAt = 0;
  let lastEventType = '';

  const recordEvent = (eventType: string, _sessionId?: string) => {
    ingestedTotal++;
    lastEventAt = Date.now();
    lastEventType = eventType;
  };

  const snapshot = (): HookHealthSnapshot => ({
    sourceMode,
    ingestedTotal,
    ...(lastEventAt > 0 ? { lastEventAt } : {}),
    ...(lastEventType ? { lastEventType } : {}),
  });

  return {
    recordEvent,
    snapshot,
  };
}
