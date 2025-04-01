import BaseLayout from "./BaseLayout";
import { Home, Users, BadgeDollarSign } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Xodimlar",
    href: "/supervisior/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Maosh",
    href: "/supervisior/salaries",
    icon: BadgeDollarSign,
    onMobile: true,
  },
];

export default function SupervisiorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
