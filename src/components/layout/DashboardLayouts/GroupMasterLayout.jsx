import BaseLayout from "./BaseLayout";
import {
  Bot,
  FilePlus,
  Users,
  Clock,
  Bug,
  Sprout,
  FileText,
} from "lucide-react";

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
    name: "Talabnoma",
    href: "/groupMaster/addRequisition",
    icon: FileText,
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
    onMobile: false,
  },
  {
    name: "Tikuvchilar",
    href: "/tailorRating",
    icon: Sprout,
    onMobile: false,
  },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
