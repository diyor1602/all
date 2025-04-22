import BaseLayout from "./BaseLayout";
import { Home, BadgeMinus, BadgePlus, Box, Settings } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Kirimlar",
    href: "/warehouseManager/income",
    icon: BadgePlus,
    onMobile: true,
  },
  {
    name: "Chiqimlar",
    href: "/warehouseManager/outcome",
    icon: BadgeMinus,
    onMobile: true,
  },
  {
    name: "Qo'chimcha",
    href: "/warehouseManager/settings",
    icon: Settings,
    onMobile: true,
  },
];

export default function WarehouseManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
