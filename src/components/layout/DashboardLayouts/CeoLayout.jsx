import BaseLayout from "./BaseLayout";
import { Home, PackageOpen, Printer, Scissors } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Buyurtmalar",
    href: "/ceo/orders",
    icon: PackageOpen,
    onMobile: true,
  },
  {
    name: "Chop etishda",
    href: "/ceo/printing",
    icon: Printer,
    onMobile: true,
  },
  { name: "Kesishda", href: "/ceo/cutting", icon: Scissors, onMobile: true },
];

export default function CeoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
