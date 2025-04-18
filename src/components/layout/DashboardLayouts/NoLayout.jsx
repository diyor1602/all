import BaseLayout from "./BaseLayout";
import { Home } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
];

export default function NoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
