import { z } from "zod";

const DOC_RULES = {
  DNI: { length: 8, regex: /^\d{8}$/, label: "DNI (8 dígitos)" },
  RUC: { length: 11, regex: /^\d{11}$/, label: "RUC (11 dígitos)" },
  CE: { length: 12, regex: /^[A-Z0-9]{9,12}$/i, label: "Carné de extranjería" },
  PASSPORT: { length: 12, regex: /^[A-Z0-9]{6,12}$/i, label: "Pasaporte" },
} as const;

export const customerSchema = z
  .object({
    docType: z.enum(["DNI", "RUC", "CE", "PASSPORT"]),
    docNumber: z.string().min(6, "Número de documento muy corto").max(20),
    firstName: z.string().min(1, "Nombre requerido").max(60),
    lastName: z.string().max(60).optional().or(z.literal("")),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    address: z.string().max(200).optional().or(z.literal("")),
    notes: z.string().max(300).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const rule = DOC_RULES[data.docType];
      return rule.regex.test(data.docNumber);
    },
    {
      message: "Formato de documento inválido",
      path: ["docNumber"],
    },
  );

export type CustomerInput = z.infer<typeof customerSchema>;

export const DOC_TYPE_LABELS = {
  DNI: "DNI",
  RUC: "RUC",
  CE: "Carné Extranjería",
  PASSPORT: "Pasaporte",
} as const;
