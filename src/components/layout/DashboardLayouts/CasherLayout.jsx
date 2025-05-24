import BaseLayout from "./BaseLayout";
import { Home, PackageOpen, Printer, Scissors } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Chop etishda",
    href: "/casher/printing",
    icon: Printer,
    onMobile: true,
  },
];

export default function CasherLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
