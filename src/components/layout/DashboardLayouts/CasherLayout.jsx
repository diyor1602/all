import BaseLayout from "./BaseLayout";
import { Home, Printer, TrendingDown, TrendingUp } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Kirimlar",
    href: "/casher/income",
    icon: TrendingUp,
    onMobile: true,
  },
  {
    name: "Chiqimlar",
    href: "/casher/outcome",
    icon: TrendingDown,
    onMobile: true,
  },
];

export default function CasherLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
