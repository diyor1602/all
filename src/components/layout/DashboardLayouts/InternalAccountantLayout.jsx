import BaseLayout from "./BaseLayout";
import {
  Users,
  Settings,
  HandCoins,
  Box,
  Calculator,
  Sprout,
} from "lucide-react";

const navigation = [
  {
    name: "Xodimlar",
    href: "/internalAccountant/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Qo'shimcha",
    href: "/internalAccountant/settings",
    icon: Settings,
    onMobile: true,
  },
  {
    name: "Oylik terish",
    href: "/internalAccountant/manual",
    icon: HandCoins,
    onMobile: false,
  },
  {
    name: "Buyurtmalar",
    href: "/internalAccountant/work",
    icon: Box,
    onMobile: false,
  },
  {
    name: "Hisob",
    href: "/internalAccountant/overCalc",
    icon: Calculator,
    onMobile: false,
  },
  {
    name: "Tikuvchilar",
    href: "/tailorRating",
    icon: Sprout,
    onMobile: false,
  },
];

export default function InternalAccountantLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
