import BaseLayout from "./BaseLayout";
import { Home, Users, BadgeDollarSign } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home },
  { name: "Xodimlar", href: "/superhr/employees", icon: Users },
  { name: "Maosh", href: "/superhr/salaries", icon: BadgeDollarSign },
];

export default function SuperHrLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
