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
  {
    name: "Ish",
    href: "/universalTailor",
    icon: CircleDollarSign,
    onMobile: true,
  },
  {
    name: "Yangisi",
    href: "/universalTailor/models",
    icon: Leaf,
    onMobile: true,
  },
  {
    name: "Qo'llanma",
    href: "/universalTailor/video",
    icon: Clapperboard,
    onMobile: true,
  },
];

export default function UniversalTailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
