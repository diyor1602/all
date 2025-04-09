import BaseLayout from "./BaseLayout";
import { Home, Box, Puzzle, Building2 } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
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
];

export default function OrderManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
