import BaseLayout from "./BaseLayout";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  Calculator,
  CircleDollarSign,
  ClipboardCheck,
  CloudSun,
  Gem,
  Rotate3d,
  SquareScissors,
  TentTree,
  Users,
  Settings,
} from "lucide-react";

const navigation = [
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
    name: "Hisob",
    href: "/ceo/overcalc",
    icon: Calculator,
    onMobile: false,
  },
  {
    name: "Xodimlar",
    href: "/ceo/employees",
    icon: Users,
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
    name: "Qo'shimcha",
    href: "/ceo/settings",
    icon: Settings,
    onMobile: false,
  },
];

export default function CeoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
