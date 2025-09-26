import BaseLayout from "./BaseLayout";
import {
  BadgePercent,
  Home,
  PackageOpen,
  Radical,
  Sprout,
  Truck,
  TruckElectric,
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
    name: "Buyurtmalar",
    href: "/packageMaster/spec",
    icon: PackageOpen,
    onMobile: true,
  },
  {
    name: "Jo'natma",
    href: "/packageMaster/truck",
    icon: TruckElectric,
    onMobile: true,
  },
  { name: "Tikuvchilar", href: "/tailorRating", icon: Sprout, onMobile: false },
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

export default function PackageMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
