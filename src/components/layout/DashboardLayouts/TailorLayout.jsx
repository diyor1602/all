import BaseLayout from "./BaseLayout";
import { Box, CircleDollarSign, Home } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  { name: "Ish", href: "/tailor", icon: CircleDollarSign, onMobile: true },
  // { name: "Modellar", href: "/tailor/orders", icon: Box, onMobile: true },
];

export default function TailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
