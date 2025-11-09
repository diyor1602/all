import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  LayoutDashboard,
  Radical,
  Settings,
  Sprout,
  Truck,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Guruhlar",
    href: "/manufacturer/groups",
    icon: LayoutDashboard,
    onMobile: false,
  },
  {
    name: "Tikuv KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Tikuvchilar",
    href: "/tailorRating",
    icon: Sprout,
    onMobile: false,
  },
  {
    name: "Jo'natmalar",
    href: "/truck",
    icon: Truck,
    onMobile: false,
  },
  {
    name: "Koeffitsiyent",
    href: "/coefficient",
    icon: Radical,
    onMobile: false,
  },
  {
    name: "Qo'shimcha",
    href: "/manufacturer/settings",
    icon: Settings,
    onMobile: false,
  },
];

export default function ManufacturerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
