import BaseLayout from "./BaseLayout";
import { Home, Box, Puzzle, NotebookPen } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
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
];

export default function SupervisorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
