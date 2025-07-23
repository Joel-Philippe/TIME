// next.config.js
require('dotenv').config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
    eslint : {
    ignoreDuringBuilds : false,
  },


  // Désactive l'optimisation automatique des images (nécessaire pour export statique)
  images: {
    unoptimized: true,
  },
};


module.exports = nextConfig;
