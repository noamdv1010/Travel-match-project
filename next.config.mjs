/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'alxwvefifeknxktbztex.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Ensure Hebrew/RTL content is handled correctly
  i18n: undefined,
}

export default nextConfig
