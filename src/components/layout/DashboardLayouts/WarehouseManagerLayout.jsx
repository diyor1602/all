import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  BadgeMinus,
  BadgePlus,
  Home,
  Settings,
  Sprout,
  Truck,
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
    name: "Kirimlar",
    href: "/warehouseManager/income",
    icon: BadgePlus,
    onMobile: true,
  },
  {
    name: "Chiqimlar",
    href: "/warehouseManager/outcome",
    icon: BadgeMinus,
    onMobile: true,
  },
  {
    name: "Qo'chimcha",
    href: "/warehouseManager/settings",
    icon: Settings,
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

export default function WarehouseManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
