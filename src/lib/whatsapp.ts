import { EMPRESA, APP_URL } from "@/lib/constants";

/**
 * Normaliza un teléfono a formato `wa.me` (solo dígitos, sin +, espacios o guiones).
 * Si el número no tiene código de país, asume Perú (51) por defecto.
 */
export function normalizeWhatsappPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) {
    // Celular peruano sin código país (ej: 999999999) → prefija 51
    return `51${digits}`;
  }
  return digits;
}

/**
 * Construye un link wa.me con mensaje pre-rellenado para consultar un producto.
 * Si el teléfono de la empresa no está configurado, devuelve null.
 */
export function buildWhatsappProductLink(product: {
  name: string;
  sku: string;
  salePrice: number;
}): string | null {
  const phone = normalizeWhatsappPhone(EMPRESA.telefono);
  if (!phone) return null;

  const price = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(product.salePrice);

  const message = [
    `¡Hola! Estoy interesad@ en este producto del catálogo:`,
    ``,
    `📦 *${product.name}*`,
    `🏷️ ${price}`,
    `Código: ${product.sku}`,
    ``,
    `Ver: ${APP_URL}/catalogo`,
    ``,
    `¿Tienen disponible? ¿Qué tallas?`,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Link genérico de WhatsApp (sin mensaje específico) para el botón "Contactar" del header.
 */
export function buildWhatsappStoreLink(): string | null {
  const phone = normalizeWhatsappPhone(EMPRESA.telefono);
  if (!phone) return null;
  const message = `¡Hola! Vi el catálogo de ${EMPRESA.nombre} y quería hacer una consulta.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
