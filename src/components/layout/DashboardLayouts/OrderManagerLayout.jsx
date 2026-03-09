import BaseLayout from "./BaseLayout";
import { Box, Building2 } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/orderManager/orders",
    icon: Box,
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
