import BaseLayout from "./BaseLayout";
import {
  CircleDollarSign,
  Clapperboard,
  Home,
  Leaf,
  Truck,
  Radical,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  { name: "Ish", href: "/tailor", icon: CircleDollarSign, onMobile: true },
  { name: "Yangisi", href: "/tailor/models", icon: Leaf, onMobile: true },
  {
    name: "Qo'llanma",
    href: "/tailor/video",
    icon: Clapperboard,
    onMobile: true,
  },
  {
    name: "Jo'natmalar",
    href: "/truck",
    icon: Truck,
    onMobile: false,
  },
  {
    name: "Koeffitsiyent",
    href: "/coefficient",
    icon: Radical,
    onMobile: false,
  },
];

export default function TailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
