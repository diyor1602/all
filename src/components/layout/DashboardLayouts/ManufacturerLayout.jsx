import BaseLayout from "./BaseLayout";
import { LayoutDashboard, Settings } from "lucide-react";

const navigation = [
  {
    name: "Guruhlar",
    href: "/manufacturer/groups",
    icon: LayoutDashboard,
    onMobile: false,
  },
  {
    name: "Qo'shimcha",
    href: "/manufacturer/settings",
    icon: Settings,
    onMobile: false,
  },
];

export default function ManufacturerLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
