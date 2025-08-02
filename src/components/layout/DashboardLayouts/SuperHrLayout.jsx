import BaseLayout from "./BaseLayout";
import {
  Home,
  Users,
  Settings,
  Calendar1,
  ChartColumnDecreasing,
  Swords,
  BadgePercent,
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
    name: "Davomat",
    href: "/superhr/attendance",
    icon: Calendar1,
    onMobile: true,
  },
  { name: "Xodimlar", href: "/superhr/employees", icon: Users, onMobile: true },
  {
    name: "Statistika",
    href: "/superhr/stats",
    icon: ChartColumnDecreasing,
    onMobile: false,
  },
  {
    name: "Nomzodlar",
    href: "/superhr/lids",
    icon: Swords,
    onMobile: false,
  },
  {
    name: "Qo'shimcha",
    href: "/superhr/settings",
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

export default function SuperHrLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
