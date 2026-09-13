import Script from "next/script";

// Halaman ini SENGAJA polos — ini berperan sebagai "website orang lain"
// yang sedang diuji. Tidak boleh pakai palet/partikel/tipografi tapdesk,
// supaya kelihatan jelas panel itu nempel di halaman APAPUN, bukan cuma
// di situs tapdesk sendiri.
export default function DemoPage() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        margin: 0,
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111",
      }}
    >
      <header style={{ padding: "24px 32px", borderBottom: "1px solid #e5e5e5" }}>
          <strong>Toko Sederhana</strong>
        </header>

        <main style={{ padding: "48px 32px", maxWidth: 640 }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Contoh halaman yang sedang diuji</h1>
          <p style={{ lineHeight: 1.6, color: "#444" }}>
            Ini bukan halaman tapdesk. Ini contoh website biasa — anggap saja
            punya klienmu. Snippet tapdesk sudah dipasang sebelum{" "}
            <code>&lt;/body&gt;</code>. Lihat pojok kanan bawah: ada tombol
            bulat biru. Klik untuk membuka panel network, console, info, dan
            setting.
          </p>
          <button
            id="demo-fetch-btn"
            style={{
              marginTop: 24,
              padding: "10px 18px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Kirim request contoh
          </button>
          <p style={{ marginTop: 8, fontSize: 13, color: "#888" }}>
            Klik tombol di atas beberapa kali, lalu buka tab Network di panel tapdesk.
          </p>
        </main>

        <Script id="demo-fetch-script" strategy="afterInteractive">
          {`
            document.getElementById('demo-fetch-btn')?.addEventListener('click', function () {
              console.log('Mengirim request contoh...');
              fetch('https://jsonplaceholder.typicode.com/todos/1')
                .then((r) => r.json())
                .then((data) => console.log('Selesai:', data))
                .catch((err) => console.error('Gagal:', err));
            });
          `}
        </Script>

        {/* Snippet tapdesk — di produksi ini yang kamu salin dari dashboard */}
        <Script src="/tapdesk.js" data-session="demo" data-sync="false" strategy="afterInteractive" />
      </div>
  );
}
