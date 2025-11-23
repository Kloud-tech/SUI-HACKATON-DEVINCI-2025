const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    localPatterns: [
      {
        pathname: '/api/rarity-art',
        search: 'rarity=*',
      },
    ],
  },
};

export default nextConfig;
