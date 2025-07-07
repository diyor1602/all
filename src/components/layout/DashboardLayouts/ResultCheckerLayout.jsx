import BaseLayout from "./BaseLayout";
import { BadgePercent, Building2, CircleCheckBig, Home } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
  {
    name: "Guruhlar natijasi",
    href: "/resultChecker/result",
    icon: Building2,
    onMobile: true,
  },
  {
    name: "Xodimlar natijasi",
    href: "/resultChecker/employeeResult",
    icon: CircleCheckBig,
    onMobile: true,
  },
];

export default function ResultCheckerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
