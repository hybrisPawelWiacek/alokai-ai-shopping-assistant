/** @type {import('next').NextConfig["images"]} */
const config = {
  deviceSizes: [640, 768],
  imageSizes: [64, 96, 128, 160, 256, 384],
  loader: 'custom',
  loaderFile: './config/image-loaders/cloudinary/cloudinary.ts',
  remotePatterns: [
    {
      hostname: 'res.cloudinary.com',
      protocol: 'https',
    },
    {
      hostname: 'images.ctfassets.net',
      protocol: 'https',
    },
    {
      hostname: 's3-eu-west-1.amazonaws.com',
      protocol: 'https',
    },
  ],
};

export default config;
