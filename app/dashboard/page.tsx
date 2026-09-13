"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Radio, Moon, Sun, Terminal } from "lucide-react";
import type { TapEvent } from "@/lib/store";

type SessionData = { sessionId: string; snippet: string; bookmarklet: string };

export default function DashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [copied, setCopied] = useState<"snippet" | "bookmarklet" | null>(null);
  const [sync, setSyncState] = useState(true);
  const [events, setEvents] = useState<TapEvent[]>([]);
  const [dark, setDark] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    fetch("/api/session", { method: "POST" })
      .then((r) => r.json())
      .then(setSession);
  }, []);

  useEffect(() => {
    if (!session) return;
    poll.current = setInterval(async () => {
      const r = await fetch(`/api/tap/${session.sessionId}`);
      if (!r.ok) return;
      const data = await r.json();
      setEvents(data.events ?? []);
      setSyncState(data.syncEnabled);
    }, 2000);
    return () => { if (poll.current) clearInterval(poll.current); };
  }, [session]);

  function copy(text: string, which: "snippet" | "bookmarklet") {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  async function toggleSync() {
    if (!session) return;
    const next = !sync;
    setSyncState(next);
    await fetch(`/api/tap/${session.sessionId}`, { method: next ? "PUT" : "DELETE" });
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-medium">
          <Terminal size={20} className="text-signal" strokeWidth={2.5} />
          tapdesk
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Ganti mode gelap"
          className="flex h-9 w-9 items-center justify-center rounded border border-line text-ink/70 hover:text-signal dark:border-line-dark dark:text-paper/70"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {!session ? (
        <p className="mt-10 text-sm text-ink/60 dark:text-paper/60">Menyiapkan sesi…</p>
      ) : (
        <div className="mt-10 grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <section>
            <p className="mono text-xs text-ink/50 dark:text-paper/50">SESSION ID</p>
            <p className="mono mt-1 text-2xl font-medium text-signal">{session.sessionId}</p>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Snippet</p>
                <button
                  onClick={() => copy(session.snippet, "snippet")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:text-signal dark:text-paper/60"
                >
                  {copied === "snippet" ? <Check size={13} /> : <Copy size={13} />}
                  {copied === "snippet" ? "Tersalin" : "Salin"}
                </button>
              </div>
              <pre className="mono mt-2 overflow-x-auto rounded border border-line bg-ink/[0.03] p-4 text-xs dark:border-line-dark dark:bg-paper/5">
{session.snippet}
              </pre>
              <p className="mt-2 text-xs text-ink/50 dark:text-paper/50">Tempel sebelum tag &lt;/body&gt; di halaman yang mau kamu uji.</p>
            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold">Bookmarklet</p>
              <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">Seret ke bookmark bar, klik saat sedang membuka halaman yang diuji.</p>
              <a
                href={session.bookmarklet}
                onClick={(e) => e.preventDefault()}
                draggable
                className="mono mt-3 inline-block cursor-grab rounded border border-dashed border-signal px-4 py-2 text-sm text-signal active:cursor-grabbing"
              >
                tapdesk
              </a>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Kirim salinan ke dashboard</p>
              <button
                onClick={toggleSync}
                className={`flex h-6 w-11 items-center rounded-full px-0.5 transition ${sync ? "bg-signal justify-end" : "bg-ink/15 justify-start dark:bg-paper/15"}`}
              >
                <span className="h-5 w-5 rounded-full bg-white" />
              </button>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50 dark:text-paper/50">
              <Radio size={12} className={sync ? "text-signal" : ""} />
              Status: {sync ? "hidup" : "mati"}
            </p>

            <div className="mt-6 divide-y divide-line rounded border border-line dark:divide-line-dark dark:border-line-dark">
              {events.length === 0 ? (
                <p className="p-4 text-xs text-ink/50 dark:text-paper/50">
                  Belum ada event. Buka halaman yang sudah dipasangi snippet.
                </p>
              ) : (
                events.slice(-12).reverse().map((ev) => (
                  <div key={ev.id} className="mono flex items-center justify-between gap-3 p-3 text-xs">
                    <span className="truncate text-ink/70 dark:text-paper/70">
                      {ev.type === "console" ? `console.${ev.level}` : `${ev.method} ${ev.url}`}
                    </span>
                    {ev.status && <span className="shrink-0 text-signal">{ev.status}</span>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink/50 dark:border-line-dark dark:text-paper/50">
        Hanya menangkap fetch/XHR di halaman tempat script dipasang. Tidak melihat semua network HP/laptop.
      </footer>
    </main>
  );
}
