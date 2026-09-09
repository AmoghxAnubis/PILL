type PerfCounter =
  | 'telemetryEvents'
  | 'mediaEvents'
  | 'timerEvents'
  | 'featureEvents'
  | 'reactRenders'
  | 'nativeResizeCalls';

interface PerfSnapshot {
  uptimeSeconds: number;
  telemetryEvents: number;
  mediaEvents: number;
  timerEvents: number;
  featureEvents: number;
  reactRenders: number;
  nativeResizeCalls: number;
}

const startedAt = Date.now();

const counters: Record<PerfCounter, number> = {
  telemetryEvents: 0,
  mediaEvents: 0,
  timerEvents: 0,
  featureEvents: 0,
  reactRenders: 0,
  nativeResizeCalls: 0,
};

let diagnosticsStarted = false;
let diagnosticsTimer: ReturnType<typeof setInterval> | null =
  null;

function isDiagnosticsEnabled(): boolean {
  return (
    import.meta.env.DEV &&
    import.meta.env.MODE !== 'test'
  );
}

function increment(counter: PerfCounter): void {
  counters[counter] += 1;
}

export function recordTelemetryEvent(): void {
  increment('telemetryEvents');
}

export function recordMediaEvent(): void {
  increment('mediaEvents');
}

export function recordTimerEvent(): void {
  increment('timerEvents');
}

export function recordFeatureEvent(): void {
  increment('featureEvents');
}

export function recordReactRender(): void {
  increment('reactRenders');
}

export function recordNativeResize(): void {
  increment('nativeResizeCalls');
}

export function getPerfSnapshot(): PerfSnapshot {
  return {
    uptimeSeconds:
      Math.floor(
        (Date.now() - startedAt) / 1000,
      ),
    telemetryEvents:
      counters.telemetryEvents,
    mediaEvents:
      counters.mediaEvents,
    timerEvents:
      counters.timerEvents,
    featureEvents:
      counters.featureEvents,
    reactRenders:
      counters.reactRenders,
    nativeResizeCalls:
      counters.nativeResizeCalls,
  };
}

export function logPerfSnapshot(): void {
  if (!isDiagnosticsEnabled()) {
    return;
  }

  const snapshot =
    getPerfSnapshot();

  console.groupCollapsed(
    '[PILL Perf]',
  );

  console.log(
    `uptime: ${snapshot.uptimeSeconds}s`,
  );

  console.table({
    'Telemetry events':
      snapshot.telemetryEvents,
    'Media events':
      snapshot.mediaEvents,
    'Timer events':
      snapshot.timerEvents,
    'Feature events':
      snapshot.featureEvents,
    'React renders':
      snapshot.reactRenders,
    'Native resize calls':
      snapshot.nativeResizeCalls,
  });

  console.groupEnd();
}

export function startPerfDiagnostics(): () => void {
  if (
    !isDiagnosticsEnabled() ||
    diagnosticsStarted
  ) {
    return () => {};
  }

  diagnosticsStarted = true;

  console.info(
    '[PILL Perf] Diagnostics started',
  );

  diagnosticsTimer =
    setInterval(
      logPerfSnapshot,
      60_000,
    );

  return () => {
    if (diagnosticsTimer) {
      clearInterval(
        diagnosticsTimer,
      );

      diagnosticsTimer = null;
    }

    diagnosticsStarted = false;
  };
}