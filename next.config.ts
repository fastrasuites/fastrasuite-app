import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/invoicing/purchase-orders/:id*",
        destination: "/invoice/purchase-order/:id*",
        permanent: false,
      },
      {
        source: "/invoicing/purchase-order/:id*",
        destination: "/invoice/purchase-order/:id*",
        permanent: false,
      },
      {
        source: "/project-requests/:id*",
        destination: "/project-request/:id*",
        permanent: false,
      },
      {
        source: "/project_request/:id*",
        destination: "/project-request/:id*",
        permanent: false,
      },
      {
        source: "/inventory/incoming-products/:id*",
        destination: "/inventory/operation/incoming_product/:id*",
        permanent: false,
      },
      {
        source: "/inventory/scraps/:id*",
        destination: "/inventory/operation/scrap/:id*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
