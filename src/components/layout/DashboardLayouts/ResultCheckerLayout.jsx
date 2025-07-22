import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Building2,
  CircleCheckBig,
  Home,
  Sprout,
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
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
];

export default function ResultCheckerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
