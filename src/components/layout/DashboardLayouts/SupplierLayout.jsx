import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, Calendar1 } from "lucide-react";

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
];

export default function SupplierLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
