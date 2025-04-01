import BaseLayout from "./BaseLayout";
import { Home, BadgeDollarSign, Sparkles } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home },
  {
    name: "TEXNOLOG",
    href: "/technologist/spesification",
    icon: BadgeDollarSign,
  },
  { name: "Maosh", href: "/technologist/tarification", icon: Sparkles },
];

export default function TechnologLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
