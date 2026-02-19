import BaseLayout from "./BaseLayout";
import { Box } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/majorQualityController/orders",
    icon: Box,
    onMobile: true,
  },
];

export default function MajorQualityControllerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
