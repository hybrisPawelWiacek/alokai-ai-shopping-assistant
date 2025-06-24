/** @type {import('next').NextConfig["images"]} */
const config = {
  remotePatterns: [
    {
      hostname: '*',
      protocol: 'https',
    },
  ],
};

export default config;
