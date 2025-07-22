import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, Calendar1, Sprout } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Buyurtmalar",
    href: "/supplier/orders",
    icon: Calendar1,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
];

export default function SupplierLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
