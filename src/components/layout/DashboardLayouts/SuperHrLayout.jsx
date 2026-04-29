import BaseLayout from "./BaseLayout";
import {
  Users,
  Settings,
  Calendar1,
  ChartColumnDecreasing,
  Swords,
  CircleDollarSign,
  Gem,
} from "lucide-react";

const navigation = [
  {
    name: "Davomat",
    href: "/superhr/attendance",
    icon: Calendar1,
    onMobile: true,
  },
  { name: "Xodimlar", href: "/superhr/employees", icon: Users, onMobile: true },
  {
    name: "Statistika",
    href: "/superhr/stats",
    icon: ChartColumnDecreasing,
    onMobile: false,
  },
  {
    name: "Nomzodlar",
    href: "/superhr/lids",
    icon: Swords,
    onMobile: false,
  },
  {
    name: "Qo'shimcha",
    href: "/superhr/settings",
    icon: Settings,
    onMobile: true,
  },
  {
    name: "Oylik belgilash",
    href: "/superhr/salary",
    icon: CircleDollarSign,
    onMobile: false,
  },
  {
    name: "Oylik jadval",
    href: "/superhr/salary-page",
    icon: Gem,
    onMobile: false,
  },
];

export default function SuperHrLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
