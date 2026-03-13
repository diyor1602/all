import BaseLayout from "./BaseLayout";
import { DollarSign } from "lucide-react";

const navigation = [
  {
    name: "Boshlash",
    href: "/universalTailor/starter",
    icon: DollarSign,
    onMobile: true,
  },
];

export default function UniversalTailorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
