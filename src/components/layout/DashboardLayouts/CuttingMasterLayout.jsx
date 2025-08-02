import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  PackageOpen,
  Printer,
  Scissors,
  Sprout,
  Truck,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Tikuv KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Kesish KPI",
    href: "/cuttingKpi",
    icon: BadgePercent,
    onMobile: true,
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
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
  {
    name: "Jo'natmalar",
    href: "/truck",
    icon: Truck,
    onMobile: false,
  },
];

export default function CuttingMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
