import BaseLayout from "./BaseLayout";
import { Home, PackageOpen, Printer, Scissors } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home },
  { name: "Buyurtmalar", href: "/ceo/orders", icon: PackageOpen },
  { name: "Chop etishda", href: "/ceo/printing", icon: Printer },
  { name: "Kesishda", href: "/ceo/cutting", icon: Scissors },
];

export default function CeoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
