import BaseLayout from "./BaseLayout";
import { Home, Car, CalendarCheck } from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Davomat",
    href: "/transport/attendance",
    icon: CalendarCheck,
    onMobile: true,
  },
  {
    name: "Avtomobillar",
    href: "/transport/machines",
    icon: Car,
    onMobile: true,
  },
];

export default function TransportLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
