import BaseLayout from "./BaseLayout";
import { BadgePercent, Home, Box, Bot, Plane, Sprout } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Buyurtmalar",
    href: "/technologist/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Mashinalar",
    href: "/technologist/machines",
    icon: Bot,
    onMobile: true,
  },
  {
    name: "Nakladnoy",
    href: "/technologist/nakladnoy",
    icon: Plane,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
];

export default function TechnologLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
