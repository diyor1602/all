import BaseLayout from "./BaseLayout";
import { Box, BarChart3 } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/majorQualityController/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Statistika",
    href: "/majorQualityController/stats",
    icon: BarChart3,
    onMobile: true,
  },
];

export default function MajorQualityControllerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
