import BaseLayout from "./BaseLayout";
import { Building2, CircleCheckBig, Home } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
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
