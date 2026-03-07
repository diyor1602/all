import BaseLayout from "./BaseLayout";
import { Bot, FilePlus, Shirt, Users, Clock } from "lucide-react";

const navigation = [
  {
    name: "Tikuv",
    href: "/groupMaster/tailoring",
    icon: Shirt,
    onMobile: false,
  },
  {
    name: "Natija",
    href: "/groupMaster/result",
    icon: FilePlus,
    onMobile: true,
  },
  {
    name: "Xodimlar",
    href: "/groupMaster/employees",
    icon: Users,
    onMobile: false,
  },
  {
    name: "Davomat",
    href: "/groupMaster/attendanceHistory",
    icon: Clock,
    onMobile: true,
  },
  {
    name: "Tarif",
    href: "/groupMaster/tarifs",
    icon: Bot,
    onMobile: false,
  },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
