import BaseLayout from "./BaseLayout";
import { Users, Settings, Box, Calculator, Stamp } from "lucide-react";

const navigation = [
  {
    name: "Xodimlar",
    href: "/internalAccountant/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Buyurtmalar",
    href: "/internalAccountant/analysis",
    icon: Box,
    onMobile: false,
  },
  {
    name: "OTK shtamplar",
    href: "/internalAccountant/otkStamps",
    icon: Stamp,
    onMobile: false,
  },
  {
    name: "Hisob",
    href: "/internalAccountant/overCalc",
    icon: Calculator,
    onMobile: false,
  },
  {
    name: "Qo'shimcha",
    href: "/internalAccountant/settings",
    icon: Settings,
    onMobile: true,
  },
];

export default function InternalAccountantLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
