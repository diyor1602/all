import BaseLayout from "./BaseLayout";
import { Calendar1, Box, Landmark } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/supplier/orders",
    icon: Calendar1,
    onMobile: true,
  },
  {
    name: "Ombor holati",
    href: "/supplier/stockbalance",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Kassa",
    href: "/supplier/cashbox",
    icon: Landmark,
    onMobile: true,
  },
];

export default function SupplierLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
