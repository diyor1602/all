import BaseLayout from "./BaseLayout";
import { Home, Users, BadgeDollarSign } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home },
  { name: "Xodimlar", href: "/supervisior/employees", icon: Users },
  { name: "Maosh", href: "/supervisior/salaries", icon: BadgeDollarSign },
];

export default function SupervisiorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
