# tapdesk

DevTools kecil yang di-inject ke halaman yang sedang kamu uji. Mirip Eruda:
tombol bulat, panel network + console + info + setting, jalan di latar
halaman. Bukan proxy device, bukan crack, bukan aktivator lisensi — cuma
alat bantu debug punya sendiri.

## Isi proyek

```
app/
  page.tsx            landing site tapdesk
  gate/page.tsx        gate 4 digit sebelum dashboard
  dashboard/page.tsx   sessionId, snippet, bookmarklet, toggle sync, preview event
  demo/page.tsx        halaman contoh "website orang lain" yang sudah dipasangi tapdesk
  api/session/route.ts     bikin sesi baru
  api/tap/[id]/route.ts    terima/ambil/matikan-nyalakan event tap
lib/store.ts           penyimpanan in-memory (dev/demo)
public/tapdesk.js       skrip yang di-inject ke halaman target (inti tapdesk)
```

## Jalan di lokal

```bash
npm install
cp .env.example .env.local   # opsional, ganti kode gate 4 digit
npm run dev
```

Buka `http://localhost:3000`.

1. `/` — landing, klik "Aktifkan Tap"
2. `/gate` — masukkan kode 4 digit (default `2410`, ganti di `.env.local`)
3. `/dashboard` — sessionId otomatis dibuat, snippet & bookmarklet siap disalin
4. `/demo` — halaman contoh, panel tapdesk sudah aktif di pojok kanan bawah

## Cara pasang di halaman yang mau diuji

Tempel sebelum `</body>`:

```html
<script src="http://localhost:3000/tapdesk.js" data-session="SESSION_ID" data-sync="true"></script>
```

Atau seret bookmarklet dari dashboard ke bookmark bar, klik saat halaman
target sedang terbuka.

`data-sync="true"` mengirim salinan tiap event ke `/api/tap/:id` supaya
kelihatan juga di dashboard. Kalau `false` (atau dihapus), panel tetap
jalan penuh di halaman itu, tapi tidak ada yang dikirim ke server.

## Yang ditangkap panel

- **Network** — semua `fetch` dan `XMLHttpRequest` yang dipanggil dari
  halaman itu: method, url, status, durasi. Klik satu baris untuk lihat
  request body dan response body.
- **Console** — `console.log/warn/error/info` ditangkap dan tetap tampil
  normal di DevTools browser (tidak di-override, cuma disalin).
- **Info** — URL halaman, user agent, ukuran viewport, waktu, session id.
- **Setting** — dark mode panel, reset posisi tombol, clear log, destroy
  (mengembalikan `fetch`/`XHR`/`console` ke aslinya dan melepas panel dari
  halaman).

## Batas

Hanya menangkap fetch/XHR di halaman tempat script dipasang. Tidak melihat
semua network HP/laptop.

## Catatan produksi

`lib/store.ts` pakai `Map` in-memory — cukup untuk dev dan demo satu
instance, tapi hilang tiap restart proses dan tidak sinkron lintas
instance. Kalau mau dipakai serius (banyak sesi, deploy serverless),
ganti dengan penyimpanan eksternal (Redis, KV, atau database kecil).
