import BaseLayout from "./BaseLayout";
import { Bot, FilePlus, Users, Clock, Bug } from "lucide-react";

const navigation = [
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
    onMobile: true,
  },
  {
    name: "Braklar",
    href: "/groupMaster/ownDamages",
    icon: Bug,
    onMobile: true,
  },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
