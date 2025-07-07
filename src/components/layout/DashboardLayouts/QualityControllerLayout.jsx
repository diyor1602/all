import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, Box } from "lucide-react";

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
    href: "/qualityController/orders",
    icon: Box,
    onMobile: true,
  },
];

export default function QualityControllerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
