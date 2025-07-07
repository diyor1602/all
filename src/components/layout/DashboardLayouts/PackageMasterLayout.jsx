import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, PackageOpen } from "lucide-react";

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
    href: "/packageMaster/new-spec",
    icon: PackageOpen,
    onMobile: true,
  },
];

export default function PackageMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
