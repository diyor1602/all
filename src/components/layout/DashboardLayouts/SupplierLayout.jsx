import BaseLayout from "./BaseLayout";
import { Calendar1, Box } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/supplier/orders",
    icon: Calendar1,
    onMobile: true,
  },
  {
    name: "Balans",
    href: "/supplier/balance",
    icon: Box,
    onMobile: true,
  },
];

export default function SupplierLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
