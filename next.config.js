/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // next/image 400s on any width not in this list. The sizes actually used
    // across Avatar/OutfitCard (32/40/56/72) aren't all in Next's own
    // defaults, so they're listed explicitly here rather than picking sizes
    // to match an implicit, easy-to-drift-from allowlist.
    imageSizes: [32, 40, 56, 72, 128],
  },
};

module.exports = nextConfig;
