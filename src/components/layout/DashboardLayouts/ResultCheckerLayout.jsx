import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Building2,
  Home,
  Radical,
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
    name: "Guruhlar natijasi",
    href: "/resultChecker/result",
    icon: Building2,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
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
];

export default function ResultCheckerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
