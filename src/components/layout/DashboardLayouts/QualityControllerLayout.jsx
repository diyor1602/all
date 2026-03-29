import BaseLayout from "./BaseLayout";
import { Box, AlertCircle, Cctv } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/qualityController/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Braklar",
    href: "/qualityController/damages",
    icon: AlertCircle,
    onMobile: true,
  },
  {
    name: "Ikkinchi tekshiruv",
    href: "/qualityController/second-checks",
    icon: Cctv,
    onMobile: true,
  },
];

export default function QualityControllerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
