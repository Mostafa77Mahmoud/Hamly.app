import { traceEvent } from './deepTracer';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SessionSnapshot {
  timestamp: string;
  hasSession: boolean;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  provider?: string;
}

class SessionDebugger {
  private snapshots: SessionSnapshot[] = [];
  private readonly STORAGE_KEY = '@session_debug_snapshots';
  private readonly MAX_SNAPSHOTS = 50;

  async captureSnapshot(label: string, session: any) {
    const snapshot: SessionSnapshot = {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      userId: session?.user?.id,
      accessToken: session?.access_token ? `${session.access_token.substring(0, 10)}...` : undefined,
      refreshToken: session?.refresh_token ? `${session.refresh_token.substring(0, 10)}...` : undefined,
      expiresAt: session?.expires_at,
      provider: session?.user?.app_metadata?.provider,
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }

    traceEvent('SESSION_DEBUG', label, snapshot);

    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.snapshots));
    } catch (error) {
      console.error('Failed to save session snapshot:', error);
    }
  }

  async loadSnapshots() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.snapshots = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load session snapshots:', error);
    }
  }

  getSnapshots(): SessionSnapshot[] {
    return [...this.snapshots];
  }

  printSnapshots() {
    console.log('\n========== SESSION SNAPSHOTS ==========');
    this.snapshots.forEach((snapshot, idx) => {
      const time = new Date(snapshot.timestamp).toLocaleTimeString();
      console.log(`${idx + 1}. [${time}] Session: ${snapshot.hasSession ? 'YES' : 'NO'}`);
      if (snapshot.userId) {
        console.log(`   User ID: ${snapshot.userId}`);
      }
      if (snapshot.expiresAt) {
        const expiresDate = new Date(snapshot.expiresAt * 1000);
        console.log(`   Expires: ${expiresDate.toLocaleString()}`);
      }
    });
    console.log('=======================================\n');
  }

  async clearSnapshots() {
    this.snapshots = [];
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session snapshots:', error);
    }
  }
}

const sessionDebuggerInstance = new SessionDebugger();

export const captureSessionSnapshot = (label: string, session: any) => 
  sessionDebuggerInstance.captureSnapshot(label, session);

export const getSessionSnapshots = () => sessionDebuggerInstance.getSnapshots();
export const printSessionSnapshots = () => sessionDebuggerInstance.printSnapshots();
export const clearSessionSnapshots = () => sessionDebuggerInstance.clearSnapshots();
export const loadSessionSnapshots = () => sessionDebuggerInstance.loadSnapshots();

if (typeof window !== 'undefined') {
  (window as any).printSessionSnapshots = printSessionSnapshots;
  (window as any).getSessionSnapshots = getSessionSnapshots;
}
