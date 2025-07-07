import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CircleDollarSign,
  ClipboardCheck,
  Gem,
  Home,
  Rotate3d,
  TentTree,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Kirimlar",
    href: "/casher/income",
    icon: BanknoteArrowDown,
    onMobile: true,
  },
  {
    name: "Chiqimlar",
    href: "/casher/outcome",
    icon: BanknoteArrowUp,
    onMobile: true,
  },
  {
    name: "Balans",
    href: "/casher/balance",
    icon: CircleDollarSign,
    onMobile: true,
  },
  {
    name: "Talabnoma",
    href: "/casher/requests",
    icon: ClipboardCheck,
    onMobile: true,
  },
  {
    name: "Transfer",
    href: "/casher/transfer",
    icon: Rotate3d,
    onMobile: false,
  },
  {
    name: "Oylik",
    href: "/casher/salary",
    icon: Gem,
    onMobile: false,
  },
  {
    name: "Xodimlar",
    href: "/casher/employees",
    icon: Users,
    onMobile: false,
  },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Kunlik balans",
    href: "/casher/daily",
    icon: TentTree,
    onMobile: false,
  },
];

export default function CasherLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
