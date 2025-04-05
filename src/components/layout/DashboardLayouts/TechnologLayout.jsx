import BaseLayout from "./BaseLayout";
import { Home, Box, Bot } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Buyurtmalar",
    href: "/technologist/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Mashinalar",
    href: "/technologist/machines",
    icon: Bot,
    onMobile: true,
  },
];

export default function TechnologLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
