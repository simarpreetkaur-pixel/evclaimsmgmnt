/** @type {import('next').NextConfig} */

// GITHUB_PAGES=true (set by .github/workflows/deploy-pages.yml) builds the
// prototype as a static site served from https://<user>.github.io/<repo>/.
// Every other build (local dev, Docker, UAT/prod) is unchanged.
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

const nextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.acko.com',
      },
      {
        protocol: 'https',
        hostname: '**.ackodev.com',
      },
    ],
  },
};

if (isGithubPages) {
  nextConfig.output = 'export';
  nextConfig.trailingSlash = true;
  nextConfig.images.unoptimized = true;
  if (basePath) {
    nextConfig.basePath = basePath;
  }
}

module.exports = nextConfig;
