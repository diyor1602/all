import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, PackageOpen, Sprout, Truck } from "lucide-react";

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
    href: "/packageMaster/spec",
    icon: PackageOpen,
    onMobile: true,
  },
  {
    name: "Jo'natma",
    href: "/packageMaster/truck",
    icon: Truck,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
];

export default function PackageMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
