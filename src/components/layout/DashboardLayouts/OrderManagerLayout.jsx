import BaseLayout from "./BaseLayout";
import { Home, Box } from "lucide-react";

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
    icon: Box,
    onMobile: true,
  },
];

export default function OrderManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
