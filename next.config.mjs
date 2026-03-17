/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfigurasi untuk production
  output: 'standalone',
  // Aktifkan akses dari network
  experimental: {
    networkTimeout: 10000, // 10 detik timeout
  },
  // Konfigurasi server
  server: {
    port: 3000,
    host: '0.0.0.0', // Mengizinkan akses dari network
  },
}