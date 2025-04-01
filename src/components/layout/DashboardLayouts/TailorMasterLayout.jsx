import BaseLayout from "./BaseLayout";
import { Home, ListChecks } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home },
  { name: "Buyurtmalar", href: "/tailorMaster/pending", icon: ListChecks },
];

export default function TailorMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
