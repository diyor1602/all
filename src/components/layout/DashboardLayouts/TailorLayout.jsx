import BaseLayout from "./BaseLayout";
import { CircleDollarSign, Clapperboard, Leaf } from "lucide-react";

const navigation = [
  { name: "Ish", href: "/tailor", icon: CircleDollarSign, onMobile: true },
  { name: "Yangisi", href: "/tailor/models", icon: Leaf, onMobile: true },
  {
    name: "Qo'llanma",
    href: "/tailor/video",
    icon: Clapperboard,
    onMobile: false,
  },
];

export default function TailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
