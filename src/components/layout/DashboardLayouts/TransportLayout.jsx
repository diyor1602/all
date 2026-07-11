import BaseLayout from "./BaseLayout";
import { Car, CalendarCheck, Users, Scale } from "lucide-react";

const navigation = [
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
  {
    name: "Xodimlar",
    href: "/transport/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Balans",
    href: "/transport/balance",
    icon: Scale,
    onMobile: true,
  },
];

export default function TransportLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
