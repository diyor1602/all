import BaseLayout from "./BaseLayout";
import { BadgePercent, BadgeMinus, BadgePlus, Settings } from "lucide-react";

const navigation = [
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
