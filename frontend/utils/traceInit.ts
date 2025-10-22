import { traceEvent, printTimeline } from './deepTracer';
import { loadSessionSnapshots, printSessionSnapshots } from './sessionDebugger';
import { loadLogCollector, printLogReport } from './logCollector';
import { AppState } from 'react-native';

let initialized = false;
let appStateSubscription: any = null;

export async function initializeTracing() {
  if (initialized) {
    console.log('Tracing already initialized');
    return;
  }

  console.log('🔍 Initializing Deep Tracing System...');
  
  traceEvent('TRACE_INIT', 'system_start', { 
    timestamp: new Date().toISOString(),
    platform: typeof window !== 'undefined' ? 'web' : 'native'
  });

  await loadSessionSnapshots();
  await loadLogCollector();

  if (typeof window !== 'undefined') {
    console.log('📊 Tracing utilities available in console:');
    console.log('  - printTimeline() - Show full event timeline');
    console.log('  - printSessionSnapshots() - Show session history');
    console.log('  - printLogReport() - Show complete diagnostic report');
    console.log('  - saveLogReport() - Save report to storage');
    console.log('  - getTimeline() - Get timeline data');
    console.log('  - exportTimeline() - Export timeline as JSON');
  }

  if (AppState.currentState) {
    traceEvent('TRACE_INIT', 'initial_app_state', { 
      state: AppState.currentState 
    });
  }

  initialized = true;
  console.log('✅ Deep Tracing System initialized');
}

export function cleanupTracing() {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  
  traceEvent('TRACE_INIT', 'system_cleanup', {
    timestamp: new Date().toISOString()
  });
  
  initialized = false;
}

if (typeof window !== 'undefined') {
  (window as any).initializeTracing = initializeTracing;
  (window as any).cleanupTracing = cleanupTracing;
}
