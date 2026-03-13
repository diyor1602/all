import BaseLayout from "./BaseLayout";
import { CircleDollarSign, DollarSign, Leaf } from "lucide-react";

const navigation = [
  { name: "Ish", href: "/tailor", icon: CircleDollarSign, onMobile: true },
  { name: "Yangisi", href: "/tailor/models", icon: Leaf, onMobile: true },
  {
    name: "Boshlash",
    href: "/tailor/starter",
    icon: DollarSign,
    onMobile: true,
  },
];

export default function TailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
