import BaseLayout from "./BaseLayout";
import { BadgePercent, FilePlus, Home, ListChecks, Sprout } from "lucide-react";

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
    href: "/groupHelper/pending",
    icon: ListChecks,
    onMobile: true,
  },
  {
    name: "Natija",
    href: "/groupHelper/result",
    icon: FilePlus,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
];

export default function GroupHelperLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
