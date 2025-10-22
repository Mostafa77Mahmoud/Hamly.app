interface TracePayload {
  [key: string]: any;
}

interface TimelineEvent {
  timestamp: string;
  scope: string;
  label: string;
  payload?: any;
}

class DeepTracer {
  private timeline: TimelineEvent[] = [];
  private maxEvents = 200;

  traceEvent(scope: string, label: string, payload?: TracePayload) {
    const ts = new Date().toISOString();
    const event: TimelineEvent = {
      timestamp: ts,
      scope,
      label,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
    };

    this.timeline.push(event);

    if (this.timeline.length > this.maxEvents) {
      this.timeline.shift();
    }

    const payloadStr = payload ? JSON.stringify(payload, null, 2) : '';
    console.log(`[TRACE:${scope}] [${label}] @ ${ts}`, payloadStr);
  }

  getTimeline(): TimelineEvent[] {
    return [...this.timeline];
  }

  printTimeline() {
    console.log('\n========== TIMELINE ==========');
    this.timeline.forEach((event, idx) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      console.log(`${idx + 1}. [${time}] ${event.scope} -> ${event.label}`);
      if (event.payload) {
        console.log(`   Payload:`, JSON.stringify(event.payload, null, 2));
      }
    });
    console.log('==============================\n');
  }

  clearTimeline() {
    this.timeline = [];
  }

  exportTimeline(): string {
    return JSON.stringify(this.timeline, null, 2);
  }
}

const tracer = new DeepTracer();

export const traceEvent = (scope: string, label: string, payload?: TracePayload) => {
  tracer.traceEvent(scope, label, payload);
};

export const getTimeline = () => tracer.getTimeline();
export const printTimeline = () => tracer.printTimeline();
export const clearTimeline = () => tracer.clearTimeline();
export const exportTimeline = () => tracer.exportTimeline();

// Only expose to window in web environment
if (typeof window !== 'undefined' && typeof (window as any).document !== 'undefined') {
  try {
    (window as any).printTimeline = printTimeline;
    (window as any).exportTimeline = exportTimeline;
    (window as any).getTimeline = getTimeline;
  } catch (e) {
    console.warn('Could not attach timeline functions to window:', e);
  }
}
