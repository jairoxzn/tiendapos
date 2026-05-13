import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: { marginBottom: 18, flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 16, fontWeight: 700, color: "#ed1862" },
  meta: { fontSize: 9, color: "#555", textAlign: "right" },
  doc: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    border: "1pt solid #ccc",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  docCode: { fontSize: 11, fontWeight: 700 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  table: { marginTop: 4, borderTop: "1pt solid #ddd" },
  row: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #eee",
    paddingVertical: 6,
  },
  rowHeader: { borderBottom: "1pt solid #999", paddingVertical: 4 },
  cName: { flex: 3 },
  cVar: { flex: 1.5 },
  cQty: { flex: 0.6, textAlign: "right" },
  cPrice: { flex: 1, textAlign: "right" },
  cSubtotal: { flex: 1.1, textAlign: "right" },
  bold: { fontWeight: 700 },
  small: { fontSize: 8, color: "#666" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1pt solid #333",
    fontSize: 12,
    fontWeight: 700,
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#888",
  },
  notes: { marginTop: 12, padding: 8, backgroundColor: "#f7f7f7", borderRadius: 4 },
});

export interface BoletaProps {
  empresa: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
  };
  sale: {
    code: string;
    createdAt: string;
    status: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    igvPercent: number;
    notes: string | null;
    cashier: string;
    customer: { name: string; doc: string } | null;
    details: {
      productName: string;
      variantInfo: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
    }[];
    payments: { method: string; amount: number; reference: string | null }[];
  };
}

const fmt = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

export function BoletaDocument({ empresa, sale }: BoletaProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{empresa.nombre}</Text>
            <Text style={styles.small}>RUC: {empresa.ruc}</Text>
            <Text style={styles.small}>{empresa.direccion}</Text>
            <Text style={styles.small}>Tel: {empresa.telefono}</Text>
          </View>
          <View style={styles.meta}>
            <Text>Fecha de emisión</Text>
            <Text style={styles.bold}>{sale.createdAt}</Text>
            <Text style={{ marginTop: 6 }}>Cajero: {sale.cashier}</Text>
          </View>
        </View>

        {/* Documento */}
        <View style={styles.doc}>
          <View>
            <Text style={styles.small}>BOLETA DE VENTA</Text>
            <Text style={styles.docCode}>{sale.code}</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.small}>Estado</Text>
            <Text style={styles.docCode}>{sale.status}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text>
            {sale.customer ? sale.customer.name : "Cliente genérico"}
            {sale.customer && `   ·   ${sale.customer.doc}`}
          </Text>
        </View>

        {/* Detalle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.rowHeader]}>
              <Text style={[styles.cName, styles.bold]}>Producto</Text>
              <Text style={[styles.cVar, styles.bold]}>Variante</Text>
              <Text style={[styles.cQty, styles.bold]}>Cant.</Text>
              <Text style={[styles.cPrice, styles.bold]}>P. unit.</Text>
              <Text style={[styles.cSubtotal, styles.bold]}>Subtotal</Text>
            </View>
            {sale.details.map((d, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={styles.cName}>{d.productName}</Text>
                <Text style={styles.cVar}>{d.variantInfo}</Text>
                <Text style={styles.cQty}>{d.quantity}</Text>
                <Text style={styles.cPrice}>{fmt(d.unitPrice)}</Text>
                <Text style={styles.cSubtotal}>{fmt(d.subtotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{fmt(sale.subtotal)}</Text>
          </View>
          {sale.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Descuento</Text>
              <Text>− {fmt(sale.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>IGV ({sale.igvPercent}%)</Text>
            <Text>{fmt(sale.taxAmount)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>TOTAL</Text>
            <Text>{fmt(sale.total)}</Text>
          </View>
        </View>

        {/* Pagos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagos</Text>
          {sale.payments.map((p, idx) => (
            <View key={idx} style={styles.totalRow}>
              <Text>
                {PAYMENT_LABEL[p.method] ?? p.method}
                {p.reference ? ` · ${p.reference}` : ""}
              </Text>
              <Text>{fmt(p.amount)}</Text>
            </View>
          ))}
        </View>

        {sale.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Nota</Text>
            <Text>{sale.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Gracias por tu compra · Documento generado por TiendaPOS
        </Text>
      </Page>
    </Document>
  );
}
