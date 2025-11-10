import BaseLayout from "./BaseLayout";
import { Box } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/qualityController/orders",
    icon: Box,
    onMobile: true,
  },
];

export default function QualityControllerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
