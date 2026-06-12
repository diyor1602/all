import BaseLayout from "./BaseLayout";
import {
  BadgeMinus,
  BadgePlus,
  Settings,
  Box,
  Users,
  FileText,
  Snail,
  Calendar,
} from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/warehouseManager/completeOrders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Oylik xulosa",
    href: "/warehouseManager/monthly-report",
    icon: Calendar,
    onMobile: true,
  },
  {
    name: "Xodimlar",
    href: "/warehouseManager/completeOrders/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Kirimlar",
    href: "/warehouseManager/income",
    icon: BadgePlus,
    onMobile: false,
  },
  {
    name: "Chiqimlar",
    href: "/warehouseManager/outcome",
    icon: BadgeMinus,
    onMobile: false,
  },
  {
    name: "Talabnomalar",
    href: "/warehouseManager/requisitions",
    icon: FileText,
    onMobile: false,
  },
  {
    name: "Ta'minot",
    href: "/warehouseManager/supplier",
    icon: Snail,
    onMobile: false,
  },
  {
    name: "Qo'chimcha",
    href: "/warehouseManager/settings",
    icon: Settings,
    onMobile: false,
  },
];

export default function WarehouseManagerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
