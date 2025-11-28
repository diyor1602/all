import BaseLayout from "./BaseLayout";
import { BadgeMinus, BadgePlus, Settings, Box, Users } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/warehouseManager/completeOrders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Xodimlar",
    href: "/warehouseManager/completeOrders/employees",
    icon: Users,
    onMobile: true,
  },
  // {
  //   name: "Kirimlar",
  //   href: "/warehouseManager/income",
  //   icon: BadgePlus,
  //   onMobile: true,
  // },
  // {
  //   name: "Chiqimlar",
  //   href: "/warehouseManager/outcome",
  //   icon: BadgeMinus,
  //   onMobile: true,
  // },
  // {
  //   name: "Qo'chimcha",
  //   href: "/warehouseManager/settings",
  //   icon: Settings,
  //   onMobile: true,
  // },
];

export default function WarehouseManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
