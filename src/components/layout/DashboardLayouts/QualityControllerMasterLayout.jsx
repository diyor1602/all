import BaseLayout from "./BaseLayout";
import { Home, Box, CircleCheckBig } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Buyurtmalar",
    href: "/qualityControllerMaster/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Natijalar",
    href: "/qualityControllerMaster/results",
    icon: CircleCheckBig,
    onMobile: true,
  },
];

export default function QualityControllerMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
