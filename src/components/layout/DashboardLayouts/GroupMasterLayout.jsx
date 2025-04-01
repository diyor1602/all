import BaseLayout from "./BaseLayout";
import { Home, ListChecks } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Buyurtmalar",
    href: "/groupMaster/pending",
    icon: ListChecks,
    onMobile: true,
  },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
