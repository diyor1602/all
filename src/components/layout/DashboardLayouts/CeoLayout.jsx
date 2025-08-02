import BaseLayout from "./BaseLayout";
import { Activity, BadgePercent, Home, Sprout, Truck } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  { name: "Logs", href: "/ceo/logs", icon: Activity, onMobile: true },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
  {
    name: "Jo'natmalar",
    href: "/truck",
    icon: Truck,
    onMobile: false,
  },
];

export default function CeoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
