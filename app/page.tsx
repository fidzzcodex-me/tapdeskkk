"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AOS from "aos";
import { Terminal, ArrowRight, Moon, Sun } from "lucide-react";

function useGreeting() {
  const [greeting, setGreeting] = useState("Halo");
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 4 && h < 11) setGreeting("Pagi");
    else if (h >= 11 && h < 15) setGreeting("Siang");
    else if (h >= 15 && h < 18) setGreeting("Sore");
    else setGreeting("Malam");
  }, []);
  return greeting;
}

function ParticleField() {
  const particles = [
    { top: "8%", left: "82%", size: 140, delay: "0s" },
    { top: "62%", left: "6%", size: 90, delay: "1.2s" },
    { top: "30%", left: "18%", size: 50, delay: "2.1s" },
    { top: "78%", left: "70%", size: 110, delay: "0.6s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="tapdesk-particle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `tapdesk-drift ${6 + i}s ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const greeting = useGreeting();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 500, once: true, easing: "ease-out" });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticleField />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
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

      <section className="relative z-10 px-6 pb-16 pt-10 md:px-12 md:pb-24 md:pt-16">
        <p data-aos="fade-up" className="mono text-sm text-signal">
          Selamat {greeting.toLowerCase()}.
        </p>
        <h1
          data-aos="fade-up"
          data-aos-delay="80"
          className="mt-4 max-w-3xl text-4xl font-bold md:text-6xl"
        >
          DevTools kecil, nempel di halaman yang lagi kamu tes.
        </h1>
        <p data-aos="fade-up" data-aos-delay="160" className="mt-6 max-w-xl text-base text-ink/70 dark:text-paper/70">
          Satu baris script. Panel network dan console langsung muncul di
          pojok halaman kamu — bukan di tab DevTools terpisah, bukan proxy,
          bukan ekstensi yang harus di-install orang lain.
        </p>
        <div data-aos="fade-up" data-aos-delay="240" className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/gate"
            className="group inline-flex items-center gap-2 rounded bg-signal px-5 py-3 font-medium text-white transition hover:bg-signal-dim"
          >
            Aktifkan Tap
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
          <Link href="/demo" className="text-sm font-medium text-ink/70 underline decoration-line underline-offset-4 hover:text-signal dark:text-paper/70">
            Lihat demo panel dulu
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-t border-line px-6 py-16 dark:border-line-dark md:px-12">
        <h2 data-aos="fade-up" className="font-display text-sm uppercase tracking-widest text-ink/50 dark:text-paper/50">
          Cara pakai
        </h2>

        <div className="mt-8 max-w-2xl divide-y divide-line dark:divide-line-dark">
          {[
            {
              n: "01",
              title: "Aktifkan Tap",
              desc: "Masuk lewat kode 4 digit, dapat sessionId sendiri. Tidak ada akun, tidak ada email.",
            },
            {
              n: "02",
              title: "Salin snippet",
              desc: "Satu tag <script> atau bookmarklet. Dashboard sudah menyiapkan keduanya, tinggal klik salin.",
            },
            {
              n: "03",
              title: "Tempel di web yang diuji",
              desc: "Taruh sebelum </body>. Tombol bulat biru muncul di pojok halaman itu — panelnya sudah hidup.",
            },
          ].map((step, i) => (
            <div key={step.n} data-aos="fade-up" data-aos-delay={i * 80} className="flex gap-6 py-6">
              <span className="mono text-2xl text-ink/25 dark:text-paper/25">{step.n}</span>
              <div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-ink/65 dark:text-paper/65">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-line px-6 py-8 text-xs text-ink/50 dark:border-line-dark dark:text-paper/50 md:px-12">
        Hanya menangkap fetch/XHR di halaman tempat script dipasang. Tidak melihat semua network HP/laptop.
      </footer>
    </main>
  );
}
