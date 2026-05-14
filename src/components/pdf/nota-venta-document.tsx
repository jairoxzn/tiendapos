import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// 80mm thermal ticket: width = 80mm ≈ 226.77pt. Use a tall height so a single
// "page" comfortably holds typical receipts; @react-pdf paginates if needed.
const TICKET_WIDTH = 226.77;
const TICKET_HEIGHT = 850;

const styles = StyleSheet.create({
  page: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 10,
    fontSize: 8,
    fontFamily: "Courier",
    color: "#000",
  },
  center: { textAlign: "center" },
  brand: {
    fontSize: 18,
    fontFamily: "Courier-Bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  brandSub: { fontSize: 8, textAlign: "center", marginTop: 1 },
  divider: {
    borderTop: "1pt dashed #000",
    marginVertical: 4,
  },
  blockTitle: {
    textAlign: "center",
    fontFamily: "Courier-Bold",
    fontSize: 9,
    marginVertical: 2,
  },
  metaLine: { textAlign: "center", fontSize: 8, marginTop: 1 },
  tableHead: {
    flexDirection: "row",
    marginTop: 2,
    paddingBottom: 2,
  },
  row: { flexDirection: "row", marginTop: 1 },
  cDesc: { flex: 2.6 },
  cQty: { flex: 0.6, textAlign: "left" },
  cPU: { flex: 0.8, textAlign: "right" },
  cUnd: { flex: 0.7, textAlign: "right" },
  cTot: { flex: 1.0, textAlign: "right" },
  bold: { fontFamily: "Courier-Bold" },
  itemName: { fontFamily: "Courier-Bold", marginTop: 3 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  totalBig: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    fontFamily: "Courier-Bold",
    marginTop: 2,
  },
  payRight: { textAlign: "right", marginTop: 2, fontFamily: "Courier-Bold" },
  footer: { textAlign: "center", fontSize: 7.5, marginTop: 2 },
  footerBold: {
    textAlign: "center",
    fontSize: 8,
    fontFamily: "Courier-Bold",
    marginTop: 2,
  },
});

export interface NotaVentaProps {
  empresa: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
  };
  sale: {
    code: string;
    createdAt: string; // dd/MM/yyyy hh:mm a
    subtotal: number;
    discountAmount: number;
    total: number;
    cashier: string;
    customer: {
      name: string;
      doc: string;
    };
    details: {
      productName: string;
      variantInfo: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
    payments: { method: string; amount: number; reference: string | null }[];
  };
}

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "EFECTIVO",
  YAPE: "YAPE",
  PLIN: "PLIN",
  CARD: "TARJETA",
  TRANSFER: "TRANSF.",
};

const money = (n: number) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function NotaVentaDocument({ empresa, sale }: NotaVentaProps) {
  const paymentLabel =
    sale.payments.length > 0
      ? PAYMENT_LABEL[sale.payments[0].method] ?? sale.payments[0].method
      : "—";

  return (
    <Document>
      <Page size={[TICKET_WIDTH, TICKET_HEIGHT]} style={styles.page}>
        <Text style={styles.brand}>{empresa.nombre.toUpperCase()}</Text>

        <View style={styles.divider} />
        <Text style={styles.blockTitle}>NOTA DE VENTA</Text>
        <View style={styles.divider} />

        {empresa.ruc ? (
          <Text style={styles.metaLine}>RUC: {empresa.ruc}</Text>
        ) : null}
        {empresa.direccion ? (
          <Text style={styles.metaLine}>{empresa.direccion.toUpperCase()}</Text>
        ) : null}
        {empresa.telefono ? (
          <Text style={styles.metaLine}>TEL: {empresa.telefono}</Text>
        ) : null}

        <View style={styles.divider} />

        <Text style={[styles.metaLine, styles.bold]}>{sale.createdAt}</Text>
        <Text style={[styles.metaLine, styles.bold]}>{sale.code}</Text>

        <View style={styles.divider} />

        <Text style={[styles.metaLine, styles.bold]}>
          {sale.customer.name.toUpperCase()}
        </Text>
        <Text style={styles.metaLine}>{sale.customer.doc}</Text>

        <View style={styles.divider} />

        {/* Encabezado tabla */}
        <View style={styles.tableHead}>
          <Text style={[styles.cDesc, styles.bold]}>Descripcion</Text>
          <Text style={[styles.cQty, styles.bold]}>Cant</Text>
          <Text style={[styles.cPU, styles.bold]}>P.Und</Text>
          <Text style={[styles.cUnd, styles.bold]}>Und</Text>
          <Text style={[styles.cTot, styles.bold]}>P.Total</Text>
        </View>

        {sale.details.map((d, idx) => (
          <View key={idx}>
            <Text style={styles.itemName}>
              {d.productName.toUpperCase()}
              {d.variantInfo ? ` ${d.variantInfo}` : ""}
            </Text>
            <View style={styles.row}>
              <Text style={styles.cDesc}> </Text>
              <Text style={styles.cQty}>{d.quantity}</Text>
              <Text style={styles.cPU}>{money(d.unitPrice)}</Text>
              <Text style={styles.cUnd}>NIU</Text>
              <Text style={styles.cTot}>{money(d.subtotal)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalsRow}>
          <Text>Descuento Gral.</Text>
          <Text>S/ {money(sale.discountAmount)}</Text>
        </View>

        <View style={styles.totalBig}>
          <Text>Total</Text>
          <Text>S/ {money(sale.total)}</Text>
        </View>
        <View style={styles.totalBig}>
          <Text>Pago</Text>
          <Text>S/ {money(sale.total)}</Text>
        </View>

        <Text style={styles.payRight}>{paymentLabel}</Text>

        <View style={styles.divider} />

        <Text style={styles.metaLine}>Atendido por:</Text>
        <Text style={[styles.metaLine, styles.bold]}>
          {sale.cashier.toUpperCase()}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.footer}>
          ESTE ES UN DOCUMENTO SIN VALOR FISCAL SE EMITE
        </Text>
        <Text style={styles.footer}>DEBIDO A UNA FALLA EN EL SISTEMA</Text>

        <View style={styles.divider} />

        <Text style={styles.footer}>
          NO SE ACEPTAN DEVOLUCIONES SOLO CAMBIOS EN
        </Text>
        <Text style={styles.footer}>
          EL PLAZO DE 7 DIAS PRESENTANDO LA PRENDA SIN USO
        </Text>
        <Text style={styles.footer}>
          EN PERFECTAS CONDICIONES CON SUS ETIQUETAS
        </Text>

        <Text style={styles.footerBold}>GRACIAS POR SU COMPRA</Text>
      </Page>
    </Document>
  );
}
