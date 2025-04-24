import BaseLayout from "./BaseLayout";
import { Home, Box, Puzzle, Building2 } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Buyurtmalar",
    href: "/qualityControllerMaster/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Modellar",
    href: "/qualityControllerMaster/models",
    icon: Puzzle,
    onMobile: true,
  },
  {
    name: "Kontragentlar",
    href: "/qualityControllerMaster/contragent",
    icon: Building2,
    onMobile: true,
  },
];

export default function QualityControllerMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
