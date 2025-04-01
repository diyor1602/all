import BaseLayout from "./BaseLayout";
import { Home, PackageOpen, Printer, Scissors } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home },
  { name: "Buyurtmalar", href: "/cuttingMaster/orders", icon: PackageOpen },
  { name: "Chop etishda", href: "/cuttingMaster/printing", icon: Printer },
  { name: "Kesishda", href: "/cuttingMaster/cutting", icon: Scissors },
];

export default function CuttingMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
