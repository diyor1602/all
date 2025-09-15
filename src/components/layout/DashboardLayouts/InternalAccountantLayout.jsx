import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  Users,
  Settings,
  Sprout,
  Truck,
  HandCoins,
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
  {
    name: "Oylik terish",
    href: "/internalAccountant/manual",
    icon: HandCoins,
    onMobile: false,
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
