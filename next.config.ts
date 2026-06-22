import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@supabase/supabase-js",
    "leaflet",
    "@tensorflow/tfjs",
    "@tensorflow-models/mobilenet",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;
