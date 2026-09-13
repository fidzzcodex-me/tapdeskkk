// Store in-memory sederhana. Cukup untuk dev & demo satu instance.
// Kalau dideploy serius (multi-instance, serverless dingin), ganti dengan
// Redis/KV — state ini hilang tiap restart proses.

export type TapEvent = {
  id: string;
  type: "fetch" | "xhr" | "console";
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  level?: "log" | "warn" | "error" | "info";
  args?: string[];
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  ts: number;
};

export type Session = {
  id: string;
  createdAt: number;
  syncEnabled: boolean;
  events: TapEvent[];
};

const sessions = new Map<string, Session>();

export function createSession(): Session {
  const id = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const session: Session = { id, createdAt: Date.now(), syncEnabled: true, events: [] };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function pushEvent(id: string, event: TapEvent): Session | undefined {
  const session = sessions.get(id);
  if (!session || !session.syncEnabled) return undefined;
  session.events.push(event);
  // Batasi memori: simpan 300 event terakhir saja per sesi.
  if (session.events.length > 300) session.events.shift();
  return session;
}

export function disableSync(id: string): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.syncEnabled = false;
  return session;
}

export function setSync(id: string, on: boolean): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.syncEnabled = on;
  return session;
}
