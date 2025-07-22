import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, Car, CalendarCheck, Sprout } from "lucide-react";

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
    href: "/transport/attendance",
    icon: CalendarCheck,
    onMobile: true,
  },
  {
    name: "Avtomobillar",
    href: "/transport/machines",
    icon: Car,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
];

export default function TransportLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
