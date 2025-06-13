import BaseLayout from "./BaseLayout";
import { FilePlus, Home, ListChecks } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Tasdiqlash",
    href: "/groupHelper/pending",
    icon: ListChecks,
    onMobile: true,
  },
  {
    name: "Natija",
    href: "/groupHelper/result",
    icon: FilePlus,
    onMobile: true,
  },
];

export default function GroupHelperLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
