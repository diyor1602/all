import BaseLayout from "./BaseLayout";
import { Building2 } from "lucide-react";

const navigation = [
  {
    name: "Guruhlar natijasi",
    href: "/resultChecker/result",
    icon: Building2,
    onMobile: true,
  },
];

export default function ResultCheckerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
