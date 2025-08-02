import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, Sprout, Truck } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
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

export default function NoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
