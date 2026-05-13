import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { paddingHorizontal: 36, paddingVertical: 36, fontSize: 9, fontFamily: "Helvetica" },
  header: { marginBottom: 16 },
  brand: { fontSize: 14, fontWeight: 700, color: "#ed1862" },
  title: { fontSize: 16, fontWeight: 700, marginTop: 6 },
  meta: { fontSize: 8, color: "#666", marginTop: 4 },
  table: { marginTop: 10, borderTop: "1pt solid #999" },
  row: { flexDirection: "row", paddingVertical: 4, borderBottom: "0.5pt solid #eee" },
  rowHeader: { borderBottom: "1pt solid #999", paddingVertical: 5 },
  cell: { flex: 1, paddingHorizontal: 4 },
  bold: { fontWeight: 700 },
  totals: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#f3f3f3",
    borderRadius: 4,
  },
  footer: { marginTop: 20, fontSize: 7, color: "#888", textAlign: "center" },
});

const fmt = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ReportProps {
  empresa: { nombre: string; ruc: string };
  title: string;
  range: { from: string; to: string };
  columns: { key: string; label: string; align?: "left" | "right" | "center"; width?: number }[];
  rows: Record<string, string | number>[];
  totals?: { label: string; value: string }[];
}

export function ReportePdfDocument({ empresa, title, range, columns, rows, totals }: ReportProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{empresa.nombre}</Text>
          <Text style={styles.meta}>RUC: {empresa.ruc}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>
            Periodo: {range.from} → {range.to} · Generado: {new Date().toLocaleString("es-PE")}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.rowHeader]}>
            {columns.map((c) => (
              <Text
                key={c.key}
                style={[
                  styles.cell,
                  styles.bold,
                  { flex: c.width ?? 1, textAlign: c.align ?? "left" },
                ]}
              >
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((r, i) => (
            <View key={i} style={styles.row}>
              {columns.map((c) => (
                <Text
                  key={c.key}
                  style={[styles.cell, { flex: c.width ?? 1, textAlign: c.align ?? "left" }]}
                >
                  {String(r[c.key] ?? "")}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {totals && totals.length > 0 && (
          <View style={styles.totals}>
            {totals.map((t) => (
              <View key={t.label}>
                <Text style={styles.meta}>{t.label}</Text>
                <Text style={[styles.bold, { fontSize: 11 }]}>{t.value}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>TiendaPOS · Reporte generado automáticamente</Text>
      </Page>
    </Document>
  );
}

// Export para uso desde server routes
export type { ReportProps };
export { fmt as fmtMoney };
