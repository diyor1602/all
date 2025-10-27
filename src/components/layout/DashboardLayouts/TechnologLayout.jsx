import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  Box,
  Bot,
  Plane,
  Sprout,
  Truck,
  Radical,
  Users,
  CirclePlay,
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
    href: "/technologist/employees",
    icon: Users,
    onMobile: false,
    showUsers: [621],
  },
  {
    name: "Buyurtmalar",
    href: "/technologist/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Videolar",
    href: "/technologist/videos",
    icon: CirclePlay,
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

export default function TechnologLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
