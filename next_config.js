/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_DATA_URL: process.env.NEXT_PUBLIC_DATA_URL,
  },
}

module.exports = nextConfig