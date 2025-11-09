import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  Settings,
  Sprout,
  Truck,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Guruhlar",
    href: "/manufacturer/groups",
    icon: Users,
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
    name: "Qo'chimcha",
    href: "/manufacturer/settings",
    icon: Settings,
    onMobile: false,
  },
];

export default function CeoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
