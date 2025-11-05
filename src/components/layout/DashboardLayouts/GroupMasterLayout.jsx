import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Bot,
  FilePlus,
  Home,
  ListChecks,
  Medal,
  Shirt,
  Truck,
  Radical,
  Users,
  Clock,
  Wallet,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  { name: "Oylik", href: "/groupMaster/salary", icon: Wallet, onMobile: true },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Tasdiqlash",
    href: "/groupMaster/pending",
    icon: ListChecks,
    onMobile: true,
  },
  {
    name: "Tikuv",
    href: "/groupMaster/tailoring",
    icon: Shirt,
    onMobile: true,
  },
  {
    name: "Natija",
    href: "/groupMaster/result",
    icon: FilePlus,
    onMobile: true,
  },
  {
    name: "Xodimlar",
    href: "/groupMaster/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Davomat",
    href: "/groupMaster/attendanceHistory",
    icon: Clock,
    onMobile: true,
  },
  {
    name: "Tarif",
    href: "/groupMaster/tarifs",
    icon: Bot,
    onMobile: false,
  },
  {
    name: "Reyting",
    href: "/tailorRating",
    icon: Medal,
    onMobile: true,
  },
  {
    name: "Jo'natmalar",
    href: "/truck",
    icon: Truck,
    onMobile: false,
  },
  {
    name: "Koeffitsiyent",
    href: "/coefficient",
    icon: Radical,
    onMobile: false,
  },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
