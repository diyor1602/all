import BaseLayout from "./BaseLayout";
import { Home, ListChecks } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home },
  { name: "Buyurtmalar", href: "/groupMaster/pending", icon: ListChecks },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
