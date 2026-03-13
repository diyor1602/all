import BaseLayout from "./BaseLayout";
import { DollarSign } from "lucide-react";

const navigation = [
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
