import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CircleDollarSign,
  ClipboardCheck,
  CloudSun,
  Gem,
  Home,
  Rotate3d,
  Sprout,
  SquareScissors,
  TentTree,
  Truck,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Kirimlar",
    href: "/ceo/income",
    icon: BanknoteArrowDown,
    onMobile: true,
  },
  {
    name: "Chiqimlar",
    href: "/ceo/outcome",
    icon: BanknoteArrowUp,
    onMobile: true,
  },
  {
    name: "Balans",
    href: "/ceo/balance",
    icon: CircleDollarSign,
    onMobile: true,
  },
  {
    name: "Talabnoma",
    href: "/ceo/requests",
    icon: ClipboardCheck,
    onMobile: true,
  },
  {
    name: "Transfer",
    href: "/ceo/transfer",
    icon: Rotate3d,
    onMobile: false,
  },
  {
    name: "Oylik",
    href: "/ceo/salary",
    icon: Gem,
    onMobile: false,
  },
  {
    name: "Xodimlar",
    href: "/ceo/employees",
    icon: Users,
    onMobile: false,
  },
  {
    name: "Tikuv KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Bichuv KPI",
    href: "/cuttingKpi",
    icon: SquareScissors,
    onMobile: false,
  },
  {
    name: "Kunlik balans",
    href: "/ceo/daily",
    icon: TentTree,
    onMobile: false,
  },
  {
    name: "Oylik balans",
    href: "/ceo/monthly",
    icon: CloudSun,
    onMobile: false,
  },
  {
    name: "Tikuvchilar",
    href: "/tailorRating",
    icon: Sprout,
    onMobile: false,
  },
  {
    name: "Jo'natmalar",
    href: "/truck",
    icon: Truck,
    onMobile: false,
  },
];

export default function CeoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
