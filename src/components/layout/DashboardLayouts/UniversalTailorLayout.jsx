import BaseLayout from "./BaseLayout";
import { DollarSign, Send } from "lucide-react";

const navigation = [
  {
    name: "Boshlash",
    href: "/universalTailor/starter",
    icon: DollarSign,
    onMobile: true,
  },
  {
    name: "Muammo",
    href: "/issue",
    icon: Send,
    onMobile: true,
  },
];

export default function UniversalTailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
