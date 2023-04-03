/**
 * @type {import('next').NextConfig}
 **/

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  output: "export",
};

module.exports = nextConfig;
