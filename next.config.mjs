/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // tapdesk.js harus bisa di-fetch cross-origin dari website yang diuji
        source: "/tapdesk.js",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
