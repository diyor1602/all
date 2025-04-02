import BaseLayout from "./BaseLayout";
import { FilePlus, Home, ListChecks, Shirt } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Tasdiqlash",
    href: "/groupMaster/pending",
    icon: ListChecks,
    onMobile: true,
  },
  {
    name: "Tikuv",
    href: "/groupMaster/tailoring",
    icon: Shirt,
    onMobile: true,
  },
  {
    name: "Natija",
    href: "/groupMaster/result",
    icon: FilePlus,
    onMobile: true,
  },
];

export default function GroupMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
