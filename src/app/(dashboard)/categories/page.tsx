import { Tags } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Categorías" };

export default function CategoriesPage() {
  return (
    <ComingSoon
      title="Categorías"
      description="Organiza tus productos por categoría y marca."
      phase="Fase 2"
      icon={Tags}
    />
  );
}
