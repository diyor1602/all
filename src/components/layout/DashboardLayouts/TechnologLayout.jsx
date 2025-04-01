import BaseLayout from "./BaseLayout";
import { Home, BadgeDollarSign, Sparkles } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "TEXNOLOG",
    href: "/technologist/spesification",
    icon: BadgeDollarSign,
    onMobile: true,
  },
  {
    name: "Maosh",
    href: "/technologist/tarification",
    icon: Sparkles,
    onMobile: true,
  },
];

export default function TechnologLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
