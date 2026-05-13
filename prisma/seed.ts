import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ---------- Usuarios ----------
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const cashierPassword = await bcrypt.hash("Caja123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@tiendapos.com" },
    update: {},
    create: {
      email: "admin@tiendapos.com",
      name: "Administrador",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cajero@tiendapos.com" },
    update: {},
    create: {
      email: "cajero@tiendapos.com",
      name: "Cajero Demo",
      password: cashierPassword,
      role: Role.CASHIER,
    },
  });

  console.log(`✓ Usuarios listos: ${admin.email}, ${cashier.email}`);

  // ---------- Marcas ----------
  const brands = ["Nike", "Adidas", "Zara", "H&M", "Local Brand"];
  for (const name of brands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`✓ ${brands.length} marcas creadas`);

  // ---------- Categorías ----------
  const categories = [
    { name: "Polos", description: "Polos casuales y deportivos" },
    { name: "Pantalones", description: "Jeans, joggers y formales" },
    { name: "Vestidos", description: "Vestidos casuales y de noche" },
    { name: "Chaquetas", description: "Casacas, polos térmicos, abrigos" },
    { name: "Zapatos", description: "Zapatillas, sandalias, formales" },
    { name: "Accesorios", description: "Carteras, gorros, cinturones" },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, slug: slugify(c.name), description: c.description },
    });
  }
  console.log(`✓ ${categories.length} categorías creadas`);

  // ---------- Producto demo ----------
  const polosCat = await prisma.category.findUnique({ where: { name: "Polos" } });
  const zaraBrand = await prisma.brand.findUnique({ where: { name: "Zara" } });

  if (polosCat) {
    const polo = await prisma.product.upsert({
      where: { sku: "POLO-OS-001" },
      update: {},
      create: {
        sku: "POLO-OS-001",
        name: "Polo Oversize Premium",
        description: "Polo de algodón pima oversize, corte moderno.",
        costPrice: 25,
        salePrice: 59.9,
        categoryId: polosCat.id,
        brandId: zaraBrand?.id,
        minStock: 5,
        variants: {
          create: [
            { sku: "POLO-OS-001-M-NEG", size: "M", color: "Negro", colorHex: "#000000", stock: 12 },
            { sku: "POLO-OS-001-M-BLA", size: "M", color: "Blanco", colorHex: "#FFFFFF", stock: 9 },
            { sku: "POLO-OS-001-L-NEG", size: "L", color: "Negro", colorHex: "#000000", stock: 7 },
            { sku: "POLO-OS-001-L-ROS", size: "L", color: "Rosa", colorHex: "#ff6695", stock: 4 },
          ],
        },
      },
    });
    console.log(`✓ Producto demo creado: ${polo.name}`);
  }

  // ---------- Cliente demo ----------
  await prisma.customer.upsert({
    where: { docNumber: "00000000" },
    update: {},
    create: {
      docType: "DNI",
      docNumber: "00000000",
      firstName: "Cliente",
      lastName: "Genérico",
    },
  });

  console.log("\n✅ Seed completo.");
  console.log("\n   Cuentas de prueba:");
  console.log("   ┌─ admin@tiendapos.com    / Admin123!");
  console.log("   └─ cajero@tiendapos.com   / Caja123!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
