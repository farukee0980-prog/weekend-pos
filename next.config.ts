import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'bluetooth=*, camera=*, microphone=*, geolocation=*, payment=*'
          }
        ]
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ];
  },

  // Service Worker support
  async rewrites() {
    return [
      {
        source: '/service-worker.js',
        destination: '/sw.js'
      }
    ];
  },

  // Performance optimizations
  compress: true,
  
  // Environment variables for PWA
  env: {
    PWA_ENABLED: 'true',
    BLUETOOTH_ENABLED: 'true'
  }
};

export default nextConfig;
