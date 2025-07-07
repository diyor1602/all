import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  PackageOpen,
  Printer,
  Scissors,
} from "lucide-react";

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
    href: "/cuttingMaster/orders",
    icon: PackageOpen,
    onMobile: true,
  },
  {
    name: "Chop etishda",
    href: "/cuttingMaster/printing",
    icon: Printer,
    onMobile: true,
  },
  {
    name: "Kesishda",
    href: "/cuttingMaster/cutting",
    icon: Scissors,
    onMobile: true,
  },
];

export default function CuttingMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
