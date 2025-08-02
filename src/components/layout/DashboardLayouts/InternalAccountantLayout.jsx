import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  Users,
  Settings,
  Calendar1,
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
    href: "/internalAccountant/attendance",
    icon: Calendar1,
    onMobile: true,
  },
  {
    name: "Xodimlar",
    href: "/internalAccountant/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Qo'shimcha",
    href: "/internalAccountant/settings",
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

export default function InternalAccountantLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
