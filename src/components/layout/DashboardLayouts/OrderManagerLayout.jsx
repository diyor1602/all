import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  Box,
  Puzzle,
  Building2,
  Sprout,
  Truck,
  Radical,
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
    name: "Buyurtmalar",
    href: "/orderManager/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Modellar",
    href: "/orderManager/models",
    icon: Puzzle,
    onMobile: true,
  },
  {
    name: "Kontragentlar",
    href: "/orderManager/contragent",
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

export default function OrderManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
