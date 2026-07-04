/** @type {import('next').NextConfig} */
const nextConfig = {
  // MVPは完全ステートレスな静的サイトとして配信する（要件定義書§4.1）
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
