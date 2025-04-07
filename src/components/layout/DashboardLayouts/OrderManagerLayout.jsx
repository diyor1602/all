import BaseLayout from "./BaseLayout";
import { Home, Box, Puzzle } from "lucide-react";

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
];

export default function OrderManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
