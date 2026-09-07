import BaseLayout from "./BaseLayout";
import {
  Puzzle,
  Box,
  NotebookPen,
  ChartArea,
  Users,
  ChartNoAxesCombined,
} from "lucide-react";

const navigation = [
  {
    name: "Xodimlar",
    href: "/supervisor/employees",
    icon: Users,
    onMobile: true,
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
    name: "Tahlil",
    href: "/supervisor/analysis",
    icon: ChartArea,
    onMobile: false,
  },
  {
    name: "Reja",
    href: "/supervisor/plan",
    icon: NotebookPen,
    onMobile: true,
  },
  {
    name: "Haqiqiy reja",
    href: "/supervisor/actualPlan",
    icon: ChartNoAxesCombined,
    onMobile: false,
  },
];

export default function SupervisorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
