import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceder",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <span className="font-bold">T</span>
          </div>
          TiendaPOS
        </div>
        <div className="relative space-y-4">
          <p className="max-w-md text-2xl font-medium leading-snug">
            “Vende rápido, controla tu stock y entiende tu negocio — todo en un solo lugar.”
          </p>
          <p className="text-sm text-white/70">
            Sistema POS moderno para tiendas de ropa en Perú.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
