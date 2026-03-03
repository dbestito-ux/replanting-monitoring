import withPWA from 'next-pwa'

const nextConfig = {
  reactStrictMode: true,
}

export default withPWA({
  ...nextConfig,
  dest: 'public',
  register: true,
  skipWaiting: true,
})