import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, Box, CircleCheckBig, Sprout } from "lucide-react";

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
    href: "/qualityControllerMaster/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Natijalar",
    href: "/qualityControllerMaster/results",
    icon: CircleCheckBig,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
];

export default function QualityControllerMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
