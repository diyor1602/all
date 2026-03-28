import BaseLayout from "./BaseLayout";
import { DollarSign, Send } from "lucide-react";

const navigation = [
  {
    name: "Boshlash",
    href: "/tailor/starter",
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

export default function TailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
