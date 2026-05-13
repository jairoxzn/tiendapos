/** @type {import('next').NextConfig} */

/**
 * Headers de seguridad aplicados a TODAS las respuestas.
 * Documentación: https://owasp.org/www-project-secure-headers/
 */
const securityHeaders = [
  // Anti-clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Bloquea MIME-sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Solo enviamos Referer same-origin, omitimos para cross-origin downgrade
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Cero permisos para APIs sensibles del navegador (cámara, micrófono, etc.)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Fuerza HTTPS por 2 años (incluye subdominios). Solo activo en prod.
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Imágenes vienen de URLs externas pegadas por el admin. Permitimos cualquier host HTTPS.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
