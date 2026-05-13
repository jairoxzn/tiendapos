export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "TiendaPOS";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const EMPRESA = {
  nombre: process.env.NEXT_PUBLIC_EMPRESA_NOMBRE ?? "Mi Tienda",
  ruc: process.env.NEXT_PUBLIC_EMPRESA_RUC ?? "",
  direccion: process.env.NEXT_PUBLIC_EMPRESA_DIRECCION ?? "",
  telefono: process.env.NEXT_PUBLIC_EMPRESA_TELEFONO ?? "",
} as const;

export const IGV_PERCENT = Number(process.env.NEXT_PUBLIC_IGV_PERCENT ?? 18);

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "CARD", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
] as const;

export const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "CASHIER", label: "Cajero" },
] as const;
