import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Bot,
  FilePlus,
  Home,
  ListChecks,
  Medal,
  Shirt,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
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
    name: "Tarif",
    href: "/groupMaster/tarifs",
    icon: Bot,
    onMobile: false,
  },
  {
    name: "Reyting",
    href: "/groupMaster/topEarners",
    icon: Medal,
    onMobile: true,
  },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
