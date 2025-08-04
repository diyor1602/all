import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  Box,
  Puzzle,
  NotebookPen,
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
    name: "Buyurtmalar",
    href: "/supervisor/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Modellar",
    href: "/supervisor/models",
    icon: Puzzle,
    onMobile: true,
  },
  {
    name: "Reja",
    href: "/supervisor/plan",
    icon: NotebookPen,
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

export default function SupervisorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
