import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  PackageOpen,
  Printer,
  Scissors,
  Users,
} from "lucide-react";

const navigation = [
  // {
  //   name: "Xodimlar",
  //   href: "/cuttingMaster/department-details",
  //   icon: Users,
  //   onMobile: false,
  // },
  {
    name: "Kesish KPI",
    href: "/cuttingKpi",
    icon: BadgePercent,
    onMobile: true,
  },
  // {
  //   name: "Buyurtmalar",
  //   href: "/cuttingMaster/orders",
  //   icon: PackageOpen,
  //   onMobile: true,
  // },
  // {
  //   name: "Chop etishda",
  //   href: "/cuttingMaster/printing",
  //   icon: Printer,
  //   onMobile: true,
  // },
  {
    name: "Kesishda",
    href: "/cuttingMaster/cutting",
    icon: Scissors,
    onMobile: true,
  },
];

export default function CuttingMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
