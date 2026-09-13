"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Loader2 } from "lucide-react";

const GATE_CODE = process.env.NEXT_PUBLIC_GATE_CODE || "2410";

export default function GatePage() {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "wrong">("idle");
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function updateDigit(i: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...digits];
    next[i] = value;
    setDigits(next);
    if (value && i < 3) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) submit(next.join(""));
  }

  function submit(code: string) {
    setStatus("checking");
    setTimeout(() => {
      if (code === GATE_CODE) {
        router.push("/dashboard");
      } else {
        setStatus("wrong");
        setDigits(["", "", "", ""]);
        refs.current[0]?.focus();
        setTimeout(() => setStatus("idle"), 1600);
      }
    }, 2200);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <button
        onClick={() => setDark((d) => !d)}
        aria-label="Ganti mode gelap"
        className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded border border-line text-ink/70 hover:text-signal dark:border-line-dark dark:text-paper/70"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-xs text-center">
        <h1 className="font-display text-2xl font-bold">Masuk dulu</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
          Kode 4 digit yang kamu tentukan sendiri.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              disabled={status === "checking"}
              onChange={(e) => updateDigit(i, e.target.value)}
              inputMode="numeric"
              maxLength={1}
              className={`h-14 w-12 rounded border text-center text-xl font-semibold outline-none transition
                ${status === "wrong" ? "border-red-400" : "border-line dark:border-line-dark"}
                bg-transparent focus:border-signal`}
            />
          ))}
        </div>

        <div className="mt-6 h-5 text-sm">
          {status === "checking" && (
            <span className="inline-flex items-center gap-2 text-ink/60 dark:text-paper/60">
              <Loader2 size={14} className="animate-spin" /> Memeriksa…
            </span>
          )}
          {status === "wrong" && <span className="text-red-500">Kode salah, coba lagi.</span>}
        </div>
      </div>
    </main>
  );
}
