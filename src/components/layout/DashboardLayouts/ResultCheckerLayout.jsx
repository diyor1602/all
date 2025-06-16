import BaseLayout from "./BaseLayout";
import { CircleCheckBig, Home } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Natija",
    href: "/resultChecker/result",
    icon: CircleCheckBig,
    onMobile: true,
  },
];

export default function ResultCheckerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
