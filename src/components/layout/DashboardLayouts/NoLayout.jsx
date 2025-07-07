import BaseLayout from "./BaseLayout";
import { BadgePercent, Home } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "KPI",
    href: "/kpi",
    icon: BadgePercent,
    onMobile: false,
  },
];

export default function NoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
