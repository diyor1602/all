import BaseLayout from "./BaseLayout";
import { Box, CircleCheckBig } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/qualityControllerMaster/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Natijalar",
    href: "/qualityControllerMaster/results",
    icon: CircleCheckBig,
    onMobile: true,
  },
];

export default function QualityControllerMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
