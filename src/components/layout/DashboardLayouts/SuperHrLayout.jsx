import BaseLayout from "./BaseLayout";
import { Home, Users, Settings, Calendar1 } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Davomat",
    href: "/superhr/attendance",
    icon: Calendar1,
    onMobile: true,
  },
  { name: "Xodimlar", href: "/superhr/employees", icon: Users, onMobile: true },
  {
    name: "Qo'shimcha",
    href: "/superhr/settings",
    icon: Settings,
    onMobile: true,
  },
];

export default function SuperHrLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
