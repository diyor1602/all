import BaseLayout from "./BaseLayout";
import { Calendar1, Box, Landmark, Store } from "lucide-react";

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
  {
    name: "Do'konlar",
    href: "/supplier/stores",
    icon: Store,
    onMobile: false,
  },
];

export default function SupplierLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
